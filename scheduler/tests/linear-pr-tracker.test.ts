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

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function createLifecycleRepo(root: string): { repoPath: string; remotePath: string; head: string } {
  const remotePath = join(root, 'remote.git');
  const repoPath = join(root, 'repo');
  git(root, ['init', '--bare', remotePath]);
  git(root, ['init', '--initial-branch=master', repoPath]);
  git(repoPath, ['config', 'user.name', 'Scheduler Test']);
  git(repoPath, ['config', 'user.email', 'scheduler@example.test']);
  writeFileSync(join(repoPath, 'README.md'), '# lifecycle fixture\n');
  git(repoPath, ['add', 'README.md']);
  git(repoPath, ['commit', '-m', 'initial']);
  git(repoPath, ['remote', 'add', 'origin', remotePath]);
  git(repoPath, ['push', '-u', 'origin', 'master']);
  return { repoPath, remotePath, head: git(repoPath, ['rev-parse', 'HEAD']) };
}

function commitAndPush(repoPath: string, message: string): string {
  git(repoPath, ['add', '.']);
  git(repoPath, ['commit', '-m', message]);
  git(repoPath, ['push', 'origin', 'master']);
  return git(repoPath, ['rev-parse', 'HEAD']);
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
    mergeCommitSha: overrides.mergeCommitSha ?? null,
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

test('tracker treats PR identity as run-level metadata and accepts an authorized follow-up URL', async () => {
  const root = tmpRoot('pr-tracker-run-metadata');
  const store = openSchedulerStore(':memory:');
  try {
    const claim = claimRun(store, {
      linearIssueId: 'issue-authorized-follow-up',
      linearIdentifier: '0XC-60-AUTHORIZED-FOLLOW-UP',
      resourceHints: ['area:authorized-follow-up'],
    }, 'linear-0xc-60-authorized-follow-up');
    store.updateRunMetadata(claim.runId, { prUrl: 'https://github.com/Thrimbda/legion-mind/pull/301' });
    const fetched: string[] = [];
    const client = {
      async fetchPullRequest(prUrl: string) {
        fetched.push(prUrl);
        return prSnapshot({ url: 'https://github.com/Thrimbda/legion-mind/pull/303' });
      },
    };
    const outcome = await trackPrDelivery(store, client, {
      runId: claim.runId,
      prUrl: 'https://github.com/Thrimbda/legion-mind/pull/302',
      repoPath: root,
    });
    assert.equal(outcome.decision, 'in_review');
    assert.deepEqual(fetched, ['https://github.com/Thrimbda/legion-mind/pull/302']);
    assert.equal(store.getRun(claim.runId)?.pr_url, 'https://github.com/Thrimbda/legion-mind/pull/303');
    assert.equal(store.timelineForRun(claim.runId).some((event) => event.event_type === 'pr_snapshot_observed'), true);
    assert.equal(store.outboxForRun(claim.runId).some((row) => row.idempotency_key.includes(':delivery:pr-url:')), true);
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
      url: 'https://github.com/Thrimbda/legion-mind/pull/61',
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
    const lifecycleRepo = createLifecycleRepo(root);
    const claim = claimRun(store);
    writeEvidenceFixture(lifecycleRepo.repoPath, 'linear-0xc-60', { includeRfc: true });
    const mergeCommitSha = commitAndPush(lifecycleRepo.repoPath, 'add scheduler evidence');
    const merged = prSnapshot({
      state: 'closed',
      merged: true,
      mergedAt: '2026-06-25T01:00:00.000Z',
      mergeCommitSha,
      checks: { status: 'success', summary: 'Required checks passed.' },
      review: { decision: 'approved', summary: 'Approved.' },
    });
    const outcome = await trackPrDelivery(store, new StaticPullRequestClient(merged), { runId: claim.runId, prUrl: merged.url, repoPath: lifecycleRepo.repoPath });

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

test('merged PR with missing repo evidence is terminal non-success while lifecycle gaps remain externally retryable', async () => {
  const root = tmpRoot('pr-tracker-evidence-blocked');
  const store = openSchedulerStore(':memory:');
  try {
    const lifecycleRepo = createLifecycleRepo(root);
    const merged = prSnapshot({
      state: 'closed',
      merged: true,
      mergedAt: '2026-06-25T01:00:00.000Z',
      mergeCommitSha: lifecycleRepo.head,
      checks: { status: 'success', summary: 'Required checks passed.' },
      review: { decision: 'approved', summary: 'Approved.' },
    });

    const missing = claimRun(store, { linearIssueId: 'issue-missing-evidence', linearIdentifier: '0XC-60-MISSING', resourceHints: ['area:missing-evidence'] }, 'linear-0xc-60-missing');
    const missingOutcome = await trackPrDelivery(store, new StaticPullRequestClient(merged), { runId: missing.runId, prUrl: merged.url, repoPath: lifecycleRepo.repoPath });
    assert.equal(missingOutcome.decision, 'terminal_non_success');
    assert.equal(missingOutcome.terminalKind, 'run_terminal_non_success');
    assert.equal(missingOutcome.verification?.failureType, 'legion_evidence_missing');
    assert.equal(store.getRun(missing.runId)?.state, 'failed');
    assert.equal(store.getRun(missing.runId)?.failure_type, 'legion_evidence_missing');
    assert.match(store.getRun(missing.runId)?.failure_reason ?? '', /explicit user authorization/);
    assert.equal(store.isBlockerSatisfiedByRun(missing.runId).satisfied, false);
    assert.equal(store.heldLockConflicts(['area:missing-evidence']).length, 0);
    assert.match(store.outboxForRun(missing.runId).find((row) => row.side_effect === 'final_response')?.payload_json ?? '', /run_terminal_non_success/);
    assert.equal(store.outboxForRun(missing.runId).some((row) => row.side_effect === 'create_comment'), true);

    const lifecycle = claimRun(store, { linearIssueId: 'issue-lifecycle-gap', linearIdentifier: '0XC-60-LIFECYCLE', repoKey: 'legion-mind-lifecycle', resourceHints: ['area:lifecycle-gap'] }, 'linear-0xc-60-lifecycle');
    writeEvidenceFixture(lifecycleRepo.repoPath, 'linear-0xc-60-lifecycle', { includeRfc: true });
    const lifecycleMergeSha = commitAndPush(lifecycleRepo.repoPath, 'add lifecycle task evidence');
    mkdirSync(join(lifecycleRepo.repoPath, '.worktrees', 'linear-0xc-60-lifecycle'), { recursive: true });
    const lifecycleSnapshot = { ...merged, mergeCommitSha: lifecycleMergeSha };
    const lifecycleOutcome = await trackPrDelivery(store, new StaticPullRequestClient(lifecycleSnapshot), { runId: lifecycle.runId, prUrl: lifecycleSnapshot.url, repoPath: lifecycleRepo.repoPath });
    assert.equal(lifecycleOutcome.decision, 'blocked');
    assert.equal(lifecycleOutcome.lifecycle?.failureType, 'lifecycle_blocked');
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
    const lifecycleRepo = createLifecycleRepo(root);
    const claim = claimRun(store);
    const closed = prSnapshot({
      state: 'closed',
      merged: false,
      closedAt: '2026-06-25T02:00:00.000Z',
      closeReason: 'rejected',
      checks: { status: 'success', summary: 'Checks passed before rejection.' },
      review: { decision: 'changes_requested', summary: 'Human rejected the change.' },
    });
    const outcome = await trackPrDelivery(store, new StaticPullRequestClient(closed), { runId: claim.runId, prUrl: closed.url, repoPath: lifecycleRepo.repoPath });

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

test('closed-unmerged PR remains lifecycle_blocked until cleanup and refresh are directly observed', async () => {
  const root = tmpRoot('pr-tracker-closed-lifecycle');
  const store = openSchedulerStore(':memory:');
  try {
    const lifecycleRepo = createLifecycleRepo(root);
    const taskId = 'linear-0xc-60-closed-lifecycle';
    const claim = claimRun(store, {
      linearIssueId: 'issue-closed-lifecycle',
      linearIdentifier: '0XC-60-CLOSED-LIFECYCLE',
      resourceHints: ['area:closed-lifecycle'],
    }, taskId);
    const closed = prSnapshot({
      url: 'https://github.com/Thrimbda/legion-mind/pull/62',
      state: 'closed',
      merged: false,
      closedAt: '2026-06-25T02:00:00.000Z',
      closeReason: 'closed_unmerged',
      checks: { status: 'success', summary: 'Checks passed before close.' },
      review: { decision: 'none', summary: 'No review required.' },
    });
    const taskWorktree = join(lifecycleRepo.repoPath, '.worktrees', taskId);
    mkdirSync(taskWorktree, { recursive: true });
    const blocked = await trackPrDelivery(store, new StaticPullRequestClient(closed), {
      runId: claim.runId,
      prUrl: closed.url,
      repoPath: lifecycleRepo.repoPath,
    });
    assert.equal(blocked.decision, 'blocked');
    assert.equal(blocked.lifecycle?.ok, false);
    assert.equal(store.getRun(claim.runId)?.failure_type, 'lifecycle_blocked');
    assert.equal(store.getRun(claim.runId)?.pr_url, closed.url);
    assert.equal(store.outboxForRun(claim.runId).some((row) => row.side_effect === 'final_response'), false);

    rmSync(taskWorktree, { recursive: true, force: true });
    const terminal = await trackPrDelivery(store, new StaticPullRequestClient(closed), {
      runId: claim.runId,
      prUrl: closed.url,
      repoPath: lifecycleRepo.repoPath,
    });
    assert.equal(terminal.decision, 'terminal_non_success');
    assert.equal(terminal.lifecycle?.ok, true);
    assert.equal(store.getRun(claim.runId)?.state, 'failed');
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
