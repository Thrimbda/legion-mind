# Task Summary: linear-0xc-62-webhooks-retry-recovery

## Status

- **Task**: `linear-0xc-62-webhooks-retry-recovery`
- **Linear**: `0XC-62` — WI-07: Add webhooks, retries, and stale recovery
- **Outcome**: webhook ingestion, retry taxonomy/backoff, stale run recovery and safe lock release implemented for the standalone `scheduler/` npm project.
- **Delivery artifact**: `docs/linear-legion-scheduler/webhooks-retry-recovery.md`
- **Raw evidence**: `.legion/tasks/linear-0xc-62-webhooks-retry-recovery/`

## What changed

- Added `scheduler/src/webhook.ts` for raw-body Linear webhook signature verification, timestamp replay checks, dedupe persistence, AgentSessionEvent / PermissionChange routing and a thin Node HTTP handler.
- Added `scheduler/src/retry-policy.ts` for retryable / conditionally retryable / non-retryable / control-signal failure taxonomy and deterministic bounded backoff.
- Added `scheduler/src/recovery.ts` for stale active run detection, worker liveness checks and retry / terminal recovery actions.
- Extended `scheduler/src/sqlite-store.ts` with scheduler outbox side effects, webhook dedupe outcome, retry-attempt creation, stale active run queries, AgentSession run lookup and safe lock release.
- Updated `scheduler/src/worker-runner.ts` so worker timeout/crash can schedule retry attempts without creating duplicate active runs; retry dispatch honors `notBefore` and preserves evaluated Linear context.
- Added `scheduler/tests/linear-reliability.test.ts` plus existing test updates for safe lock release and retry behavior.
- Added WI-07 delivery docs and scheduler README/index updates.

## Current truth promoted

- Webhook handlers verify raw bytes, persist a dedupe record and enqueue scheduler/native outbox work; they must not directly claim WIs or launch workers.
- Linear webhook events are latency triggers, not current truth. Scheduler reconcile / DB state remains the decision boundary for claim, blocker satisfaction and worker dispatch.
- AgentSessionEvent `created`, `prompted` and `delegated` route to native session / reconcile outbox. `stopped` maps to `native_stop_requested_at` and terminal `cancelled` when the AgentSession maps to a run.
- Native stop/cancel is terminal non-success: it can release runtime locks after cleanup, but downstream blockers remain unsatisfied unless an explicit admin override exists.
- Retryable worker failures keep one active run in `blocked`, create a new attempt, preserve the original evaluated Linear context and enqueue worker dispatch with `notBefore` backoff.
- Stale heartbeat / lock TTL is an alarm only. Recovery must check worker liveness before retrying, terminalizing, or releasing locks.
- `releaseLocksForRun()` is safe by default: non-terminal releases require confirmed-dead-worker proof or admin action.

## Verification

- `npm --prefix scheduler test` PASS (50/50).

## Review

- RFC review: PASS.
- Change review: PASS with security lens applied for webhook signature, crypto, trust-boundary and user-controlled payload routing.
- One review-time implementation gap was fixed before PASS: retry worker-dispatch payloads now preserve evaluated Linear context from the original run snapshot.

## Follow-ups

- Run webhook ingestion against a real Linear test webhook / native app before enabling production webhook scheduling.
- Implement production processors for scheduler outbox side effects (`reconcile_project`, `native_session_event`, `permission_change`) in the future Linear native adapter / operations WI.
- If the prototype becomes long-lived, replace outbox `notBefore` metadata with a durable delayed-job mechanism and add operational metrics around retry / stale recovery.
