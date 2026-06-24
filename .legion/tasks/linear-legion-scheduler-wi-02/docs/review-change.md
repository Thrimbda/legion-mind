# Review Change: Linear Scheduler WI-02

> **Task**: `linear-legion-scheduler-wi-02`<br>
> **Review target**: SQLite-backed scheduler core implementation, tests and WI-02 documentation<br>
> **Date**: 2026-06-24

## Verdict

PASS

## Blocking findings

None.

## Scope review

The change stays within the WI-02 contract:

- Adds scheduler core runtime code under `scripts/lib/linear-scheduler/**`.
- Adds a minimal debug command at `scripts/linear-scheduler.ts`.
- Adds regression coverage for migration, state machine, claim transaction, locks, outbox, native stop, terminal semantics and debug smoke.
- Updates `package.json` only for scheduler debug / test scripts and to run regression with SQLite enabled.
- Updates `docs/linear-legion-scheduler/**` to link and document the WI-02 SQLite delivery artifact.
- Adds task-local Legion evidence under `.legion/tasks/linear-legion-scheduler-wi-02/**`.

No real Linear API, GitHub PR tracker, webhook HTTP server, worker launcher, full admin CLI or Legion workflow behavior was added, which matches the non-goals.

## Correctness / maintainability review

- Migration creates the seven core WI-02 tables with active-run, held-lock, webhook-dedupe and outbox idempotency constraints.
- `claimReadyWorkItem()` uses a single SQLite write transaction for snapshot persistence, stale revalidation, active-run check, lock acquisition, run / attempt creation, scheduler event and outbox enqueue.
- Run state transitions are centralized in `state-machine.ts`; illegal transitions are tested.
- `isBlockerSatisfiedByRun()` does not treat terminal non-success as downstream success; admin override is audit-event based.
- Native stop updates DB state, records audit events and enqueues one idempotent final-response outbox job.
- SQLite-specific details are mostly contained in `SchedulerStore`, leaving later WI-03 / WI-04 integration at DTO / repository boundary.

## Verification evidence reviewed

`docs/test-report.md` records PASS for:

- `npm run test:linear-scheduler` — 12 tests PASS.
- `npm run test:regression` — 30 tests PASS.
- `npm run scheduler:debug -- health --db :memory:` — PASS.
- `git diff --check` — PASS.

This evidence directly covers the new scheduler core behavior and protects existing repo regressions.

## Security lens

Applied because the change defines scheduler machine-truth state, protocol boundaries, webhook dedupe shape, native agent outbox and user-controlled Linear snapshot payload handling.

Findings:

- SQL statements use bound parameters for runtime data. Interpolated SQL fragments are constants derived from local state enums, not user input.
- Raw webhook payloads are not stored directly by default; the schema uses `raw_payload_uri` and sanitized `payload_json`, matching the RFC privacy boundary.
- Linear native objects remain control / presentation plane only; DB state and evidence gates remain machine truth.
- The debug command accepts an explicit local DB path and creates parent directories. This is acceptable for repo-local debug use; production admin hardening is explicitly deferred to WI-08.

No exploitable trust-boundary or data-exposure blocker was found for the WI-02 scope.

## Non-blocking suggestions

- Future WI-07 should add retry backoff counters / next-at fields to `native_outbox` when implementing real outbox workers.
- Future production DB migration should add a compatibility test suite that replays the WI-02 claim / lock / terminal fixtures against the new backend.
