import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
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

function workerOutbox(store: ReturnType<typeof openSchedulerStore>, runId?: string): OutboxRow {
  const row = store.pendingOutbox().find((entry) => entry.outbox_kind === 'worker_dispatch' && (!runId || entry.run_id === runId));
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
  assert.match(prompt, /Do not autonomously create a closeout/);
  assert.match(prompt, /explicit user authorization; that authorization may allow a new PR/);
  assert.match(prompt, /PR created is not completion/);
  assert.match(prompt, /LEGION_WORKER_RESULT_START/);
  assert.match(prompt, /evidenceVerifierOutputPath/);
  assert.match(prompt, /"reportData": "\.legion\/tasks\/linear-0xc-58\/docs\/report-data\.json"/);
});

test('worker result parser extracts result block and rejects malformed output', () => {
  const parsed = parseWorkerResultBlock(workerResultBlock({
    runResult: 'in_review',
    runId: 'run-1',
    attemptId: 'attempt-1',
    linearIssue: '0XC-58',
    taskId: 'linear-0xc-58',
    prUrl: 'https://github.com/Thrimbda/legion-mind/pull/58',
    externalUrls: [{ label: 'Walkthrough', url: 'https://example.com/reports/58' }],
  }));
  assert.equal(parsed.prUrl, 'https://github.com/Thrimbda/legion-mind/pull/58');
  assert.deepEqual(parsed.externalUrls, [{ label: 'Walkthrough', url: 'https://example.com/reports/58' }]);
  assert.throws(() => parseWorkerResultBlock('no result here'), /complete Legion result block/);
  assert.throws(() => parseWorkerResultBlock(`${workerResultBlock({ runResult: 'blocked', runId: 'run-1', attemptId: 'attempt-1', linearIssue: '0XC-58', taskId: 'linear-0xc-58' })}\n${workerResultBlock({ runResult: 'blocked', runId: 'run-1', attemptId: 'attempt-1', linearIssue: '0XC-58', taskId: 'linear-0xc-58' })}`), /multiple Legion result block/);
  assert.throws(() => parseWorkerResultBlock(workerResultBlock({ runResult: 'done', linearIssue: '', taskId: '' })), /linearIssue and taskId/);
  assert.throws(() => parseWorkerResultBlock(workerResultBlock({
    runResult: 'in_review',
    linearIssue: '0XC-58',
    taskId: 'linear-0xc-58',
    prUrl: 'not-a-pr-url',
  })), /supported HTTPS pull request URL/);
  assert.throws(() => parseWorkerResultBlock(workerResultBlock({
    runResult: 'in_review',
    linearIssue: '0XC-58',
    taskId: 'linear-0xc-58',
    externalUrls: [null as never],
  })), /externalUrls entries/);
  assert.throws(() => parseWorkerResultBlock(workerResultBlock({
    runResult: 'in_review',
    linearIssue: '0XC-58',
    taskId: 'linear-0xc-58',
    externalUrls: [{ label: 42, url: false } as never],
  })), /externalUrls entries/);
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

test('evidence verifier rejects PR-only and passes complete high-risk repo evidence without task lifecycle JSON', () => {
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

test('scheduler 以共享严格 Verdict 和 v1.1 report-data.json 拒绝状态冲突与运行元数据漂移', () => {
  const root = tmpRoot('worker-report-data');
  try {
    const taskId = 'linear-report-data';
    const evidence = writeEvidenceFixture(root, taskId, { includeRfc: true, risk: 'high' });
    const result = { runResult: 'done' as const, linearIssue: 'REPORT-1', taskId, legionEvidence: evidence };
    const highOptions = { repoPath: root, runKind: 'implementation' as const, risk: 'high' as const, prBacked: false };
    assert.equal(verifyLegionEvidence(result, highOptions).ok, true, '合法 v1.1 high implementation 应通过');
    for (const risk of ['low', 'medium'] as const) {
      const scenarioTaskId = `linear-report-${risk}`;
      const scenarioEvidence = writeEvidenceFixture(root, scenarioTaskId, { risk });
      const scenarioResult = { runResult: 'done' as const, linearIssue: `REPORT-${risk}`, taskId: scenarioTaskId, legionEvidence: scenarioEvidence };
      assert.equal(verifyLegionEvidence(scenarioResult, { repoPath: root, runKind: 'implementation', risk, prBacked: false }).ok, true, `合法 v1.1 ${risk} implementation 应通过`);
    }
    const runtimeRiskMismatch = verifyLegionEvidence(result, { ...highOptions, risk: 'medium' });
    assert.equal(runtimeRiskMismatch.ok, false, 'report-data high 也不得覆盖 scheduler medium 风险');
    assert.match(runtimeRiskMismatch.failures.join('\n'), /risk 必须与 scheduler 风险 medium 字面一致/);

    const reportDataPath = join(root, evidence.reportData as string);
    const originalData = JSON.parse(readFileSync(reportDataPath, 'utf8'));
    rmSync(reportDataPath);
    const missingReportData = verifyLegionEvidence(result, highOptions);
    assert.equal(missingReportData.ok, false, 'report-data.json 是 scheduler 必需 evidence');
    assert.ok(missingReportData.missing.some((item) => item.includes('docs/report-data.json')));
    writeFileSync(reportDataPath, `${JSON.stringify(originalData, null, 2)}\n`);
    const invalidDataCases: Array<{ name: string; mutate: (data: any) => void; expected: RegExp }> = [
      { name: 'v1.0 历史输入', mutate: (data) => { data.schemaVersion = '1.0'; }, expected: /v1\.0 仅为历史 artifact/ },
      { name: '自报低风险', mutate: (data) => { data.risk = 'low'; data.evidence = data.evidence.filter((item: any) => item.kind !== 'rfc' && item.kind !== 'review-rfc'); }, expected: /risk 必须与 scheduler 风险 high 字面一致/ },
      { name: 'profile 漂移', mutate: (data) => { data.profile = 'rfc-only'; }, expected: /profile 必须为 implementation/ },
      { name: 'taskId 漂移', mutate: (data) => { data.task.id = 'linear-other'; }, expected: /task\.id 必须等于当前 taskId/ },
      { name: '必需 locator 漂移', mutate: (data) => { data.evidence.find((item: any) => item.kind === 'review-change').locator = '.legion/tasks/linear-report-data/docs/other.md'; }, expected: /review-change 必须以 PASS 状态精确指向/ },
    ];
    for (const scenario of invalidDataCases) {
      const data = structuredClone(originalData);
      scenario.mutate(data);
      writeFileSync(reportDataPath, `${JSON.stringify(data, null, 2)}\n`);
      const verification = verifyLegionEvidence(result, highOptions);
      assert.equal(verification.ok, false, `${scenario.name}必须 fail-closed`);
      assert.match(verification.failures.join('\n'), scenario.expected);
    }

    writeFileSync(reportDataPath, `${JSON.stringify(originalData, null, 2)}\n`);
    const reviewChangePath = join(root, evidence.reviewChange as string);
    for (const source of [
      '# 审查\n\n## Verdict\n\nFAIL\n',
      '# 历史\n\n## 历史 Verdict\n\nPASS\n\n## Verdict\n\nFAIL\n',
      '# 审查\n\n## Verdict\n\nPASS - 不精确\n',
      '# 审查\n\n## Verdict\n\nPASS\n\n## Verdict\n\nPASS\n',
      '# 审查\n\n## Verdict\n\n<!-- 注释 -->\nPASS（错误）\n',
    ]) {
      writeFileSync(reviewChangePath, source);
      const verification = verifyLegionEvidence(result, highOptions);
      assert.equal(verification.ok, false, 'JSON 自报 PASS 不得绕过当前 FAIL、历史 PASS 或非精确 Verdict');
      assert.match(verification.failures.join('\n'), /review-change\.md 当前 Verdict 不是 PASS/);
    }

    let designResult;
    for (const risk of ['low', 'medium', 'high'] as const) {
      const designTaskId = `linear-report-design-${risk}`;
      const designEvidence = writeEvidenceFixture(root, designTaskId, { profile: 'rfc-only', risk });
      designResult = { runResult: 'done' as const, linearIssue: `REPORT-DESIGN-${risk}`, taskId: designTaskId, legionEvidence: designEvidence };
      assert.equal(verifyLegionEvidence(designResult, { repoPath: root, runKind: 'design_only', risk, prBacked: false }).ok, true, `rfc-only+${risk} 应接受当前 review-rfc PASS`);
    }
    assert.ok(designResult);
    const brainstorm = verifyLegionEvidence(designResult, { repoPath: root, runKind: 'brainstorm_only', risk: 'medium', prBacked: false });
    assert.equal(brainstorm.ok, false, 'brainstorm_only 没有 v1.1 收口映射，必须拒绝');
    assert.match(brainstorm.failures.join('\n'), /不支持 runKind=brainstorm_only/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('scheduler 拒绝跨 task、仓库外和同 task 其他文件的固定证据 symlink', () => {
  const root = tmpRoot('worker-evidence-symlink');
  const outside = tmpRoot('worker-evidence-outside');
  try {
    const taskId = 'linear-symlink-target';
    const sourceTaskId = 'linear-symlink-source';
    const evidence = writeEvidenceFixture(root, taskId, { risk: 'high' });
    const sourceEvidence = writeEvidenceFixture(root, sourceTaskId, { risk: 'high' });
    const result = { runResult: 'done' as const, linearIssue: 'SYMLINK-1', taskId, legionEvidence: evidence };
    const options = { repoPath: root, runKind: 'implementation' as const, risk: 'high' as const, prBacked: false };
    assert.equal(verifyLegionEvidence(result, options).ok, true, '正常 worktree 固定证据应通过');
    const linkedRoot = join(outside, 'repo-link');
    symlinkSync(root, linkedRoot, 'dir');
    assert.equal(verifyLegionEvidence(result, { ...options, repoPath: linkedRoot }).ok, true, 'repo root 本身由 symlink 访问时合法固定证据仍应通过');

    const reviewChange = join(root, evidence.reviewChange as string);
    rmSync(reviewChange);
    symlinkSync(join(root, sourceEvidence.reviewChange as string), reviewChange);
    const crossTask = verifyLegionEvidence(result, options);
    assert.equal(crossTask.ok, false, '跨 task PASS symlink 必须拒绝');
    assert.match([...crossTask.missing, ...crossTask.failures].join('\n'), /解引用后必须精确等于当前 task 的规范路径/);

    rmSync(reviewChange);
    writeFileSync(reviewChange, '# 审查\n\n## Verdict\n\nPASS\n');
    const reportData = join(root, evidence.reportData as string);
    const reportDataSource = readFileSync(reportData, 'utf8');
    rmSync(reportData);
    symlinkSync(join(root, sourceEvidence.reportData as string), reportData);
    const crossTaskData = verifyLegionEvidence(result, options);
    assert.equal(crossTaskData.ok, false, '跨 task report-data.json symlink 必须拒绝');
    assert.match([...crossTaskData.missing, ...crossTaskData.failures].join('\n'), /解引用后必须精确等于当前 task 的规范路径/);

    rmSync(reportData);
    writeFileSync(reportData, reportDataSource);
    const outsideReview = join(outside, 'review-change.md');
    writeFileSync(outsideReview, '# 仓库外审查\n\n## Verdict\n\nPASS\n');
    rmSync(reviewChange);
    symlinkSync(outsideReview, reviewChange);
    const outsideStage = verifyLegionEvidence(result, options);
    assert.equal(outsideStage.ok, false, '仓库外 PASS 阶段 symlink 必须拒绝');
    assert.match([...outsideStage.missing, ...outsideStage.failures].join('\n'), /解引用后必须精确等于当前 task 的规范路径/);

    rmSync(reviewChange);
    writeFileSync(reviewChange, '# 审查\n\n## Verdict\n\nPASS\n');
    const outsideReportData = join(outside, 'report-data.json');
    writeFileSync(outsideReportData, reportDataSource);
    rmSync(reportData);
    symlinkSync(outsideReportData, reportData);
    const outsideData = verifyLegionEvidence(result, options);
    assert.equal(outsideData.ok, false, '仓库外 report-data.json symlink 必须拒绝');
    assert.match([...outsideData.missing, ...outsideData.failures].join('\n'), /解引用后必须精确等于当前 task 的规范路径/);

    rmSync(reportData);
    writeFileSync(reportData, reportDataSource);
    const alternateReview = join(root, `.legion/tasks/${taskId}/docs/alternate-review.md`);
    writeFileSync(alternateReview, '# 同 task 其他审查\n\n## Verdict\n\nPASS\n');
    rmSync(reviewChange);
    symlinkSync(alternateReview, reviewChange);
    const sameTaskRedirect = verifyLegionEvidence(result, options);
    assert.equal(sameTaskRedirect.ok, false, '同 task 其他文件重定向必须拒绝');
    assert.match([...sameTaskRedirect.missing, ...sameTaskRedirect.failures].join('\n'), /解引用后必须精确等于当前 task 的规范路径/);
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
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

test('worker PR URL ingress records run-level tracking metadata without a task binding', async () => {
  const root = tmpRoot('worker-pr-run-metadata');
  const store = openSchedulerStore(':memory:');
  try {
    const current = snapshot({ linearIssueId: 'issue-worker-pr-conflict', linearIdentifier: 'WI-WORKER-PR-CONFLICT' });
    const claim = store.claimReadyWorkItem({
      readySnapshot: current,
      currentSnapshot: current,
      taskId: 'linear-worker-pr-conflict',
      lockKeys: ['mutex:worker-pr-conflict'],
    });
    assert.equal(claim.ok, true);
    if (!claim.ok) return;
    await processNativeAgentOutbox(store, fakeNativeAdapter());
    const outcome = await processOpenCodeWorkerDispatch(store, workerOutbox(store), {
      repoPath: root,
      launcher: {
        async launch() {
          return {
            kind: 'success',
            exitCode: 0,
            stderr: '',
            stdout: workerResultBlock({
              runResult: 'in_review',
              runId: claim.runId,
              attemptId: claim.attemptId,
              linearIssue: 'WI-WORKER-PR-CONFLICT',
              taskId: 'linear-worker-pr-conflict',
              prUrl: 'https://github.com/Thrimbda/legion-mind/pull/201',
              externalUrls: [{ label: 'GitHub PR', url: 'https://github.com/Thrimbda/legion-mind/pull/202' }],
            }),
          };
        },
      },
    });
    assert.equal(outcome.result, 'in_review');
    assert.equal(store.getRun(claim.runId)?.failure_type, null);
    assert.equal(store.getRun(claim.runId)?.state, 'in_review');
    assert.equal(store.getRun(claim.runId)?.pr_url, 'https://github.com/Thrimbda/legion-mind/pull/201');
  } finally {
    store.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('existing run-level PR metadata does not block an explicitly authorized follow-up PR', async () => {
  const root = tmpRoot('worker-authorized-follow-up');
  const store = openSchedulerStore(':memory:');
  try {
    const current = snapshot({ linearIssueId: 'issue-worker-terminal', linearIdentifier: 'WI-WORKER-TERMINAL' });
    const claim = store.claimReadyWorkItem({
      readySnapshot: current,
      currentSnapshot: current,
      taskId: 'linear-worker-terminal',
      lockKeys: ['mutex:worker-terminal'],
    });
    assert.equal(claim.ok, true);
    if (!claim.ok) return;
    await processNativeAgentOutbox(store, fakeNativeAdapter());
    store.updateRunMetadata(claim.runId, { prUrl: 'https://github.com/Thrimbda/legion-mind/pull/210' });
    let launched = false;
    const outcome = await processOpenCodeWorkerDispatch(store, workerOutbox(store), {
      repoPath: root,
      launcher: {
        async launch() {
          launched = true;
          return {
            kind: 'success',
            exitCode: 0,
            stderr: '',
            stdout: workerResultBlock({
              runResult: 'in_review',
              runId: claim.runId,
              attemptId: claim.attemptId,
              linearIssue: 'WI-WORKER-TERMINAL',
              taskId: 'linear-worker-terminal',
              prUrl: 'https://github.com/Thrimbda/legion-mind/pull/211',
            }),
          };
        },
      },
    });
    assert.equal(outcome.result, 'in_review');
    assert.equal(launched, true);
    assert.equal(store.getRun(claim.runId)?.pr_url, 'https://github.com/Thrimbda/legion-mind/pull/211');
  } finally {
    store.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('a later run for the same task may track a different explicitly authorized PR', async () => {
  const root = tmpRoot('worker-legacy-done');
  const dbPath = join(root, 'scheduler.sqlite');
  const taskId = 'linear-worker-legacy-done';
  const prUrl = 'https://github.com/Thrimbda/legion-mind/pull/220';
  try {
    const legacyStore = openSchedulerStore(dbPath);
    const historical = snapshot({ linearIssueId: 'issue-legacy-done-old', linearIdentifier: 'WI-LEGACY-DONE-OLD' });
    const oldClaim = legacyStore.claimReadyWorkItem({
      readySnapshot: historical,
      currentSnapshot: historical,
      taskId,
      lockKeys: ['mutex:legacy-done-old'],
    });
    assert.equal(oldClaim.ok, true);
    if (!oldClaim.ok) return;
    for (const row of legacyStore.outboxForRun(oldClaim.runId)) legacyStore.markOutboxSent(row.idempotency_key);
    legacyStore.transitionRun(oldClaim.runId, 'running', { actor: 'test' });
    legacyStore.transitionRun(oldClaim.runId, 'in_review', { actor: 'test' });
    legacyStore.transitionRun(oldClaim.runId, 'done', { actor: 'test', deliveryGateStatus: 'passed', evidenceStatus: 'passed' });
    legacyStore.releaseLocksForRun(oldClaim.runId, { actor: 'test', reason: 'legacy_done' });
    legacyStore.close();

    const legacyDb = new DatabaseSync(dbPath);
    legacyDb.prepare('UPDATE runs SET pr_url = ? WHERE id = ?').run(prUrl, oldClaim.runId);
    legacyDb.close();

    const store = openSchedulerStore(dbPath);
    const current = snapshot({ linearIssueId: 'issue-legacy-done-new', linearIdentifier: 'WI-LEGACY-DONE-NEW' });
    const nextClaim = store.claimReadyWorkItem({
      readySnapshot: current,
      currentSnapshot: current,
      taskId,
      lockKeys: ['mutex:legacy-done-new'],
    });
    assert.equal(nextClaim.ok, true);
    if (!nextClaim.ok) return;
    await processNativeAgentOutbox(store, fakeNativeAdapter());
    let launched = false;
    const outcome = await processOpenCodeWorkerDispatch(store, workerOutbox(store, nextClaim.runId), {
      repoPath: root,
      launcher: {
        async launch() {
          launched = true;
          return {
            kind: 'success',
            exitCode: 0,
            stderr: '',
            stdout: workerResultBlock({
              runResult: 'in_review',
              runId: nextClaim.runId,
              attemptId: nextClaim.attemptId,
              linearIssue: 'WI-LEGACY-DONE-NEW',
              taskId,
              prUrl: 'https://github.com/Thrimbda/legion-mind/pull/221',
            }),
          };
        },
      },
    });
    assert.equal(outcome.result, 'in_review');
    assert.equal(launched, true);
    assert.equal(store.getRun(nextClaim.runId)?.pr_url, 'https://github.com/Thrimbda/legion-mind/pull/221');
    store.close();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('historical non-success PR metadata does not create a cross-run worker gate', async () => {
  const root = tmpRoot('worker-legacy-unknown');
  const dbPath = join(root, 'scheduler.sqlite');
  const taskId = 'linear-worker-legacy-unknown';
  const prUrl = 'https://github.com/Thrimbda/legion-mind/pull/230';
  try {
    const legacyStore = openSchedulerStore(dbPath);
    const historical = snapshot({ linearIssueId: 'issue-legacy-unknown-old', linearIdentifier: 'WI-LEGACY-UNKNOWN-OLD' });
    const oldClaim = legacyStore.claimReadyWorkItem({
      readySnapshot: historical,
      currentSnapshot: historical,
      taskId,
      lockKeys: ['mutex:legacy-unknown-old'],
    });
    assert.equal(oldClaim.ok, true);
    if (!oldClaim.ok) return;
    for (const row of legacyStore.outboxForRun(oldClaim.runId)) legacyStore.markOutboxSent(row.idempotency_key);
    legacyStore.transitionRun(oldClaim.runId, 'failed', { actor: 'test', failureType: 'legacy_unknown', failureReason: 'Historical state does not prove PR terminal.' });
    legacyStore.releaseLocksForRun(oldClaim.runId, { actor: 'test', reason: 'legacy_unknown' });
    legacyStore.close();

    const legacyDb = new DatabaseSync(dbPath);
    legacyDb.prepare('UPDATE runs SET pr_url = ? WHERE id = ?').run(prUrl, oldClaim.runId);
    legacyDb.close();

    const store = openSchedulerStore(dbPath);
    const current = snapshot({ linearIssueId: 'issue-legacy-unknown-new', linearIdentifier: 'WI-LEGACY-UNKNOWN-NEW' });
    const nextClaim = store.claimReadyWorkItem({
      readySnapshot: current,
      currentSnapshot: current,
      taskId,
      lockKeys: ['mutex:legacy-unknown-new'],
    });
    assert.equal(nextClaim.ok, true);
    if (!nextClaim.ok) return;
    await processNativeAgentOutbox(store, fakeNativeAdapter());
    let launched = false;
    const outcome = await processOpenCodeWorkerDispatch(store, workerOutbox(store, nextClaim.runId), {
      repoPath: root,
      launcher: {
        async launch() {
          launched = true;
          return {
            kind: 'success',
            exitCode: 0,
            stderr: '',
            stdout: workerResultBlock({
              runResult: 'in_review',
              runId: nextClaim.runId,
              attemptId: nextClaim.attemptId,
              linearIssue: 'WI-LEGACY-UNKNOWN-NEW',
              taskId,
              prUrl: 'https://github.com/Thrimbda/legion-mind/pull/231',
            }),
          };
        },
      },
    });
    assert.equal(launched, true);
    assert.equal(outcome.result, 'in_review');
    assert.equal(store.getRun(nextClaim.runId)?.pr_url, 'https://github.com/Thrimbda/legion-mind/pull/231');
    store.close();
  } finally {
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
    reportData: '.legion/tasks/linear-0xc-58/docs/report-data.json',
    report: '.legion/tasks/linear-0xc-58/docs/report-walkthrough.md',
    wiki: '.legion/wiki/tasks/linear-0xc-58.md',
  });
});
