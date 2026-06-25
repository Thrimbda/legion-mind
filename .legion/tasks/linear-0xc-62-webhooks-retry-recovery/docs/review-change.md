# Review Change: WI-07 webhooks, retries, and stale recovery

## Verdict: PASS

The implementation is ready for delivery. It stays within WI-07 scope, matches the approved RFC, includes targeted regression coverage for the new reliability behavior, and preserves the scheduler truth boundaries: webhook ingestion never directly claims or launches workers, retry preserves one active run, and stale recovery requires liveness proof before retry/release.

## Blocking findings

- None.

## Scope compliance

- In scope:
  - `scheduler/src/webhook.ts` adds raw-body Linear signature verification, timestamp replay guard, dedupe persistence and AgentSessionEvent / PermissionChange routing.
  - `scheduler/src/retry-policy.ts` adds failure taxonomy and bounded backoff retry decisions.
  - `scheduler/src/recovery.ts` adds stale run detection and worker-liveness-gated recovery.
  - `scheduler/src/sqlite-store.ts` adds scheduler outbox support, retry attempts, stale run helpers, AgentSession lookup and safe lock release.
  - `scheduler/src/worker-runner.ts` integrates retry scheduling and retry `notBefore` enforcement.
  - Scheduler docs/tests were updated to reflect delivered behavior.
- Out of scope avoided:
  - No new runtime adapter beyond OpenCode.
  - No incident dashboard / admin UX expansion.
  - No direct Linear native API production adapter implementation.

## Correctness review

- Webhook handler verifies raw bytes before routing and dedupes before enqueueing side effects.
- Duplicate AgentSessionEvent payloads do not enqueue duplicate scheduler work.
- `AgentSessionEvent:stopped` maps to `native_stop_requested_at`, terminal `cancelled`, final response outbox and lock release, while `isBlockerSatisfiedByRun()` remains false for terminal non-success.
- Retryable worker timeout/crash paths create a new attempt under the same active run and keep locks held; retry dispatch respects `notBefore`.
- Retry dispatch preserves evaluated Linear context from the original run snapshot, so retry prompts do not lose issue title/risk/contract context.
- Stale recovery records detection first, checks liveness, and only schedules retry or releases locks when a worker is confirmed dead.
- `releaseLocksForRun()` rejects unsafe non-terminal releases unless terminal/dead-worker/admin conditions apply.

## Security lens

Security lens applied because this change touches webhook signing, crypto, protocol boundaries and user-controlled event payloads.

- HMAC verification uses `timingSafeEqual` and fails closed on missing/malformed signature or length mismatch.
- Signature validation is over the original raw request bytes, not reserialized JSON.
- Timestamp replay window is enforced before event routing.
- Webhook payloads are persisted and routed to outbox/reconcile; they do not directly enter privileged worker-launch paths.
- No secrets are logged or written by the new test/report artifacts.

No exploitable trust-boundary issue found in the implemented prototype scope.

## Verification evidence

- `docs/test-report.md`
- Command: `npm --prefix scheduler test`
- Result: 50/50 PASS after implementation and after retry-context review fix.

## Non-blocking notes

- The scheduler outbox side effects (`reconcile_project`, `native_session_event`, `permission_change`) are persisted but still require future production adapter/worker processing. This is consistent with WI-07 and WI-08 boundaries.
- The Node HTTP handler is intentionally thin/local; production deployment should wrap the same pure ingestion function in the chosen server runtime.
