import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { decideRetry, retryNotBeforeDue } from './retry-policy.ts';
import type { RetryPolicyOptions } from './retry-policy.ts';
import type { AttemptResultKind, OutboxRow, RunAttemptRow, RunKind, RunRow, SchedulerStore } from './sqlite-store.ts';
import { stableHash, stableStringify } from './sqlite-store.ts';

export const WORKER_RESULT_START = 'LEGION_WORKER_RESULT_START';
export const WORKER_RESULT_END = 'LEGION_WORKER_RESULT_END';

export type WorkerTerminalResult = 'in_review' | 'done' | 'blocked' | 'failed' | 'cancelled' | 'abandoned';
export type WorkerLaunchResultKind = 'success' | 'nonzero_exit' | 'timeout' | 'cancelled';

export interface LinearWorkerContext {
  issueId: string;
  identifier: string;
  url?: string | null;
  projectId: string;
  title: string;
  description?: string | null;
  labels: string[];
  blockers: string[];
  repoKey: string;
  risk: 'low' | 'medium' | 'high';
  contractState: 'stable' | 'needs-review' | 'unknown';
  linearUpdatedAt: string;
}

export interface NativeAgentContext {
  agentSessionId: string | null;
  delegateAppUserId: string | null;
  stopSignalSource: string;
}

export interface OpenCodePromptContext {
  runId: string;
  attemptId: string;
  taskId: string;
  repoPath: string;
  baseRef: string;
  branchPrefix: string;
  evidenceVerifierOutputPath: string;
  linear: LinearWorkerContext;
  nativeAgent: NativeAgentContext;
}

export interface WorkerResultBlock {
  runResult: WorkerTerminalResult;
  runId?: string;
  attemptId?: string;
  linearIssue: string;
  taskId: string;
  prUrl?: string | null;
  agentSessionId?: string | null;
  externalUrls?: Array<{ label: string; url: string }>;
  legionEvidence?: LegionEvidencePaths;
  lifecycle?: GitWorktreeLifecycleEvidence;
  blocker?: string | { reason?: string; nextOwner?: string; details?: unknown } | null;
  nextStep?: string | null;
}

export interface LegionEvidencePaths {
  plan?: string;
  tasks?: string;
  log?: string;
  rfc?: string;
  reviewRfc?: string;
  testReport?: string;
  reviewChange?: string;
  report?: string;
  wiki?: string;
  lifecycle?: string;
}

export interface GitWorktreeLifecycleEvidence {
  prMerged?: boolean;
  checksAndReviewComplete?: boolean;
  worktreeRemoved?: boolean;
  mainRefreshed?: boolean;
}

export interface EvidenceVerificationResult {
  ok: boolean;
  status: 'passed' | 'missing' | 'stale';
  failureType?: 'legion_evidence_missing' | 'lifecycle_blocked';
  missing: string[];
  failures: string[];
}

export interface OpenCodeLaunchRequest {
  prompt: string;
  promptPath?: string;
  repoPath: string;
  timeoutMs: number;
  killGraceMs?: number;
  command?: string;
  env?: NodeJS.ProcessEnv;
  onHeartbeat?: () => void;
  shouldCancel?: () => boolean;
}

export interface OpenCodeLaunchResult {
  kind: WorkerLaunchResultKind;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut?: boolean;
  cancelled?: boolean;
  logUri?: string | null;
}

export interface WorkerDispatchOutcome {
  result: WorkerTerminalResult | 'launch_failed' | 'malformed_result';
  promptPath?: string;
  logPath?: string;
  verificationPath?: string;
  verification?: EvidenceVerificationResult;
}

export interface OpenCodeLauncher {
  launch(request: OpenCodeLaunchRequest): Promise<OpenCodeLaunchResult>;
}

export interface NativeAgentAdapter {
  createOrFindSession(input: { runId: string; linearIssueId: string; linearIdentifier: string; agentSessionId?: string | null; promptContextHash?: string | null; traceId?: string | null }): Promise<{ agentSessionId: string }>;
  setDelegate(input: { runId: string; linearIssueId: string; delegateAppUserId: string; traceId?: string | null }): Promise<void>;
  createActivity(input: { runId: string; kind: string; message: string; traceId?: string | null }): Promise<{ activityId?: string | null }>;
  updatePlan(input: { runId: string; steps: string[]; traceId?: string | null }): Promise<void>;
  updateExternalUrls(input: { runId: string; urls: Array<{ label: string; url: string }>; traceId?: string | null }): Promise<void>;
  createComment(input: { runId: string; body: string; traceId?: string | null }): Promise<{ commentId?: string | null }>;
  updateIssueLabels(input: { runId: string; addLabels?: string[]; removeLabels?: string[]; traceId?: string | null }): Promise<void>;
  updateIssueState(input: { runId: string; schedulerState: string; suggestedState?: string | null; traceId?: string | null }): Promise<void>;
  finalResponse(input: { runId: string; result: string; reason?: string | null; terminalKind?: string | null; summaryMarkdown?: string | null; traceId?: string | null }): Promise<void>;
}

interface WorkerDispatchPayload {
  runId: string;
  attemptId: string;
  taskId: string;
  linearIdentifier: string;
  traceId?: string | null;
  linear?: Partial<LinearWorkerContext>;
  retry?: {
    attemptNumber?: number;
    failureType?: string;
    failureReason?: string;
    notBefore?: string | null;
  };
}

function parsePayload<T>(row: OutboxRow): T {
  return JSON.parse(row.payload_json) as T;
}

function nowIso(): string {
  return new Date().toISOString();
}

function promptHash(prompt: string): string {
  return createHash('sha256').update(prompt).digest('hex');
}

function resolveEvidencePath(root: string, path: string): string {
  return resolve(root, path);
}

function fileContains(path: string, pattern: RegExp): boolean {
  return existsSync(path) && pattern.test(readFileSync(path, 'utf-8'));
}

function hasPassVerdict(path: string): boolean {
  return fileContains(path, /(^|\n)\s*(#{1,6}\s*)?Verdict\s*:?\s*(\n\s*)?PASS\b/i);
}

function expectedEvidenceRelative(taskId: string, key: keyof LegionEvidencePaths): string | null {
  return defaultEvidencePaths(taskId)[key] ?? null;
}

function resolveContainedEvidencePath(root: string, taskId: string, key: keyof LegionEvidencePaths, value: string): { path?: string; failure?: string } {
  if (isAbsolute(value)) {
    return { failure: `${String(key)} must be a repo-relative path` };
  }
  const expected = expectedEvidenceRelative(taskId, key);
  if (expected && value !== expected) {
    return { failure: `${String(key)} must be ${expected}` };
  }
  const repoReal = realpathSync(root);
  const candidate = resolveEvidencePath(root, value);
  if (!existsSync(candidate)) {
    return { failure: `${String(key)} missing at ${value}` };
  }
  const real = realpathSync(candidate);
  if (real !== repoReal && !real.startsWith(`${repoReal}/`)) {
    return { failure: `${String(key)} resolves outside repo: ${value}` };
  }
  return { path: real };
}

function readLifecycleEvidence(root: string, taskId: string, value: string | undefined): { evidence?: Required<GitWorktreeLifecycleEvidence>; missing?: string; failures: string[] } {
  if (!value) {
    return { missing: 'git-worktree-pr lifecycle evidence file', failures: [] };
  }
  const resolved = resolveContainedEvidencePath(root, taskId, 'lifecycle', value);
  if (resolved.failure || !resolved.path) {
    return { missing: resolved.failure ?? 'git-worktree-pr lifecycle evidence file', failures: [] };
  }
  let parsed: GitWorktreeLifecycleEvidence;
  try {
    parsed = JSON.parse(readFileSync(resolved.path, 'utf-8')) as GitWorktreeLifecycleEvidence;
  } catch (error) {
    return { failures: [`git-worktree-pr lifecycle evidence is not valid JSON: ${error instanceof Error ? error.message : String(error)}`] };
  }
  const failures: string[] = [];
  for (const key of ['prMerged', 'checksAndReviewComplete', 'worktreeRemoved', 'mainRefreshed'] as const) {
    if (parsed[key] !== true) {
      failures.push(`git-worktree-pr lifecycle ${key} must be boolean true`);
    }
  }
  if (failures.length > 0) {
    return { failures };
  }
  return { evidence: parsed as Required<GitWorktreeLifecycleEvidence>, failures };
}

function safeBlockerReason(result: WorkerResultBlock): string | null {
  if (!result.blocker) {
    return null;
  }
  if (typeof result.blocker === 'string') {
    return result.blocker;
  }
  return result.blocker.reason ?? stableStringify(result.blocker);
}

function writeJsonArtifact(path: string, value: unknown): string {
  const absolute = resolve(path);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`);
  return absolute;
}

function writeLaunchLog(input: { repoPath: string; runId: string; attemptId: string; launch: OpenCodeLaunchResult; promptPath: string }): string {
  return writeJsonArtifact(join(input.repoPath, '.cache', 'linear-scheduler', 'worker-logs', `${input.runId}-${input.attemptId}.json`), {
    runId: input.runId,
    attemptId: input.attemptId,
    promptPath: input.promptPath,
    kind: input.launch.kind,
    exitCode: input.launch.exitCode,
    timedOut: input.launch.timedOut ?? false,
    cancelled: input.launch.cancelled ?? false,
    stdout: input.launch.stdout,
    stderr: input.launch.stderr,
  });
}

export function renderOpenCodePrompt(context: OpenCodePromptContext): string {
  const resultSchema = {
    runResult: 'in_review|done|blocked|failed|cancelled|abandoned',
    runId: context.runId,
    attemptId: context.attemptId,
    linearIssue: context.linear.identifier,
    taskId: context.taskId,
    prUrl: 'https://github.com/org/repo/pull/123 or null',
    agentSessionId: context.nativeAgent.agentSessionId,
    externalUrls: [{ label: 'GitHub PR', url: 'https://github.com/org/repo/pull/123' }],
    legionEvidence: {
      plan: `.legion/tasks/${context.taskId}/plan.md`,
      tasks: `.legion/tasks/${context.taskId}/tasks.md`,
      log: `.legion/tasks/${context.taskId}/log.md`,
      rfc: `.legion/tasks/${context.taskId}/docs/rfc.md`,
      reviewRfc: `.legion/tasks/${context.taskId}/docs/review-rfc.md`,
      testReport: `.legion/tasks/${context.taskId}/docs/test-report.md`,
      reviewChange: `.legion/tasks/${context.taskId}/docs/review-change.md`,
      report: `.legion/tasks/${context.taskId}/docs/report-walkthrough.md`,
      wiki: `.legion/wiki/tasks/${context.taskId}.md`,
      lifecycle: `.legion/tasks/${context.taskId}/docs/git-worktree-lifecycle.json`,
    },
    lifecycle: {
      note: 'Self-attested lifecycle booleans are not trusted by the scheduler; write the lifecycle evidence file above.',
      prMerged: false,
      checksAndReviewComplete: false,
      worktreeRemoved: false,
      mainRefreshed: false,
    },
    blocker: null,
    nextStep: 'wait_for_pr_checks',
  };

  return `# OpenCode Legion worker contract

You are executing Linear WI ${context.linear.identifier} for scheduler run ${context.runId} attempt ${context.attemptId}.

## Linear context

${JSON.stringify(context.linear, null, 2)}

## Native agent context

${JSON.stringify(context.nativeAgent, null, 2)}

## Worker environment

- repoPath: ${context.repoPath}
- baseRef: ${context.baseRef}
- taskId: ${context.taskId}
- branchPrefix: ${context.branchPrefix}
- evidenceVerifierOutputPath: ${context.evidenceVerifierOutputPath}

## Hard gates

1. Your first workflow action MUST be entering or restoring \`legion-workflow\`.
2. If the task contract is not stable, STOP implementation and enter \`brainstorm\`.
3. If you will modify repository files, enter \`git-worktree-pr\` before editing.
4. Each WI must use an independent Legion task, worktree, branch, and PR.
5. PR created is not completion. Completion requires Legion stages, PR lifecycle, cleanup, main refresh, and wiki writeback.
6. If stop/cancel is observed from \`${context.nativeAgent.stopSignalSource}\`, stop further tool/code/API side effects and emit a cancelled result.
7. Do not put secrets in the result block. Use repo-local evidence files and PR URLs only.

## Required result block

At process end, print exactly one machine-readable result block:

${WORKER_RESULT_START}
${JSON.stringify(resultSchema, null, 2)}
${WORKER_RESULT_END}
`;
}

export function writePromptArtifact(input: { prompt: string; directory: string; runId: string; attemptId: string }): { path: string; hash: string } {
  mkdirSync(input.directory, { recursive: true });
  const hash = promptHash(input.prompt);
  const path = join(input.directory, `${input.runId}-${input.attemptId}-${hash.slice(0, 12)}.md`);
  writeFileSync(path, input.prompt, { mode: 0o600 });
  return { path, hash };
}

export function parseWorkerResultBlock(output: string): WorkerResultBlock {
  const start = output.indexOf(WORKER_RESULT_START);
  const end = output.indexOf(WORKER_RESULT_END, start + WORKER_RESULT_START.length);
  if (start < 0 || end < 0) {
    throw new Error('Worker output did not include a complete Legion result block.');
  }
  if (output.indexOf(WORKER_RESULT_START, start + WORKER_RESULT_START.length) >= 0 || output.indexOf(WORKER_RESULT_END, end + WORKER_RESULT_END.length) >= 0) {
    throw new Error('Worker output included multiple Legion result block delimiters.');
  }
  const jsonText = output.slice(start + WORKER_RESULT_START.length, end).trim();
  const parsed = JSON.parse(jsonText) as WorkerResultBlock;
  if (!['in_review', 'done', 'blocked', 'failed', 'cancelled', 'abandoned'].includes(parsed.runResult)) {
    throw new Error(`Worker result has invalid runResult: ${String(parsed.runResult)}`);
  }
  if (typeof parsed.linearIssue !== 'string' || !parsed.linearIssue || typeof parsed.taskId !== 'string' || !parsed.taskId) {
    throw new Error('Worker result must include linearIssue and taskId.');
  }
  if (parsed.runId !== undefined && (typeof parsed.runId !== 'string' || !parsed.runId)) {
    throw new Error('Worker result runId must be a non-empty string when present.');
  }
  if (parsed.attemptId !== undefined && (typeof parsed.attemptId !== 'string' || !parsed.attemptId)) {
    throw new Error('Worker result attemptId must be a non-empty string when present.');
  }
  if (parsed.prUrl !== undefined && parsed.prUrl !== null && typeof parsed.prUrl !== 'string') {
    throw new Error('Worker result prUrl must be a string or null.');
  }
  if (parsed.legionEvidence !== undefined && (parsed.legionEvidence === null || typeof parsed.legionEvidence !== 'object' || Array.isArray(parsed.legionEvidence))) {
    throw new Error('Worker result legionEvidence must be an object when present.');
  }
  if (parsed.externalUrls !== undefined && !Array.isArray(parsed.externalUrls)) {
    throw new Error('Worker result externalUrls must be an array when present.');
  }
  for (const [key, value] of Object.entries(parsed.legionEvidence ?? {})) {
    if (value !== undefined && typeof value !== 'string') {
      throw new Error(`Worker result legionEvidence.${key} must be a string path.`);
    }
  }
  return parsed;
}

export function verifyLegionEvidence(result: WorkerResultBlock, options: { repoPath: string; runKind: RunKind; risk: 'low' | 'medium' | 'high'; prBacked?: boolean }): EvidenceVerificationResult {
  const missing: string[] = [];
  const failures: string[] = [];
  const evidence = result.legionEvidence ?? {};
  const requirePath = (key: keyof LegionEvidencePaths, label: string) => {
    const value = evidence[key];
    if (!value) {
      missing.push(label);
      return null;
    }
    const resolved = resolveContainedEvidencePath(options.repoPath, result.taskId, key, value);
    if (resolved.failure || !resolved.path) {
      missing.push(`${label}:${resolved.failure ?? value}`);
      return null;
    }
    return resolved.path;
  };

  if (options.runKind === 'design_only') {
    requirePath('rfc', 'docs/rfc.md');
    const reviewRfc = requirePath('reviewRfc', 'docs/review-rfc.md');
    requirePath('report', 'docs/report-walkthrough.md');
    requirePath('wiki', 'wiki writeback');
    if (reviewRfc && !hasPassVerdict(reviewRfc)) {
      failures.push('docs/review-rfc.md missing PASS verdict');
    }
  } else {
    requirePath('plan', 'plan.md');
    requirePath('tasks', 'tasks.md');
    requirePath('log', 'log.md');
    requirePath('testReport', 'docs/test-report.md');
    const reviewChange = requirePath('reviewChange', 'docs/review-change.md');
    requirePath('report', 'docs/report-walkthrough.md');
    requirePath('wiki', 'wiki writeback');
    if (reviewChange && !hasPassVerdict(reviewChange)) {
      failures.push('docs/review-change.md missing PASS verdict');
    }
    if (options.risk === 'medium' || options.risk === 'high') {
      requirePath('rfc', 'docs/rfc.md');
      const reviewRfc = requirePath('reviewRfc', 'docs/review-rfc.md');
      if (reviewRfc && !hasPassVerdict(reviewRfc)) {
        failures.push('docs/review-rfc.md missing PASS verdict');
      }
    }
  }

  const prBacked = options.prBacked ?? Boolean(result.prUrl);
  if (prBacked) {
    if (!result.prUrl) {
      missing.push('prUrl');
    }
    const lifecycle = readLifecycleEvidence(options.repoPath, result.taskId, evidence.lifecycle);
    if (lifecycle.missing) {
      missing.push(lifecycle.missing);
    }
    failures.push(...lifecycle.failures);
  }

  const lifecycleFailures = failures.filter((failure) => failure.includes('git-worktree-pr lifecycle'));
  const legionFailures = failures.filter((failure) => !failure.includes('git-worktree-pr lifecycle'));
  if (missing.length > 0 || legionFailures.length > 0) {
    return { ok: false, status: 'missing', failureType: 'legion_evidence_missing', missing, failures };
  }
  if (lifecycleFailures.length > 0) {
    return { ok: false, status: 'missing', failureType: 'lifecycle_blocked', missing, failures };
  }
  return { ok: true, status: 'passed', missing, failures };
}

export async function runOpenCodeProcess(request: OpenCodeLaunchRequest): Promise<OpenCodeLaunchResult> {
  return await new Promise((resolveLaunch) => {
    const command = request.command ?? 'opencode';
    const promptArgument = request.promptPath
      ? `Read and execute the OpenCode Legion worker prompt artifact at ${request.promptPath}. Treat that artifact as the only task input.`
      : request.prompt;
    const child = spawn(command, ['-p', promptArgument, '-f', 'json', '-q', '-c', request.repoPath], {
      cwd: request.repoPath,
      env: sanitizeOpenCodeEnv(process.env, request.env),
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    });
    let stdout = '';
    let stderr = '';
    let settled = false;
    let stoppingKind: 'timeout' | 'cancelled' | null = null;
    let killTimer: NodeJS.Timeout | null = null;

    const signalProcessGroup = (signal: NodeJS.Signals) => {
      if (!child.pid) return;
      try {
        process.kill(-child.pid, signal);
      } catch {
        child.kill(signal);
      }
    };

    const requestStop = (kind: 'timeout' | 'cancelled') => {
      if (stoppingKind) return;
      stoppingKind = kind;
      signalProcessGroup('SIGTERM');
      killTimer = setTimeout(() => signalProcessGroup('SIGKILL'), request.killGraceMs ?? 5000);
    };

    const heartbeat = setInterval(() => request.onHeartbeat?.(), 1000);
    const cancelPoll = setInterval(() => {
      if (request.shouldCancel?.()) {
        requestStop('cancelled');
      }
    }, 250);
    const timeout = setTimeout(() => {
      requestStop('timeout');
    }, request.timeoutMs);

    const finish = (result: OpenCodeLaunchResult) => {
      if (settled) return;
      settled = true;
      clearInterval(heartbeat);
      clearInterval(cancelPoll);
      clearTimeout(timeout);
      if (killTimer) clearTimeout(killTimer);
      resolveLaunch(result);
    };

    child.stdout?.setEncoding('utf-8');
    child.stderr?.setEncoding('utf-8');
    child.stdout?.on('data', (chunk) => { stdout += chunk; });
    child.stderr?.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => finish({ kind: 'nonzero_exit', exitCode: null, stdout, stderr: stderr + String(error) }));
    child.on('close', (code) => {
      if (stoppingKind === 'timeout') {
        finish({ kind: 'timeout', exitCode: code, stdout, stderr, timedOut: true });
        return;
      }
      if (stoppingKind === 'cancelled' || request.shouldCancel?.()) {
        finish({ kind: 'cancelled', exitCode: code, stdout, stderr, cancelled: true });
        return;
      }
      finish({ kind: code === 0 ? 'success' : 'nonzero_exit', exitCode: code, stdout, stderr });
    });
  });
}

export const opencodeProcessLauncher: OpenCodeLauncher = { launch: runOpenCodeProcess };

const DEFAULT_OPENCODE_ENV_EXACT = new Set(['PATH', 'HOME', 'LANG', 'LC_ALL', 'TERM', 'SHELL', 'USER', 'TMPDIR', 'XDG_CONFIG_HOME', 'XDG_CACHE_HOME']);
const DEFAULT_OPENCODE_ENV_PREFIXES = ['OPENCODE_', 'OPENAI_', 'ANTHROPIC_', 'GEMINI_', 'GOOGLE_', 'AZURE_OPENAI_', 'AWS_'];

export function sanitizeOpenCodeEnv(source: NodeJS.ProcessEnv = process.env, extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  const sanitized: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries({ ...source, ...extra })) {
    if (value === undefined) continue;
    if (DEFAULT_OPENCODE_ENV_EXACT.has(key) || DEFAULT_OPENCODE_ENV_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export async function processNativeAgentOutbox(store: SchedulerStore, adapter: NativeAgentAdapter): Promise<number> {
  let processed = 0;
  const sideEffectOrder = new Map([
    ['create_or_find_session', 0],
    ['set_delegate', 1],
    ['create_activity', 2],
    ['update_plan', 3],
    ['update_external_urls', 4],
    ['update_issue_state', 5],
    ['update_issue_labels', 6],
    ['create_comment', 7],
    ['final_response', 8],
  ]);
  const rows = store.pendingOutbox()
    .filter((entry) => entry.outbox_kind === 'native_agent')
    .sort((left, right) => (sideEffectOrder.get(left.side_effect) ?? 99) - (sideEffectOrder.get(right.side_effect) ?? 99) || left.created_at.localeCompare(right.created_at) || left.id.localeCompare(right.id));
  const blockedRuns = new Set<string>();
  for (const row of rows) {
    if (!row.run_id) {
      store.markOutboxFailed(row.idempotency_key, 'native_agent outbox row is missing run_id');
      continue;
    }
    const run = store.getRun(row.run_id);
    if ((run?.native_stop_requested_at || run?.state === 'cancelled') && row.side_effect !== 'final_response') {
      store.markOutboxFailed(row.idempotency_key, 'Skipped native startup side effect after stop/cancel request.');
      blockedRuns.add(row.run_id);
      continue;
    }
    if (blockedRuns.has(row.run_id) && row.side_effect !== 'final_response') {
      continue;
    }
    if (row.side_effect !== 'final_response') {
      const currentOrder = sideEffectOrder.get(row.side_effect) ?? 99;
      const unsentPrerequisite = store.outboxForRun(row.run_id)
        .filter((entry) => entry.outbox_kind === 'native_agent' && entry.side_effect !== 'final_response' && (sideEffectOrder.get(entry.side_effect) ?? 99) < currentOrder)
        .find((entry) => entry.state !== 'sent');
      if (unsentPrerequisite) {
        blockedRuns.add(row.run_id);
        continue;
      }
    }
    const payload = parsePayload<Record<string, unknown>>(row);
    try {
      if (row.side_effect === 'create_or_find_session') {
        const result = await adapter.createOrFindSession({
          runId: row.run_id,
          linearIssueId: String(payload.linearIssueId),
          linearIdentifier: String(payload.linearIdentifier),
          agentSessionId: payload.agentSessionId as string | null | undefined,
          promptContextHash: payload.promptContextHash as string | null | undefined,
          traceId: payload.traceId as string | null | undefined,
        });
        store.updateNativeRunContext(row.run_id, { agentSessionId: result.agentSessionId, promptContextHash: payload.promptContextHash as string | null | undefined, nativeStateObserved: 'session_ready' });
      } else if (row.side_effect === 'set_delegate') {
        await adapter.setDelegate({ runId: row.run_id, linearIssueId: String(payload.linearIssueId), delegateAppUserId: String(payload.delegateAppUserId), traceId: payload.traceId as string | null | undefined });
        store.updateNativeRunContext(row.run_id, { delegateAppUserId: String(payload.delegateAppUserId) });
      } else if (row.side_effect === 'create_activity') {
        const result = await adapter.createActivity({ runId: row.run_id, kind: String(payload.kind), message: String(payload.message), traceId: payload.traceId as string | null | undefined });
        store.updateNativeRunContext(row.run_id, { lastAgentActivityId: result.activityId ?? null, lastAgentActivityAt: nowIso(), nativeStateObserved: String(payload.kind) });
      } else if (row.side_effect === 'update_plan') {
        await adapter.updatePlan({ runId: row.run_id, steps: payload.steps as string[], traceId: payload.traceId as string | null | undefined });
      } else if (row.side_effect === 'update_external_urls') {
        await adapter.updateExternalUrls({ runId: row.run_id, urls: payload.urls as Array<{ label: string; url: string }>, traceId: payload.traceId as string | null | undefined });
      } else if (row.side_effect === 'update_issue_state') {
        await adapter.updateIssueState({ runId: row.run_id, schedulerState: String(payload.schedulerState), suggestedState: payload.suggestedState as string | null | undefined, traceId: payload.traceId as string | null | undefined });
      } else if (row.side_effect === 'update_issue_labels') {
        await adapter.updateIssueLabels({ runId: row.run_id, addLabels: payload.addLabels as string[] | undefined, removeLabels: payload.removeLabels as string[] | undefined, traceId: payload.traceId as string | null | undefined });
      } else if (row.side_effect === 'create_comment') {
        const result = await adapter.createComment({ runId: row.run_id, body: String(payload.body), traceId: payload.traceId as string | null | undefined });
        store.updateNativeRunContext(row.run_id, { lastAgentActivityId: result.commentId ?? null, lastAgentActivityAt: nowIso(), nativeStateObserved: 'comment' });
      } else if (row.side_effect === 'final_response') {
        await adapter.finalResponse({ runId: row.run_id, result: String(payload.result), reason: payload.reason as string | null | undefined, terminalKind: payload.terminalKind as string | null | undefined, summaryMarkdown: payload.summaryMarkdown as string | null | undefined, traceId: payload.traceId as string | null | undefined });
      } else {
        throw new Error(`Unsupported native side effect: ${row.side_effect}`);
      }
      store.markOutboxSent(row.idempotency_key);
      processed += 1;
    } catch (error) {
      store.markOutboxFailed(row.idempotency_key, error instanceof Error ? error.message : String(error), { retry: true });
      blockedRuns.add(row.run_id);
    }
  }
  return processed;
}

function linearContextFromRun(run: RunRow, payload: WorkerDispatchPayload): LinearWorkerContext {
  const linear = payload.linear ?? {};
  return {
    issueId: run.linear_issue_id,
    identifier: run.linear_identifier,
    url: linear.url ?? null,
    projectId: run.linear_project_id,
    title: linear.title ?? run.linear_identifier,
    description: linear.description ?? null,
    labels: linear.labels ?? [],
    blockers: linear.blockers ?? [],
    repoKey: run.repo_key,
    risk: linear.risk ?? 'medium',
    contractState: linear.contractState ?? 'unknown',
    linearUpdatedAt: linear.linearUpdatedAt ?? run.evaluated_issue_updated_at,
  };
}

function dispatchIdentityFailures(row: OutboxRow, payload: WorkerDispatchPayload, run: RunRow, attempt: { id: string; run_id: string }): string[] {
  const failures: string[] = [];
  if (row.run_id !== payload.runId) failures.push('outbox row run_id does not match payload.runId');
  if (row.attempt_id !== payload.attemptId) failures.push('outbox row attempt_id does not match payload.attemptId');
  if (attempt.run_id !== run.id) failures.push('attempt.run_id does not match run.id');
  if (payload.taskId !== run.task_id) failures.push('payload.taskId does not match run.task_id');
  if (payload.linearIdentifier !== run.linear_identifier) failures.push('payload.linearIdentifier does not match run.linear_identifier');
  if (payload.linear?.issueId && payload.linear.issueId !== run.linear_issue_id) failures.push('payload.linear.issueId does not match run.linear_issue_id');
  if (payload.linear?.identifier && payload.linear.identifier !== run.linear_identifier) failures.push('payload.linear.identifier does not match run.linear_identifier');
  if (payload.linear?.projectId && payload.linear.projectId !== run.linear_project_id) failures.push('payload.linear.projectId does not match run.linear_project_id');
  if (payload.linear?.repoKey && payload.linear.repoKey !== run.repo_key) failures.push('payload.linear.repoKey does not match run.repo_key');
  return failures;
}

function attemptResultKind(launch: OpenCodeLaunchResult, parsed?: WorkerResultBlock): AttemptResultKind {
  if (launch.timedOut) return 'timeout';
  if (launch.cancelled || parsed?.runResult === 'cancelled') return 'cancelled';
  if (parsed?.runResult === 'blocked') return 'blocked';
  if (launch.exitCode !== 0 || parsed?.runResult === 'failed' || parsed?.runResult === 'abandoned') return 'failed';
  return 'success';
}

function workerResultIdentityFailures(result: WorkerResultBlock, run: RunRow, attemptId: string, expectedTaskId: string): string[] {
  const failures: string[] = [];
  if (result.runId !== run.id) failures.push('runId mismatch or missing');
  if (result.attemptId !== attemptId) failures.push('attemptId mismatch or missing');
  if (result.linearIssue !== run.linear_identifier) failures.push('linearIssue mismatch');
  if (result.taskId !== expectedTaskId) failures.push('taskId mismatch');
  if (run.linear_agent_session_id && result.agentSessionId && result.agentSessionId !== run.linear_agent_session_id) failures.push('agentSessionId mismatch');
  return failures;
}

function transitionToInReview(store: SchedulerStore, run: RunRow, result: WorkerResultBlock, traceId?: string | null) {
  const current = store.getRun(run.id) ?? run;
  if (current.state === 'queued') {
    store.transitionRun(run.id, 'running', { actor: 'worker', traceId: traceId ?? undefined });
  }
  const refreshed = store.getRun(run.id) ?? current;
  if (refreshed.state === 'running' || refreshed.state === 'blocked') {
    store.transitionRun(run.id, 'in_review', { actor: 'worker', traceId: traceId ?? undefined, evidenceStatus: 'pending' });
  }
  store.updateRunMetadata(run.id, { prUrl: result.prUrl ?? null, evidenceStatus: 'pending' });
}

function terminalFailure(store: SchedulerStore, runId: string, nextState: 'failed' | 'cancelled' | 'abandoned', input: { failureType: string; failureReason: string; traceId?: string | null; now?: string }) {
  const current = store.getRun(runId);
  if (!current) return;
  if (current.state !== nextState) {
    store.transitionRun(runId, nextState, { actor: 'worker', traceId: input.traceId ?? undefined, failureType: input.failureType, failureReason: input.failureReason, now: input.now });
  }
  store.releaseLocksForRun(runId, { actor: 'worker', reason: input.failureType, traceId: input.traceId ?? undefined, now: input.now });
}

function scheduleRetryOrTerminalFailure(store: SchedulerStore, run: RunRow, attempt: RunAttemptRow, input: {
  failureType: string;
  failureReason: string;
  traceId?: string | null;
  now?: string;
  retryPolicy?: RetryPolicyOptions;
  scopeRepairable?: boolean;
}): { retryScheduled: boolean; retryAttemptId?: string; notBefore?: string; reason: string } {
  const decision = decideRetry({
    failureType: input.failureType,
    attemptNumber: attempt.attempt_number,
    scopeRepairable: input.scopeRepairable,
    maxAttempts: input.retryPolicy?.maxAttempts,
    baseDelayMs: input.retryPolicy?.baseDelayMs,
    maxDelayMs: input.retryPolicy?.maxDelayMs,
    now: input.now,
  });
  if (!decision.retry) {
    terminalFailure(store, run.id, 'failed', { failureType: input.failureType, failureReason: `${input.failureReason} ${decision.reason}`.trim(), traceId: input.traceId, now: input.now });
    return { retryScheduled: false, reason: decision.reason };
  }

  const current = store.getRun(run.id) ?? run;
  if (current.state !== 'blocked') {
    store.transitionRun(run.id, 'blocked', {
      actor: 'worker',
      traceId: input.traceId ?? undefined,
      failureType: input.failureType,
      failureReason: `${input.failureReason} ${decision.reason} Next retry not before ${decision.notBefore}.`.trim(),
      now: input.now,
    });
  }
  const retry = store.createRetryAttempt(run.id, {
    failureType: input.failureType,
    failureReason: input.failureReason,
    notBefore: decision.notBefore,
    traceId: input.traceId,
    now: input.now,
  });
  return { retryScheduled: true, retryAttemptId: retry.attemptId, notBefore: decision.notBefore, reason: decision.reason };
}

export async function processOpenCodeWorkerDispatch(store: SchedulerStore, row: OutboxRow, options: {
  repoPath: string;
  baseRef?: string;
  promptArtifactDir?: string;
  launcher?: OpenCodeLauncher;
  timeoutMs?: number;
  stopSignalSource?: string;
  now?: string;
  retryPolicy?: RetryPolicyOptions;
}): Promise<WorkerDispatchOutcome> {
  if (row.outbox_kind !== 'worker_dispatch' || row.side_effect !== 'dispatch_worker') {
    throw new Error(`Outbox row is not a worker dispatch: ${row.id}`);
  }
  const payload = parsePayload<WorkerDispatchPayload>(row);
  const run = store.getRun(payload.runId);
  if (!run) {
    store.markOutboxFailed(row.idempotency_key, `Run not found: ${payload.runId}`);
    return { result: 'launch_failed' };
  }
  const attempt = store.getAttempt(payload.attemptId);
  if (!attempt) {
    store.markOutboxFailed(row.idempotency_key, `Attempt not found: ${payload.attemptId}`);
    return { result: 'launch_failed' };
  }
  const now = options.now ?? nowIso();
  if (payload.retry?.notBefore && !retryNotBeforeDue(payload.retry.notBefore, now)) {
    store.markOutboxFailed(row.idempotency_key, `Retry not due until ${payload.retry.notBefore}.`, { retry: true, now });
    return { result: 'launch_failed' };
  }
  const dispatchFailures = dispatchIdentityFailures(row, payload, run, attempt);
  if (dispatchFailures.length > 0) {
    store.markOutboxFailed(row.idempotency_key, dispatchFailures.join('; '));
    store.recordSchedulerEvent({
      runId: run.id,
      eventType: 'worker_dispatch_rejected',
      actor: 'scheduler',
      payload: { reason: 'dispatch_identity_mismatch', failures: dispatchFailures },
      traceId: payload.traceId ?? null,
      linearIdentifier: run.linear_identifier,
      taskId: run.task_id,
    });
    return { result: 'launch_failed' };
  }
  if (run.native_stop_requested_at || run.state === 'cancelled') {
    store.markAttemptFinished(attempt.id, { exitCode: null, resultKind: 'cancelled' });
    if (run.state !== 'cancelled') {
      store.transitionRun(run.id, 'cancelled', { actor: 'worker', traceId: payload.traceId ?? undefined, failureType: 'native_stop_requested', failureReason: 'Stop requested before worker dispatch.' });
    }
    store.releaseLocksForRun(run.id, { actor: 'worker', reason: 'native_stop_requested', traceId: payload.traceId ?? undefined });
    store.markOutboxSent(row.idempotency_key);
    return { result: 'cancelled' };
  }
  const incompleteNativeStartup = store.outboxForRun(run.id).filter((entry) => entry.outbox_kind === 'native_agent' && entry.side_effect !== 'final_response' && entry.state !== 'sent');
  if (incompleteNativeStartup.length > 0) {
    store.markOutboxFailed(row.idempotency_key, 'Native agent startup outbox must be sent before worker dispatch.', { retry: true });
    return { result: 'launch_failed' };
  }

  const linear = linearContextFromRun(run, payload);
  const context: OpenCodePromptContext = {
    runId: run.id,
    attemptId: attempt.id,
    taskId: run.task_id,
    repoPath: options.repoPath,
    baseRef: options.baseRef ?? 'origin/master',
    branchPrefix: `legion/${run.task_id}-`,
    evidenceVerifierOutputPath: `.legion/tasks/${run.task_id}/docs/evidence-verifier.json`,
    linear,
    nativeAgent: {
      agentSessionId: run.linear_agent_session_id,
      delegateAppUserId: run.linear_delegate_app_user_id,
      stopSignalSource: options.stopSignalSource ?? `scheduler://runs/${run.id}/stop`,
    },
  };
  const prompt = renderOpenCodePrompt(context);
  const promptDir = options.promptArtifactDir ?? join(options.repoPath, '.cache', 'linear-scheduler', 'prompts');
  const artifact = writePromptArtifact({ prompt, directory: promptDir, runId: run.id, attemptId: attempt.id });
  store.markAttemptStarted(attempt.id, { promptHash: artifact.hash, logUri: artifact.path });
  if (run.state === 'queued') {
    store.transitionRun(run.id, 'running', { actor: 'worker', traceId: payload.traceId ?? undefined });
  }

  const launcher = options.launcher ?? opencodeProcessLauncher;
  const launch = await launcher.launch({
    prompt,
    promptPath: artifact.path,
    repoPath: options.repoPath,
    timeoutMs: options.timeoutMs ?? 60 * 60 * 1000,
    onHeartbeat: () => store.heartbeatRun(run.id),
    shouldCancel: () => Boolean(store.getRun(run.id)?.native_stop_requested_at),
  });
  const launchLogPath = writeLaunchLog({ repoPath: options.repoPath, runId: run.id, attemptId: attempt.id, launch, promptPath: artifact.path });

  if (launch.kind !== 'success' || launch.exitCode !== 0) {
    const kind = launch.timedOut ? 'timeout' : launch.cancelled ? 'cancelled' : 'failed';
    store.markAttemptFinished(attempt.id, { exitCode: launch.exitCode, resultKind: kind as AttemptResultKind, logUri: launchLogPath });
    if (kind === 'cancelled') {
      terminalFailure(store, run.id, 'cancelled', { failureType: 'native_stop_requested', failureReason: launch.stderr || 'OpenCode worker dispatch was cancelled.', traceId: payload.traceId, now });
      store.markOutboxSent(row.idempotency_key);
      return { result: 'cancelled', promptPath: artifact.path, logPath: launchLogPath };
    }
    const failureType = launch.timedOut ? 'worker_timeout' : 'agent_failed';
    const retry = scheduleRetryOrTerminalFailure(store, run, attempt, {
      failureType,
      failureReason: launch.stderr || `OpenCode worker exited with ${launch.exitCode}`,
      traceId: payload.traceId,
      now,
      retryPolicy: options.retryPolicy,
    });
    store.markOutboxSent(row.idempotency_key);
    return { result: retry.retryScheduled ? 'blocked' : 'failed', promptPath: artifact.path, logPath: launchLogPath };
  }

  let parsed: WorkerResultBlock;
  try {
    parsed = parseWorkerResultBlock(`${launch.stdout}\n${launch.stderr}`);
  } catch (error) {
    store.markAttemptFinished(attempt.id, { exitCode: launch.exitCode, resultKind: 'failed', logUri: launchLogPath });
    terminalFailure(store, run.id, 'failed', { failureType: 'unknown_result', failureReason: error instanceof Error ? error.message : String(error), traceId: payload.traceId, now });
    store.markOutboxSent(row.idempotency_key);
    return { result: 'malformed_result', promptPath: artifact.path, logPath: launchLogPath };
  }

  const identityFailures = workerResultIdentityFailures(parsed, store.getRun(run.id) ?? run, attempt.id, run.task_id);
  if (identityFailures.length > 0) {
    store.markAttemptFinished(attempt.id, { exitCode: launch.exitCode, resultKind: 'failed', logUri: launchLogPath });
    terminalFailure(store, run.id, 'failed', { failureType: 'result_identity_mismatch', failureReason: identityFailures.join('; '), traceId: payload.traceId, now });
    store.markOutboxSent(row.idempotency_key);
    return { result: 'malformed_result', promptPath: artifact.path, logPath: launchLogPath };
  }

  store.markAttemptFinished(attempt.id, { exitCode: launch.exitCode, resultKind: attemptResultKind(launch, parsed), logUri: launchLogPath });
  store.updateRunMetadata(run.id, { prUrl: parsed.prUrl ?? null });

  if (parsed.runResult === 'cancelled') {
    terminalFailure(store, run.id, 'cancelled', { failureType: 'worker_cancelled', failureReason: safeBlockerReason(parsed) ?? 'Worker returned cancelled.', traceId: payload.traceId, now });
  } else if (parsed.runResult === 'blocked') {
    store.transitionRun(run.id, 'blocked', { actor: 'worker', traceId: payload.traceId ?? undefined, failureType: 'worker_blocked', failureReason: safeBlockerReason(parsed) ?? parsed.nextStep ?? 'Worker returned blocked.' });
  } else if (parsed.runResult === 'failed' || parsed.runResult === 'abandoned') {
    terminalFailure(store, run.id, parsed.runResult === 'abandoned' ? 'abandoned' : 'failed', { failureType: parsed.runResult === 'abandoned' ? 'worker_abandoned' : 'worker_failed', failureReason: safeBlockerReason(parsed) ?? parsed.nextStep ?? `Worker returned ${parsed.runResult}.`, traceId: payload.traceId, now });
  } else if (parsed.runResult === 'in_review') {
    transitionToInReview(store, run, parsed, payload.traceId);
  } else if (parsed.runResult === 'done') {
    const verification = verifyLegionEvidence(parsed, { repoPath: options.repoPath, runKind: run.run_kind, risk: linear.risk, prBacked: true });
    const verificationPath = writeJsonArtifact(resolveEvidencePath(options.repoPath, context.evidenceVerifierOutputPath), verification);
    if (!verification.ok) {
      store.transitionRun(run.id, 'blocked', { actor: 'worker', traceId: payload.traceId ?? undefined, evidenceStatus: verification.status, failureType: verification.failureType, failureReason: [...verification.missing, ...verification.failures].join('; ') });
      store.markOutboxSent(row.idempotency_key);
      return { result: 'done', promptPath: artifact.path, logPath: launchLogPath, verificationPath, verification };
    }
    transitionToInReview(store, run, parsed, payload.traceId);
    store.updateRunMetadata(run.id, { deliveryGateStatus: 'pending', evidenceStatus: 'passed' });
    store.recordSchedulerEvent({
      runId: run.id,
      eventType: 'pr_tracking_required',
      actor: 'worker',
      payload: { prUrl: parsed.prUrl, reason: 'Worker returned done; scheduler must still verify GitHub PR terminal state before run_terminal_success.' },
      traceId: payload.traceId ?? null,
      linearIdentifier: run.linear_identifier,
      taskId: run.task_id,
    });
    store.markOutboxSent(row.idempotency_key);
    return { result: 'in_review', promptPath: artifact.path, logPath: launchLogPath, verificationPath, verification };
  }

  store.markOutboxSent(row.idempotency_key);
  return { result: parsed.runResult, promptPath: artifact.path, logPath: launchLogPath };
}

export function workerResultBlock(result: WorkerResultBlock): string {
  return `${WORKER_RESULT_START}\n${JSON.stringify(result, null, 2)}\n${WORKER_RESULT_END}`;
}

export function defaultEvidencePaths(taskId: string): LegionEvidencePaths {
  return {
    plan: `.legion/tasks/${taskId}/plan.md`,
    tasks: `.legion/tasks/${taskId}/tasks.md`,
    log: `.legion/tasks/${taskId}/log.md`,
    rfc: `.legion/tasks/${taskId}/docs/rfc.md`,
    reviewRfc: `.legion/tasks/${taskId}/docs/review-rfc.md`,
    testReport: `.legion/tasks/${taskId}/docs/test-report.md`,
    reviewChange: `.legion/tasks/${taskId}/docs/review-change.md`,
    report: `.legion/tasks/${taskId}/docs/report-walkthrough.md`,
    wiki: `.legion/wiki/tasks/${taskId}.md`,
    lifecycle: `.legion/tasks/${taskId}/docs/git-worktree-lifecycle.json`,
  };
}

export function writeEvidenceFixture(root: string, taskId: string, options: { includeRfc?: boolean } = {}): LegionEvidencePaths {
  const paths = defaultEvidencePaths(taskId);
  const entries: Array<[keyof LegionEvidencePaths, string]> = [
    ['plan', '# plan'],
    ['tasks', '# tasks'],
    ['log', '# log'],
    ['testReport', '# test report\n\n## Result\n\nPASS'],
    ['reviewChange', '# review-change\n\n## Verdict\n\nPASS'],
    ['report', '# report'],
    ['wiki', '# wiki'],
    ['lifecycle', `${JSON.stringify({ prMerged: true, checksAndReviewComplete: true, worktreeRemoved: true, mainRefreshed: true }, null, 2)}\n`],
  ];
  if (options.includeRfc) {
    entries.push(['rfc', '# rfc'], ['reviewRfc', '# review-rfc\n\n## Verdict\n\nPASS']);
  }
  for (const [key, content] of entries) {
    const relative = paths[key];
    if (!relative) continue;
    const absolute = resolveEvidencePath(root, relative);
    mkdirSync(dirname(absolute), { recursive: true });
    writeFileSync(absolute, content);
  }
  return paths;
}

export function workerPromptContextHash(context: OpenCodePromptContext): string {
  return stableHash(context);
}
