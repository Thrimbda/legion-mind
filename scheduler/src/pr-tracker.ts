import type { DeliveryGateStatus, EvidenceStatus, RiskLevel, RunRow, SchedulerStore } from './sqlite-store.ts';
import { stableHash, stableStringify } from './sqlite-store.ts';
import type { RunState } from './state-machine.ts';
import { isTerminalRunState } from './state-machine.ts';
import { defaultEvidencePaths, verifyLegionEvidence } from './worker-runner.ts';
import type { EvidenceVerificationResult, WorkerResultBlock } from './worker-runner.ts';

export type PullRequestLifecycleState = 'open' | 'closed';
export type PullRequestChecksStatus = 'success' | 'pending' | 'failure' | 'unknown';
export type PullRequestReviewDecision = 'approved' | 'changes_requested' | 'review_required' | 'none' | 'unknown';
export type PullRequestCloseReason = 'closed_unmerged' | 'cancelled' | 'abandoned' | 'superseded' | 'rejected' | 'duplicate';

export interface PullRequestSnapshot {
  url: string;
  state: PullRequestLifecycleState;
  draft?: boolean;
  merged?: boolean;
  mergedAt?: string | null;
  closedAt?: string | null;
  headSha?: string | null;
  checks: {
    status: PullRequestChecksStatus;
    summary?: string | null;
  };
  review: {
    decision: PullRequestReviewDecision;
    summary?: string | null;
  };
  closeReason?: PullRequestCloseReason | null;
}

export interface GitHubPrClient {
  fetchPullRequest(prUrl: string): Promise<PullRequestSnapshot>;
}

export interface DeliveryTrackingOutcome {
  runId: string;
  prUrl: string;
  runState: RunState;
  deliveryGateStatus: DeliveryGateStatus;
  evidenceStatus: EvidenceStatus;
  terminalKind: 'run_terminal_success' | 'run_terminal_non_success' | null;
  decision: 'in_review' | 'blocked' | 'done' | 'terminal_non_success' | 'ignored_terminal';
  reason: string;
  verification?: EvidenceVerificationResult;
  enqueuedOutboxIds: string[];
}

interface TrackingOptions {
  runId: string;
  prUrl?: string | null;
  repoPath: string;
  traceId?: string | null;
  risk?: RiskLevel;
  now?: string;
}

interface DeliveryDecision {
  kind: 'in_review' | 'blocked' | 'merged' | 'terminal_non_success';
  failureType?: string | null;
  reason: string;
  terminalState?: RunState;
  terminalKind?: 'run_terminal_non_success';
}

function nowIso(): string {
  return new Date().toISOString();
}

function outboxSuffix(value: unknown): string {
  return stableHash(value).slice(0, 16);
}

function normalizeMessage(message: string): string {
  return message.replace(/\s+/g, ' ').trim();
}

function snapshotSummary(snapshot: PullRequestSnapshot) {
  return {
    url: snapshot.url,
    state: snapshot.state,
    draft: snapshot.draft ?? false,
    merged: snapshot.merged ?? false,
    mergedAt: snapshot.mergedAt ?? null,
    closedAt: snapshot.closedAt ?? null,
    headSha: snapshot.headSha ?? null,
    checks: snapshot.checks,
    review: snapshot.review,
    closeReason: snapshot.closeReason ?? null,
  };
}

function evidenceResultBlock(run: RunRow, prUrl: string): WorkerResultBlock {
  return {
    runResult: 'done',
    linearIssue: run.linear_identifier,
    taskId: run.task_id,
    prUrl,
    legionEvidence: defaultEvidencePaths(run.task_id),
  };
}

function riskForRun(store: SchedulerStore, run: RunRow, override?: RiskLevel): RiskLevel {
  return override ?? store.evaluatedSnapshotForRun(run.id)?.risk ?? 'medium';
}

function enqueueActivity(store: SchedulerStore, run: RunRow, input: { key: string; kind: 'thought' | 'action' | 'elicitation' | 'response' | 'error'; message: string; traceId?: string | null; now?: string }): string {
  return store.enqueueOutbox({
    outboxKind: 'native_agent',
    runId: run.id,
    attemptId: null,
    idempotencyKey: `run:${run.id}:delivery:${input.key}:activity`,
    sideEffect: 'create_activity',
    payload: { kind: input.kind, message: input.message, traceId: input.traceId ?? null },
    now: input.now,
  });
}

function enqueueExternalUrls(store: SchedulerStore, run: RunRow, input: { prUrl: string; traceId?: string | null; now?: string }): string {
  return store.enqueueOutbox({
    outboxKind: 'native_agent',
    runId: run.id,
    attemptId: null,
    idempotencyKey: `run:${run.id}:delivery:pr-url:${outboxSuffix(input.prUrl)}:external-urls`,
    sideEffect: 'update_external_urls',
    payload: { urls: [{ label: 'GitHub PR', url: input.prUrl }], traceId: input.traceId ?? null },
    now: input.now,
  });
}

function enqueuePlan(store: SchedulerStore, run: RunRow, input: { key: string; steps: string[]; traceId?: string | null; now?: string }): string {
  return store.enqueueOutbox({
    outboxKind: 'native_agent',
    runId: run.id,
    attemptId: null,
    idempotencyKey: `run:${run.id}:delivery:${input.key}:plan`,
    sideEffect: 'update_plan',
    payload: { steps: input.steps, traceId: input.traceId ?? null },
    now: input.now,
  });
}

function enqueueIssueState(store: SchedulerStore, run: RunRow, input: { key: string; schedulerState: string; suggestedState?: string | null; traceId?: string | null; now?: string }): string {
  return store.enqueueOutbox({
    outboxKind: 'native_agent',
    runId: run.id,
    attemptId: null,
    idempotencyKey: `run:${run.id}:delivery:${input.key}:issue-state`,
    sideEffect: 'update_issue_state',
    payload: { schedulerState: input.schedulerState, suggestedState: input.suggestedState ?? null, traceId: input.traceId ?? null },
    now: input.now,
  });
}

function enqueueIssueLabels(store: SchedulerStore, run: RunRow, input: { key: string; addLabels?: string[]; removeLabels?: string[]; traceId?: string | null; now?: string }): string {
  return store.enqueueOutbox({
    outboxKind: 'native_agent',
    runId: run.id,
    attemptId: null,
    idempotencyKey: `run:${run.id}:delivery:${input.key}:issue-labels`,
    sideEffect: 'update_issue_labels',
    payload: { addLabels: input.addLabels ?? [], removeLabels: input.removeLabels ?? [], traceId: input.traceId ?? null },
    now: input.now,
  });
}

function enqueueComment(store: SchedulerStore, run: RunRow, input: { key: string; body: string; traceId?: string | null; now?: string }): string {
  return store.enqueueOutbox({
    outboxKind: 'native_agent',
    runId: run.id,
    attemptId: null,
    idempotencyKey: `run:${run.id}:delivery:${input.key}:comment`,
    sideEffect: 'create_comment',
    payload: { body: input.body, traceId: input.traceId ?? null },
    now: input.now,
  });
}

function enqueueFinalResponse(store: SchedulerStore, run: RunRow, input: { key: string; terminalKind: 'run_terminal_success' | 'run_terminal_non_success'; result: string; reason: string; summary: string; traceId?: string | null; now?: string }): string {
  return store.enqueueOutbox({
    outboxKind: 'native_agent',
    runId: run.id,
    attemptId: null,
    idempotencyKey: `run:${run.id}:delivery:final:${input.key}`,
    sideEffect: 'final_response',
    payload: {
      result: input.result,
      reason: input.reason,
      terminalKind: input.terminalKind,
      summaryMarkdown: input.summary,
      traceId: input.traceId ?? null,
    },
    now: input.now,
  });
}

function checksAndReviewResolved(snapshot: PullRequestSnapshot): { ok: true } | { ok: false; reason: string } {
  if (snapshot.checks.status !== 'success') {
    return { ok: false, reason: `PR checks are ${snapshot.checks.status}${snapshot.checks.summary ? `: ${snapshot.checks.summary}` : ''}` };
  }
  if (snapshot.review.decision === 'changes_requested' || snapshot.review.decision === 'review_required' || snapshot.review.decision === 'unknown') {
    return { ok: false, reason: `PR review is ${snapshot.review.decision}${snapshot.review.summary ? `: ${snapshot.review.summary}` : ''}` };
  }
  return { ok: true };
}

function decidePrSnapshot(snapshot: PullRequestSnapshot): DeliveryDecision {
  if (snapshot.merged || snapshot.mergedAt) {
    const resolved = checksAndReviewResolved(snapshot);
    if (!resolved.ok) {
      return { kind: 'blocked', failureType: 'pr_blocked', reason: resolved.reason };
    }
    return { kind: 'merged', reason: 'PR merged and checks/review are resolved.' };
  }

  if (snapshot.state === 'closed') {
    const reason = snapshot.closeReason ?? 'closed_unmerged';
    if (reason === 'cancelled') {
      return { kind: 'terminal_non_success', terminalState: 'cancelled', terminalKind: 'run_terminal_non_success', failureType: 'pr_cancelled', reason: 'PR closed after cancellation.' };
    }
    if (reason === 'abandoned' || reason === 'superseded') {
      return { kind: 'terminal_non_success', terminalState: 'abandoned', terminalKind: 'run_terminal_non_success', failureType: `pr_${reason}`, reason: `PR terminal non-success: ${reason}.` };
    }
    return { kind: 'terminal_non_success', terminalState: 'failed', terminalKind: 'run_terminal_non_success', failureType: `pr_${reason}`, reason: `PR closed unmerged: ${reason}.` };
  }

  if (snapshot.checks.status === 'failure') {
    return { kind: 'blocked', failureType: 'pr_blocked', reason: `PR checks failing${snapshot.checks.summary ? `: ${snapshot.checks.summary}` : ''}` };
  }
  if (snapshot.review.decision === 'changes_requested') {
    return { kind: 'blocked', failureType: 'pr_blocked', reason: `PR review changes requested${snapshot.review.summary ? `: ${snapshot.review.summary}` : ''}` };
  }

  const waiting = [
    snapshot.draft ? 'draft PR' : 'open PR',
    snapshot.checks.status === 'pending' ? 'checks pending' : null,
    snapshot.checks.status === 'unknown' ? 'checks unknown' : null,
    snapshot.review.decision === 'review_required' ? 'review required' : null,
    snapshot.review.decision === 'unknown' ? 'review unknown' : null,
  ].filter(Boolean).join(', ');
  return { kind: 'in_review', reason: waiting || 'PR open; waiting for checks/review/merge.' };
}

function moveToInReview(store: SchedulerStore, run: RunRow, options: { traceId?: string | null; evidenceStatus?: EvidenceStatus; now?: string }) {
  let current = store.getRun(run.id) ?? run;
  if (current.state === 'queued') {
    store.transitionRun(run.id, 'running', { actor: 'scheduler', traceId: options.traceId ?? undefined, now: options.now });
    current = store.getRun(run.id) ?? current;
  }
  if (current.state === 'running' || current.state === 'blocked') {
    store.transitionRun(run.id, 'in_review', {
      actor: 'scheduler',
      traceId: options.traceId ?? undefined,
      deliveryGateStatus: 'pending',
      evidenceStatus: options.evidenceStatus ?? 'pending',
      failureType: null,
      failureReason: null,
      now: options.now,
    });
  } else if (current.state === 'in_review') {
    store.transitionRun(run.id, 'in_review', {
      actor: 'scheduler',
      traceId: options.traceId ?? undefined,
      deliveryGateStatus: 'pending',
      evidenceStatus: options.evidenceStatus,
      failureType: null,
      failureReason: null,
      now: options.now,
    });
  }
}

function transitionToBlocked(store: SchedulerStore, run: RunRow, input: { failureType: string; reason: string; evidenceStatus?: EvidenceStatus; traceId?: string | null; now?: string }) {
  store.transitionRun(run.id, 'blocked', {
    actor: 'scheduler',
    traceId: input.traceId ?? undefined,
    deliveryGateStatus: 'blocked',
    evidenceStatus: input.evidenceStatus,
    failureType: input.failureType,
    failureReason: input.reason,
    now: input.now,
  });
}

function finalSummary(input: { run: RunRow; prUrl: string; result: string; checksSummary: string; reviewSummary: string; lifecycleSummary: string; downstreamTriggered: boolean; terminalKind: 'run_terminal_success' | 'run_terminal_non_success'; reason: string }): string {
  return [
    `PR URL: ${input.prUrl}`,
    `Legion task path: .legion/tasks/${input.run.task_id}`,
    `Result: ${input.result}`,
    `Verification / checks summary: ${input.checksSummary}; ${input.reviewSummary}`,
    `git-worktree-pr lifecycle summary: ${input.lifecycleSummary}`,
    `Downstream reconcile triggered: ${input.downstreamTriggered ? 'yes' : 'no'}`,
    `Terminal kind: ${input.terminalKind}`,
    `Reason: ${input.reason}`,
  ].join('\n');
}

function lifecycleSummary(verification?: EvidenceVerificationResult): string {
  if (!verification) {
    return 'not evaluated';
  }
  if (verification.ok) {
    return 'PR merged, checks/review complete, worktree cleanup complete, main refresh complete';
  }
  return [...verification.missing, ...verification.failures].join('; ') || verification.status;
}

export async function trackPrDelivery(store: SchedulerStore, client: GitHubPrClient, options: TrackingOptions): Promise<DeliveryTrackingOutcome> {
  const run = store.getRun(options.runId);
  if (!run) {
    throw new Error(`Run not found: ${options.runId}`);
  }
  const prUrl = options.prUrl ?? run.pr_url;
  if (!prUrl) {
    throw new Error(`Run ${run.id} does not have a PR URL.`);
  }
  const now = options.now ?? nowIso();
  const enqueuedOutboxIds: string[] = [];
  const snapshot = await client.fetchPullRequest(prUrl);
  const effectivePrUrl = snapshot.url || prUrl;

  if (isTerminalRunState(run.state)) {
    store.recordSchedulerEvent({
      runId: run.id,
      eventType: 'pr_delivery_ignored_terminal',
      actor: 'scheduler',
      payload: { prUrl: effectivePrUrl, runState: run.state, snapshot: snapshotSummary(snapshot) },
      traceId: options.traceId ?? null,
      linearIdentifier: run.linear_identifier,
      taskId: run.task_id,
      createdAt: now,
    });
    return {
      runId: run.id,
      prUrl: effectivePrUrl,
      runState: run.state,
      deliveryGateStatus: run.delivery_gate_status,
      evidenceStatus: run.evidence_status,
      terminalKind: run.state === 'done' ? 'run_terminal_success' : 'run_terminal_non_success',
      decision: 'ignored_terminal',
      reason: 'Run already terminal; PR snapshot recorded but no state transition applied.',
      enqueuedOutboxIds,
    };
  }

  store.updateRunMetadata(run.id, { prUrl: effectivePrUrl, now });
  store.recordSchedulerEvent({
    runId: run.id,
    eventType: 'pr_snapshot_observed',
    actor: 'scheduler',
    payload: snapshotSummary(snapshot),
    traceId: options.traceId ?? null,
    linearIdentifier: run.linear_identifier,
    taskId: run.task_id,
    createdAt: now,
  });
  enqueuedOutboxIds.push(enqueueExternalUrls(store, run, { prUrl: effectivePrUrl, traceId: options.traceId, now }));

  const decision = decidePrSnapshot(snapshot);
  if (decision.kind === 'in_review') {
    moveToInReview(store, run, { traceId: options.traceId, evidenceStatus: run.evidence_status === 'passed' ? 'passed' : 'pending', now });
    enqueuedOutboxIds.push(enqueueActivity(store, run, {
      key: `in-review:${outboxSuffix({ prUrl: effectivePrUrl, reason: decision.reason })}`,
      kind: 'action',
      message: `PR is in review: ${decision.reason}`,
      traceId: options.traceId,
      now,
    }));
    enqueuedOutboxIds.push(enqueuePlan(store, run, {
      key: 'in-review',
      steps: ['PR linked', 'wait for checks/review', 'verify Legion evidence', 'complete git-worktree-pr lifecycle', 'write final Linear summary'],
      traceId: options.traceId,
      now,
    }));
    enqueuedOutboxIds.push(enqueueIssueState(store, run, { key: 'in-review', schedulerState: 'in_review', suggestedState: 'In Review', traceId: options.traceId, now }));
    enqueuedOutboxIds.push(enqueueIssueLabels(store, run, { key: 'in-review', addLabels: ['agent:running'], removeLabels: ['agent:blocked', 'agent:needs-human'], traceId: options.traceId, now }));
    const latest = store.getRun(run.id) ?? run;
    return { runId: run.id, prUrl: effectivePrUrl, runState: latest.state, deliveryGateStatus: latest.delivery_gate_status, evidenceStatus: latest.evidence_status, terminalKind: null, decision: 'in_review', reason: decision.reason, enqueuedOutboxIds };
  }

  if (decision.kind === 'blocked') {
    transitionToBlocked(store, run, { failureType: decision.failureType ?? 'pr_blocked', reason: decision.reason, traceId: options.traceId, now });
    enqueuedOutboxIds.push(enqueueActivity(store, run, {
      key: `blocked:${outboxSuffix({ prUrl: effectivePrUrl, reason: decision.reason })}`,
      kind: 'elicitation',
      message: `PR delivery blocked: ${decision.reason}`,
      traceId: options.traceId,
      now,
    }));
    enqueuedOutboxIds.push(enqueueIssueState(store, run, { key: 'blocked', schedulerState: 'blocked', suggestedState: 'In Progress', traceId: options.traceId, now }));
    enqueuedOutboxIds.push(enqueueIssueLabels(store, run, { key: 'blocked', addLabels: ['agent:blocked', 'agent:needs-human'], removeLabels: ['agent:running'], traceId: options.traceId, now }));
    const latest = store.getRun(run.id) ?? run;
    return { runId: run.id, prUrl: effectivePrUrl, runState: latest.state, deliveryGateStatus: latest.delivery_gate_status, evidenceStatus: latest.evidence_status, terminalKind: null, decision: 'blocked', reason: decision.reason, enqueuedOutboxIds };
  }

  if (decision.kind === 'terminal_non_success') {
    const terminalState = decision.terminalState ?? 'failed';
    const summary = finalSummary({
      run,
      prUrl: effectivePrUrl,
      result: terminalState,
      checksSummary: snapshot.checks.summary ?? `checks ${snapshot.checks.status}`,
      reviewSummary: snapshot.review.summary ?? `review ${snapshot.review.decision}`,
      lifecycleSummary: 'not required for terminal non-success',
      downstreamTriggered: false,
      terminalKind: 'run_terminal_non_success',
      reason: decision.reason,
    });
    enqueuedOutboxIds.push(enqueueIssueState(store, run, { key: `non-success:${terminalState}`, schedulerState: terminalState, suggestedState: terminalState === 'cancelled' ? 'Canceled' : 'In Progress', traceId: options.traceId, now }));
    enqueuedOutboxIds.push(enqueueIssueLabels(store, run, { key: `non-success:${terminalState}`, addLabels: ['agent:blocked'], removeLabels: ['agent:running'], traceId: options.traceId, now }));
    enqueuedOutboxIds.push(enqueueComment(store, run, { key: `non-success:${terminalState}`, body: summary, traceId: options.traceId, now }));
    enqueuedOutboxIds.push(enqueueFinalResponse(store, run, { key: `non-success:${terminalState}`, terminalKind: 'run_terminal_non_success', result: terminalState, reason: decision.reason, summary, traceId: options.traceId, now }));
    store.transitionRun(run.id, terminalState, {
      actor: 'scheduler',
      traceId: options.traceId ?? undefined,
      deliveryGateStatus: 'failed',
      failureType: decision.failureType ?? 'pr_closed_unmerged',
      failureReason: decision.reason,
      now,
    });
    store.releaseLocksForRun(run.id, { actor: 'scheduler', reason: decision.failureType ?? 'run_terminal_non_success', traceId: options.traceId ?? undefined, now });
    const latest = store.getRun(run.id) ?? run;
    return { runId: run.id, prUrl: effectivePrUrl, runState: latest.state, deliveryGateStatus: latest.delivery_gate_status, evidenceStatus: latest.evidence_status, terminalKind: 'run_terminal_non_success', decision: 'terminal_non_success', reason: decision.reason, enqueuedOutboxIds };
  }

  const risk = riskForRun(store, run, options.risk);
  const verification = verifyLegionEvidence(evidenceResultBlock(run, effectivePrUrl), { repoPath: options.repoPath, runKind: run.run_kind, risk, prBacked: true });
  if (!verification.ok) {
    const reason = [...verification.missing, ...verification.failures].join('; ') || 'Legion evidence verification failed.';
    transitionToBlocked(store, run, { failureType: verification.failureType ?? 'legion_evidence_missing', reason, evidenceStatus: verification.status, traceId: options.traceId, now });
    enqueuedOutboxIds.push(enqueueActivity(store, run, {
      key: `blocked:${verification.failureType ?? 'evidence'}:${outboxSuffix(reason)}`,
      kind: 'error',
      message: `PR merged but delivery cannot be marked done: ${reason}`,
      traceId: options.traceId,
      now,
    }));
    enqueuedOutboxIds.push(enqueueIssueState(store, run, { key: `blocked:${verification.failureType ?? 'evidence'}`, schedulerState: 'blocked', suggestedState: 'In Progress', traceId: options.traceId, now }));
    enqueuedOutboxIds.push(enqueueIssueLabels(store, run, { key: `blocked:${verification.failureType ?? 'evidence'}`, addLabels: ['agent:blocked', 'agent:needs-human'], removeLabels: ['agent:running'], traceId: options.traceId, now }));
    const latest = store.getRun(run.id) ?? run;
    return { runId: run.id, prUrl: effectivePrUrl, runState: latest.state, deliveryGateStatus: latest.delivery_gate_status, evidenceStatus: latest.evidence_status, terminalKind: null, decision: 'blocked', reason, verification, enqueuedOutboxIds };
  }

  const summary = finalSummary({
    run,
    prUrl: effectivePrUrl,
    result: 'merged',
    checksSummary: snapshot.checks.summary ?? 'checks passed',
    reviewSummary: snapshot.review.summary ?? `review ${snapshot.review.decision}`,
    lifecycleSummary: lifecycleSummary(verification),
    downstreamTriggered: true,
    terminalKind: 'run_terminal_success',
    reason: decision.reason,
  });
  enqueuedOutboxIds.push(enqueueIssueState(store, run, { key: 'success', schedulerState: 'done', suggestedState: 'Done', traceId: options.traceId, now }));
  enqueuedOutboxIds.push(enqueueIssueLabels(store, run, { key: 'success', addLabels: ['agent:done'], removeLabels: ['agent:running', 'agent:blocked', 'agent:needs-human'], traceId: options.traceId, now }));
  enqueuedOutboxIds.push(enqueueComment(store, run, { key: 'success', body: summary, traceId: options.traceId, now }));
  enqueuedOutboxIds.push(enqueueFinalResponse(store, run, { key: 'success', terminalKind: 'run_terminal_success', result: 'done', reason: decision.reason, summary, traceId: options.traceId, now }));
  moveToInReview(store, run, { traceId: options.traceId, evidenceStatus: 'passed', now });
  store.transitionRun(run.id, 'done', {
    actor: 'scheduler',
    traceId: options.traceId ?? undefined,
    deliveryGateStatus: 'passed',
    evidenceStatus: 'passed',
    failureType: null,
    failureReason: null,
    now,
  });
  store.releaseLocksForRun(run.id, { actor: 'scheduler', reason: 'run_terminal_success', traceId: options.traceId ?? undefined, now });
  store.recordSchedulerEvent({
    runId: run.id,
    eventType: 'downstream_reconcile_requested',
    actor: 'scheduler',
    payload: { reason: 'run_terminal_success', prUrl: effectivePrUrl },
    traceId: options.traceId ?? null,
    linearIdentifier: run.linear_identifier,
    taskId: run.task_id,
    createdAt: now,
  });
  const latest = store.getRun(run.id) ?? run;
  return { runId: run.id, prUrl: effectivePrUrl, runState: latest.state, deliveryGateStatus: latest.delivery_gate_status, evidenceStatus: latest.evidence_status, terminalKind: 'run_terminal_success', decision: 'done', reason: decision.reason, verification, enqueuedOutboxIds };
}

export class StaticPullRequestClient implements GitHubPrClient {
  private readonly snapshot: PullRequestSnapshot;

  constructor(snapshot: PullRequestSnapshot) {
    this.snapshot = snapshot;
  }

  async fetchPullRequest(): Promise<PullRequestSnapshot> {
    return this.snapshot;
  }
}

export function parseGitHubPullRequestUrl(prUrl: string): { owner: string; repo: string; number: number } {
  const parsed = new URL(prUrl);
  const [, owner, repo, kind, numberText] = parsed.pathname.split('/');
  const number = Number(numberText);
  if (!owner || !repo || kind !== 'pull' || !Number.isInteger(number) || number <= 0) {
    throw new Error(`Unsupported GitHub PR URL: ${prUrl}`);
  }
  return { owner, repo, number };
}

interface GitHubRestClientOptions {
  token?: string;
  apiBaseUrl?: string;
}

async function githubJson(url: string, token?: string): Promise<unknown> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'linear-legion-scheduler',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
  }
  return await response.json();
}

function checksStatusFromRuns(value: unknown): PullRequestSnapshot['checks'] {
  const checkRuns = Array.isArray((value as { check_runs?: unknown[] }).check_runs) ? (value as { check_runs: Array<Record<string, unknown>> }).check_runs : [];
  if (checkRuns.length === 0) {
    return { status: 'unknown', summary: 'No check runs returned by GitHub.' };
  }
  const pending = checkRuns.filter((run) => run.status !== 'completed');
  const failing = checkRuns.filter((run) => run.status === 'completed' && !['success', 'neutral', 'skipped'].includes(String(run.conclusion)));
  if (failing.length > 0) {
    return { status: 'failure', summary: failing.map((run) => `${String(run.name ?? 'check')}:${String(run.conclusion)}`).join(', ') };
  }
  if (pending.length > 0) {
    return { status: 'pending', summary: pending.map((run) => `${String(run.name ?? 'check')}:${String(run.status)}`).join(', ') };
  }
  return { status: 'success', summary: `${checkRuns.length} check run(s) passed.` };
}

function reviewDecisionFromReviews(value: unknown): PullRequestSnapshot['review'] {
  const reviews = Array.isArray(value) ? value as Array<Record<string, unknown>> : [];
  if (reviews.length === 0) {
    return { decision: 'none', summary: 'No PR reviews returned by GitHub.' };
  }
  const latestByUser = new Map<string, Record<string, unknown>>();
  for (const review of reviews.sort((left, right) => String(left.submitted_at ?? '').localeCompare(String(right.submitted_at ?? '')))) {
    const user = (review.user as { login?: string } | undefined)?.login ?? String(review.id ?? latestByUser.size);
    latestByUser.set(user, review);
  }
  const latest = [...latestByUser.values()].filter((review) => review.state !== 'COMMENTED' && review.state !== 'DISMISSED');
  if (latest.some((review) => review.state === 'CHANGES_REQUESTED')) {
    return { decision: 'changes_requested', summary: 'Latest reviewer state includes CHANGES_REQUESTED.' };
  }
  if (latest.some((review) => review.state === 'APPROVED')) {
    return { decision: 'approved', summary: 'Latest reviewer state includes APPROVED.' };
  }
  return { decision: 'none', summary: 'No approval or changes-requested review state returned.' };
}

export function createGitHubRestPullRequestClient(options: GitHubRestClientOptions = {}): GitHubPrClient {
  const apiBaseUrl = (options.apiBaseUrl ?? 'https://api.github.com').replace(/\/$/, '');
  return {
    async fetchPullRequest(prUrl: string): Promise<PullRequestSnapshot> {
      const { owner, repo, number } = parseGitHubPullRequestUrl(prUrl);
      const encodedOwner = encodeURIComponent(owner);
      const encodedRepo = encodeURIComponent(repo);
      const pull = await githubJson(`${apiBaseUrl}/repos/${encodedOwner}/${encodedRepo}/pulls/${number}`, options.token) as Record<string, unknown>;
      const head = pull.head as { sha?: string } | undefined;
      const headSha = head?.sha ?? null;
      const checks = headSha
        ? checksStatusFromRuns(await githubJson(`${apiBaseUrl}/repos/${encodedOwner}/${encodedRepo}/commits/${encodeURIComponent(headSha)}/check-runs`, options.token))
        : { status: 'unknown' as const, summary: 'PR head SHA missing.' };
      const review = reviewDecisionFromReviews(await githubJson(`${apiBaseUrl}/repos/${encodedOwner}/${encodedRepo}/pulls/${number}/reviews`, options.token));
      const htmlUrl = String(pull.html_url ?? prUrl);
      const mergedAt = pull.merged_at ? String(pull.merged_at) : null;
      const state = String(pull.state) === 'closed' ? 'closed' : 'open';
      return {
        url: htmlUrl,
        state,
        draft: Boolean(pull.draft),
        merged: Boolean(mergedAt),
        mergedAt,
        closedAt: pull.closed_at ? String(pull.closed_at) : null,
        headSha,
        checks,
        review,
        closeReason: state === 'closed' && !mergedAt ? 'closed_unmerged' : null,
      };
    },
  };
}

export function pullRequestSnapshotFromFixture(value: unknown): PullRequestSnapshot {
  if (!value || typeof value !== 'object') {
    throw new Error('PR fixture must be an object.');
  }
  const snapshot = value as PullRequestSnapshot;
  if (typeof snapshot.url !== 'string' || !snapshot.url) {
    throw new Error('PR fixture requires url.');
  }
  if (snapshot.state !== 'open' && snapshot.state !== 'closed') {
    throw new Error('PR fixture state must be open or closed.');
  }
  if (!snapshot.checks || !['success', 'pending', 'failure', 'unknown'].includes(snapshot.checks.status)) {
    throw new Error('PR fixture checks.status is invalid.');
  }
  if (!snapshot.review || !['approved', 'changes_requested', 'review_required', 'none', 'unknown'].includes(snapshot.review.decision)) {
    throw new Error('PR fixture review.decision is invalid.');
  }
  return snapshot;
}

export function deliverySummaryForLog(outcome: DeliveryTrackingOutcome): string {
  return normalizeMessage(stableStringify({
    runId: outcome.runId,
    prUrl: outcome.prUrl,
    decision: outcome.decision,
    runState: outcome.runState,
    terminalKind: outcome.terminalKind,
    reason: outcome.reason,
  }));
}
