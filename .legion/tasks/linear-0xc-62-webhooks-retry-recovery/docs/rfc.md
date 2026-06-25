# RFC: WI-07 webhooks, retries, and stale recovery

> **Profile**: RFC Heavy
> **Status**: Draft for `review-rfc`
> **Task**: `.legion/tasks/linear-0xc-62-webhooks-retry-recovery`
> **Linear**: `0XC-62`
> **Created**: 2026-06-25

## Executive summary

WI-07 adds the scheduler reliability layer around the existing Linear scanner, SQLite run state, worker runner, PR tracker and parallel dispatcher. The design keeps one invariant central: webhook and stale-recovery signals may wake the scheduler, but they must not become a second scheduler truth. All decisions still pass through persisted run state, active-run uniqueness, resource locks, outbox idempotency and PR/evidence gates.

The recommended implementation is a zero-dependency, framework-neutral webhook ingestion module plus retry/recovery modules:

- `webhook.ts` verifies Linear signatures over raw bytes, rejects stale timestamps, persists dedupe records and routes events to scheduler/native outbox or native stop handling.
- `retry-policy.ts` defines failure taxonomy, retry class, bounded attempts and backoff.
- `recovery.ts` detects stale active runs, checks worker liveness before taking action, schedules retries safely, and only releases locks under terminal/dead-worker/admin conditions.
- `sqlite-store.ts` is extended with explicit helpers for webhook dedupe outcomes, scheduler outbox, retry attempts, stale runs and safe lock release.

## Goals

1. Add Linear webhook ingestion with raw-body signature verification and timestamp replay protection.
2. Persist and dedupe webhook events before routing side effects.
3. Route Issue / AgentSessionEvent / PermissionChange events to reconcile or native outbox; never directly claim WI or launch workers from the HTTP handler.
4. Implement failure taxonomy and retry policy for retryable, conditionally retryable, non-retryable and control-signal failures.
5. Detect stale heartbeat / stale attempts and recover without duplicate active workers.
6. Implement native stop/cancel recovery as terminal non-success that does not satisfy downstream blockers by default.
7. Harden resource lock release so TTL expiry alone cannot release locks.

## Non-goals

- Do not make webhook the only scheduling source.
- Do not implement a production incident dashboard.
- Do not add Express, Fastify, Temporal, BullMQ, or a new workflow engine.
- Do not implement new non-OpenCode worker runtimes.
- Do not bypass PR checks, human review, `git-worktree-pr`, or Legion evidence verification.
- Do not implement complete Linear Native Agent production adapter semantics; this WI creates durable outbox rows and state transitions that future adapter work can consume.

## Current state

- `scanner.ts` can produce ready/skipped reports from Linear project snapshots and refuses blocked, unstable, paused or conflicting WI.
- `sqlite-store.ts` persists runs, attempts, snapshots, locks, events, webhook rows and native outbox rows.
- `dispatcher.ts` claims parallel non-conflicting WIs and records stale lock detections as inspection-only.
- `worker-runner.ts` launches OpenCode, records heartbeat and handles native stop during dispatch, but launch failures currently become terminal failure immediately.
- `pr-tracker.ts` already tracks PR terminal states and only marks `done` after PR + evidence + lifecycle gates.

## External API facts used

- Linear webhook signature verification must use raw request body bytes and the `linear-signature` header with HMAC SHA-256.
- Linear payload includes `webhookTimestamp`; docs recommend rejecting events outside a 60-second window.
- AgentSessionEvent webhooks include documented `created` and `prompted` actions. Session webhooks must respond within 5 seconds, and a `created` event should result in activity or external URL update within 10 seconds to avoid unresponsive UI.
- Permission changes can arrive as `PermissionChange` with `teamAccessChanged` and team access arrays.

## Design principles

1. **Verify before parse-driven behavior**: parse only enough to read timestamp after raw signature verification has access to the original bytes. Never verify reserialized JSON.
2. **Persist before side effects**: insert webhook dedupe record before enqueueing reconcile/native actions.
3. **Webhook is a trigger, not truth**: issue state, blockers, labels and current run truth are fetched or reconciled separately.
4. **One active run remains the hard duplicate guard**: retries reuse the same run and task id; no stale recovery path creates a second active run for the same issue/task.
5. **Stop/cancel is terminal non-success**: it releases runtime activity only after cleanup but does not satisfy downstream blockers.
6. **TTL is an alarm, not authorization**: stale lock/run TTL only starts liveness investigation.

## Proposed modules

### `scheduler/src/webhook.ts`

#### Public types

```ts
type LinearWebhookAction =
  | 'created'
  | 'updated'
  | 'removed'
  | 'prompted'
  | 'stopped'
  | 'delegated'
  | 'teamAccessChanged'
  | string;

interface LinearWebhookEnvelope {
  type: string;
  action: LinearWebhookAction;
  webhookId?: string;
  webhookTimestamp?: number;
  organizationId?: string;
  projectId?: string;
  agentSession?: { id?: string; issue?: { id?: string; identifier?: string; project?: { id?: string } } };
}
```

#### Signature verification

- `verifyLinearWebhookSignature({ rawBody, signatureHeader, secret })` computes `HMAC-SHA256(secret, rawBody)` and compares to `linear-signature` using `timingSafeEqual`.
- Verification fails closed when secret/header is missing, hex decode fails or signature lengths differ.
- `parseLinearWebhookBody(rawBody)` returns the parsed envelope and timestamp.
- `validateWebhookTimestamp(timestamp, { now, toleranceMs: 60_000 })` rejects old/future replay candidates.

#### Dedupe key

Use a layered key:

1. payload `webhookId` when present;
2. delivery header when present;
3. fallback `sha256(rawBody)` as `signatureHash` / payload hash.

`SchedulerStore.recordWebhookEvent()` should return `{ id, duplicate }` instead of only an id. Duplicate events are acknowledged and recorded as no-op routing results.

#### Routing

| Payload type/action | Store behavior | Must not do |
|---|---|---|
| `Issue` / project-level updates | enqueue scheduler outbox `reconcile_project` with project id / issue id / webhook id | claim WI or launch worker |
| `AgentSessionEvent:created` | enqueue `reconcile_project` and a native/session urgency event; if an existing run/session mapping exists, enqueue native activity/external URL refresh | start OpenCode directly |
| `AgentSessionEvent:prompted` | enqueue `reconcile_project` or native prompt handling outbox; preserve prompt payload in sanitized form | mutate run truth without DB checks |
| `AgentSessionEvent:delegated` | enqueue reconcile; current truth decides whether WI is ready | claim directly |
| `AgentSessionEvent:stopped` | if `agentSession.id` maps to an active run, call `requestNativeStop()`; otherwise enqueue reconcile and record unmatched stop event | satisfy blockers |
| `PermissionChange` | enqueue permission-change reconcile / pause-check outbox for affected teams | assume credentials are still valid |

#### HTTP handler

Expose a thin Node `http` handler for debug/local use:

- only accepts `POST`;
- buffers raw bytes up to configurable max size;
- verifies signature and timestamp;
- calls `ingestLinearWebhook()`;
- returns `200` for accepted duplicates/new events, `401` for signature/timestamp failures, `400` for malformed JSON, `500` for store errors.

This keeps production adapters free to reuse the pure ingestion function.

### `scheduler/src/retry-policy.ts`

#### Failure taxonomy

| Class | Failure types | Default retry |
|---|---|---|
| retryable | `linear_api_5xx`, `github_api_transient`, `worker_infra_crash`, `network_timeout`, `worker_timeout`, `agent_failed` | yes, bounded |
| conditionally retryable | `verification_failed`, `merge_conflict`, `checks_failure`, `pr_blocked` | yes only when `scopeRepairable=true` |
| non-retryable | `contract_missing`, `needs_human`, `security_blocked`, `dependency_cycle`, `permission_denied`, `result_identity_mismatch`, `unknown_result` | no |
| control signal | `native_stop_requested`, `admin_cancelled`, `worker_cancelled` | no automatic retry |

#### Retry decision

`decideRetry({ failureType, attemptNumber, maxAttempts, scopeRepairable, now })` returns:

```ts
{
  retry: boolean;
  classification: 'retryable' | 'conditionally_retryable' | 'non_retryable' | 'control_signal';
  reason: string;
  nextAttemptNumber?: number;
  notBefore?: string;
  backoffMs?: number;
}
```

Backoff uses capped exponential delay with jitter disabled by default for deterministic tests:

```text
backoff = min(baseDelayMs * 2 ** (attemptNumber - 1), maxDelayMs)
```

Default prototype policy: `maxAttempts=3`, `baseDelayMs=1_000`, `maxDelayMs=60_000`.

### `scheduler/src/recovery.ts`

#### Stale run detection

`listStaleActiveRuns({ staleAfterMs, now })` selects active runs whose `heartbeat_at` is older than the cutoff. Detection records `stale_run_detected` and does not alter locks by itself.

#### Worker liveness probe

```ts
interface WorkerLivenessProbe {
  isWorkerAlive(input: { run: RunRow; attempt: RunAttemptRow | null }): Promise<boolean> | boolean;
}
```

The default local probe can be conservative and return `true` unless a test or future runtime provides proof. Recovery actions requiring dead-worker proof must pass a probe.

#### Recovery action matrix

| Condition | Action |
|---|---|
| stale but worker alive | record `stale_run_worker_alive`; heartbeat remains stale; no retry/no release |
| stale and worker dead, retry budget available | create next attempt, enqueue worker dispatch with `notBefore`, keep same run/task/locks active |
| stale and worker dead, retry budget exhausted | transition to `failed` with retry exhaustion, release locks because run is terminal and worker is confirmed dead |
| native stop requested | mark/carry `cancelled`, enqueue final response, release locks after terminal cleanup, downstream remains unsatisfied |
| admin release | release locks only with audit reason and actor `admin` |

### `sqlite-store.ts` extensions

Add methods rather than leaking raw SQL to modules:

- `recordWebhookEvent(...) => { id: string; duplicate: boolean }`.
- `enqueueSchedulerOutbox({ sideEffect: 'reconcile_project' | 'permission_change' | 'retry_worker', ... })` using `outboxKind: 'scheduler'`.
- `findRunByAgentSessionId(agentSessionId)`.
- `listAttemptsForRun(runId)` and `latestAttemptForRun(runId)`.
- `createRetryAttempt(runId, options)` that creates a new `run_attempts` row and enqueues `dispatch_worker` with retry metadata.
- `listStaleActiveRuns({ staleAfterMs, now })`.
- `releaseLocksForRun(runId, { reason, confirmedDeadWorker?, adminOverride?, actor })` hardened so non-terminal release throws unless confirmed-dead-worker or admin override is supplied.

Schema migration should remain additive where possible:

- extend `native_outbox.outbox_kind` check to include `scheduler`;
- extend `side_effect` check to include `reconcile_project`, `permission_change`, `retry_worker` if needed;
- keep existing tables and indexes.

## State transitions

### Retryable worker failure

```text
worker launch timeout/crash
  -> mark attempt finished
  -> classify failure
  -> if retry budget remains:
       state blocked, failure_type=<type>, failure_reason includes retry notBefore
       create next attempt
       enqueue worker_dispatch retry row with notBefore
       locks remain held, active run remains unique
     else:
       state failed terminal non-success
       release locks after terminal failure
```

### Native stop

```text
AgentSessionEvent stopped
  -> verify/dedupe/persist webhook
  -> find run by agentSessionId
  -> requestNativeStop(run)
  -> state cancelled, failure_type native_stop_requested
  -> enqueue final_response
  -> release locks only after terminal cleanup
  -> isBlockerSatisfiedByRun remains false unless admin_override exists
```

### Stale recovery

```text
heartbeat older than threshold
  -> record stale_run_detected
  -> liveness probe
     alive: record worker_alive; no release/no retry
     dead: classify last failure/stale_worker
       retry available: create retry attempt and dispatch outbox; no duplicate run
       retry exhausted: terminal failed; safe lock release
```

## Alternatives

### A. Express / SDK-first webhook endpoint

Rejected because the scheduler prototype currently has zero runtime dependencies. A framework-neutral raw handler is easier to test and can still be wrapped later.

### B. Direct worker launch from AgentSessionEvent `created`

Rejected because it bypasses scanner/reconcile, active-run uniqueness, blockers and resource locks. `created` can create urgency but not ownership of scheduler truth.

### C. Release locks when TTL expires

Rejected because it can start a second worker while the first is still alive. TTL must only trigger liveness investigation.

### D. Terminal failure for every worker launch failure

Rejected because it prevents bounded recovery from transient infra errors. Use `blocked` + retry outbox while budget remains, terminal `failed` only after exhaustion or non-retryable classification.

## Rollback plan

1. Stop using the webhook HTTP command/handler; periodic/manual reconcile remains intact.
2. Revert `webhook.ts`, `retry-policy.ts`, `recovery.ts` and store extensions if the feature is abandoned.
3. Existing run/attempt/lock/PR tracking tables remain compatible; scheduler outbox rows can be ignored or deleted in local dev DBs.
4. For any run affected by failed retry/recovery logic, use admin audit override only if a human verifies downstream should be unblocked.
5. Keep Legion task evidence and PR history; do not delete raw task docs.

## Verification plan

- `npm --prefix scheduler test` for full scheduler regression.
- New focused tests:
  - raw signature positive/negative and timestamp replay rejection;
  - webhook dedupe returns duplicate no-op and does not enqueue duplicate reconcile;
  - AgentSessionEvent created/prompted/delegated/stopped routing;
  - retry taxonomy/backoff/limit;
  - fake worker timeout/crash schedules bounded retry and keeps one active run;
  - stale worker alive vs confirmed-dead recovery;
  - safe lock release failure for non-terminal run without proof/admin;
  - native stop terminal non-success and blocker remains unsatisfied.

## Open questions / explicit boundaries

- Exact production Linear native adapter calls remain outside WI-07; this WI persists outbox rows and state transitions that such an adapter can consume.
- Exact production process liveness detection can be improved later. The WI-07 interface must require positive proof before dead-worker recovery actions.
- Backoff is represented in outbox payload metadata in this prototype. A future durable queue may honor `notBefore` natively.
