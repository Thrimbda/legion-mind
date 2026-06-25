# Webhooks, Retry Policy, and Stale Recovery

> **WI**: [WI-07 Webhooks, retries, and stale recovery](work-items/WI-07-webhooks-retry-recovery.md)<br>
> **Status**: WI-07 delivery artifact<br>
> **Runtime**: standalone `scheduler/` npm project<br>
> **Design source**: [RFC](rfc.md), [WI-06 parallel dispatch](parallel-dispatch-locks.md)

## 1. What WI-07 delivers

WI-07 adds the reliability layer that lets the scheduler survive duplicate webhooks, transient worker failures, stale heartbeats and native stop/cancel signals without creating duplicate active workers or incorrectly unlocking downstream WIs.

Delivered source:

| Path | Purpose |
|---|---|
| `scheduler/src/webhook.ts` | Framework-neutral Linear webhook ingestion: raw-body signature verification, timestamp replay check, dedupe persistence, AgentSessionEvent / PermissionChange routing and optional Node HTTP handler |
| `scheduler/src/retry-policy.ts` | Failure taxonomy, retry classification, bounded attempts and deterministic exponential backoff |
| `scheduler/src/recovery.ts` | Stale active run detection, worker liveness probe boundary and retry/terminal recovery executor |
| `scheduler/src/sqlite-store.ts` | Scheduler outbox side effects, webhook dedupe outcome, retry-attempt creation, stale active run queries, AgentSession run lookup and safe lock release |
| `scheduler/src/worker-runner.ts` | Worker timeout / crash retry scheduling, retry `notBefore` enforcement and terminal lock cleanup |
| `scheduler/tests/linear-reliability.test.ts` | Signature, dedupe, AgentSessionEvent stop, retry taxonomy, worker timeout retry and stale recovery coverage |

## 2. Webhook ingestion model

Webhook handling follows a strict sequence:

```text
raw request bytes
  -> verify HMAC SHA-256 using linear-signature
  -> parse JSON and validate webhookTimestamp replay window
  -> persist webhook_events dedupe record
  -> enqueue scheduler/native outbox or request native stop
  -> ack quickly
```

The handler never calls `claimReadyWorkItem()` or launches OpenCode. Issue events, AgentSession `created` / `prompted` / `delegated`, and unmatched `stopped` signals enqueue scheduler outbox rows that later reconcile current truth. Duplicate webhook payloads return accepted/no-op and do not enqueue duplicate work.

## 3. Native stop semantics

`AgentSessionEvent:stopped` tries to map `agentSession.id` to a scheduler run. If found, the store records `native_stop_requested_at`, transitions the active run to `cancelled`, enqueues a `final_response`, releases runtime locks after terminal cleanup and keeps downstream blockers unsatisfied through `run_terminal_non_success`.

If no run mapping exists, the event is still persisted and routed to scheduler outbox for reconcile/inspection. It does not claim or launch work.

## 4. Retry taxonomy

| Class | Examples | Behavior |
|---|---|---|
| retryable | `linear_api_5xx`, `github_api_transient`, `worker_infra_crash`, `network_timeout`, `worker_timeout`, `agent_failed` | bounded retry with exponential backoff |
| conditionally retryable | `verification_failed`, `merge_conflict`, `checks_failure`, `pr_blocked` | retry only when marked scope-repairable |
| non-retryable | `contract_missing`, `needs_human`, `security_blocked`, `dependency_cycle`, `permission_denied`, `result_identity_mismatch`, `unknown_result` | terminal/non-retry path |
| control signal | `native_stop_requested`, `admin_cancelled`, `worker_cancelled` | no automatic retry |

Worker timeout / crash keeps the same run active in `blocked`, creates the next `run_attempts` row, and enqueues a retry dispatch row with `notBefore`. Consuming a retry before `notBefore` marks the outbox row `retrying` without launching.

## 5. Stale recovery

Stale recovery is an investigation, not an automatic lock release:

1. `listStaleActiveRuns()` finds active runs whose heartbeat is older than the configured threshold.
2. `recoverStaleRuns()` records `stale_run_detected` and asks a `WorkerLivenessProbe` whether the latest attempt is alive.
3. If alive, it records `stale_run_worker_alive` and does not retry or release locks.
4. If confirmed dead and retry budget remains, it schedules a retry attempt under the same active run/task/locks.
5. If confirmed dead and retry budget is exhausted, it transitions terminal `failed`, releases locks with `confirmedDeadWorker`, and downstream remains unsatisfied.

## 6. Safe lock release

`releaseLocksForRun()` now rejects non-terminal releases unless the caller supplies confirmed-dead-worker proof or an admin action. TTL expiry alone is not enough.

Valid release reasons:

- run is terminal (`done`, `failed`, `cancelled`, `abandoned`);
- recovery confirmed worker dead;
- admin release with audit reason.

## 7. Verification

Full scheduler regression:

```bash
npm --prefix scheduler test
```

WI-07 adds coverage for:

- raw body signature verification and mutated-body failure;
- timestamp replay rejection;
- webhook dedupe no-op;
- AgentSessionEvent created/prompted/delegated/stopped routing;
- retry taxonomy and backoff;
- worker timeout retry without duplicate active run;
- stale worker alive vs confirmed-dead recovery;
- safe lock release rejection for non-terminal runs.
