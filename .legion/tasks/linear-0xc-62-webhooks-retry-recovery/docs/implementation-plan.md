# Implementation plan: WI-07 webhooks, retries, and stale recovery

## Milestone 1: Store and policy primitives

- Extend `sqlite-store.ts` with webhook dedupe outcome, scheduler outbox side effects, retry attempts, stale active run listing, run lookup by AgentSession id and safe lock release.
- Add `retry-policy.ts` with taxonomy, retry classification and deterministic backoff.
- Tests: retry classes/backoff; webhook duplicate row result; safe lock release.

## Milestone 2: Webhook ingestion

- Add `webhook.ts` raw-body signature verification, timestamp validation, envelope parsing and event routing.
- Add optional Node HTTP handler preserving raw bytes.
- Tests: signature verification, mutated body failure, timestamp rejection, duplicate webhook no-op, AgentSessionEvent created/prompted/delegated/stopped routing.

## Milestone 3: Retry and worker integration

- Update worker dispatch failure handling to classify timeout/nonzero/malformed/identity/control-signal outcomes.
- For retryable failures with remaining budget, keep run active in `blocked`, create retry attempt and enqueue worker dispatch with `notBefore`.
- Respect retry `notBefore` when consuming worker dispatch outbox rows.
- Tests: fake timeout/crash retry, retry limit exhaustion terminal failure, control signal no retry.

## Milestone 4: Stale recovery

- Add `recovery.ts` with stale detection, liveness probe, recovery executor and event recording.
- Integrate stale run recovery with existing dispatcher stale-lock inspection where appropriate without auto release.
- Tests: worker alive no duplicate/no release, confirmed dead retry, exhausted retry terminal release, no second active run.

## Milestone 5: Documentation and verification

- Update `scheduler/README.md` and `docs/linear-legion-scheduler/**` with WI-07 delivered behavior.
- Run `npm --prefix scheduler test`.
- Record `docs/test-report.md` and proceed to `verify-change` / `review-change`.
