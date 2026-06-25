import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { recoverStaleRuns } from '../src/recovery.ts';
import { classifyFailure, decideRetry } from '../src/retry-policy.ts';
import { openSchedulerStore } from '../src/sqlite-store.ts';
import type { OutboxRow, WorkItemSnapshotInput } from '../src/sqlite-store.ts';
import { processOpenCodeWorkerDispatch } from '../src/worker-runner.ts';
import type { OpenCodeLauncher } from '../src/worker-runner.ts';
import {
  ingestLinearWebhook,
  validateWebhookTimestamp,
  verifyLinearWebhookSignature,
} from '../src/webhook.ts';

const projectRoot = resolve(new URL('..', import.meta.url).pathname);
const regressionCacheRoot = join(projectRoot, '.cache', 'regression');
const secret = 'linear-webhook-secret';

function tmpRoot(name: string) {
  mkdirSync(regressionCacheRoot, { recursive: true });
  return mkdtempSync(join(regressionCacheRoot, `${name}-`));
}

function snapshot(overrides: Partial<WorkItemSnapshotInput> = {}): WorkItemSnapshotInput {
  return {
    linearIssueId: overrides.linearIssueId ?? 'issue-62',
    linearIdentifier: overrides.linearIdentifier ?? '0XC-62',
    linearProjectId: overrides.linearProjectId ?? 'project-linear-scheduler',
    title: overrides.title ?? 'WI-07 reliability',
    stateName: overrides.stateName ?? 'Ready',
    stateType: overrides.stateType ?? 'unstarted',
    labels: overrides.labels ?? ['agent:ready', 'contract:stable', 'repo:legion-mind', 'risk:high', 'area:scheduler'],
    blockers: overrides.blockers ?? [],
    repoKey: overrides.repoKey ?? 'legion-mind',
    risk: overrides.risk ?? 'high',
    contractState: overrides.contractState ?? 'stable',
    resourceHints: overrides.resourceHints ?? ['area:scheduler'],
    linearUpdatedAt: overrides.linearUpdatedAt ?? '2026-06-25T09:00:00.000Z',
    observedVersion: overrides.observedVersion,
  };
}

function sign(rawBody: string | Buffer) {
  return createHmac('sha256', secret).update(rawBody).digest('hex');
}

function webhookBody(overrides: Record<string, unknown> = {}, now = '2026-06-25T12:00:00.000Z') {
  return JSON.stringify({
    type: 'AgentSessionEvent',
    action: 'created',
    webhookId: 'webhook-1',
    webhookTimestamp: Date.parse(now),
    agentSession: {
      id: 'agent-session-62',
      issue: { id: 'issue-62', identifier: '0XC-62', project: { id: 'project-linear-scheduler' } },
    },
    ...overrides,
  });
}

function workerOutbox(store: ReturnType<typeof openSchedulerStore>): OutboxRow {
  const row = store.pendingOutbox().find((entry) => entry.outbox_kind === 'worker_dispatch') as OutboxRow | undefined;
  assert.ok(row);
  return row;
}

function markNativeStartupSent(store: ReturnType<typeof openSchedulerStore>, runId: string) {
  for (const row of store.pendingOutbox().filter((entry) => entry.run_id === runId && entry.outbox_kind === 'native_agent')) {
    store.markOutboxSent(row.idempotency_key);
  }
}

test('Linear webhook signature uses raw body and timestamp replay window', () => {
  const now = '2026-06-25T12:00:00.000Z';
  const raw = webhookBody({}, now);
  assert.equal(verifyLinearWebhookSignature({ rawBody: raw, signatureHeader: sign(raw), secret }), true);
  assert.equal(verifyLinearWebhookSignature({ rawBody: `${raw}\n`, signatureHeader: sign(raw), secret }), false);
  assert.equal(validateWebhookTimestamp(Date.parse(now), { now }), true);
  assert.equal(validateWebhookTimestamp(Date.parse('2026-06-25T11:58:00.000Z'), { now }), false);
});

test('AgentSessionEvent webhooks dedupe and enqueue outbox without claiming workers', () => {
  const store = openSchedulerStore(':memory:');
  try {
    const now = '2026-06-25T12:00:00.000Z';
    const raw = webhookBody({}, now);
    const first = ingestLinearWebhook({ store, rawBody: raw, headers: { 'linear-signature': sign(raw) }, secret, now });
    const duplicate = ingestLinearWebhook({ store, rawBody: raw, headers: { 'linear-signature': sign(raw) }, secret, now });

    assert.equal(first.duplicate, false);
    assert.equal(duplicate.duplicate, true);
    assert.equal(store.listRuns().length, 0);
    assert.equal(store.pendingOutbox().filter((row) => row.outbox_kind === 'scheduler').length, 2);
    assert.deepEqual(store.pendingOutbox().filter((row) => row.outbox_kind === 'scheduler').map((row) => row.side_effect).sort(), ['native_session_event', 'reconcile_project']);
  } finally {
    store.close();
  }
});

test('AgentSessionEvent stopped requests native stop and does not satisfy downstream', () => {
  const store = openSchedulerStore(':memory:');
  try {
    const claim = store.claimReadyWorkItem({
      readySnapshot: snapshot(),
      currentSnapshot: snapshot(),
      taskId: 'linear-0xc-62',
      nativeAgent: { agentSessionId: 'agent-session-62' },
      lockKeys: ['area:legion-mind/scheduler'],
    });
    assert.equal(claim.ok, true);
    if (!claim.ok) return;
    store.transitionRun(claim.runId, 'running');

    const now = '2026-06-25T12:00:00.000Z';
    const raw = webhookBody({ action: 'stopped', webhookId: 'webhook-stop' }, now);
    const result = ingestLinearWebhook({ store, rawBody: raw, headers: { 'linear-signature': sign(raw) }, secret, now });

    assert.equal(result.duplicate, false);
    assert.equal(store.getRun(claim.runId)?.state, 'cancelled');
    assert.equal(store.getRun(claim.runId)?.failure_type, 'native_stop_requested');
    assert.deepEqual(store.isBlockerSatisfiedByRun(claim.runId), { satisfied: false, reason: 'run_terminal_non_success' });
    assert.equal(store.listHeldLocks().length, 0);
    assert.equal(store.pendingOutbox().some((row) => row.side_effect === 'final_response'), true);
    assert.equal(store.pendingOutbox().some((row) => row.side_effect === 'native_session_event'), true);
  } finally {
    store.close();
  }
});

test('retry taxonomy distinguishes retryable, conditional, non-retryable and control signals', () => {
  assert.equal(classifyFailure('worker_timeout'), 'retryable');
  assert.equal(classifyFailure('checks_failure'), 'conditionally_retryable');
  assert.equal(classifyFailure('permission_denied'), 'non_retryable');
  assert.equal(classifyFailure('native_stop_requested'), 'control_signal');

  const now = '2026-06-25T12:00:00.000Z';
  const retry = decideRetry({ failureType: 'worker_timeout', attemptNumber: 1, now, baseDelayMs: 1000, maxAttempts: 3 });
  assert.equal(retry.retry, true);
  assert.equal(retry.notBefore, '2026-06-25T12:00:01.000Z');
  assert.equal(decideRetry({ failureType: 'checks_failure', attemptNumber: 1, now }).retry, false);
  assert.equal(decideRetry({ failureType: 'checks_failure', attemptNumber: 1, now, scopeRepairable: true }).retry, true);
  assert.equal(decideRetry({ failureType: 'worker_timeout', attemptNumber: 3, now, maxAttempts: 3 }).retry, false);
});

test('worker timeout schedules bounded retry without creating a second active run', async () => {
  const root = tmpRoot('worker-timeout-retry');
  const store = openSchedulerStore(':memory:');
  try {
    const claim = store.claimReadyWorkItem({ readySnapshot: snapshot(), currentSnapshot: snapshot(), taskId: 'linear-0xc-62', lockKeys: ['area:legion-mind/scheduler'] });
    assert.equal(claim.ok, true);
    if (!claim.ok) return;
    markNativeStartupSent(store, claim.runId);
    const launcher: OpenCodeLauncher = { async launch() { return { kind: 'timeout', exitCode: null, stdout: '', stderr: 'timeout', timedOut: true }; } };

    const outcome = await processOpenCodeWorkerDispatch(store, workerOutbox(store), { repoPath: root, launcher, now: '2026-06-25T12:00:00.000Z', retryPolicy: { baseDelayMs: 1000, maxAttempts: 3 } });
    assert.equal(outcome.result, 'blocked');
    assert.equal(store.getRun(claim.runId)?.state, 'blocked');
    assert.equal(store.getRun(claim.runId)?.failure_type, 'worker_timeout');
    assert.equal(store.listAttemptsForRun(claim.runId).length, 2);
    assert.equal(store.listRuns().filter((run) => run.linear_issue_id === 'issue-62' && ['queued', 'running', 'in_review', 'blocked'].includes(run.state)).length, 1);
    assert.equal(store.listHeldLocks().length, 1);
    const retryPayload = JSON.parse(workerOutbox(store).payload_json) as { linear?: { title?: string; risk?: string; contractState?: string }; retry?: { notBefore?: string | null } };
    assert.equal(retryPayload.linear?.title, 'WI-07 reliability');
    assert.equal(retryPayload.linear?.risk, 'high');
    assert.equal(retryPayload.linear?.contractState, 'stable');

    let launchedEarly = false;
    const retryOutcome = await processOpenCodeWorkerDispatch(store, workerOutbox(store), {
      repoPath: root,
      launcher: { async launch() { launchedEarly = true; return { kind: 'success', exitCode: 0, stdout: '', stderr: '' }; } },
      now: '2026-06-25T12:00:00.500Z',
    });
    assert.equal(retryOutcome.result, 'launch_failed');
    assert.equal(launchedEarly, false);
  } finally {
    store.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('stale recovery checks worker liveness before retry or lock release', async () => {
  const store = openSchedulerStore(':memory:');
  try {
    const claim = store.claimReadyWorkItem({
      readySnapshot: snapshot({ linearIssueId: 'issue-live', linearIdentifier: 'WI-LIVE' }),
      currentSnapshot: snapshot({ linearIssueId: 'issue-live', linearIdentifier: 'WI-LIVE' }),
      taskId: 'linear-wi-live',
      lockKeys: ['area:legion-mind/live'],
      now: '2026-06-25T12:00:00.000Z',
    });
    assert.equal(claim.ok, true);
    if (!claim.ok) return;
    store.transitionRun(claim.runId, 'running', { now: '2026-06-25T12:00:00.000Z' });

    const result = await recoverStaleRuns(store, {
      staleAfterMs: 60_000,
      now: '2026-06-25T12:05:00.000Z',
      livenessProbe: { isWorkerAlive: () => true },
    });
    assert.equal(result.staleRuns, 1);
    assert.equal(result.recovered[0].action, 'worker_alive');
    assert.equal(store.listAttemptsForRun(claim.runId).length, 1);
    assert.equal(store.listHeldLocks().length, 1);
  } finally {
    store.close();
  }
});

test('stale recovery with confirmed dead worker schedules retry or terminal release', async () => {
  const store = openSchedulerStore(':memory:');
  try {
    const retryClaim = store.claimReadyWorkItem({
      readySnapshot: snapshot({ linearIssueId: 'issue-dead-retry', linearIdentifier: 'WI-DEAD-RETRY' }),
      currentSnapshot: snapshot({ linearIssueId: 'issue-dead-retry', linearIdentifier: 'WI-DEAD-RETRY' }),
      taskId: 'linear-wi-dead-retry',
      lockKeys: ['area:legion-mind/dead-retry'],
      now: '2026-06-25T12:00:00.000Z',
    });
    assert.equal(retryClaim.ok, true);
    if (!retryClaim.ok) return;
    store.transitionRun(retryClaim.runId, 'running', { now: '2026-06-25T12:00:00.000Z' });

    const retry = await recoverStaleRuns(store, {
      staleAfterMs: 60_000,
      now: '2026-06-25T12:05:00.000Z',
      livenessProbe: { isWorkerAlive: () => false },
      baseDelayMs: 1000,
      maxAttempts: 3,
    });
    assert.equal(retry.recovered[0].action, 'retry_scheduled');
    assert.equal(store.getRun(retryClaim.runId)?.state, 'blocked');
    assert.equal(store.listAttemptsForRun(retryClaim.runId).length, 2);
    assert.equal(store.listHeldLocks().some((lock) => lock.runId === retryClaim.runId), true);

    const terminalClaim = store.claimReadyWorkItem({
      readySnapshot: snapshot({ linearIssueId: 'issue-dead-terminal', linearIdentifier: 'WI-DEAD-TERM' }),
      currentSnapshot: snapshot({ linearIssueId: 'issue-dead-terminal', linearIdentifier: 'WI-DEAD-TERM' }),
      taskId: 'linear-wi-dead-terminal',
      lockKeys: ['area:legion-mind/dead-terminal'],
      now: '2026-06-25T12:00:00.000Z',
    });
    assert.equal(terminalClaim.ok, true);
    if (!terminalClaim.ok) return;
    store.transitionRun(terminalClaim.runId, 'running', { now: '2026-06-25T12:00:00.000Z' });

    const terminal = await recoverStaleRuns(store, {
      staleAfterMs: 60_000,
      now: '2026-06-25T12:05:00.000Z',
      livenessProbe: { isWorkerAlive: () => false },
      maxAttempts: 1,
    });
    assert.equal(terminal.recovered.some((item) => item.runId === terminalClaim.runId && item.action === 'terminal_failed'), true);
    assert.equal(store.getRun(terminalClaim.runId)?.state, 'failed');
    assert.equal(store.listHeldLocks().some((lock) => lock.runId === terminalClaim.runId), false);
    assert.deepEqual(store.isBlockerSatisfiedByRun(terminalClaim.runId), { satisfied: false, reason: 'run_terminal_non_success' });
  } finally {
    store.close();
  }
});
