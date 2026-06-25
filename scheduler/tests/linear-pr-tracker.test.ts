import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  StaticPullRequestClient,
  pullRequestSnapshotFromFixture,
  trackPrDelivery,
} from '../src/pr-tracker.ts';
import type { PullRequestSnapshot } from '../src/pr-tracker.ts';
import { openSchedulerStore } from '../src/sqlite-store.ts';
import type { WorkItemSnapshotInput } from '../src/sqlite-store.ts';
import { writeEvidenceFixture } from '../src/worker-runner.ts';

const projectRoot = resolve(new URL('..', import.meta.url).pathname);
const regressionCacheRoot = join(projectRoot, '.cache', 'regression');

function tmpRoot(name: string) {
  mkdirSync(regressionCacheRoot, { recursive: true });
  return mkdtempSync(join(regressionCacheRoot, `${name}-`));
}

function snapshot(overrides: Partial<WorkItemSnapshotInput> = {}): WorkItemSnapshotInput {
  return {
    linearIssueId: overrides.linearIssueId ?? 'issue-60',
    linearIdentifier: overrides.linearIdentifier ?? '0XC-60',
    linearProjectId: overrides.linearProjectId ?? 'project-linear-scheduler',
    title: overrides.title ?? 'WI-05 PR tracking and Linear delivery writeback',
    stateName: overrides.stateName ?? 'Ready',
    stateType: overrides.stateType ?? 'unstarted',
    labels: overrides.labels ?? ['agent:ready', 'contract:stable', 'repo:legion-mind', 'risk:high', 'area:scheduler'],
    blockers: overrides.blockers ?? ['0XC-58'],
    repoKey: overrides.repoKey ?? 'legion-mind',
    risk: overrides.risk ?? 'high',
    contractState: overrides.contractState ?? 'stable',
    resourceHints: overrides.resourceHints ?? ['area:scheduler'],
    linearUpdatedAt: overrides.linearUpdatedAt ?? '2026-06-25T00:00:00.000Z',
  };
}

function prSnapshot(overrides: Partial<PullRequestSnapshot> = {}): PullRequestSnapshot {
  return {
    url: overrides.url ?? 'https://github.com/Thrimbda/legion-mind/pull/60',
    state: overrides.state ?? 'open',
    draft: overrides.draft ?? false,
    merged: overrides.merged ?? false,
    mergedAt: overrides.mergedAt ?? null,
    closedAt: overrides.closedAt ?? null,
    headSha: overrides.headSha ?? 'abc123',
    checks: overrides.checks ?? { status: 'pending', summary: 'CI pending.' },
    review: overrides.review ?? { decision: 'review_required', summary: 'Awaiting review.' },
    closeReason: overrides.closeReason ?? null,
  };
}

function claimRun(store: ReturnType<typeof openSchedulerStore>, overrides: Partial<WorkItemSnapshotInput> = {}, taskId = 'linear-0xc-60') {
  const input = snapshot(overrides);
  const claim = store.claimReadyWorkItem({
    readySnapshot: input,
    currentSnapshot: input,
    taskId,
    lockKeys: [`repo:${input.repoKey}`, ...(input.resourceHints ?? [])],
    traceId: `trace-${input.linearIdentifier}`,
  });
  assert.equal(claim.ok, true);
  if (!claim.ok) throw new Error('claim failed');
  return claim;
}

test('PR open maps run to in_review and enqueues idempotent Linear native writeback', async () => {
  const root = tmpRoot('pr-tracker-in-review');
  const store = openSchedulerStore(':memory:');
  try {
    const claim = claimRun(store);
    const beforeOutboxCount = store.outboxForRun(claim.runId).length;
    const openPr = prSnapshot();
    const outcome = await trackPrDelivery(store, new StaticPullRequestClient(openPr), { runId: claim.runId, prUrl: openPr.url, repoPath: root, traceId: 'trace-pr-open' });

    assert.equal(outcome.decision, 'in_review');
    assert.equal(outcome.terminalKind, null);
    assert.equal(store.getRun(claim.runId)?.state, 'in_review');
    assert.equal(store.getRun(claim.runId)?.pr_url, openPr.url);
    assert.equal(store.getRun(claim.runId)?.evidence_status, 'pending');
    assert.equal(store.isBlockerSatisfiedByRun(claim.runId).satisfied, false);

    const afterFirstTrackCount = store.outboxForRun(claim.runId).length;
    assert.equal(afterFirstTrackCount, beforeOutboxCount + 5);
    await trackPrDelivery(store, new StaticPullRequestClient(openPr), { runId: claim.runId, prUrl: openPr.url, repoPath: root, traceId: 'trace-pr-open-repeat' });
    assert.equal(store.outboxForRun(claim.runId).length, afterFirstTrackCount);

    const external = store.outboxForRun(claim.runId).find((row) => row.idempotency_key.includes(':delivery:pr-url:'));
    assert.ok(external);
    assert.match(external?.payload_json ?? '', /GitHub PR/);
  } finally {
    store.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('checks failure and review changes requested block run without downstream unlock', async () => {
  const root = tmpRoot('pr-tracker-blocked');
  const store = openSchedulerStore(':memory:');
  try {
    const claim = claimRun(store, { linearIssueId: 'issue-checks-fail', linearIdentifier: '0XC-60-CHECKS', resourceHints: ['area:checks-fail'] }, 'linear-0xc-60-checks');
    const outcome = await trackPrDelivery(store, new StaticPullRequestClient(prSnapshot({
      checks: { status: 'failure', summary: 'test failed' },
      review: { decision: 'approved', summary: 'approved' },
    })), { runId: claim.runId, prUrl: 'https://github.com/Thrimbda/legion-mind/pull/61', repoPath: root });

    assert.equal(outcome.decision, 'blocked');
    assert.equal(store.getRun(claim.runId)?.state, 'blocked');
    assert.equal(store.getRun(claim.runId)?.failure_type, 'pr_blocked');
    assert.match(store.getRun(claim.runId)?.failure_reason ?? '', /checks failing/i);
    assert.equal(store.isBlockerSatisfiedByRun(claim.runId).satisfied, false);
  } finally {
    store.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('merged PR reaches done only after evidence and lifecycle verifier pass', async () => {
  const root = tmpRoot('pr-tracker-success');
  const store = openSchedulerStore(':memory:');
  try {
    const claim = claimRun(store);
    writeEvidenceFixture(root, 'linear-0xc-60', { includeRfc: true });
    const merged = prSnapshot({
      state: 'closed',
      merged: true,
      mergedAt: '2026-06-25T01:00:00.000Z',
      checks: { status: 'success', summary: 'Required checks passed.' },
      review: { decision: 'approved', summary: 'Approved.' },
    });
    const outcome = await trackPrDelivery(store, new StaticPullRequestClient(merged), { runId: claim.runId, prUrl: merged.url, repoPath: root });

    assert.equal(outcome.decision, 'done');
    assert.equal(outcome.terminalKind, 'run_terminal_success');
    assert.equal(outcome.verification?.ok, true);
    assert.equal(store.getRun(claim.runId)?.state, 'done');
    assert.equal(store.getRun(claim.runId)?.delivery_gate_status, 'passed');
    assert.equal(store.getRun(claim.runId)?.evidence_status, 'passed');
    assert.deepEqual(store.isBlockerSatisfiedByRun(claim.runId), { satisfied: true, reason: 'run_terminal_success' });
    assert.equal(store.heldLockConflicts(['area:scheduler']).length, 0);

    const finalResponse = store.outboxForRun(claim.runId).find((row) => row.side_effect === 'final_response');
    assert.ok(finalResponse);
    assert.match(finalResponse?.payload_json ?? '', /run_terminal_success/);
    assert.match(finalResponse?.payload_json ?? '', /git-worktree-pr lifecycle summary/);
    assert.equal(store.timelineForRun(claim.runId).some((event) => event.event_type === 'downstream_reconcile_requested'), true);
  } finally {
    store.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('merged PR with missing evidence or lifecycle gap remains blocked', async () => {
  const root = tmpRoot('pr-tracker-evidence-blocked');
  const store = openSchedulerStore(':memory:');
  try {
    const merged = prSnapshot({
      state: 'closed',
      merged: true,
      mergedAt: '2026-06-25T01:00:00.000Z',
      checks: { status: 'success', summary: 'Required checks passed.' },
      review: { decision: 'approved', summary: 'Approved.' },
    });

    const missing = claimRun(store, { linearIssueId: 'issue-missing-evidence', linearIdentifier: '0XC-60-MISSING', resourceHints: ['area:missing-evidence'] }, 'linear-0xc-60-missing');
    const missingOutcome = await trackPrDelivery(store, new StaticPullRequestClient(merged), { runId: missing.runId, prUrl: merged.url, repoPath: root });
    assert.equal(missingOutcome.decision, 'blocked');
    assert.equal(missingOutcome.verification?.failureType, 'legion_evidence_missing');
    assert.equal(store.getRun(missing.runId)?.failure_type, 'legion_evidence_missing');
    assert.equal(store.isBlockerSatisfiedByRun(missing.runId).satisfied, false);

    const lifecycle = claimRun(store, { linearIssueId: 'issue-lifecycle-gap', linearIdentifier: '0XC-60-LIFECYCLE', repoKey: 'legion-mind-lifecycle', resourceHints: ['area:lifecycle-gap'] }, 'linear-0xc-60-lifecycle');
    const evidence = writeEvidenceFixture(root, 'linear-0xc-60-lifecycle', { includeRfc: true });
    writeFileSync(join(root, evidence.lifecycle as string), JSON.stringify({ prMerged: true, checksAndReviewComplete: true, worktreeRemoved: true, mainRefreshed: false }));
    const lifecycleOutcome = await trackPrDelivery(store, new StaticPullRequestClient(merged), { runId: lifecycle.runId, prUrl: merged.url, repoPath: root });
    assert.equal(lifecycleOutcome.decision, 'blocked');
    assert.equal(lifecycleOutcome.verification?.failureType, 'lifecycle_blocked');
    assert.equal(store.getRun(lifecycle.runId)?.failure_type, 'lifecycle_blocked');
    assert.equal(store.isBlockerSatisfiedByRun(lifecycle.runId).satisfied, false);
  } finally {
    store.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('closed-unmerged PR is terminal non-success and does not satisfy downstream', async () => {
  const root = tmpRoot('pr-tracker-non-success');
  const store = openSchedulerStore(':memory:');
  try {
    const claim = claimRun(store);
    const closed = prSnapshot({
      state: 'closed',
      merged: false,
      closedAt: '2026-06-25T02:00:00.000Z',
      closeReason: 'rejected',
      checks: { status: 'success', summary: 'Checks passed before rejection.' },
      review: { decision: 'changes_requested', summary: 'Human rejected the change.' },
    });
    const outcome = await trackPrDelivery(store, new StaticPullRequestClient(closed), { runId: claim.runId, prUrl: closed.url, repoPath: root });

    assert.equal(outcome.decision, 'terminal_non_success');
    assert.equal(outcome.terminalKind, 'run_terminal_non_success');
    assert.equal(store.getRun(claim.runId)?.state, 'failed');
    assert.equal(store.getRun(claim.runId)?.delivery_gate_status, 'failed');
    assert.equal(store.getRun(claim.runId)?.failure_type, 'pr_rejected');
    assert.deepEqual(store.isBlockerSatisfiedByRun(claim.runId), { satisfied: false, reason: 'run_terminal_non_success' });
    assert.equal(store.heldLockConflicts(['area:scheduler']).length, 0);
    assert.match(store.outboxForRun(claim.runId).find((row) => row.side_effect === 'final_response')?.payload_json ?? '', /run_terminal_non_success/);
  } finally {
    store.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('delivery track CLI consumes fixture snapshots', () => {
  const root = tmpRoot('pr-tracker-cli');
  const dbPath = join(root, 'scheduler.sqlite');
  const fixturePath = join(root, 'pr-open.json');
  const store = openSchedulerStore(dbPath);
  let runId = '';
  try {
    const claim = claimRun(store);
    runId = claim.runId;
  } finally {
    store.close();
  }
  try {
    const fixture = prSnapshot();
    writeFileSync(fixturePath, JSON.stringify(fixture, null, 2));
    assert.equal(pullRequestSnapshotFromFixture(JSON.parse(readFileSync(fixturePath, 'utf-8'))).url, fixture.url);
    const output = execFileSync(process.execPath, ['--experimental-strip-types', '--experimental-sqlite', 'src/cli.ts', 'delivery', 'track', '--run', runId, '--repo', root, '--fixture', fixturePath, '--db', dbPath], {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const parsed = JSON.parse(output) as { decision: string; runState: string; prUrl: string };
    assert.equal(parsed.decision, 'in_review');
    assert.equal(parsed.runState, 'in_review');
    assert.equal(parsed.prUrl, fixture.url);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
