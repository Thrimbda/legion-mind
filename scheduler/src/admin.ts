import { SchedulerMetrics, structuredLog } from './observability.ts';
import type { MetricsSnapshot, SchedulerLogContext, StructuredLogEvent } from './observability.ts';
import { decideRetry } from './retry-policy.ts';
import type { RetryPolicyOptions } from './retry-policy.ts';
import type { ProjectControlRow, ProjectControlState, ResourceLockRow, RunRow, SchedulerStore } from './sqlite-store.ts';
import { isTerminalRunState } from './state-machine.ts';
import type { ScannerConfig } from './scanner.ts';

export type AdminAction = 'retry' | 'cancel' | 'release_lock' | 'pause_project' | 'resume_project' | 'security_block_project';

export interface AdminResult<T> {
  result: T;
  log: StructuredLogEvent;
  metrics: MetricsSnapshot;
}

export interface RunInspection {
  run: RunRow;
  attempts: ReturnType<SchedulerStore['listAttemptsForRun']>;
  locks: ResourceLockRow[];
  timeline: ReturnType<SchedulerStore['timelineForRun']>;
  outbox: ReturnType<SchedulerStore['outboxForRun']>;
  evaluatedSnapshot: ReturnType<SchedulerStore['evaluatedSnapshotForRun']>;
  terminal: {
    isTerminal: boolean;
    terminalKind: 'run_terminal_success' | 'run_terminal_non_success' | null;
    reason: string | null;
  };
  native: {
    agentSessionId: string | null;
    lastActivityId: string | null;
    lastActivityAt: string | null;
    nativeStopRequestedAt: string | null;
    nativeStateObserved: string | null;
  };
}

export interface ProjectHealth {
  projectId: string;
  control: ProjectControlRow | null;
  runs: RunRow[];
  activeRuns: RunRow[];
  locks: ResourceLockRow[];
  staleLocks: Array<{ lockKey: string; runId: string; expiresAt: string | null }>;
  pendingOutbox: number;
  recentSkipped: Array<{ event_type: string; linear_identifier: string | null; task_id: string | null; payload: unknown }>;
}

export interface SecurityValidationInput {
  projectId?: string | null;
  projectKey?: string | null;
  production?: boolean;
  linearAuthMode?: 'oauth_app' | 'app_actor' | 'client_credentials' | 'personal_api_key' | 'unknown';
  actorApp?: boolean;
  scopes?: string[];
  delegateEnabled?: boolean;
  mentionEnabled?: boolean;
  githubTokenScope?: 'single_repo' | 'selected_repos' | 'all_repos' | 'unknown';
  webhookSignatureConfigured?: boolean;
  workerHasSchedulerDbSuperuser?: boolean;
  reason?: string;
  traceId?: string | null;
}

export interface SecurityFinding {
  code: string;
  severity: 'info' | 'warning' | 'blocking';
  message: string;
}

export interface SecurityValidationResult {
  ok: boolean;
  findings: SecurityFinding[];
  control?: ProjectControlRow | null;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function requireReason(action: AdminAction, reason: string | null | undefined): string {
  const trimmed = reason?.trim() ?? '';
  if (!trimmed) {
    throw new Error(`${action} requires --reason <reason>.`);
  }
  return trimmed;
}

function metricsWith(name: string, labels: Record<string, string> = {}): SchedulerMetrics {
  const metrics = new SchedulerMetrics();
  metrics.increment(name, labels);
  return metrics;
}

function adminContext(run?: RunRow | null, extra: SchedulerLogContext = {}): SchedulerLogContext {
  return {
    traceId: extra.traceId,
    projectId: extra.projectId ?? run?.linear_project_id,
    linearIdentifier: extra.linearIdentifier ?? run?.linear_identifier,
    runId: extra.runId ?? run?.id,
    taskId: extra.taskId ?? run?.task_id,
    repoKey: extra.repoKey ?? run?.repo_key,
    prUrl: extra.prUrl ?? run?.pr_url,
    linearAgentSessionId: extra.linearAgentSessionId ?? run?.linear_agent_session_id,
  };
}

export function scannerConfigWithProjectControls(store: SchedulerStore, config: ScannerConfig = {}): ScannerConfig {
  const controls = store.listProjectControls(['paused', 'security_blocked']);
  return {
    ...config,
    pausedProjectIds: [...new Set([...(config.pausedProjectIds ?? []), ...controls.map((control) => control.project_id)])],
    projectControls: {
      ...(config.projectControls ?? {}),
      ...Object.fromEntries(controls.map((control) => [control.project_id, { state: control.state, reason: control.reason }])),
    },
  };
}

export function inspectRun(store: SchedulerStore, runId: string): RunInspection {
  const run = store.getRun(runId);
  if (!run) {
    throw new Error(`Run not found: ${runId}`);
  }
  const terminalKind = run.state === 'done'
    ? 'run_terminal_success'
    : isTerminalRunState(run.state)
      ? 'run_terminal_non_success'
      : null;
  return {
    run,
    attempts: store.listAttemptsForRun(runId),
    locks: store.listResourceLocks({ runId }),
    timeline: store.timelineForRun(runId),
    outbox: store.outboxForRun(runId),
    evaluatedSnapshot: store.evaluatedSnapshotForRun(runId),
    terminal: {
      isTerminal: terminalKind !== null,
      terminalKind,
      reason: run.failure_reason ?? (run.state === 'done' ? 'run_terminal_success' : null),
    },
    native: {
      agentSessionId: run.linear_agent_session_id,
      lastActivityId: run.last_agent_activity_id,
      lastActivityAt: run.last_agent_activity_at,
      nativeStopRequestedAt: run.native_stop_requested_at,
      nativeStateObserved: run.native_state_observed,
    },
  };
}

export function listRuns(store: SchedulerStore, projectId?: string | null): RunRow[] {
  return projectId ? store.listRuns().filter((run) => run.linear_project_id === projectId) : store.listRuns();
}

export function projectHealth(store: SchedulerStore, projectId: string, options: { now?: string } = {}): ProjectHealth {
  const runs = listRuns(store, projectId);
  const activeStates = new Set(['queued', 'running', 'in_review', 'blocked']);
  const runIds = new Set(runs.map((run) => run.id));
  return {
    projectId,
    control: store.getProjectControl(projectId),
    runs,
    activeRuns: runs.filter((run) => activeStates.has(run.state)),
    locks: store.listResourceLocks().filter((lock) => runIds.has(lock.run_id)),
    staleLocks: store.listStaleHeldLocks({ now: options.now }),
    pendingOutbox: store.pendingOutbox().filter((row) => !row.run_id || runIds.has(row.run_id)).length,
    recentSkipped: store.listSchedulerEvents()
      .filter((event) => event.event_type === 'skipped' || event.event_type === 'dispatch_waiting')
      .slice(-20)
      .map((event) => ({ event_type: event.event_type, linear_identifier: event.linear_identifier, task_id: event.task_id, payload: event.payload })),
  };
}

function setProjectControl(store: SchedulerStore, input: { projectId: string; projectKey?: string | null; state: ProjectControlState; reason: string; source: string; traceId?: string | null; now?: string }): ProjectControlRow {
  return store.setProjectControl({
    projectId: input.projectId,
    projectKey: input.projectKey ?? null,
    state: input.state,
    reason: input.reason,
    actor: 'admin',
    source: input.source,
    traceId: input.traceId ?? null,
    now: input.now,
  });
}

export function pauseProject(store: SchedulerStore, input: { projectId: string; projectKey?: string | null; reason: string; traceId?: string | null; now?: string }): AdminResult<ProjectControlRow> {
  const reason = requireReason('pause_project', input.reason);
  const control = setProjectControl(store, { ...input, reason, state: 'paused', source: 'admin_cli_pause' });
  const metrics = metricsWith('security.project_paused', { state: control.state });
  return { result: control, log: structuredLog('project_paused', { traceId: input.traceId, projectId: input.projectId, projectKey: input.projectKey }, { reason }), metrics: metrics.snapshot() };
}

export function resumeProject(store: SchedulerStore, input: { projectId: string; projectKey?: string | null; reason: string; traceId?: string | null; now?: string }): AdminResult<ProjectControlRow> {
  const reason = requireReason('resume_project', input.reason);
  const control = setProjectControl(store, { ...input, reason, state: 'active', source: 'admin_cli_resume' });
  const metrics = metricsWith('security.project_resumed');
  return { result: control, log: structuredLog('project_resumed', { traceId: input.traceId, projectId: input.projectId, projectKey: input.projectKey }, { reason }), metrics: metrics.snapshot() };
}

export function retryRun(store: SchedulerStore, input: { runId: string; reason: string; failureType?: string; retryPolicy?: RetryPolicyOptions; traceId?: string | null; now?: string }): AdminResult<{ attemptId: string; attemptNumber: number; outboxId: string }> {
  const reason = requireReason('retry', input.reason);
  const run = store.getRun(input.runId);
  if (!run) throw new Error(`Run not found: ${input.runId}`);
  if (isTerminalRunState(run.state)) throw new Error(`Cannot retry terminal run ${input.runId}.`);
  const latest = store.latestAttemptForRun(run.id);
  const failureType = input.failureType ?? run.failure_type ?? 'agent_failed';
  const decision = decideRetry({ failureType, attemptNumber: latest?.attempt_number ?? 1, scopeRepairable: true, now: input.now, ...input.retryPolicy });
  if (!decision.retry) throw new Error(`Retry denied: ${decision.reason}`);
  store.recordSchedulerEvent({
    runId: run.id,
    eventType: 'admin_retry_requested',
    actor: 'admin',
    payload: { reason, failureType, decision },
    traceId: input.traceId,
    linearIdentifier: run.linear_identifier,
    taskId: run.task_id,
    createdAt: input.now,
  });
  const retry = store.createRetryAttempt(run.id, { failureType, failureReason: reason, notBefore: decision.notBefore, traceId: input.traceId, now: input.now });
  const metrics = metricsWith('run.retried', { failure_type: failureType });
  return { result: retry, log: structuredLog('admin_retry_requested', adminContext(run, { traceId: input.traceId }), { reason, failureType, retry }), metrics: metrics.snapshot() };
}

export function cancelRun(store: SchedulerStore, input: { runId: string; reason: string; traceId?: string | null; now?: string }): AdminResult<RunRow> {
  const reason = requireReason('cancel', input.reason);
  const run = store.getRun(input.runId);
  if (!run) throw new Error(`Run not found: ${input.runId}`);
  if (isTerminalRunState(run.state)) throw new Error(`Cannot cancel terminal run ${input.runId}.`);
  store.recordSchedulerEvent({ runId: run.id, eventType: 'admin_cancel_requested', actor: 'admin', payload: { reason }, traceId: input.traceId, linearIdentifier: run.linear_identifier, taskId: run.task_id, createdAt: input.now });
  store.transitionRun(run.id, 'cancelled', { actor: 'admin', traceId: input.traceId ?? undefined, failureType: 'admin_cancelled', failureReason: reason, now: input.now });
  store.releaseLocksForRun(run.id, { actor: 'admin', reason: `admin_cancelled: ${reason}`, traceId: input.traceId ?? undefined, now: input.now });
  store.enqueueOutbox({
    outboxKind: 'native_agent',
    runId: run.id,
    attemptId: null,
    idempotencyKey: `run:${run.id}:admin-cancel:final-response`,
    sideEffect: 'final_response',
    payload: { reason, result: 'cancelled', terminalKind: 'run_terminal_non_success', traceId: input.traceId ?? null },
    now: input.now,
  });
  const latest = store.getRun(run.id) ?? run;
  const metrics = metricsWith('run.cancelled', { source: 'admin' });
  return { result: latest, log: structuredLog('admin_cancelled', adminContext(latest, { traceId: input.traceId }), { reason }), metrics: metrics.snapshot() };
}

export function releaseLock(store: SchedulerStore, input: { lockKey: string; runId: string; reason: string; traceId?: string | null; now?: string }): AdminResult<ResourceLockRow | null> {
  const reason = requireReason('release_lock', input.reason);
  const run = store.getRun(input.runId);
  if (!run) throw new Error(`Run not found: ${input.runId}`);
  store.recordSchedulerEvent({ runId: run.id, eventType: 'admin_lock_release_requested', actor: 'admin', payload: { lockKey: input.lockKey, reason }, traceId: input.traceId, linearIdentifier: run.linear_identifier, taskId: run.task_id, createdAt: input.now });
  store.releaseLockForRun(input.runId, input.lockKey, { actor: 'admin', reason, traceId: input.traceId ?? undefined, now: input.now });
  const latest = store.listResourceLocks({ runId: input.runId }).find((lock) => lock.lock_key === input.lockKey) ?? null;
  const metrics = metricsWith('lock.released', { source: 'admin' });
  return { result: latest, log: structuredLog('admin_lock_released', adminContext(run, { traceId: input.traceId }), { lockKey: input.lockKey, reason }), metrics: metrics.snapshot() };
}

function hasScope(scopes: string[] | undefined, scope: string): boolean {
  return (scopes ?? []).includes(scope);
}

export function validateSecurityConfig(store: SchedulerStore, input: SecurityValidationInput): SecurityValidationResult {
  const findings: SecurityFinding[] = [];
  const production = input.production !== false;
  if (production && (input.linearAuthMode === 'personal_api_key' || input.linearAuthMode === 'unknown' || !input.linearAuthMode)) {
    findings.push({ code: 'linear_auth_not_app_actor', severity: 'blocking', message: 'Production Linear auth must prefer OAuth app actor / client credentials, not a personal API key.' });
  }
  if (production && input.actorApp === false) {
    findings.push({ code: 'linear_actor_not_app', severity: 'blocking', message: 'Production scheduler writeback should use actor=app where supported.' });
  }
  if (input.delegateEnabled && !hasScope(input.scopes, 'app:assignable')) {
    findings.push({ code: 'delegate_scope_missing', severity: 'blocking', message: 'Delegate behavior requires app:assignable scope.' });
  }
  if (input.mentionEnabled && !hasScope(input.scopes, 'app:mentionable')) {
    findings.push({ code: 'mention_scope_missing', severity: 'blocking', message: 'Mention-driven native sessions require app:mentionable scope.' });
  }
  if (production && (input.githubTokenScope === 'all_repos' || input.githubTokenScope === 'unknown' || !input.githubTokenScope)) {
    findings.push({ code: 'github_scope_too_broad', severity: 'blocking', message: 'GitHub token must be restricted to required repo(s).' });
  }
  if (input.webhookSignatureConfigured === false) {
    findings.push({ code: 'webhook_signature_missing', severity: 'blocking', message: 'Linear webhook signature verification must be configured.' });
  }
  if (input.workerHasSchedulerDbSuperuser === true) {
    findings.push({ code: 'worker_db_superuser', severity: 'blocking', message: 'Worker must not receive scheduler DB superuser credentials.' });
  }
  findings.push({ code: 'delegate_not_assignee', severity: 'info', message: 'Issue.delegate must not replace human assignee ownership.' });

  const blocking = findings.filter((finding) => finding.severity === 'blocking');
  let control: ProjectControlRow | null | undefined;
  if (blocking.length > 0 && input.projectId) {
    control = store.setProjectControl({
      projectId: input.projectId,
      projectKey: input.projectKey ?? null,
      state: 'security_blocked',
      reason: input.reason ?? `Security validation failed: ${blocking.map((finding) => finding.code).join(', ')}`,
      actor: 'admin',
      source: 'security_validation',
      traceId: input.traceId ?? null,
    });
  }
  store.recordSchedulerEvent({
    eventType: blocking.length > 0 ? 'security_scope_validation_failed' : 'security_scope_validation_passed',
    actor: 'admin',
    payload: { findings, projectId: input.projectId ?? null },
    traceId: input.traceId,
    linearIdentifier: null,
    taskId: null,
  });

  return { ok: blocking.length === 0, findings, control };
}

export function handlePermissionChange(store: SchedulerStore, input: { projectId?: string | null; projectKey?: string | null; teamId?: string | null; reason?: string; traceId?: string | null; now?: string }): SecurityValidationResult {
  const reason = input.reason ?? `PermissionChange/app access changed${input.teamId ? ` for team ${input.teamId}` : ''}. Scope revalidation required.`;
  const findings: SecurityFinding[] = [{ code: 'permission_change', severity: 'blocking', message: reason }];
  let control: ProjectControlRow | null | undefined;
  if (input.projectId) {
    control = store.setProjectControl({ projectId: input.projectId, projectKey: input.projectKey ?? null, state: 'security_blocked', reason, actor: 'webhook', source: 'permission_change', traceId: input.traceId ?? null, now: input.now });
  }
  store.recordSchedulerEvent({ eventType: 'permission_change_security_block', actor: 'webhook', payload: { projectId: input.projectId ?? null, projectKey: input.projectKey ?? null, teamId: input.teamId ?? null, reason }, traceId: input.traceId, createdAt: input.now });
  return { ok: false, findings, control };
}
