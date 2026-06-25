import { decideRetry } from './retry-policy.ts';
import type { RetryPolicyOptions } from './retry-policy.ts';
import type { RunAttemptRow, RunRow, SchedulerStore } from './sqlite-store.ts';
import { isTerminalRunState } from './state-machine.ts';

export interface WorkerLivenessProbe {
  isWorkerAlive(input: { run: RunRow; attempt: RunAttemptRow | null }): Promise<boolean> | boolean;
}

export interface StaleRecoveryOptions extends RetryPolicyOptions {
  staleAfterMs: number;
  now?: string;
  traceId?: string | null;
  failureType?: string;
  scopeRepairable?: boolean;
  livenessProbe?: WorkerLivenessProbe;
}

export interface StaleRecoveryItem {
  runId: string;
  action: 'worker_alive' | 'retry_scheduled' | 'retry_pending' | 'terminal_failed';
  reason: string;
  attemptId?: string;
  notBefore?: string;
}

export interface StaleRecoveryResult {
  staleRuns: number;
  recovered: StaleRecoveryItem[];
}

const conservativeProbe: WorkerLivenessProbe = {
  isWorkerAlive() {
    return true;
  },
};

function nowIso(): string {
  return new Date().toISOString();
}

function activeRetryPending(attempt: RunAttemptRow | null): boolean {
  return Boolean(attempt && attempt.attempt_number > 1 && attempt.started_at === null && attempt.ended_at === null);
}

export async function recoverStaleRuns(store: SchedulerStore, options: StaleRecoveryOptions): Promise<StaleRecoveryResult> {
  const now = options.now ?? nowIso();
  const probe = options.livenessProbe ?? conservativeProbe;
  const failureType = options.failureType ?? 'worker_infra_crash';
  const staleRuns = store.listStaleActiveRuns({ staleAfterMs: options.staleAfterMs, now });
  const recovered: StaleRecoveryItem[] = [];

  for (const run of staleRuns) {
    const attempt = store.latestAttemptForRun(run.id);
    store.recordSchedulerEvent({
      runId: run.id,
      eventType: 'stale_run_detected',
      actor: 'scheduler',
      payload: { heartbeatAt: run.heartbeat_at, staleAfterMs: options.staleAfterMs, latestAttemptId: attempt?.id ?? null },
      traceId: options.traceId ?? null,
      linearIdentifier: run.linear_identifier,
      taskId: run.task_id,
      createdAt: now,
    });

    if (activeRetryPending(attempt)) {
      store.recordSchedulerEvent({
        runId: run.id,
        eventType: 'stale_run_retry_already_pending',
        actor: 'scheduler',
        payload: { attemptId: attempt?.id, attemptNumber: attempt?.attempt_number },
        traceId: options.traceId ?? null,
        linearIdentifier: run.linear_identifier,
        taskId: run.task_id,
        createdAt: now,
      });
      recovered.push({ runId: run.id, action: 'retry_pending', reason: 'Retry attempt already exists and has not started.', attemptId: attempt?.id });
      continue;
    }

    const alive = await probe.isWorkerAlive({ run, attempt });
    if (alive) {
      store.recordSchedulerEvent({
        runId: run.id,
        eventType: 'stale_run_worker_alive',
        actor: 'scheduler',
        payload: { action: 'inspection_only_no_retry_no_release', latestAttemptId: attempt?.id ?? null },
        traceId: options.traceId ?? null,
        linearIdentifier: run.linear_identifier,
        taskId: run.task_id,
        createdAt: now,
      });
      recovered.push({ runId: run.id, action: 'worker_alive', reason: 'Worker liveness probe reported alive.' });
      continue;
    }

    const attemptNumber = attempt?.attempt_number ?? 1;
    const decision = decideRetry({
      failureType,
      attemptNumber,
      scopeRepairable: options.scopeRepairable,
      maxAttempts: options.maxAttempts,
      baseDelayMs: options.baseDelayMs,
      maxDelayMs: options.maxDelayMs,
      now,
    });

    if (decision.retry) {
      if (run.state !== 'blocked') {
        store.transitionRun(run.id, 'blocked', {
          actor: 'scheduler',
          traceId: options.traceId ?? undefined,
          failureType,
          failureReason: `${decision.reason} Worker confirmed dead during stale recovery.`,
          now,
        });
      }
      const retry = store.createRetryAttempt(run.id, {
        failureType,
        failureReason: `${decision.reason} Worker confirmed dead during stale recovery.`,
        notBefore: decision.notBefore,
        traceId: options.traceId,
        now,
      });
      store.recordSchedulerEvent({
        runId: run.id,
        eventType: 'stale_run_retry_scheduled',
        actor: 'scheduler',
        payload: { attemptId: retry.attemptId, attemptNumber: retry.attemptNumber, notBefore: decision.notBefore, failureType },
        traceId: options.traceId ?? null,
        linearIdentifier: run.linear_identifier,
        taskId: run.task_id,
        createdAt: now,
      });
      recovered.push({ runId: run.id, action: 'retry_scheduled', reason: decision.reason, attemptId: retry.attemptId, notBefore: decision.notBefore });
      continue;
    }

    if (!isTerminalRunState((store.getRun(run.id) ?? run).state)) {
      store.transitionRun(run.id, 'failed', {
        actor: 'scheduler',
        traceId: options.traceId ?? undefined,
        failureType,
        failureReason: `Stale worker confirmed dead; ${decision.reason}`,
        now,
      });
    }
    store.releaseLocksForRun(run.id, {
      actor: 'scheduler',
      reason: 'stale_worker_confirmed_dead_retry_exhausted',
      confirmedDeadWorker: true,
      traceId: options.traceId ?? undefined,
      now,
    });
    recovered.push({ runId: run.id, action: 'terminal_failed', reason: decision.reason });
  }

  return { staleRuns: staleRuns.length, recovered };
}
