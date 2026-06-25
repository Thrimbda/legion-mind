# RFC Review — WI-06 parallel dispatch and resource locks

## Verdict

PASS

## Review Scope

Reviewed `.legion/tasks/linear-0xc-61/docs/rfc.md` against Linear WI 0XC-61, the scheduler RFC, and existing scheduler prototype boundaries.

## Findings

- No blocking design gaps found. The RFC keeps durable lock acquisition inside `SchedulerStore.claimReadyWorkItem()` and therefore does not introduce an unsafe second claim path.
- Capacity-before-claim is the correct first implementation boundary: it prevents idle queued work from holding locks and matches the WI backpressure requirement.
- Stale lock detection is explicitly inspection/reporting only, not automatic release. This is necessary to avoid false downstream unlocks.
- Waiting visibility is scoped to structured events/outbox-compatible payloads for this prototype. That is acceptable for WI-06 because production native Linear adapters are out of scope, but implementation must test that these payloads do not add `agent:running` labels.

## Non-blocking Suggestions

- Keep lock parsing and conflict helpers small and pure so future WI-07 stale recovery and WI-08 admin commands can reuse them.
- Preserve deterministic sort tie-breakers in tests; otherwise fair scheduling can become flaky.

## Gate Decision

Implementation may proceed under the medium-risk implementation chain.
