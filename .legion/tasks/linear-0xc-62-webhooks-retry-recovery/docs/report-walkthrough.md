# Walkthrough: WI-07 webhooks, retries, and stale recovery

> **Mode**: implementation
> **Task**: `linear-0xc-62-webhooks-retry-recovery`
> **Linear**: `0XC-62`
> **Verification**: `docs/test-report.md` — PASS
> **Review**: `docs/review-change.md` — PASS

## Reviewer summary

This change completes WI-07 by adding the scheduler reliability layer for Linear webhooks, retry policy, stale recovery and native stop/cancel behavior. The implementation keeps the existing scheduler truth boundaries intact: webhook events are verified, deduped and routed to outbox/reconcile; they do not directly claim work or launch OpenCode workers.

## Main changes

### 1. Linear webhook ingestion

- Added `scheduler/src/webhook.ts`.
- Verifies Linear webhook signatures over raw request bytes using `linear-signature`.
- Enforces timestamp replay window before routing.
- Persists webhook dedupe records and returns duplicate no-op results.
- Routes `Issue`, `AgentSessionEvent`, and `PermissionChange` payloads into scheduler/native outbox or native stop handling.
- Includes an optional thin Node HTTP handler that preserves raw body bytes.

### 2. Retry policy and worker retry integration

- Added `scheduler/src/retry-policy.ts`.
- Classifies failures as retryable, conditionally retryable, non-retryable or control signal.
- Adds bounded exponential backoff with deterministic test behavior.
- Updates `scheduler/src/worker-runner.ts` so worker timeout / crash can schedule a retry attempt while keeping the same active run/task/locks.
- Retry dispatch rows carry `notBefore` and preserve evaluated Linear context from the original run snapshot.

### 3. Stale recovery and safe lock release

- Added `scheduler/src/recovery.ts`.
- Detects stale active runs by heartbeat age, then checks worker liveness before acting.
- Worker alive: inspection-only event, no retry, no release.
- Worker confirmed dead: bounded retry if budget remains, otherwise terminal failure with safe lock release.
- Hardens `releaseLocksForRun()` so non-terminal lock release requires confirmed-dead-worker proof or admin action.

### 4. Native stop / cancel semantics

- `AgentSessionEvent:stopped` maps to the run by `agentSession.id` when possible.
- The run records `native_stop_requested_at`, transitions to `cancelled`, enqueues final response, releases runtime locks after terminal cleanup, and remains downstream-unsatisfied as terminal non-success.

### 5. Documentation and tests

- Added WI-07 delivery artifact: `docs/linear-legion-scheduler/webhooks-retry-recovery.md`.
- Updated scheduler README and scheduler design index.
- Added `scheduler/tests/linear-reliability.test.ts` and updated existing scheduler tests for safe lock release and retry behavior.

## Evidence

- Design gate: `docs/rfc.md`, `docs/review-rfc.md` (PASS).
- Verification: `docs/test-report.md` (PASS, `npm --prefix scheduler test`, 50/50 tests passed).
- Readiness review: `docs/review-change.md` (PASS, security lens applied for webhook signature/trust boundary changes).

## Risk notes

- Scheduler outbox side effects for `reconcile_project`, `native_session_event`, and `permission_change` are persisted but still require future production adapter processing. This is intentional and remains in WI-08 / production adapter scope.
- The Node HTTP handler is intentionally thin and local; production deployment should wrap the same pure ingestion function.

## Reviewer checklist

- [ ] Confirm webhook handler does not directly claim WI or launch workers.
- [ ] Confirm retry keeps one active run and preserves Linear context.
- [ ] Confirm stale recovery requires worker liveness proof before retry/release.
- [ ] Confirm native stop remains terminal non-success and does not satisfy downstream blockers.
- [ ] Confirm scheduler tests cover the new reliability paths.
