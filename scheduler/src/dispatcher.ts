import { isActiveRunState } from './state-machine.ts';
import type { RunRow, SchedulerStore, WorkItemSnapshotInput } from './sqlite-store.ts';
import { findResourceLockConflicts } from './resource-locks.ts';
import { scanLinearProject } from './scanner.ts';
import type { LinearProjectSnapshotInput, ReadyCandidate, ScannerConfig, ScannerReport, SkippedItem } from './scanner.ts';
import { stableHash } from './sqlite-store.ts';
import { scannerConfigWithProjectControls } from './admin.ts';

export interface DispatchLimits {
  globalConcurrency?: number;
  perProjectConcurrency?: number | Record<string, number>;
  perRepoConcurrency?: number | Record<string, number>;
}

export interface DispatchConfig extends ScannerConfig {
  limits?: DispatchLimits;
  ageBoostIntervalMs?: number;
  waitingVisibilityLabel?: string;
  branchSuffix?: string;
  lockTtlMs?: number;
  now?: string;
  traceId?: string;
}

export interface CapacitySnapshot {
  global: { active: number; limit: number | null };
  projects: Record<string, { active: number; limit: number | null }>;
  repos: Record<string, { active: number; limit: number | null }>;
}

export type DispatchWaitingReason = 'waiting_for_lock' | 'waiting_for_capacity' | 'waiting_for_blocker';

export interface DispatchWaitingItem {
  identifier: string;
  taskId: string;
  title: string;
  reason: DispatchWaitingReason;
  details: Record<string, unknown>;
  nativePreview: ReadyCandidate['nativePreview'] & {
    waitingReason: DispatchWaitingReason;
    activityMessage: string;
  };
}

export interface ClaimedDispatchItem {
  identifier: string;
  taskId: string;
  runId: string;
  attemptId: string;
  lockKeys: string[];
}

export interface DispatchPlan {
  report: ScannerReport;
  capacity: CapacitySnapshot;
  orderedReady: ReadyCandidate[];
  toClaim: ReadyCandidate[];
  waiting: DispatchWaitingItem[];
}

export interface DispatchOutcome extends DispatchPlan {
  claimed: ClaimedDispatchItem[];
  skipped: SkippedItem[];
  staleLocks: Array<{ lockKey: string; runId: string; expiresAt: string | null }>;
}

function nowIso(): string {
  return new Date().toISOString();
}

function effectiveLimit(limit: DispatchLimits['perProjectConcurrency'] | DispatchLimits['perRepoConcurrency'] | DispatchLimits['globalConcurrency'], key?: string): number | null {
  if (typeof limit === 'number') {
    return Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : null;
  }
  if (limit && key && typeof limit === 'object' && key in limit) {
    const value = Number((limit as Record<string, number>)[key]);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
  }
  return null;
}

function countActiveRuns(runs: RunRow[]) {
  const active = runs.filter((run) => isActiveRunState(run.state));
  const byProject = new Map<string, number>();
  const byRepo = new Map<string, number>();
  for (const run of active) {
    byProject.set(run.linear_project_id, (byProject.get(run.linear_project_id) ?? 0) + 1);
    byRepo.set(run.repo_key, (byRepo.get(run.repo_key) ?? 0) + 1);
  }
  return { active, byProject, byRepo };
}

function capacitySnapshot(runs: RunRow[], limits: DispatchLimits = {}): CapacitySnapshot {
  const active = countActiveRuns(runs);
  const projects: CapacitySnapshot['projects'] = {};
  const repos: CapacitySnapshot['repos'] = {};
  for (const [project, count] of active.byProject.entries()) {
    projects[project] = { active: count, limit: null };
  }
  for (const [repo, count] of active.byRepo.entries()) {
    repos[repo] = { active: count, limit: null };
  }
  return {
    global: { active: active.active.length, limit: effectiveLimit(limits.globalConcurrency) },
    projects,
    repos,
  };
}

function ageMs(candidate: ReadyCandidate, now: string): number {
  const reference = candidate.createdAt ?? candidate.linearUpdatedAt;
  const parsed = Date.parse(reference);
  if (Number.isNaN(parsed)) {
    return 0;
  }
  return Math.max(0, Date.parse(now) - parsed);
}

function effectivePriority(candidate: ReadyCandidate, now: string, boostIntervalMs: number): number {
  const base = candidate.priority > 0 ? candidate.priority : 5;
  const boost = Math.max(0, Math.floor(ageMs(candidate, now) / Math.max(boostIntervalMs, 1)));
  const starvationBoost = Math.max(0, Math.floor(candidate.downstreamCount / 2));
  return Math.max(1, base - boost - starvationBoost);
}

function sortCandidates(candidates: ReadyCandidate[], now: string, boostIntervalMs: number): ReadyCandidate[] {
  return [...candidates].sort((left, right) => {
    const leftPriority = effectivePriority(left, now, boostIntervalMs);
    const rightPriority = effectivePriority(right, now, boostIntervalMs);
    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }
    if (left.downstreamCount !== right.downstreamCount) {
      return right.downstreamCount - left.downstreamCount;
    }
    if (left.dependencyDepth !== right.dependencyDepth) {
      return right.dependencyDepth - left.dependencyDepth;
    }
    const leftAge = ageMs(left, now);
    const rightAge = ageMs(right, now);
    if (leftAge !== rightAge) {
      return rightAge - leftAge;
    }
    return left.identifier.localeCompare(right.identifier);
  });
}

function asSnapshot(candidate: ReadyCandidate): WorkItemSnapshotInput {
  return {
    linearIssueId: candidate.linearIssueId,
    linearIdentifier: candidate.identifier,
    linearProjectId: candidate.projectId,
    title: candidate.title,
    stateName: candidate.stateName,
    stateType: candidate.stateType,
    labels: candidate.labels,
    blockers: candidate.blockerIdentifiers,
    repoKey: candidate.repoKey,
    risk: candidate.risk,
    contractState: candidate.contractState,
    resourceHints: candidate.resourceHints,
    relations: { blockers: candidate.blockerIdentifiers },
    linearUpdatedAt: candidate.updatedAt,
    observedVersion: 1,
  };
}

function waitingPreview(candidate: ReadyCandidate, reason: DispatchWaitingReason, message: string): DispatchWaitingItem['nativePreview'] {
  return {
    ...candidate.nativePreview,
    waitingReason: reason,
    activityMessage: message,
  };
}

function blockerWaitingDetails(item: SkippedItem): Record<string, unknown> {
  return {
    skippedReason: item.reason,
    details: item.details,
  };
}

function waitingFromSkipped(item: SkippedItem): DispatchWaitingItem | null {
  const reason: DispatchWaitingReason | null = item.reason === 'dependency_blocked'
    ? 'waiting_for_blocker'
    : item.reason === 'resource_conflict'
      ? 'waiting_for_lock'
      : null;
  if (!reason) {
    return null;
  }
  const message = reason === 'waiting_for_lock'
    ? 'Waiting for resource lock from scanner conflict report.'
    : 'Waiting for blocker satisfaction from scanner dependency report.';
  return {
    identifier: item.identifier,
    taskId: item.taskId,
    title: item.title,
    reason,
    details: blockerWaitingDetails(item),
    nativePreview: {
      delegate: null,
      agentSession: 'create_or_find',
      agentSessionKey: `linear-issue:${item.identifier}:agent-session`,
      initialActivity: { kind: 'thought', message },
      externalUrls: [],
      waitingReason: reason,
      activityMessage: message,
    },
  };
}

function lockWaitingDetails(candidate: ReadyCandidate, conflicts: ReturnType<typeof findResourceLockConflicts>): Record<string, unknown> {
  return {
    lockKeys: candidate.locks,
    conflicts,
  };
}

function capacityWaitingDetails(scope: 'global' | 'project' | 'repo', limit: number | null, active: number, key?: string): Record<string, unknown> {
  return { scope, key: key ?? null, limit, active };
}

function buildWaitingItem(candidate: ReadyCandidate, reason: DispatchWaitingReason, details: Record<string, unknown>): DispatchWaitingItem {
  const message = reason === 'waiting_for_lock'
    ? `Waiting for resource lock: ${String(details.lockKeys?.[0] ?? 'unknown')}`
    : reason === 'waiting_for_capacity'
      ? `Waiting for scheduler capacity: ${String(details.scope ?? 'global')}`
      : `Waiting for blocker(s): ${String((details.details as Record<string, unknown> | undefined)?.blockers ? 'blockers' : 'dependency')}`;
  return {
    identifier: candidate.identifier,
    taskId: candidate.taskId,
    title: candidate.title,
    reason,
    details,
    nativePreview: waitingPreview(candidate, reason, message),
  };
}

export function planParallelDispatch(input: {
  report: ScannerReport;
  activeRuns: RunRow[];
  heldLocks: Array<{ lockKey: string; runId: string }>;
  limits?: DispatchLimits;
  now?: string;
  ageBoostIntervalMs?: number;
}): DispatchPlan {
  const now = input.now ?? input.report.observedAt ?? nowIso();
  const boostIntervalMs = input.ageBoostIntervalMs ?? 24 * 60 * 60 * 1000;
  const sorted = sortCandidates(input.report.ready, now, boostIntervalMs);
  const capacity = capacitySnapshot(input.activeRuns, input.limits);
  const waiting: DispatchWaitingItem[] = [];
  const toClaim: ReadyCandidate[] = [];
  const scheduledLocks = [...input.heldLocks];
  const usage = {
    global: capacity.global.active,
    projects: new Map<string, number>(Object.entries(capacity.projects).map(([project, entry]) => [project, entry.active])),
    repos: new Map<string, number>(Object.entries(capacity.repos).map(([repo, entry]) => [repo, entry.active])),
  };

  for (const candidate of sorted) {
    const globalLimit = effectiveLimit(input.limits?.globalConcurrency);
    if (globalLimit !== null && usage.global >= globalLimit) {
      waiting.push(buildWaitingItem(candidate, 'waiting_for_capacity', capacityWaitingDetails('global', globalLimit, usage.global)));
      continue;
    }

    const projectLimit = effectiveLimit(input.limits?.perProjectConcurrency, candidate.projectId);
    const projectCount = usage.projects.get(candidate.projectId) ?? 0;
    if (projectLimit !== null && projectCount >= projectLimit) {
      waiting.push(buildWaitingItem(candidate, 'waiting_for_capacity', capacityWaitingDetails('project', projectLimit, projectCount, candidate.projectId)));
      continue;
    }

    const repoLimit = effectiveLimit(input.limits?.perRepoConcurrency, candidate.repoKey);
    const repoCount = usage.repos.get(candidate.repoKey) ?? 0;
    if (repoLimit !== null && repoCount >= repoLimit) {
      waiting.push(buildWaitingItem(candidate, 'waiting_for_capacity', capacityWaitingDetails('repo', repoLimit, repoCount, candidate.repoKey)));
      continue;
    }

    const conflicts = findResourceLockConflicts(candidate.locks, scheduledLocks);
    if (conflicts.length > 0) {
      waiting.push(buildWaitingItem(candidate, 'waiting_for_lock', lockWaitingDetails(candidate, conflicts)));
      continue;
    }

    toClaim.push(candidate);
    usage.global += 1;
    usage.projects.set(candidate.projectId, projectCount + 1);
    usage.repos.set(candidate.repoKey, repoCount + 1);
    for (const lockKey of candidate.locks) {
      scheduledLocks.push({ lockKey, runId: `planned:${candidate.taskId}` });
    }
  }

  return {
    report: input.report,
    capacity,
    orderedReady: sorted,
    toClaim,
    waiting,
  };
}

export function dispatchParallelWorkItems(store: SchedulerStore, input: {
  project: LinearProjectSnapshotInput;
  config?: DispatchConfig;
}): DispatchOutcome {
  const now = input.config?.now ?? nowIso();
  const config = scannerConfigWithProjectControls(store, input.config);
  const report = scanLinearProject(input.project, { store, config });
  const staleLocks = store.listStaleHeldLocks({ now });
  for (const lock of staleLocks) {
    store.recordStaleLockDetection(lock, { now, traceId: input.config?.traceId });
  }

  const plan = planParallelDispatch({
    report,
    activeRuns: store.listRuns(),
    heldLocks: store.listHeldLocks(),
    limits: input.config?.limits,
    now,
    ageBoostIntervalMs: input.config?.ageBoostIntervalMs,
  });

  const skippedWaiting = report.skipped.map(waitingFromSkipped).filter((item): item is DispatchWaitingItem => Boolean(item));
  const waiting = [...plan.waiting, ...skippedWaiting];

  const claimed: ClaimedDispatchItem[] = [];
  const skipped = [...report.skipped];

  for (const waitingItem of waiting) {
    store.recordSchedulerEvent({
      runId: null,
      eventType: 'dispatch_waiting',
      actor: 'scheduler',
      payload: {
        identifier: waitingItem.identifier,
        taskId: waitingItem.taskId,
        reason: waitingItem.reason,
        details: waitingItem.details,
        nativePreview: waitingItem.nativePreview,
      },
      traceId: input.config?.traceId ?? null,
      linearIdentifier: waitingItem.identifier,
      taskId: waitingItem.taskId,
      createdAt: now,
    });
  }

  for (const candidate of plan.toClaim) {
    const claim = store.claimReadyWorkItem({
      readySnapshot: asSnapshot(candidate),
      currentSnapshot: asSnapshot(candidate),
      taskId: candidate.taskId,
      claimKey: `linear:${candidate.linearIssueId}:dispatch:${candidate.snapshotHash}`,
      branch: `legion/${candidate.taskId}-parallel-dispatch-locks`,
      worktreePath: `.worktrees/${candidate.taskId}`,
      lockKeys: candidate.locks,
      lockTtlMs: input.config?.lockTtlMs,
      nativeAgent: {
        delegateAppUserId: input.config?.delegateAppUserId ?? null,
        promptContextHash: stableHash({ taskId: candidate.taskId, snapshotHash: candidate.snapshotHash, parallelDispatch: true }),
      },
      traceId: input.config?.traceId,
      now,
    });

    if (!claim.ok) {
      const details = claim.reason === 'resource_conflict'
        ? { reason: claim.reason, conflicts: claim.lockConflicts }
        : { reason: claim.reason, existingRunId: 'existingRunId' in claim ? claim.existingRunId : null };
      store.recordSchedulerEvent({
        runId: null,
        eventType: 'dispatch_claim_skipped',
        actor: 'scheduler',
        payload: { identifier: candidate.identifier, taskId: candidate.taskId, reason: claim.reason, details },
        traceId: input.config?.traceId ?? null,
        linearIdentifier: candidate.identifier,
        taskId: candidate.taskId,
        createdAt: now,
      });
      skipped.push({
        identifier: candidate.identifier,
        taskId: candidate.taskId,
        title: candidate.title,
        reason: claim.reason,
        details,
        snapshotHash: candidate.snapshotHash,
        linearUpdatedAt: candidate.linearUpdatedAt,
      });
      continue;
    }

    claimed.push({
      identifier: candidate.identifier,
      taskId: candidate.taskId,
      runId: claim.runId,
      attemptId: claim.attemptId,
      lockKeys: claim.lockKeys,
    });
  }

  return {
    ...plan,
    waiting,
    claimed,
    skipped,
    staleLocks,
  };
}
