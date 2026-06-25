# Review RFC: WI-07 webhooks, retries, and stale recovery

## Verdict: PASS

The RFC is sufficient to enter implementation. It defines the required boundaries, rollback path, verification surface, and the main state transitions for webhook ingestion, retry policy, native stop/cancel, stale recovery and safe lock release.

## Blocking findings

- None.

## Non-blocking findings / implementation cautions

1. **Linear AgentSession action names beyond current public docs**
   Current Linear docs surfaced `created` and `prompted` clearly; the WI contract also requires `stopped`, `delegated` and permission changes. The RFC handles action names generically and routes unknown/non-current actions through persisted webhook + reconcile instead of direct worker launch, so this is implementable and safe.

2. **`native_outbox` naming is broader than its table name**
   Extending it with `outbox_kind: scheduler` is slightly semantically awkward, but the table already holds `worker_dispatch` rows. This is acceptable for the prototype as long as migrations and processors filter by kind.

3. **Retry `notBefore` is metadata, not a production delayed queue**
   The RFC explicitly scopes this as prototype behavior. Implementation must ensure worker dispatch consumption respects `notBefore` and does not launch early.

4. **Safe lock release will affect existing tests/callers**
   This is expected and desirable. Update tests to transition runs terminal or pass confirmed-dead/admin proof before releasing locks.

## Gate checks

- **Implementable**: PASS — proposed modules map to existing scheduler structure and use additive helpers.
- **Verifiable**: PASS — RFC includes unit, integration and fault-injection coverage tied to acceptance criteria.
- **Rollbackable**: PASS — webhook can be disabled while periodic reconcile remains; new modules and outbox rows are isolated.
- **Scope bounded**: PASS — production incident dashboard, new runtimes and full native adapter behavior remain out of scope.

## Follow-up requirements for implementation

- Keep HTTP handler thin and raw-body preserving.
- Do not let webhook routing call `claimReadyWorkItem()` or `processOpenCodeWorkerDispatch()` directly.
- Add tests proving stale heartbeat with live worker does not release locks or create retry attempts.
- Preserve `isBlockerSatisfiedByRun()` semantics for terminal non-success after native stop / retry exhaustion.
