import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  cancelRun,
  handlePermissionChange,
  inspectRun,
  pauseProject,
  releaseLock,
  requireReason,
  retryRun,
  validateSecurityConfig,
} from '../src/admin.ts';
import { dispatchParallelWorkItems } from '../src/dispatcher.ts';
import { REDACTED, SchedulerMetrics, redactSecrets, structuredLog } from '../src/observability.ts';
import { openSchedulerStore } from '../src/sqlite-store.ts';
import type { OutboxRow, WorkItemSnapshotInput } from '../src/sqlite-store.ts';
import { ingestLinearWebhook } from '../src/webhook.ts';
import { processOpenCodeWorkerDispatch } from '../src/worker-runner.ts';
import type { OpenCodeLauncher } from '../src/worker-runner.ts';
import type { LinearProjectSnapshotInput, ScannerIssueInput } from '../src/scanner.ts';

const projectRoot = resolve(new URL('..', import.meta.url).pathname);
const regressionCacheRoot = join(projectRoot, '.cache', 'regression');
const webhookSecret = 'linear-webhook-secret';

function tmpDb(name: string) {
  mkdirSync(regressionCacheRoot, { recursive: true });
  const root = mkdtempSync(join(regressionCacheRoot, `${name}-`));
  return { root, dbPath: join(root, 'scheduler.sqlite') };
}

function snapshot(overrides: Partial<WorkItemSnapshotInput> = {}): WorkItemSnapshotInput {
  return {
    linearIssueId: overrides.linearIssueId ?? 'issue-59',
    linearIdentifier: overrides.linearIdentifier ?? '0XC-59',
    linearProjectId: overrides.linearProjectId ?? 'project-linear-scheduler',
    title: overrides.title ?? 'WI-08 operations security',
    stateName: overrides.stateName ?? 'Ready',
    stateType: overrides.stateType ?? 'unstarted',
    labels: overrides.labels ?? ['agent:ready', 'contract:stable', 'repo:legion-mind', 'risk:high', 'area:scheduler'],
    blockers: overrides.blockers ?? [],
    repoKey: overrides.repoKey ?? 'legion-mind',
    risk: overrides.risk ?? 'high',
    contractState: overrides.contractState ?? 'stable',
    resourceHints: overrides.resourceHints ?? ['area:scheduler'],
    linearUpdatedAt: overrides.linearUpdatedAt ?? '2026-06-25T10:00:00.000Z',
    observedVersion: overrides.observedVersion,
  };
}

function issue(overrides: Partial<ScannerIssueInput> = {}): ScannerIssueInput {
  const identifier = overrides.identifier ?? '0XC-59';
  return {
    linearIssueId: overrides.linearIssueId ?? `issue-${identifier.toLowerCase()}`,
    identifier,
    title: overrides.title ?? `${identifier} operations fixture`,
    projectId: overrides.projectId ?? 'project-linear-scheduler',
    projectName: overrides.projectName ?? 'linear-opencode-scheduler',
    url: overrides.url ?? `https://linear.app/0xc1/issue/${identifier}`,
    stateName: overrides.stateName ?? 'Ready',
    stateType: overrides.stateType ?? 'unstarted',
    labels: overrides.labels ?? ['agent:ready', 'contract:stable', 'repo:legion-mind', 'risk:high', 'area:scheduler'],
    priority: overrides.priority ?? 2,
    assignee: overrides.assignee ?? null,
    blockerIdentifiers: overrides.blockerIdentifiers ?? [],
    createdAt: overrides.createdAt ?? '2026-06-25T09:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-06-25T10:00:00.000Z',
    taskId: overrides.taskId,
    resourceHints: overrides.resourceHints ?? [],
    relations: overrides.relations,
  };
}

function project(issues: ScannerIssueInput[]): LinearProjectSnapshotInput {
  return {
    project: { id: 'project-linear-scheduler', name: 'linear-opencode-scheduler', key: 'scheduler' },
    observedAt: '2026-06-25T12:00:00.000Z',
    issues,
  };
}

function sign(rawBody: string | Buffer) {
  return createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
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

test('project pause is durable, blocks new dispatch, and keeps active runs inspectable', () => {
  const store = openSchedulerStore(':memory:');
  try {
    const active = store.claimReadyWorkItem({ readySnapshot: snapshot(), currentSnapshot: snapshot(), taskId: 'linear-0xc-59', lockKeys: ['area:legion-mind/scheduler'] });
    assert.equal(active.ok, true);
    if (!active.ok) return;
    store.transitionRun(active.runId, 'running', { actor: 'test' });

    const paused = pauseProject(store, { projectId: 'project-linear-scheduler', reason: 'maintenance window', traceId: 'trace-pause' });
    assert.equal(paused.result.state, 'paused');
    assert.deepEqual(store.pausedOrBlockedProjectIds(), ['project-linear-scheduler']);

    const outcome = dispatchParallelWorkItems(store, {
      project: project([issue({ identifier: '0XC-NEW', linearIssueId: 'issue-new', labels: ['agent:ready', 'contract:stable', 'repo:legion-mind', 'risk:high', 'area:other'] })]),
      config: { parallelRepoKeys: ['legion-mind'], limits: { globalConcurrency: 2 } },
    });
    assert.equal(outcome.claimed.length, 0);
    assert.equal(outcome.skipped[0].reason, 'project_paused');
    assert.equal((outcome.skipped[0].details as { controlState?: string }).controlState, 'paused');

    const inspection = inspectRun(store, active.runId);
    assert.equal(inspection.run.state, 'running');
    assert.equal(inspection.locks.length, 1);
    assert.equal(inspection.native.nativeStopRequestedAt, null);
  } finally {
    store.close();
  }
});

test('admin dangerous actions require reasons and write audit events', () => {
  const store = openSchedulerStore(':memory:');
  try {
    assert.throws(() => requireReason('cancel', ''), /requires --reason/);
    const claim = store.claimReadyWorkItem({ readySnapshot: snapshot(), currentSnapshot: snapshot(), taskId: 'linear-0xc-59', lockKeys: ['area:legion-mind/scheduler'] });
    assert.equal(claim.ok, true);
    if (!claim.ok) return;
    store.transitionRun(claim.runId, 'running', { actor: 'test' });
    store.transitionRun(claim.runId, 'blocked', { actor: 'test', failureType: 'checks_failure', failureReason: 'fixture repairable' });

    assert.throws(() => retryRun(store, { runId: claim.runId, reason: '' }), /requires --reason/);
    const retry = retryRun(store, { runId: claim.runId, reason: 'retry after fixing flaky fixture', retryPolicy: { baseDelayMs: 1 } });
    assert.equal(retry.result.attemptNumber, 2);
    assert.equal(store.listAttemptsForRun(claim.runId).length, 2);
    assert.equal(store.listSchedulerEvents().some((event) => event.event_type === 'admin_retry_requested'), true);

    const lockClaim = store.claimReadyWorkItem({ readySnapshot: snapshot({ linearIssueId: 'issue-lock', linearIdentifier: 'LOCK-1' }), currentSnapshot: snapshot({ linearIssueId: 'issue-lock', linearIdentifier: 'LOCK-1' }), taskId: 'linear-lock-1', lockKeys: ['mutex:admin-release'] });
    assert.equal(lockClaim.ok, true);
    if (!lockClaim.ok) return;
    assert.throws(() => releaseLock(store, { runId: lockClaim.runId, lockKey: 'mutex:admin-release', reason: '' }), /requires --reason/);
    releaseLock(store, { runId: lockClaim.runId, lockKey: 'mutex:admin-release', reason: 'stale lock confirmed by admin' });
    assert.equal(store.listResourceLocks({ runId: lockClaim.runId })[0].state, 'released');
    assert.equal(store.listSchedulerEvents().some((event) => event.event_type === 'admin_lock_release_requested'), true);

    assert.throws(() => cancelRun(store, { runId: claim.runId, reason: '' }), /requires --reason/);
    const cancelled = cancelRun(store, { runId: claim.runId, reason: 'operator cancel drill' });
    assert.equal(cancelled.result.state, 'cancelled');
    assert.equal(cancelled.result.failure_type, 'admin_cancelled');
    assert.equal(store.listSchedulerEvents().some((event) => event.event_type === 'admin_cancel_requested'), true);
  } finally {
    store.close();
  }
});

test('project pause defers pending worker dispatch before a new worker launches', async () => {
  const root = tmpDb('pause-worker-dispatch');
  const store = openSchedulerStore(':memory:');
  try {
    const claim = store.claimReadyWorkItem({ readySnapshot: snapshot(), currentSnapshot: snapshot(), taskId: 'linear-0xc-59', lockKeys: ['area:legion-mind/scheduler'] });
    assert.equal(claim.ok, true);
    if (!claim.ok) return;
    markNativeStartupSent(store, claim.runId);
    pauseProject(store, { projectId: 'project-linear-scheduler', reason: 'pause before worker launch' });
    let launched = false;
    const launcher: OpenCodeLauncher = { async launch() { launched = true; return { kind: 'success', exitCode: 0, stdout: '', stderr: '' }; } };
    const outcome = await processOpenCodeWorkerDispatch(store, workerOutbox(store), { repoPath: root.root, launcher });
    assert.equal(outcome.result, 'launch_failed');
    assert.equal(launched, false);
    assert.equal(store.pendingOutbox().find((row) => row.outbox_kind === 'worker_dispatch')?.state, 'retrying');
    assert.equal(store.listSchedulerEvents().some((event) => event.event_type === 'worker_dispatch_paused'), true);
  } finally {
    store.close();
    rmSync(root.root, { recursive: true, force: true });
  }
});

test('redaction preserves shape while removing tokens, headers and signed URL secrets', () => {
  const value = redactSecrets({
    Authorization: 'Bearer linear-secret-token-1234567890',
    nested: { githubToken: 'ghp_abcdefghijklmnopqrstuvwxyz123456', safe: 'visible' },
    url: 'https://storage.example/file.txt?X-Goog-Signature=abcdef&name=report',
  });
  assert.equal(value.Authorization, `${REDACTED}`);
  assert.equal(value.nested.githubToken, REDACTED);
  assert.equal(value.nested.safe, 'visible');
  assert.equal(value.url, `https://storage.example/file.txt?X-Goog-Signature=${encodeURIComponent(REDACTED)}&name=report`);

  const log = structuredLog('api.error', { traceId: 'trace-redact', runId: 'run-1' }, { authorization: 'Linear abcdef1234567890' });
  assert.equal(log.context.trace_id, 'trace-redact');
  assert.equal((log.payload as { authorization: string }).authorization, REDACTED);

  const metrics = new SchedulerMetrics();
  metrics.increment('api.error', { provider: 'linear' });
  metrics.increment('api.error', { provider: 'linear' });
  metrics.gauge('lock.held', 1, { project: 'scheduler' });
  metrics.timing('reconcile.duration_ms', 42, { project: 'scheduler' });
  const snapshotMetrics = metrics.snapshot();
  assert.equal(snapshotMetrics.counters.find((sample) => sample.name === 'api.error')?.value, 2);
  assert.equal(snapshotMetrics.gauges.find((sample) => sample.name === 'lock.held')?.value, 1);
  assert.equal(snapshotMetrics.timings.find((sample) => sample.name === 'reconcile.duration_ms')?.value, 42);
});

test('security validation and PermissionChange block affected projects', () => {
  const store = openSchedulerStore(':memory:');
  try {
    const validation = validateSecurityConfig(store, {
      projectId: 'project-linear-scheduler',
      production: true,
      linearAuthMode: 'personal_api_key',
      actorApp: false,
      delegateEnabled: true,
      mentionEnabled: true,
      scopes: [],
      githubTokenScope: 'all_repos',
      webhookSignatureConfigured: false,
      workerHasSchedulerDbSuperuser: true,
    });
    assert.equal(validation.ok, false);
    assert.equal(validation.findings.some((finding) => finding.code === 'delegate_scope_missing'), true);
    assert.equal(store.getProjectControl('project-linear-scheduler')?.state, 'security_blocked');

    const permission = handlePermissionChange(store, { projectId: 'project-linear-scheduler', teamId: 'team-1', reason: 'revoked app access' });
    assert.equal(permission.ok, false);
    assert.equal(store.getProjectControl('project-linear-scheduler')?.reason, 'revoked app access');
    assert.equal(store.listSchedulerEvents().some((event) => event.event_type === 'permission_change_security_block'), true);
  } finally {
    store.close();
  }
});

test('PermissionChange webhook records security_blocked control and keeps dedupe semantics', () => {
  const store = openSchedulerStore(':memory:');
  try {
    const now = '2026-06-25T12:00:00.000Z';
    const raw = JSON.stringify({
      type: 'PermissionChange',
      action: 'teamAccessChanged',
      webhookId: 'permission-webhook-1',
      webhookTimestamp: Date.parse(now),
      projectId: 'project-linear-scheduler',
      teamId: 'team-1',
    });
    const first = ingestLinearWebhook({ store, rawBody: raw, headers: { 'linear-signature': sign(raw) }, secret: webhookSecret, now });
    const duplicate = ingestLinearWebhook({ store, rawBody: raw, headers: { 'linear-signature': sign(raw) }, secret: webhookSecret, now });
    assert.equal(first.duplicate, false);
    assert.equal(duplicate.duplicate, true);
    assert.equal(first.routed.some((route) => route === 'security_blocked:project-linear-scheduler'), true);
    assert.equal(store.getProjectControl('project-linear-scheduler')?.state, 'security_blocked');
  } finally {
    store.close();
  }
});

test('admin CLI exposes pause, health and run inspect JSON', () => {
  const { root, dbPath } = tmpDb('admin-cli');
  const store = openSchedulerStore(dbPath);
  let runId = '';
  try {
    const claim = store.claimReadyWorkItem({ readySnapshot: snapshot(), currentSnapshot: snapshot(), taskId: 'linear-0xc-59', lockKeys: ['area:legion-mind/scheduler'] });
    assert.equal(claim.ok, true);
    if (!claim.ok) return;
    runId = claim.runId;
    store.transitionRun(runId, 'running', { actor: 'test' });
  } finally {
    store.close();
  }

  try {
    const pauseOutput = execFileSync(process.execPath, ['--experimental-strip-types', '--experimental-sqlite', 'src/cli.ts', 'project', 'pause', 'project-linear-scheduler', '--reason', 'cli maintenance', '--db', dbPath], { cwd: projectRoot, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
    const pause = JSON.parse(pauseOutput) as { result: { state: string } };
    assert.equal(pause.result.state, 'paused');

    const inspectOutput = execFileSync(process.execPath, ['--experimental-strip-types', '--experimental-sqlite', 'src/cli.ts', 'run', 'inspect', runId, '--db', dbPath], { cwd: projectRoot, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
    const inspection = JSON.parse(inspectOutput) as { run: { id: string; state: string }; timeline: unknown[] };
    assert.equal(inspection.run.id, runId);
    assert.equal(inspection.run.state, 'running');
    assert.equal(inspection.timeline.length > 0, true);

    const healthOutput = execFileSync(process.execPath, ['--experimental-strip-types', '--experimental-sqlite', 'src/cli.ts', 'project', 'health', 'project-linear-scheduler', '--db', dbPath], { cwd: projectRoot, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
    const health = JSON.parse(healthOutput) as { control: { state: string }; activeRuns: unknown[] };
    assert.equal(health.control.state, 'paused');
    assert.equal(health.activeRuns.length, 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
