import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, resolve } from 'node:path';
import { openSchedulerStore } from '../src/sqlite-store.ts';
import type { WorkItemSnapshotInput } from '../src/sqlite-store.ts';
import { buildDependencyGraph, detectCycles, fetchLinearProjectSnapshot, isBlockerSatisfied, scanLinearProject } from '../src/scanner.ts';
import type { LinearProjectSnapshotInput, ScannerIssueInput, SkippedReason } from '../src/scanner.ts';

const projectRoot = resolve(new URL('..', import.meta.url).pathname);
const regressionCacheRoot = join(projectRoot, '.cache', 'regression');

function tmpRoot(name: string) {
  mkdirSync(regressionCacheRoot, { recursive: true });
  return mkdtempSync(join(regressionCacheRoot, `${name}-`));
}

function issue(overrides: Partial<ScannerIssueInput> = {}): ScannerIssueInput {
  const identifier = overrides.identifier ?? 'WI-READY';
  return {
    linearIssueId: overrides.linearIssueId ?? `issue-${identifier.toLowerCase()}`,
    identifier,
    title: overrides.title ?? `${identifier} fixture`,
    projectId: overrides.projectId ?? 'project-linear-scheduler',
    projectName: overrides.projectName ?? 'linear-opencode-scheduler',
    url: overrides.url ?? `https://linear.app/0xc1/issue/${identifier}`,
    stateName: overrides.stateName ?? 'Ready',
    stateType: overrides.stateType ?? 'unstarted',
    labels: overrides.labels ?? ['agent:ready', 'contract:stable', 'repo:legion-mind', 'risk:medium', 'area:scheduler'],
    priority: overrides.priority ?? 2,
    assignee: overrides.assignee ?? null,
    blockerIdentifiers: overrides.blockerIdentifiers ?? [],
    createdAt: overrides.createdAt ?? '2026-06-23T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-06-24T00:00:00.000Z',
    taskId: overrides.taskId,
    resourceHints: overrides.resourceHints ?? [],
    staleSnapshotChangedFields: overrides.staleSnapshotChangedFields,
    relations: overrides.relations,
  };
}

function snapshot(overrides: Partial<WorkItemSnapshotInput> = {}): WorkItemSnapshotInput {
  return {
    linearIssueId: overrides.linearIssueId ?? 'issue-lock-holder',
    linearIdentifier: overrides.linearIdentifier ?? 'WI-LOCK-HOLDER',
    linearProjectId: overrides.linearProjectId ?? 'project-linear-scheduler',
    title: overrides.title ?? 'Active lock holder',
    stateName: overrides.stateName ?? 'Ready',
    stateType: overrides.stateType ?? 'unstarted',
    labels: overrides.labels ?? ['agent:ready', 'contract:stable', 'repo:legion-mind', 'risk:medium'],
    blockers: overrides.blockers ?? [],
    repoKey: overrides.repoKey ?? 'legion-mind',
    risk: overrides.risk ?? 'medium',
    contractState: overrides.contractState ?? 'stable',
    resourceHints: overrides.resourceHints ?? [],
    linearUpdatedAt: overrides.linearUpdatedAt ?? '2026-06-24T00:00:00.000Z',
  };
}

function project(issues: ScannerIssueInput[]): LinearProjectSnapshotInput {
  return {
    project: { id: 'project-linear-scheduler', name: 'linear-opencode-scheduler', key: 'scheduler' },
    observedAt: '2026-06-24T12:00:00.000Z',
    issues,
  };
}

async function withMockLinearServer(handler: (body: Record<string, unknown>) => Record<string, unknown>, run: (endpoint: string, requests: Record<string, unknown>[]) => Promise<void>) {
  const requests: Record<string, unknown>[] = [];
  const server = createServer((request, response) => {
    let body = '';
    request.setEncoding('utf-8');
    request.on('data', (chunk) => { body += chunk; });
    request.on('end', () => {
      const parsed = JSON.parse(body) as Record<string, unknown>;
      requests.push(parsed);
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify(handler(parsed)));
    });
  });
  await new Promise<void>((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
  const address = server.address();
  assert.equal(typeof address, 'object');
  try {
    await run(`http://127.0.0.1:${address?.port}/graphql`, requests);
  } finally {
    await new Promise<void>((resolveClose, rejectClose) => server.close((error) => error ? rejectClose(error) : resolveClose()));
  }
}

test('dependency graph uses blocker -> blocked direction and reports cycle paths', () => {
  const graph = buildDependencyGraph([
    issue({ identifier: 'WI-A' }),
    issue({ identifier: 'WI-B', blockerIdentifiers: ['WI-A'] }),
    issue({ identifier: 'WI-C', blockerIdentifiers: ['WI-B'] }),
  ]);
  assert.deepEqual(graph.outgoing.get('WI-A'), ['WI-B']);
  assert.deepEqual(graph.incoming.get('WI-C'), ['WI-B']);

  const cyclic = buildDependencyGraph([
    issue({ identifier: 'WI-X', blockerIdentifiers: ['WI-Y'] }),
    issue({ identifier: 'WI-Y', blockerIdentifiers: ['WI-X'] }),
  ]);
  assert.deepEqual(detectCycles(cyclic), [{ path: ['WI-X', 'WI-Y', 'WI-X'] }]);
});

test('Linear GraphQL client fetches project issues with Relay pagination and relation normalization', async () => {
  await withMockLinearServer((body) => {
    const variables = body.variables as { after?: string | null };
    const firstPage = !variables.after;
    return {
      data: {
        issues: {
          nodes: firstPage ? [
            {
              id: 'issue-ready',
              identifier: 'WI-READY',
              title: 'Ready from Linear API',
              url: 'https://linear.app/0xc1/issue/WI-READY',
              priority: 1,
              createdAt: '2026-06-23T00:00:00.000Z',
              updatedAt: '2026-06-24T00:00:00.000Z',
              project: { id: 'project-linear-scheduler', name: 'linear-opencode-scheduler', key: 'scheduler', url: 'https://linear.app/0xc1/project/scheduler' },
              state: { name: 'Ready', type: 'unstarted' },
              labels: { nodes: [{ name: 'agent:ready' }, { name: 'contract:stable' }, { name: 'repo:legion-mind' }, { name: 'risk:medium' }] },
              assignee: { id: 'user-1', name: 'Owner', email: 'owner@example.com' },
              relations: { nodes: [{ type: 'blocked_by', relatedIssue: { id: 'issue-upstream', identifier: 'WI-UPSTREAM' } }] },
            },
          ] : [
            {
              id: 'issue-upstream',
              identifier: 'WI-UPSTREAM',
              title: 'Upstream manual done',
              priority: 2,
              createdAt: '2026-06-22T00:00:00.000Z',
              updatedAt: '2026-06-24T00:00:00.000Z',
              project: { id: 'project-linear-scheduler', name: 'linear-opencode-scheduler', key: 'scheduler' },
              state: { name: 'Done', type: 'completed' },
              labels: { nodes: [{ name: 'contract:stable' }, { name: 'repo:legion-mind' }, { name: 'risk:low' }] },
              relations: { nodes: [] },
            },
          ],
          pageInfo: { hasNextPage: firstPage, endCursor: firstPage ? 'cursor-2' : null },
        },
      },
    };
  }, async (endpoint, requests) => {
    const snapshot = await fetchLinearProjectSnapshot({ apiKey: 'test-linear-key', projectId: 'project-linear-scheduler', endpoint, observedAt: '2026-06-24T12:00:00.000Z', pageSize: 1 });
    assert.equal(requests.length, 2);
    assert.equal(snapshot.project.name, 'linear-opencode-scheduler');
    assert.deepEqual(snapshot.issues.map((item) => item.identifier), ['WI-READY', 'WI-UPSTREAM']);
    assert.deepEqual(snapshot.issues[0].blockerIdentifiers, ['WI-UPSTREAM']);
    assert.equal(snapshot.issues[0].labels.includes('agent:ready'), true);
  });
});

test('blocker satisfaction uses scheduler terminal policy before Linear Done fallback', () => {
  const store = openSchedulerStore(':memory:');
  try {
    const claim = store.claimReadyWorkItem({ readySnapshot: snapshot({ linearIssueId: 'issue-run-success', linearIdentifier: 'WI-RUN-SUCCESS' }), currentSnapshot: snapshot({ linearIssueId: 'issue-run-success', linearIdentifier: 'WI-RUN-SUCCESS' }), taskId: 'linear-wi-run-success', lockKeys: ['mutex:success'] });
    assert.equal(claim.ok, true);
    if (!claim.ok) return;
    store.transitionRun(claim.runId, 'running');
    store.transitionRun(claim.runId, 'in_review');
    store.transitionRun(claim.runId, 'done');
    assert.equal(isBlockerSatisfied(issue({ linearIssueId: 'issue-run-success', identifier: 'WI-RUN-SUCCESS' }), { store }).reason, 'inconsistent_terminal_state');

    const passed = store.claimReadyWorkItem({ readySnapshot: snapshot({ linearIssueId: 'issue-run-passed', linearIdentifier: 'WI-RUN-PASSED' }), currentSnapshot: snapshot({ linearIssueId: 'issue-run-passed', linearIdentifier: 'WI-RUN-PASSED' }), taskId: 'linear-wi-run-passed', lockKeys: ['mutex:passed'] });
    assert.equal(passed.ok, true);
    if (!passed.ok) return;
    store.transitionRun(passed.runId, 'running');
    store.transitionRun(passed.runId, 'in_review');
    store.transitionRun(passed.runId, 'done', { deliveryGateStatus: 'passed', evidenceStatus: 'passed' });
    assert.deepEqual(isBlockerSatisfied(issue({ linearIssueId: 'issue-run-passed', identifier: 'WI-RUN-PASSED' }), { store }), { satisfied: true, reason: 'run_terminal_success', runId: passed.runId });

    const failed = store.claimReadyWorkItem({ readySnapshot: snapshot({ linearIssueId: 'issue-run-failed', linearIdentifier: 'WI-RUN-FAILED' }), currentSnapshot: snapshot({ linearIssueId: 'issue-run-failed', linearIdentifier: 'WI-RUN-FAILED' }), taskId: 'linear-wi-run-failed', lockKeys: ['mutex:failed'] });
    assert.equal(failed.ok, true);
    if (!failed.ok) return;
    store.transitionRun(failed.runId, 'running');
    store.transitionRun(failed.runId, 'failed', { failureType: 'verification_failed' });
    assert.equal(isBlockerSatisfied(issue({ linearIssueId: 'issue-run-failed', identifier: 'WI-RUN-FAILED' }), { store }).reason, 'run_terminal_non_success');

    assert.deepEqual(isBlockerSatisfied(issue({ identifier: 'WI-MANUAL', stateName: 'Done', stateType: 'completed', labels: ['repo:legion-mind', 'risk:low', 'contract:stable'] }), { store }), { satisfied: true, reason: 'manual_done' });
  } finally {
    store.close();
  }
});

test('scanner emits ready list, required skipped reasons and persists work item snapshots', () => {
  const store = openSchedulerStore(':memory:');
  try {
    const lockHolder = store.claimReadyWorkItem({ readySnapshot: snapshot(), currentSnapshot: snapshot(), taskId: 'linear-lock-holder', lockKeys: ['mutex:db-migration'] });
    assert.equal(lockHolder.ok, true);
    const active = store.claimReadyWorkItem({ readySnapshot: snapshot({ linearIssueId: 'issue-active', linearIdentifier: 'WI-ACTIVE' }), currentSnapshot: snapshot({ linearIssueId: 'issue-active', linearIdentifier: 'WI-ACTIVE' }), taskId: 'linear-wi-active', lockKeys: ['mutex:active'] });
    assert.equal(active.ok, true);

    const report = scanLinearProject(project([
      issue({ identifier: 'WI-DONE', stateName: 'Done', stateType: 'completed', labels: ['contract:stable', 'repo:legion-mind', 'risk:low'] }),
      issue({ identifier: 'WI-READY', blockerIdentifiers: ['WI-DONE'], priority: 1 }),
      issue({ identifier: 'WI-NO-READY', labels: ['contract:stable', 'repo:legion-mind', 'risk:medium'] }),
      issue({ identifier: 'WI-CONTRACT', labels: ['agent:ready', 'contract:needs-review', 'repo:legion-mind', 'risk:medium'] }),
      issue({ identifier: 'WI-HUMAN', labels: ['agent:ready', 'contract:stable', 'agent:needs-human', 'repo:legion-mind', 'risk:medium'] }),
      issue({ identifier: 'WI-NO-REPO', labels: ['agent:ready', 'contract:stable', 'risk:medium'] }),
      issue({ identifier: 'WI-ACTIVE', linearIssueId: 'issue-active' }),
      issue({ identifier: 'WI-LOCKED', labels: ['agent:ready', 'contract:stable', 'repo:legion-mind', 'risk:medium', 'mutex:db-migration'] }),
      issue({ identifier: 'WI-BLOCKED', blockerIdentifiers: ['WI-NOT-DONE'] }),
      issue({ identifier: 'WI-NOT-DONE', stateName: 'In Progress', stateType: 'started' }),
      issue({ identifier: 'WI-STALE', staleSnapshotChangedFields: ['labels', 'linear_updated_at'] }),
      issue({ identifier: 'WI-CYCLE-A', blockerIdentifiers: ['WI-CYCLE-B'] }),
      issue({ identifier: 'WI-CYCLE-B', blockerIdentifiers: ['WI-CYCLE-A'] }),
    ]), { store, config: { knownRepoKeys: ['legion-mind'], delegateAppUserId: 'linear-agent-app' } });

    assert.deepEqual(report.ready.map((item) => item.identifier), ['WI-READY']);
    assert.equal(report.ready[0].nativePreview.agentSession, 'create_or_find');
    assert.equal(report.ready[0].nativePreview.delegate, 'linear-agent-app');
    assert.equal(report.ready[0].locks.includes('repo:legion-mind'), true);
    assert.match(report.ready[0].snapshotHash, /^[a-f0-9]{64}$/);

    const reasons = new Map(report.skipped.map((item) => [item.identifier, item.reason]));
    const expected: Record<string, SkippedReason> = {
      'WI-NO-READY': 'agent_ready_missing',
      'WI-CONTRACT': 'contract_not_stable',
      'WI-HUMAN': 'human_gate',
      'WI-NO-REPO': 'repo_mapping_missing',
      'WI-ACTIVE': 'active_run_exists',
      'WI-LOCKED': 'resource_conflict',
      'WI-BLOCKED': 'dependency_blocked',
      'WI-STALE': 'stale_snapshot',
      'WI-CYCLE-A': 'dependency_cycle',
      'WI-CYCLE-B': 'dependency_cycle',
    };
    for (const [identifier, reason] of Object.entries(expected)) {
      assert.equal(reasons.get(identifier), reason, identifier);
    }
    assert.deepEqual(report.cycles, [{ path: ['WI-CYCLE-A', 'WI-CYCLE-B', 'WI-CYCLE-A'] }]);
    assert.equal(store.listSnapshots().some((row) => row.linear_identifier === 'WI-READY'), true);

    const paused = scanLinearProject(project([issue({ identifier: 'WI-PAUSED' })]), { store, config: { pausedProjectIds: ['project-linear-scheduler'] } });
    assert.equal(paused.skipped[0].reason, 'project_paused');
  } finally {
    store.close();
  }
});

test('scan fixture CLI prints dry-run report without Linear write side effects', () => {
  const root = tmpRoot('scanner-cli');
  try {
    const fixturePath = join(root, 'snapshot.json');
    const dbPath = join(root, 'scanner.sqlite');
    writeFileSync(fixturePath, JSON.stringify(project([
      issue({ identifier: 'WI-MANUAL', stateName: 'Done', stateType: 'completed', labels: ['contract:stable', 'repo:legion-mind', 'risk:low'] }),
      issue({ identifier: 'WI-CLI-READY', blockerIdentifiers: ['WI-MANUAL'] }),
    ]), null, 2));

    const output = execFileSync(process.execPath, ['--experimental-strip-types', '--experimental-sqlite', 'src/cli.ts', 'scan', 'fixture', '--fixture', fixturePath, '--db', dbPath, '--delegate', 'linear-agent-app'], {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const report = JSON.parse(output) as { ready: Array<{ identifier: string; nativePreview: { delegate: string } }>; skipped: Array<{ identifier: string }> };
    assert.deepEqual(report.ready.map((item) => item.identifier), ['WI-CLI-READY']);
    assert.equal(report.ready[0].nativePreview.delegate, 'linear-agent-app');
    assert.deepEqual(report.skipped.map((item) => item.identifier), ['WI-MANUAL']);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
