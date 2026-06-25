import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { openSchedulerStore } from '../src/sqlite-store.ts';
import { dispatchParallelWorkItems } from '../src/dispatcher.ts';
import type { LinearProjectSnapshotInput, ScannerIssueInput } from '../src/scanner.ts';
import {
  findResourceLockConflicts,
  parseResourceLockKey,
  resourceLockKeysForIssue,
  resourceLocksConflict,
} from '../src/resource-locks.ts';

const projectRoot = resolve(new URL('..', import.meta.url).pathname);
const regressionCacheRoot = join(projectRoot, '.cache', 'regression');

function tmpDb(name: string) {
  mkdirSync(regressionCacheRoot, { recursive: true });
  const root = mkdtempSync(join(regressionCacheRoot, `${name}-`));
  return { root, dbPath: join(root, 'scheduler.sqlite') };
}

function issue(overrides: Partial<ScannerIssueInput> = {}): ScannerIssueInput {
  const identifier = overrides.identifier ?? 'WI-A';
  return {
    linearIssueId: overrides.linearIssueId ?? `issue-${identifier.toLowerCase()}`,
    identifier,
    title: overrides.title ?? `${identifier} fixture`,
    projectId: overrides.projectId ?? 'project-linear-scheduler',
    projectName: overrides.projectName ?? 'linear-opencode-scheduler',
    url: overrides.url ?? `https://linear.app/0xc1/issue/${identifier}`,
    stateName: overrides.stateName ?? 'Ready',
    stateType: overrides.stateType ?? 'unstarted',
    labels: overrides.labels ?? ['agent:ready', 'contract:stable', 'repo:legion-mind', 'risk:medium', 'area:default'],
    priority: overrides.priority ?? 2,
    assignee: overrides.assignee ?? null,
    blockerIdentifiers: overrides.blockerIdentifiers ?? [],
    createdAt: overrides.createdAt ?? '2026-06-20T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-06-25T00:00:00.000Z',
    taskId: overrides.taskId,
    resourceHints: overrides.resourceHints ?? [],
    staleSnapshotChangedFields: overrides.staleSnapshotChangedFields,
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

function tenIssueFixture(): LinearProjectSnapshotInput {
  return project([
    issue({ identifier: 'WI-A', labels: ['agent:ready', 'contract:stable', 'repo:legion-mind', 'risk:medium', 'area:ui'] }),
    issue({ identifier: 'WI-B', labels: ['agent:ready', 'contract:stable', 'repo:legion-mind', 'risk:medium', 'area:api'] }),
    issue({ identifier: 'WI-C', labels: ['agent:ready', 'contract:stable', 'repo:legion-mind', 'risk:medium', 'area:ui'] }),
    issue({ identifier: 'WI-D', labels: ['agent:ready', 'contract:stable', 'repo:legion-mind', 'risk:medium', 'mutex:db-migration'] }),
    issue({ identifier: 'WI-E', labels: ['agent:ready', 'contract:stable', 'repo:legion-mind', 'risk:medium', 'mutex:db-migration'] }),
    issue({ identifier: 'WI-F', labels: ['agent:ready', 'contract:stable', 'repo:legion-mind', 'risk:medium', 'area:docs'] }),
    issue({ identifier: 'WI-G', labels: ['agent:ready', 'contract:stable', 'repo:legion-mind', 'risk:medium', 'area:ops'] }),
    issue({ identifier: 'WI-H', labels: ['agent:ready', 'contract:stable', 'repo:legion-mind', 'risk:medium', 'area:api'] }),
    issue({ identifier: 'WI-I', labels: ['agent:ready', 'contract:stable', 'repo:legion-mind', 'risk:medium', 'area:cli'] }),
    issue({ identifier: 'WI-J', labels: ['agent:ready', 'contract:stable', 'repo:legion-mind', 'risk:medium', 'area:cli'] }),
  ]);
}

test('resource lock parser normalizes supported keys and conflict matrix', () => {
  assert.deepEqual(parseResourceLockKey(' Repo:Legion-Mind '), { kind: 'repo', name: 'legion-mind', key: 'repo:legion-mind' });
  assert.deepEqual(parseResourceLockKey('area:Scheduler'), { kind: 'area', name: 'scheduler', key: 'area:scheduler' });
  assert.throws(() => parseResourceLockKey('unknown:scheduler'), /Invalid resource lock key/);
  assert.throws(() => parseResourceLockKey('repo:'), /Invalid resource lock key/);

  assert.deepEqual(resourceLockKeysForIssue({ repoKey: 'Legion-Mind', labels: ['repo:legion-mind', 'area:Scheduler', 'mutex:DB-Migration'], allowRepoParallel: true }), [
    'area:legion-mind/scheduler',
    'mutex:db-migration',
  ]);
  assert.deepEqual(resourceLockKeysForIssue({ repoKey: 'legion-mind', labels: ['repo:legion-mind'], allowRepoParallel: false }), ['repo:legion-mind']);

  assert.equal(resourceLocksConflict('repo:legion-mind', 'area:legion-mind/scheduler'), true);
  assert.equal(resourceLocksConflict('area:repo-a/scheduler', 'area:repo-b/scheduler'), false);
  assert.equal(resourceLocksConflict('mutex:db', 'mutex:db'), true);
  assert.equal(findResourceLockConflicts(['area:legion-mind/api'], [{ lockKey: 'repo:legion-mind', runId: 'run-1' }])[0].runId, 'run-1');
});

test('fair scheduler lets old candidates escape starvation under capacity', () => {
  const store = openSchedulerStore(':memory:');
  try {
    const outcome = dispatchParallelWorkItems(store, {
      project: project([
        issue({ identifier: 'WI-NEW-HIGH', priority: 1, createdAt: '2026-06-25T11:00:00.000Z', labels: ['agent:ready', 'contract:stable', 'repo:legion-mind', 'risk:medium', 'area:new'] }),
        issue({ identifier: 'WI-OLD-LOW', priority: 4, createdAt: '2026-06-20T00:00:00.000Z', labels: ['agent:ready', 'contract:stable', 'repo:legion-mind', 'risk:medium', 'area:old'] }),
      ]),
      config: {
        parallelRepoKeys: ['legion-mind'],
        ageBoostIntervalMs: 24 * 60 * 60 * 1000,
        limits: { globalConcurrency: 1 },
        now: '2026-06-25T12:00:00.000Z',
      },
    });
    assert.deepEqual(outcome.claimed.map((item) => item.identifier), ['WI-OLD-LOW']);
    assert.equal(outcome.waiting.find((item) => item.identifier === 'WI-NEW-HIGH')?.reason, 'waiting_for_capacity');
  } finally {
    store.close();
  }
});

test('parallel dispatcher claims non-conflicting WIs and reports lock waits', () => {
  const store = openSchedulerStore(':memory:');
  try {
    const outcome = dispatchParallelWorkItems(store, {
      project: tenIssueFixture(),
      config: {
        parallelRepoKeys: ['legion-mind'],
        limits: { globalConcurrency: 10, perProjectConcurrency: 10, perRepoConcurrency: 10 },
        now: '2026-06-25T12:00:00.000Z',
        traceId: 'trace-parallel-dispatch',
      },
    });

    assert.deepEqual(outcome.claimed.map((item) => item.identifier), ['WI-A', 'WI-B', 'WI-D', 'WI-F', 'WI-G', 'WI-I']);
    assert.equal(store.listRuns().length, 6);
    assert.deepEqual(outcome.waiting.filter((item) => item.reason === 'waiting_for_lock').map((item) => item.identifier), ['WI-C', 'WI-E', 'WI-H', 'WI-J']);
    assert.equal(outcome.waiting.every((item) => item.nativePreview.waitingReason !== undefined), true);
    assert.equal(store.listHeldLocks().some((lock) => lock.lockKey === 'repo:legion-mind'), false);
    assert.equal(store.listSchedulerEvents().some((event) => event.event_type === 'dispatch_waiting'), true);
  } finally {
    store.close();
  }
});

test('capacity waits stay unclaimed and are not running', () => {
  const store = openSchedulerStore(':memory:');
  try {
    const outcome = dispatchParallelWorkItems(store, {
      project: project([
        issue({ identifier: 'WI-A', labels: ['agent:ready', 'contract:stable', 'repo:legion-mind', 'risk:medium', 'area:a'] }),
        issue({ identifier: 'WI-B', labels: ['agent:ready', 'contract:stable', 'repo:legion-mind', 'risk:medium', 'area:b'] }),
        issue({ identifier: 'WI-C', labels: ['agent:ready', 'contract:stable', 'repo:legion-mind', 'risk:medium', 'area:c'] }),
      ]),
      config: { parallelRepoKeys: ['legion-mind'], limits: { globalConcurrency: 2 }, now: '2026-06-25T12:00:00.000Z' },
    });

    assert.equal(outcome.claimed.length, 2);
    const waiting = outcome.waiting.find((item) => item.reason === 'waiting_for_capacity');
    assert.equal(waiting?.identifier, 'WI-C');
    assert.equal(store.listRuns().some((run) => run.linear_identifier === 'WI-C'), false);
    assert.equal(JSON.stringify(waiting?.nativePreview).includes('agent:running'), false);
  } finally {
    store.close();
  }
});

test('restart recovery sees persisted active runs and held locks without duplicate dispatch', () => {
  const { root, dbPath } = tmpDb('dispatcher-restart');
  const first = openSchedulerStore(dbPath);
  try {
    const initial = dispatchParallelWorkItems(first, {
      project: tenIssueFixture(),
      config: { parallelRepoKeys: ['legion-mind'], limits: { globalConcurrency: 6, perProjectConcurrency: 6, perRepoConcurrency: 6 }, now: '2026-06-25T12:00:00.000Z' },
    });
    assert.equal(initial.claimed.length, 6);
  } finally {
    first.close();
  }

  const restarted = openSchedulerStore(dbPath);
  try {
    const afterRestart = dispatchParallelWorkItems(restarted, {
      project: tenIssueFixture(),
      config: { parallelRepoKeys: ['legion-mind'], limits: { globalConcurrency: 6, perProjectConcurrency: 6, perRepoConcurrency: 6 }, now: '2026-06-25T12:05:00.000Z' },
    });
    assert.equal(afterRestart.claimed.length, 0);
    assert.equal(restarted.listRuns().length, 6);
    assert.deepEqual(afterRestart.waiting.filter((item) => item.reason === 'waiting_for_lock').map((item) => item.identifier), ['WI-C', 'WI-E', 'WI-H', 'WI-J']);
  } finally {
    restarted.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('terminal lock release allows a later reconcile to claim the next conflicting WI', () => {
  const store = openSchedulerStore(':memory:');
  try {
    const initial = dispatchParallelWorkItems(store, {
      project: tenIssueFixture(),
      config: { parallelRepoKeys: ['legion-mind'], limits: { globalConcurrency: 6, perProjectConcurrency: 6, perRepoConcurrency: 6 }, now: '2026-06-25T12:00:00.000Z' },
    });
    const firstRun = initial.claimed.find((item) => item.identifier === 'WI-A');
    assert.ok(firstRun);
    store.transitionRun(firstRun.runId, 'failed', { actor: 'test', failureType: 'fixture_terminal_non_success', now: '2026-06-25T12:01:00.000Z' });
    store.releaseLocksForRun(firstRun.runId, { actor: 'test', reason: 'fixture terminal release', now: '2026-06-25T12:01:00.000Z' });

    const afterRelease = dispatchParallelWorkItems(store, {
      project: tenIssueFixture(),
      config: { parallelRepoKeys: ['legion-mind'], limits: { globalConcurrency: 6, perProjectConcurrency: 6, perRepoConcurrency: 6 }, now: '2026-06-25T12:02:00.000Z' },
    });
    assert.equal(afterRelease.claimed.some((item) => item.identifier === 'WI-C'), true);
  } finally {
    store.close();
  }
});

test('stale lock hook reports expired held locks without auto-release', () => {
  const store = openSchedulerStore(':memory:');
  try {
    const initial = dispatchParallelWorkItems(store, {
      project: project([issue({ identifier: 'WI-STALE', labels: ['agent:ready', 'contract:stable', 'repo:legion-mind', 'risk:medium', 'area:stale'] })]),
      config: { parallelRepoKeys: ['legion-mind'], limits: { globalConcurrency: 1 }, lockTtlMs: 1000, now: '2026-06-25T12:00:00.000Z' },
    });
    assert.equal(initial.claimed.length, 1);

    const afterTtl = dispatchParallelWorkItems(store, {
      project: project([issue({ identifier: 'WI-BLOCKED-BY-STALE', labels: ['agent:ready', 'contract:stable', 'repo:legion-mind', 'risk:medium', 'area:stale'] })]),
      config: { parallelRepoKeys: ['legion-mind'], limits: { globalConcurrency: 2 }, now: '2026-06-25T12:01:00.000Z' },
    });
    assert.equal(afterTtl.staleLocks.length, 1);
    assert.equal(afterTtl.waiting[0].reason, 'waiting_for_lock');
    assert.equal(store.listSchedulerEvents().some((event) => event.event_type === 'stale_lock_detected'), true);
    assert.equal(store.heldLockConflicts(['area:legion-mind/stale']).length, 1);
  } finally {
    store.close();
  }
});

test('dispatch fixture CLI claims ready WIs without launching workers', () => {
  const { root, dbPath } = tmpDb('dispatcher-cli');
  try {
    const fixturePath = join(root, 'snapshot.json');
    writeFileSync(fixturePath, JSON.stringify(project([
      issue({ identifier: 'WI-CLI-A', labels: ['agent:ready', 'contract:stable', 'repo:legion-mind', 'risk:medium', 'area:cli-a'] }),
      issue({ identifier: 'WI-CLI-B', labels: ['agent:ready', 'contract:stable', 'repo:legion-mind', 'risk:medium', 'area:cli-b'] }),
    ]), null, 2));

    const output = execFileSync(process.execPath, [
      '--experimental-strip-types',
      '--experimental-sqlite',
      'src/cli.ts',
      'dispatch',
      'fixture',
      '--fixture',
      fixturePath,
      '--db',
      dbPath,
      '--parallel-repos',
      'legion-mind',
      '--global-concurrency',
      '2',
    ], { cwd: projectRoot, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
    const outcome = JSON.parse(output) as { claimed: Array<{ identifier: string }>; waiting: unknown[] };
    assert.deepEqual(outcome.claimed.map((item) => item.identifier), ['WI-CLI-A', 'WI-CLI-B']);
    assert.deepEqual(outcome.waiting, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
