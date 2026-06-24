import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { openSchedulerStore, stableHash } from '../src/sqlite-store.ts';
import type { WorkItemSnapshotInput } from '../src/sqlite-store.ts';
import { assertValidRunTransition, canTransitionRun, isTerminalNonSuccessRunState } from '../src/state-machine.ts';

const projectRoot = resolve(new URL('..', import.meta.url).pathname);
const regressionCacheRoot = join(projectRoot, '.cache', 'regression');

function tmpDb(name: string) {
  mkdirSync(regressionCacheRoot, { recursive: true });
  const root = mkdtempSync(join(regressionCacheRoot, `${name}-`));
  return { root, dbPath: join(root, 'scheduler.sqlite') };
}

function snapshot(overrides: Partial<WorkItemSnapshotInput> = {}): WorkItemSnapshotInput {
  const base = {
    linearIssueId: 'issue-1',
    linearIdentifier: 'WI-02',
    linearProjectId: 'project-linear-legion-scheduler',
    title: 'Scheduler core service and durable state',
    stateName: 'Ready',
    stateType: 'unstarted',
    labels: ['agent:ready', 'contract:stable', 'repo:legion-mind', 'risk:medium'],
    blockers: ['WI-01'],
    repoKey: 'legion-mind',
    risk: 'medium' as const,
    contractState: 'stable' as const,
    resourceHints: ['area:scheduler-core', 'mutex:db-migration'],
    linearUpdatedAt: '2026-06-24T00:00:00.000Z',
    observedVersion: 1,
  };
  return { ...base, ...overrides };
}

test('SQLite migration creates WI-02 core tables and service health', () => {
  const store = openSchedulerStore(':memory:');
  try {
    const health = store.health();
    assert.equal(health.ok, true);
    assert.deepEqual(health.tables, [
      'native_outbox',
      'resource_locks',
      'run_attempts',
      'runs',
      'scheduler_events',
      'webhook_events',
      'work_item_snapshots',
    ]);
    assert.equal(health.activeRuns, 0);
    assert.equal(health.pendingOutbox, 0);
  } finally {
    store.close();
  }
});

test('run state machine accepts only centralized legal transitions', () => {
  assert.equal(canTransitionRun('queued', 'running'), true);
  assert.equal(canTransitionRun('running', 'in_review'), true);
  assert.equal(canTransitionRun('in_review', 'done'), true);
  assert.equal(isTerminalNonSuccessRunState('failed'), true);
  assert.throws(() => assertValidRunTransition('done', 'running'), /Illegal run state transition/);
  assert.throws(() => assertValidRunTransition('queued', 'done'), /Illegal run state transition/);
});

test('claim transaction creates run, attempt, resource locks, event timeline and outbox jobs', () => {
  const store = openSchedulerStore(':memory:');
  try {
    const result = store.claimReadyWorkItem({
      readySnapshot: snapshot(),
      currentSnapshot: snapshot(),
      taskId: 'linear-legion-scheduler-wi-02',
      branch: 'legion/linear-legion-scheduler-wi-02-sqlite-core',
      worktreePath: '.worktrees/linear-legion-scheduler-wi-02',
      nativeAgent: { delegateAppUserId: 'linear-agent-app', promptContextHash: 'prompt-hash-1' },
      traceId: 'trace-claim-success',
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.lockKeys.includes('repo:legion-mind'), true);
    assert.equal(result.lockKeys.includes('mutex:db-migration'), true);

    const run = store.getRun(result.runId);
    assert.equal(run?.state, 'queued');
    assert.equal(run?.linear_issue_id, 'issue-1');
    assert.equal(run?.task_id, 'linear-legion-scheduler-wi-02');
    assert.equal(run?.linear_delegate_app_user_id, 'linear-agent-app');

    const timeline = store.timelineForRun(result.runId);
    assert.equal(timeline.length, 1);
    assert.equal(timeline[0].event_type, 'claimed');
    assert.deepEqual((timeline[0].payload as { lockKeys: string[] }).lockKeys, result.lockKeys);

    const outbox = store.pendingOutbox();
    assert.equal(outbox.length, 6);
    assert.equal(outbox.some((entry) => entry.outbox_kind === 'worker_dispatch' && entry.side_effect === 'dispatch_worker'), true);
    assert.equal(outbox.some((entry) => entry.side_effect === 'create_or_find_session'), true);
    assert.equal(outbox.some((entry) => entry.side_effect === 'set_delegate'), true);
  } finally {
    store.close();
  }
});

test('claim rejects stale ready snapshots before creating active runs', () => {
  const store = openSchedulerStore(':memory:');
  try {
    const current = snapshot({
      labels: ['agent:ready', 'contract:needs-review', 'repo:legion-mind', 'risk:medium'],
      contractState: 'needs-review',
      linearUpdatedAt: '2026-06-24T01:00:00.000Z',
    });
    const result = store.claimReadyWorkItem({
      readySnapshot: snapshot(),
      currentSnapshot: current,
      taskId: 'linear-legion-scheduler-wi-02',
      traceId: 'trace-stale',
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.reason, 'stale_snapshot');
    assert.equal(result.changedFields.includes('labels'), true);
    assert.equal(result.changedFields.includes('contract_state'), true);
    assert.equal(store.listRuns().length, 0);
  } finally {
    store.close();
  }
});

test('duplicate claim across SQLite connections creates only one active run', () => {
  const { root, dbPath } = tmpDb('scheduler-duplicate-claim');
  const first = openSchedulerStore(dbPath);
  const second = openSchedulerStore(dbPath);
  try {
    const initial = first.claimReadyWorkItem({
      readySnapshot: snapshot(),
      currentSnapshot: snapshot(),
      taskId: 'linear-legion-scheduler-wi-02',
      traceId: 'trace-first',
    });
    assert.equal(initial.ok, true);

    const duplicate = second.claimReadyWorkItem({
      readySnapshot: snapshot(),
      currentSnapshot: snapshot(),
      taskId: 'linear-legion-scheduler-wi-02',
      traceId: 'trace-second',
    });
    assert.equal(duplicate.ok, false);
    if (duplicate.ok) return;
    assert.equal(duplicate.reason, 'active_run_exists');
    assert.equal(first.listRuns().length, 1);
  } finally {
    first.close();
    second.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('resource locks conflict until released', () => {
  const store = openSchedulerStore(':memory:');
  try {
    const first = store.claimReadyWorkItem({
      readySnapshot: snapshot({ linearIssueId: 'issue-1', linearIdentifier: 'WI-02' }),
      currentSnapshot: snapshot({ linearIssueId: 'issue-1', linearIdentifier: 'WI-02' }),
      taskId: 'linear-legion-scheduler-wi-02-a',
      lockKeys: ['repo:legion-mind', 'mutex:db-migration'],
    });
    assert.equal(first.ok, true);
    if (!first.ok) return;

    const conflict = store.claimReadyWorkItem({
      readySnapshot: snapshot({ linearIssueId: 'issue-2', linearIdentifier: 'WI-03' }),
      currentSnapshot: snapshot({ linearIssueId: 'issue-2', linearIdentifier: 'WI-03' }),
      taskId: 'linear-legion-scheduler-wi-03',
      lockKeys: ['mutex:db-migration'],
    });
    assert.equal(conflict.ok, false);
    if (conflict.ok) return;
    assert.equal(conflict.reason, 'resource_conflict');
    assert.equal(conflict.lockConflicts[0].lockKey, 'mutex:db-migration');

    store.releaseLocksForRun(first.runId, { reason: 'test release', actor: 'test' });
    const afterRelease = store.claimReadyWorkItem({
      readySnapshot: snapshot({ linearIssueId: 'issue-2', linearIdentifier: 'WI-03' }),
      currentSnapshot: snapshot({ linearIssueId: 'issue-2', linearIdentifier: 'WI-03' }),
      taskId: 'linear-legion-scheduler-wi-03',
      lockKeys: ['mutex:db-migration'],
    });
    assert.equal(afterRelease.ok, true);
  } finally {
    store.close();
  }
});

test('native outbox is idempotent by key and can mark dispatch sent', () => {
  const store = openSchedulerStore(':memory:');
  try {
    const first = store.enqueueOutbox({
      outboxKind: 'native_agent',
      idempotencyKey: 'run:test:activity:initial',
      sideEffect: 'create_activity',
      payload: { message: 'hello' },
    });
    const second = store.enqueueOutbox({
      outboxKind: 'native_agent',
      idempotencyKey: 'run:test:activity:initial',
      sideEffect: 'create_activity',
      payload: { message: 'hello again' },
    });
    assert.equal(first, second);
    assert.equal(store.pendingOutbox().length, 1);
    store.markOutboxSent('run:test:activity:initial');
    assert.equal(store.pendingOutbox().length, 0);
  } finally {
    store.close();
  }
});

test('non-success terminal runs do not satisfy blockers without admin override audit', () => {
  const store = openSchedulerStore(':memory:');
  try {
    const claim = store.claimReadyWorkItem({
      readySnapshot: snapshot(),
      currentSnapshot: snapshot(),
      taskId: 'linear-legion-scheduler-wi-02',
    });
    assert.equal(claim.ok, true);
    if (!claim.ok) return;
    store.transitionRun(claim.runId, 'running');
    store.transitionRun(claim.runId, 'failed', { failureType: 'verification_failed', failureReason: 'fixture failure' });
    assert.deepEqual(store.isBlockerSatisfiedByRun(claim.runId), { satisfied: false, reason: 'run_terminal_non_success' });

    store.recordAdminOverride(claim.runId, 'Superseded by manual delivery in fixture.');
    assert.deepEqual(store.isBlockerSatisfiedByRun(claim.runId), { satisfied: true, reason: 'admin_override' });
  } finally {
    store.close();
  }
});

test('native stop records cancel state and idempotent final response outbox', () => {
  const store = openSchedulerStore(':memory:');
  try {
    const claim = store.claimReadyWorkItem({
      readySnapshot: snapshot(),
      currentSnapshot: snapshot(),
      taskId: 'linear-legion-scheduler-wi-02',
    });
    assert.equal(claim.ok, true);
    if (!claim.ok) return;

    store.transitionRun(claim.runId, 'running');
    store.requestNativeStop(claim.runId, 'Human pressed stop in Linear.', { traceId: 'trace-stop' });
    store.requestNativeStop(claim.runId, 'Duplicate stop webhook.', { traceId: 'trace-stop-duplicate' });

    const run = store.getRun(claim.runId);
    assert.equal(run?.state, 'cancelled');
    assert.equal(run?.failure_type, 'native_stop_requested');
    assert.equal(run?.native_state_observed, 'stop_requested');
    assert.deepEqual(store.isBlockerSatisfiedByRun(claim.runId), { satisfied: false, reason: 'run_terminal_non_success' });

    const finalResponses = store.pendingOutbox().filter((entry) => entry.side_effect === 'final_response');
    assert.equal(finalResponses.length, 1);
    assert.match(finalResponses[0].idempotency_key, /native-stop:final-response$/);
  } finally {
    store.close();
  }
});

test('done run requires delivery and evidence gates before downstream satisfaction', () => {
  const store = openSchedulerStore(':memory:');
  try {
    const claim = store.claimReadyWorkItem({ readySnapshot: snapshot(), currentSnapshot: snapshot(), taskId: 'linear-legion-scheduler-wi-02' });
    assert.equal(claim.ok, true);
    if (!claim.ok) return;

    store.transitionRun(claim.runId, 'running');
    store.transitionRun(claim.runId, 'in_review');
    store.transitionRun(claim.runId, 'done');
    assert.deepEqual(store.isBlockerSatisfiedByRun(claim.runId), { satisfied: false, reason: 'inconsistent_terminal_state' });
  } finally {
    store.close();
  }
});

test('debug command applies migrations and prints health JSON for SQLite DB', () => {
  const { root, dbPath } = tmpDb('scheduler-debug-command');
  try {
    const output = execFileSync(process.execPath, ['--experimental-strip-types', '--experimental-sqlite', 'src/cli.ts', 'health', '--db', dbPath], {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const health = JSON.parse(output) as { ok: boolean; tables: string[]; dbPath: string };
    assert.equal(health.ok, true);
    assert.equal(health.tables.includes('runs'), true);
    assert.equal(health.dbPath.endsWith('scheduler.sqlite'), true);
    assert.equal(existsSync(dbPath), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('snapshot hash helper is stable across object key ordering', () => {
  assert.equal(stableHash({ b: 2, a: 1 }), stableHash({ a: 1, b: 2 }));
});
