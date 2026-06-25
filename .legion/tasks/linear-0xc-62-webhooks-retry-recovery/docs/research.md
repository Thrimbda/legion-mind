# Research: WI-07 webhooks, retries, and stale recovery

## Scope

This research records the implementation surface for WI-07 before writing the task RFC. It is task-local evidence for `.legion/tasks/linear-0xc-62-webhooks-retry-recovery/docs/rfc.md`.

## Upstream contract

- Linear issue: `0XC-62` / WI-07, labels `contract:stable`, `risk:high`, `repo:legion-mind`, `area:scheduler`.
- Blockers: `0XC-60` WI-05 and `0XC-61` WI-06 are Done.
- Source docs:
  - `docs/linear-legion-scheduler/rfc.md`
  - `docs/linear-legion-scheduler/work-items/WI-07-webhooks-retry-recovery.md`
  - `docs/linear-legion-scheduler/parallel-dispatch-locks.md`

## Current scheduler implementation

| Path | Current behavior relevant to WI-07 |
|---|---|
| `scheduler/src/sqlite-store.ts` | SQLite store already has `webhook_events`, `native_outbox`, `runs.native_stop_requested_at`, `runs.failure_type`, heartbeat fields, active-run unique indexes, resource locks and basic `requestNativeStop()`. It records webhook events but does not expose full ingestion/routing semantics. |
| `scheduler/src/worker-runner.ts` | OpenCode worker dispatch handles native startup outbox ordering, heartbeat, process timeout/cancel, result parsing and Legion evidence verification. Launch failures currently become terminal `failed` immediately; no bounded retry/backoff exists. |
| `scheduler/src/dispatcher.ts` | Parallel dispatcher records stale-lock detection but intentionally does not release stale locks. It does not recover stale runs or attempts. |
| `scheduler/src/pr-tracker.ts` | PR delivery already maps PR states to in-review/blocked/done/terminal-non-success and releases locks after terminal success/non-success. |
| `scheduler/src/state-machine.ts` | Run states are `queued`, `running`, `in_review`, `blocked`, `done`, `failed`, `cancelled`, `abandoned`. `blocked` is the only active state suitable for retry waiting without creating a terminal run. |
| `scheduler/tests/*` | Existing tests cover core claim/dedupe, native stop, worker launch negative paths, PR delivery gates and stale-lock inspection hooks. WI-07 should add focused tests rather than replacing these. |

## Current data model observations

- Active run uniqueness exists on `(linear_issue_id)` and `(task_id)` for states in `queued`, `running`, `in_review`, `blocked`. This is the primary guard against duplicate worker launch.
- `webhook_events` has unique indexes on `delivery_id` and `signature_hash`; this is enough for idempotent webhook persistence if the ingestion layer computes deterministic IDs before routing.
- `native_outbox` is already a generic outbox in practice (`native_agent` + `worker_dispatch`), even though the name is native-specific. WI-07 can extend it with a scheduler outbox kind / side effect for reconcile triggers without introducing a new table.
- `releaseLocksForRun()` currently trusts callers. WI-07 should harden it so terminal run, confirmed-dead-worker recovery, or admin action is required before held locks can be released.

## Linear current docs checked via Context7

- Library ID used: `/websites/linear_app_developers`.
- Webhook signatures:
  - Linear signs raw request body with HMAC SHA-256 and sends signature in `linear-signature`.
  - Verification must use raw bytes captured before JSON parsing.
  - Docs recommend rejecting events whose `webhookTimestamp` differs from current time by more than 60 seconds.
- AgentSessionEvent:
  - `created` and `prompted` session webhooks are documented actions.
  - Session webhook receivers must respond within 5 seconds.
  - For a `created` event, the agent should emit an activity or update external URLs within 10 seconds to avoid Linear marking the session unresponsive.
  - Docs describe session webhooks as covering mentions, issue delegations and additional prompts; permission changes are represented by a `PermissionChange` payload with `teamAccessChanged`.

## Design constraints from upstream RFC

- Webhook handler must verify, dedupe, persist and enqueue; it must not claim WI or launch workers directly.
- Webhooks are latency hints; periodic/manual reconcile remains current truth.
- AgentSessionEvent `created` must not bypass scheduler claim/reconcile. It should enqueue native/session work or reconcile and quickly acknowledge.
- Native stop/cancel is a control signal, not a success gate and not an automatic retry trigger.
- Stale run recovery must first check worker liveness; TTL/heartbeat expiry alone must not release locks or start another worker.

## Design options considered

### Option A: Add Express and SDK webhook handler

- Pros: Close to Linear docs and SDK examples.
- Cons: Introduces dependencies into the standalone zero-dependency scheduler prototype and couples tests to framework behavior.
- Decision: Reject for this WI.

### Option B: Build framework-neutral raw handler + optional Node HTTP debug server

- Pros: Keeps zero external dependencies; tests can pass raw bytes/headers directly; CLI/server wrapper can be thin.
- Cons: More local code for request parsing and response mapping.
- Decision: Choose.

### Option C: Treat stale heartbeat as lock expiry and release immediately

- Pros: Simple.
- Cons: Violates WI-07 recovery rule and can create duplicate active workers.
- Decision: Reject.

### Option D: Keep retry policy pure and schedule retry via existing outbox

- Pros: Fits current SQLite/outbox model and is testable without production queue infrastructure.
- Cons: Backoff is represented as `notBefore` metadata rather than a full delayed job queue.
- Decision: Choose for prototype; future WI-08 can turn this into richer admin/observability.

## Recommended implementation shape

- Add `scheduler/src/webhook.ts`:
  - `verifyLinearWebhookSignature(rawBody, signature, secret)`.
  - `parseLinearWebhook(rawBody)` with timestamp validation.
  - `ingestLinearWebhook(store, input)` that records dedupe row, determines duplicate/new, and routes only by enqueuing scheduler/native actions or requesting native stop when a mapped active run exists.
  - Optional `createLinearWebhookHttpHandler()` / `startLinearWebhookServer()` using Node `http`, preserving raw bytes.
- Add `scheduler/src/retry-policy.ts`:
  - failure taxonomy and retry class mapping.
  - bounded retry decision with exponential backoff.
  - helper for scope-local conditional retry.
- Add `scheduler/src/recovery.ts`:
  - stale run detection from active runs and heartbeat age.
  - worker liveness probe interface.
  - recovery planner/executor that records events, schedules retry only after confirmed-dead worker, and uses safe lock release rules.
- Harden `sqlite-store.ts`:
  - expose dedupe outcome for webhooks.
  - expose active/stale run and attempt helpers.
  - support scheduler outbox rows for reconcile/retry scheduling.
  - make lock release safe by default.

## Verification implications

- Unit tests:
  - signature verification with raw body and mutated body negative case.
  - timestamp window rejection.
  - dedupe by `webhookId` / delivery id / signature hash.
  - retry taxonomy and backoff behavior.
  - safe lock release rejects non-terminal release without dead-worker/admin proof.
- Integration / fault-injection tests:
  - duplicate webhook + periodic reconcile outbox yields one active claim path.
  - AgentSessionEvent `created` / `prompted` / `delegated` enqueues scheduler/native outbox and does not launch worker.
  - AgentSessionEvent `stopped` maps to `native_stop_requested_at`, `cancelled`, final response, and downstream remains unsatisfied.
  - stale heartbeat with worker alive records inspection only; stale heartbeat with confirmed dead worker schedules bounded retry or terminal failure without creating duplicate active run.
