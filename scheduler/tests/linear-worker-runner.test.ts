import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { openSchedulerStore } from '../src/sqlite-store.ts';
import type { OutboxRow, WorkItemSnapshotInput } from '../src/sqlite-store.ts';
import { taskIdFromLinearIdentifier } from '../src/task-id.ts';
import {
  defaultEvidencePaths,
  parseWorkerResultBlock,
  processNativeAgentOutbox,
  processOpenCodeWorkerDispatch,
  renderOpenCodePrompt,
  sanitizeOpenCodeEnv,
  verifyLegionEvidence,
  workerResultBlock,
  writeEvidenceFixture,
} from '../src/worker-runner.ts';
import type { NativeAgentAdapter, OpenCodeLauncher, OpenCodePromptContext } from '../src/worker-runner.ts';

const projectRoot = resolve(new URL('..', import.meta.url).pathname);
const regressionCacheRoot = join(projectRoot, '.cache', 'regression');

function tmpRoot(name: string) {
  mkdirSync(regressionCacheRoot, { recursive: true });
  return mkdtempSync(join(regressionCacheRoot, `${name}-`));
}

function snapshot(overrides: Partial<WorkItemSnapshotInput> = {}): WorkItemSnapshotInput {
  return {
    linearIssueId: overrides.linearIssueId ?? 'issue-58',
    linearIdentifier: overrides.linearIdentifier ?? '0XC-58',
    linearProjectId: overrides.linearProjectId ?? 'project-linear-scheduler',
    title: overrides.title ?? 'WI-04 worker runner',
    stateName: overrides.stateName ?? 'Ready',
    stateType: overrides.stateType ?? 'unstarted',
    labels: overrides.labels ?? ['agent:ready', 'contract:stable', 'repo:legion-mind', 'risk:high', 'area:scheduler'],
    blockers: overrides.blockers ?? [],
    repoKey: overrides.repoKey ?? 'legion-mind',
    risk: overrides.risk ?? 'high',
    contractState: overrides.contractState ?? 'stable',
    resourceHints: overrides.resourceHints ?? ['area:scheduler'],
    linearUpdatedAt: overrides.linearUpdatedAt ?? '2026-06-25T00:00:00.000Z',
  };
}

function promptContext(overrides: Partial<OpenCodePromptContext> = {}): OpenCodePromptContext {
  return {
    runId: 'run-1',
    attemptId: 'attempt-1',
    taskId: 'linear-0xc-58',
    repoPath: '/repo',
    baseRef: 'origin/master',
    branchPrefix: 'legion/linear-0xc-58-',
    evidenceVerifierOutputPath: '.legion/tasks/linear-0xc-58/docs/evidence-verifier.json',
    linear: {
      issueId: 'issue-58',
      identifier: '0XC-58',
      url: 'https://linear.app/0xc1/issue/0XC-58',
      projectId: 'project-linear-scheduler',
      title: 'WI-04 worker runner',
      description: 'Implement OpenCode worker runner.',
      labels: ['contract:stable', 'risk:high', 'repo:legion-mind'],
      blockers: ['0XC-55'],
      repoKey: 'legion-mind',
      risk: 'high',
      contractState: 'stable',
      linearUpdatedAt: '2026-06-25T00:00:00.000Z',
    },
    nativeAgent: {
      agentSessionId: 'agent-session-1',
      delegateAppUserId: 'linear-agent-app',
      stopSignalSource: 'scheduler://runs/run-1/stop',
    },
    ...overrides,
  };
}

function fakeNativeAdapter(calls: string[] = []): NativeAgentAdapter {
  return {
    async createOrFindSession(input) {
      calls.push('create_or_find_session');
      return { agentSessionId: input.agentSessionId ?? `session-${input.runId}` };
    },
    async setDelegate() { calls.push('set_delegate'); },
    async createActivity() {
      calls.push('create_activity');
      return { activityId: `activity-${calls.length}` };
    },
    async updatePlan() { calls.push('update_plan'); },
    async updateExternalUrls() { calls.push('update_external_urls'); },
    async createComment() {
      calls.push('create_comment');
      return { commentId: `comment-${calls.length}` };
    },
    async updateIssueLabels() { calls.push('update_issue_labels'); },
    async updateIssueState() { calls.push('update_issue_state'); },
    async finalResponse() { calls.push('final_response'); },
  };
}

function workerOutbox(store: ReturnType<typeof openSchedulerStore>): OutboxRow {
  const row = store.pendingOutbox().find((entry) => entry.outbox_kind === 'worker_dispatch');
  assert.ok(row);
  return row;
}

test('task id mapping is deterministic for Linear identifiers', () => {
  assert.equal(taskIdFromLinearIdentifier('ENG-123'), 'linear-eng-123');
  assert.equal(taskIdFromLinearIdentifier('0XC-58'), 'linear-0xc-58');
  assert.equal(taskIdFromLinearIdentifier('ABC 123'), 'linear-abc-123');
  assert.throws(() => taskIdFromLinearIdentifier('***'), /cannot be converted/);
});

test('OpenCode prompt renderer includes Linear context, native context and Legion hard gates', () => {
  const prompt = renderOpenCodePrompt(promptContext());
  assert.match(prompt, /0XC-58/);
  assert.match(prompt, /agent-session-1/);
  assert.match(prompt, /linear-agent-app/);
  assert.match(prompt, /legion-workflow/);
  assert.match(prompt, /brainstorm/);
  assert.match(prompt, /git-worktree-pr/);
  assert.match(prompt, /PR created is not completion/);
  assert.match(prompt, /LEGION_WORKER_RESULT_START/);
  assert.match(prompt, /evidenceVerifierOutputPath/);
});

test('worker result parser extracts result block and rejects malformed output', () => {
  const parsed = parseWorkerResultBlock(workerResultBlock({
    runResult: 'in_review',
    runId: 'run-1',
    attemptId: 'attempt-1',
    linearIssue: '0XC-58',
    taskId: 'linear-0xc-58',
    prUrl: 'https://github.com/Thrimbda/legion-mind/pull/58',
  }));
  assert.equal(parsed.prUrl, 'https://github.com/Thrimbda/legion-mind/pull/58');
  assert.throws(() => parseWorkerResultBlock('no result here'), /complete Legion result block/);
  assert.throws(() => parseWorkerResultBlock(`${workerResultBlock({ runResult: 'blocked', runId: 'run-1', attemptId: 'attempt-1', linearIssue: '0XC-58', taskId: 'linear-0xc-58' })}\n${workerResultBlock({ runResult: 'blocked', runId: 'run-1', attemptId: 'attempt-1', linearIssue: '0XC-58', taskId: 'linear-0xc-58' })}`), /multiple Legion result block/);
  assert.throws(() => parseWorkerResultBlock(workerResultBlock({ runResult: 'done', linearIssue: '', taskId: '' })), /linearIssue and taskId/);
});

test('OpenCode environment sanitizer does not pass scheduler or Linear/GitHub secrets by default', () => {
  const env = sanitizeOpenCodeEnv({
    PATH: '/bin',
    LINEAR_API_KEY: 'linear-secret',
    GITHUB_TOKEN: 'github-secret',
    SCHEDULER_DATABASE_URL: 'sqlite://secret',
    OPENAI_API_KEY: 'model-secret',
    OPENCODE_CONFIG_DIR: '/config',
  });
  assert.equal(env.PATH, '/bin');
  assert.equal(env.OPENAI_API_KEY, 'model-secret');
  assert.equal(env.OPENCODE_CONFIG_DIR, '/config');
  assert.equal(env.LINEAR_API_KEY, undefined);
  assert.equal(env.GITHUB_TOKEN, undefined);
  assert.equal(env.SCHEDULER_DATABASE_URL, undefined);
});

test('evidence verifier rejects PR-only and lifecycle-incomplete results, then passes complete high-risk evidence', () => {
  const root = tmpRoot('worker-evidence');
  try {
    const taskId = 'linear-0xc-58';
    const prOnly = verifyLegionEvidence({
      runResult: 'done',
      linearIssue: '0XC-58',
      taskId,
      prUrl: 'https://github.com/Thrimbda/legion-mind/pull/58',
    }, { repoPath: root, runKind: 'implementation', risk: 'high', prBacked: true });
    assert.equal(prOnly.ok, false);
    assert.equal(prOnly.failureType, 'legion_evidence_missing');
    assert.equal(prOnly.missing.includes('plan.md'), true);

    const evidence = writeEvidenceFixture(root, taskId, { includeRfc: true });
    writeFileSync(join(root, evidence.lifecycle as string), JSON.stringify({ prMerged: true, checksAndReviewComplete: true, worktreeRemoved: 'yes', mainRefreshed: true }));
    const lifecycleGap = verifyLegionEvidence({
      runResult: 'done',
      runId: 'run-1',
      attemptId: 'attempt-1',
      linearIssue: '0XC-58',
      taskId,
      prUrl: 'https://github.com/Thrimbda/legion-mind/pull/58',
      legionEvidence: evidence,
    }, { repoPath: root, runKind: 'implementation', risk: 'high', prBacked: true });
    assert.equal(lifecycleGap.ok, false);
    assert.equal(lifecycleGap.failureType, 'lifecycle_blocked');

    writeFileSync(join(root, evidence.lifecycle as string), JSON.stringify({ prMerged: true, checksAndReviewComplete: true, worktreeRemoved: true, mainRefreshed: true }));
    const passed = verifyLegionEvidence({
      runResult: 'done',
      runId: 'run-1',
      attemptId: 'attempt-1',
      linearIssue: '0XC-58',
      taskId,
      prUrl: 'https://github.com/Thrimbda/legion-mind/pull/58',
      legionEvidence: evidence,
    }, { repoPath: root, runKind: 'implementation', risk: 'high', prBacked: true });
    assert.equal(passed.ok, true);
    assert.equal(passed.status, 'passed');

    const absolutePath = verifyLegionEvidence({
      runResult: 'done',
      runId: 'run-1',
      attemptId: 'attempt-1',
      linearIssue: '0XC-58',
      taskId,
      prUrl: 'https://github.com/Thrimbda/legion-mind/pull/58',
      legionEvidence: { ...evidence, plan: join(root, evidence.plan as string) },
    }, { repoPath: root, runKind: 'implementation', risk: 'high', prBacked: true });
    assert.equal(absolutePath.ok, false);
    assert.equal(absolutePath.failureType, 'legion_evidence_missing');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('native startup outbox is processed before worker dispatch and worker done waits for PR tracking', async () => {
  const root = tmpRoot('worker-dispatch-success');
  const store = openSchedulerStore(':memory:');
  try {
    const claim = store.claimReadyWorkItem({
      readySnapshot: snapshot(),
      currentSnapshot: snapshot(),
      taskId: 'linear-0xc-58',
      nativeAgent: { delegateAppUserId: 'linear-agent-app', promptContextHash: 'prompt-context-58' },
      traceId: 'trace-worker-success',
    });
    assert.equal(claim.ok, true);
    if (!claim.ok) return;

    let launched = false;
    const blockedBeforeStartup = await processOpenCodeWorkerDispatch(store, workerOutbox(store), {
      repoPath: root,
      launcher: { async launch() { launched = true; return { kind: 'success', exitCode: 0, stdout: '', stderr: '' }; } },
    });
    assert.equal(blockedBeforeStartup.result, 'launch_failed');
    assert.equal(launched, false);

    const calls: string[] = [];
    assert.equal(await processNativeAgentOutbox(store, fakeNativeAdapter(calls)), 5);
    assert.deepEqual(calls, ['create_or_find_session', 'set_delegate', 'create_activity', 'update_plan', 'update_external_urls']);
    assert.equal(store.getRun(claim.runId)?.linear_agent_session_id, `session-${claim.runId}`);

    const evidence = writeEvidenceFixture(root, 'linear-0xc-58', { includeRfc: true });
    const launcher: OpenCodeLauncher = {
      async launch(request) {
        request.onHeartbeat?.();
        return {
          kind: 'success',
          exitCode: 0,
          stderr: '',
          stdout: workerResultBlock({
            runResult: 'done',
            runId: claim.runId,
            attemptId: claim.attemptId,
            linearIssue: '0XC-58',
            taskId: 'linear-0xc-58',
            agentSessionId: `session-${claim.runId}`,
            prUrl: 'https://github.com/Thrimbda/legion-mind/pull/58',
            legionEvidence: evidence,
            nextStep: 'done',
          }),
        };
      },
    };

    const outcome = await processOpenCodeWorkerDispatch(store, workerOutbox(store), { repoPath: root, launcher, timeoutMs: 5000 });
    assert.equal(outcome.result, 'in_review');
    assert.equal(outcome.verification?.ok, true);
    assert.ok(outcome.promptPath);
    assert.ok(outcome.logPath);
    assert.ok(outcome.verificationPath);
    assert.equal(store.getRun(claim.runId)?.state, 'in_review');
    assert.equal(store.getRun(claim.runId)?.delivery_gate_status, 'pending');
    assert.equal(store.getRun(claim.runId)?.evidence_status, 'passed');
    assert.equal(store.getAttempt(claim.attemptId)?.result_kind, 'success');
    assert.equal(readFileSync(outcome.logPath as string, 'utf-8').includes('LEGION_WORKER_RESULT_START'), true);
    assert.equal(store.isBlockerSatisfiedByRun(claim.runId).satisfied, false);
    assert.equal(store.timelineForRun(claim.runId).some((event) => event.event_type === 'pr_tracking_required'), true);
    assert.equal(store.pendingOutbox().length, 0);
  } finally {
    store.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('native startup stops after failed prerequisite and dispatch remains blocked', async () => {
  const root = tmpRoot('worker-native-failure');
  const store = openSchedulerStore(':memory:');
  try {
    const claim = store.claimReadyWorkItem({
      readySnapshot: snapshot({ linearIssueId: 'issue-native-fail', linearIdentifier: 'WI-NATIVE-FAIL' }),
      currentSnapshot: snapshot({ linearIssueId: 'issue-native-fail', linearIdentifier: 'WI-NATIVE-FAIL' }),
      taskId: 'linear-wi-native-fail',
      nativeAgent: { delegateAppUserId: 'linear-agent-app' },
      lockKeys: ['mutex:native-fail'],
    });
    assert.equal(claim.ok, true);
    if (!claim.ok) return;
    const calls: string[] = [];
    const processed = await processNativeAgentOutbox(store, {
      ...fakeNativeAdapter(calls),
      async createOrFindSession() {
        calls.push('create_or_find_session');
        throw new Error('Linear unavailable');
      },
    });
    assert.equal(processed, 0);
    assert.deepEqual(calls, ['create_or_find_session']);
    let launchCalled = false;
    const outcome = await processOpenCodeWorkerDispatch(store, workerOutbox(store), { repoPath: root, launcher: { async launch() { launchCalled = true; return { kind: 'success', exitCode: 0, stdout: '', stderr: '' }; } } });
    assert.equal(outcome.result, 'launch_failed');
    assert.equal(launchCalled, false);
  } finally {
    store.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('native startup rows are skipped after stop except final response', async () => {
  const store = openSchedulerStore(':memory:');
  try {
    const claim = store.claimReadyWorkItem({
      readySnapshot: snapshot({ linearIssueId: 'issue-stop-native', linearIdentifier: 'WI-STOP-NATIVE' }),
      currentSnapshot: snapshot({ linearIssueId: 'issue-stop-native', linearIdentifier: 'WI-STOP-NATIVE' }),
      taskId: 'linear-wi-stop-native',
      nativeAgent: { delegateAppUserId: 'linear-agent-app' },
      lockKeys: ['mutex:stop-native'],
    });
    assert.equal(claim.ok, true);
    if (!claim.ok) return;
    store.requestNativeStop(claim.runId, 'Stop before native startup.', { actor: 'webhook' });
    const calls: string[] = [];
    assert.equal(await processNativeAgentOutbox(store, fakeNativeAdapter(calls)), 1);
    assert.deepEqual(calls, ['final_response']);
    const startupRows = store.outboxForRun(claim.runId).filter((row) => row.outbox_kind === 'native_agent' && row.side_effect !== 'final_response');
    assert.equal(startupRows.every((row) => row.state === 'failed'), true);
    assert.equal(store.outboxForRun(claim.runId).find((row) => row.side_effect === 'final_response')?.state, 'sent');
  } finally {
    store.close();
  }
});

test('worker dispatch rejects tampered outbox payload identity before launch', async () => {
  const root = tmpRoot('worker-dispatch-tampered');
  const store = openSchedulerStore(':memory:');
  try {
    const claim = store.claimReadyWorkItem({
      readySnapshot: snapshot({ linearIssueId: 'issue-tampered', linearIdentifier: 'WI-TAMPERED' }),
      currentSnapshot: snapshot({ linearIssueId: 'issue-tampered', linearIdentifier: 'WI-TAMPERED' }),
      taskId: 'linear-wi-tampered',
      lockKeys: ['mutex:tampered'],
    });
    assert.equal(claim.ok, true);
    if (!claim.ok) return;
    for (const row of store.pendingOutbox().filter((entry) => entry.run_id === claim.runId)) store.markOutboxSent(row.idempotency_key);
    store.enqueueOutbox({
      outboxKind: 'worker_dispatch',
      runId: claim.runId,
      attemptId: claim.attemptId,
      idempotencyKey: `run:${claim.runId}:attempt:${claim.attemptId}:dispatch-worker-tampered`,
      sideEffect: 'dispatch_worker',
      payload: { runId: claim.runId, attemptId: claim.attemptId, taskId: 'linear-other', linearIdentifier: 'WI-TAMPERED', traceId: 'trace-tampered' },
    });
    let launchCalled = false;
    const outcome = await processOpenCodeWorkerDispatch(store, workerOutbox(store), { repoPath: root, launcher: { async launch() { launchCalled = true; return { kind: 'success', exitCode: 0, stdout: '', stderr: '' }; } } });
    assert.equal(outcome.result, 'launch_failed');
    assert.equal(launchCalled, false);
    assert.equal(store.timelineForRun(claim.runId).some((event) => event.event_type === 'worker_dispatch_rejected'), true);
  } finally {
    store.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('worker dispatch rejects result identity mismatches before evidence verification', async () => {
  const root = tmpRoot('worker-identity-mismatch');
  const store = openSchedulerStore(':memory:');
  try {
    const claim = store.claimReadyWorkItem({
      readySnapshot: snapshot({ linearIssueId: 'issue-identity', linearIdentifier: 'WI-IDENTITY' }),
      currentSnapshot: snapshot({ linearIssueId: 'issue-identity', linearIdentifier: 'WI-IDENTITY' }),
      taskId: 'linear-wi-identity',
      lockKeys: ['mutex:identity'],
    });
    assert.equal(claim.ok, true);
    if (!claim.ok) return;
    for (const row of store.pendingOutbox().filter((entry) => entry.outbox_kind === 'native_agent' && entry.run_id === claim.runId)) store.markOutboxSent(row.idempotency_key);
    const outcome = await processOpenCodeWorkerDispatch(store, workerOutbox(store), {
      repoPath: root,
      launcher: {
        async launch() {
          return {
            kind: 'success',
            exitCode: 0,
            stderr: '',
            stdout: workerResultBlock({ runResult: 'done', runId: claim.runId, attemptId: claim.attemptId, linearIssue: 'OTHER', taskId: 'linear-other' }),
          };
        },
      },
    });
    assert.equal(outcome.result, 'malformed_result');
    assert.equal(store.getRun(claim.runId)?.state, 'failed');
    assert.equal(store.getRun(claim.runId)?.failure_type, 'result_identity_mismatch');
  } finally {
    store.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('worker dispatch handles malformed result, nonzero exit, and native stop cancellation without marking done', async () => {
  const root = tmpRoot('worker-dispatch-negative');
  const store = openSchedulerStore(':memory:');
  try {
    const malformed = store.claimReadyWorkItem({
      readySnapshot: snapshot({ linearIssueId: 'issue-malformed', linearIdentifier: 'WI-MALFORMED' }),
      currentSnapshot: snapshot({ linearIssueId: 'issue-malformed', linearIdentifier: 'WI-MALFORMED' }),
      taskId: 'linear-wi-malformed',
      lockKeys: ['mutex:malformed'],
    });
    assert.equal(malformed.ok, true);
    if (!malformed.ok) return;
    for (const row of store.pendingOutbox().filter((entry) => entry.outbox_kind === 'native_agent' && entry.run_id === malformed.runId)) store.markOutboxSent(row.idempotency_key);
    const malformedOutcome = await processOpenCodeWorkerDispatch(store, workerOutbox(store), { repoPath: root, launcher: { async launch() { return { kind: 'success', exitCode: 0, stdout: 'not-json', stderr: '' }; } } });
    assert.equal(malformedOutcome.result, 'malformed_result');
    assert.equal(store.getRun(malformed.runId)?.state, 'failed');
    assert.equal(store.getRun(malformed.runId)?.failure_type, 'unknown_result');

    const nonzero = store.claimReadyWorkItem({
      readySnapshot: snapshot({ linearIssueId: 'issue-nonzero', linearIdentifier: 'WI-NONZERO' }),
      currentSnapshot: snapshot({ linearIssueId: 'issue-nonzero', linearIdentifier: 'WI-NONZERO' }),
      taskId: 'linear-wi-nonzero',
      lockKeys: ['mutex:nonzero'],
    });
    assert.equal(nonzero.ok, true);
    if (!nonzero.ok) return;
    for (const row of store.pendingOutbox().filter((entry) => entry.outbox_kind === 'native_agent' && entry.run_id === nonzero.runId)) store.markOutboxSent(row.idempotency_key);
    const nonzeroOutcome = await processOpenCodeWorkerDispatch(store, workerOutbox(store), { repoPath: root, retryPolicy: { maxAttempts: 1 }, launcher: { async launch() { return { kind: 'nonzero_exit', exitCode: 7, stdout: '', stderr: 'boom' }; } } });
    assert.equal(nonzeroOutcome.result, 'failed');
    assert.equal(store.getRun(nonzero.runId)?.state, 'failed');
    assert.equal(store.getAttempt(nonzero.attemptId)?.exit_code, 7);

    const cancelled = store.claimReadyWorkItem({
      readySnapshot: snapshot({ linearIssueId: 'issue-cancelled', linearIdentifier: 'WI-CANCELLED' }),
      currentSnapshot: snapshot({ linearIssueId: 'issue-cancelled', linearIdentifier: 'WI-CANCELLED' }),
      taskId: 'linear-wi-cancelled',
      lockKeys: ['mutex:cancelled'],
    });
    assert.equal(cancelled.ok, true);
    if (!cancelled.ok) return;
    store.requestNativeStop(cancelled.runId, 'Human pressed stop.', { actor: 'webhook' });
    let launchCalled = false;
    const cancelledOutcome = await processOpenCodeWorkerDispatch(store, workerOutbox(store), { repoPath: root, launcher: { async launch() { launchCalled = true; return { kind: 'success', exitCode: 0, stdout: '', stderr: '' }; } } });
    assert.equal(cancelledOutcome.result, 'cancelled');
    assert.equal(launchCalled, false);
    assert.equal(store.getRun(cancelled.runId)?.state, 'cancelled');
    assert.equal(store.getAttempt(cancelled.attemptId)?.result_kind, 'cancelled');
    assert.equal(store.isBlockerSatisfiedByRun(cancelled.runId).satisfied, false);
  } finally {
    store.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('default evidence paths match task-local Legion artifact layout', () => {
  assert.deepEqual(defaultEvidencePaths('linear-0xc-58'), {
    plan: '.legion/tasks/linear-0xc-58/plan.md',
    tasks: '.legion/tasks/linear-0xc-58/tasks.md',
    log: '.legion/tasks/linear-0xc-58/log.md',
    rfc: '.legion/tasks/linear-0xc-58/docs/rfc.md',
    reviewRfc: '.legion/tasks/linear-0xc-58/docs/review-rfc.md',
    testReport: '.legion/tasks/linear-0xc-58/docs/test-report.md',
    reviewChange: '.legion/tasks/linear-0xc-58/docs/review-change.md',
    report: '.legion/tasks/linear-0xc-58/docs/report-walkthrough.md',
    wiki: '.legion/wiki/tasks/linear-0xc-58.md',
    lifecycle: '.legion/tasks/linear-0xc-58/docs/git-worktree-lifecycle.json',
  });
});
