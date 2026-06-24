# Walkthrough: Linear Scheduler WI-02

> **Profile**: implementation<br>
> **Task**: `linear-legion-scheduler-wi-02`<br>
> **Status**: Ready for PR lifecycle<br>
> **Primary artifact**: `docs/linear-legion-scheduler/scheduler-core-sqlite.md`

## Reviewer summary

WI-02 is complete as a SQLite-backed scheduler core implementation. The change turns the approved Linear + Legion scheduler data model into local TypeScript runtime code with durable SQLite migrations, a centralized run state machine, transactional claim API, resource locks, event timeline, native / worker outbox and a minimal debug service.

The DB implementation uses Node.js `node:sqlite` / `DatabaseSync` per the user constraint. SQLite details are contained behind `SchedulerStore` so later WI-03 / WI-04 / WI-05 can consume repository APIs and outbox rows without depending on raw SQL.

## Scope changed

| Path | Purpose |
|---|---|
| `scripts/lib/linear-scheduler/state-machine.ts` | Central run states, legal transitions and terminal-state helpers |
| `scripts/lib/linear-scheduler/sqlite-store.ts` | SQLite migrations, claim transaction, locks, scheduler events, webhook dedupe, native / worker outbox, debug service |
| `scripts/linear-scheduler.ts` | Minimal debug command for health, run list and timeline list |
| `tests/regression/linear-scheduler-core.test.ts` | Scheduler core regression tests |
| `package.json` | Adds `scheduler:debug`, `test:linear-scheduler`; regression tests run with SQLite flag |
| `docs/linear-legion-scheduler/scheduler-core-sqlite.md` | WI-02 delivery artifact and handoff for later WIs |
| `docs/linear-legion-scheduler/index.md` | Links WI-02 delivery artifact |
| `docs/linear-legion-scheduler/work-items/WI-02-scheduler-core-state.md` | Marks WI-02 acceptance complete and aligns risk note with SQLite implementation |
| `.legion/tasks/linear-legion-scheduler-wi-02/**` | Task contract, log, validation, review and walkthrough evidence |

No real Linear API client, GitHub integration, webhook HTTP server, OpenCode worker launcher, PR tracker, full admin CLI or Legion workflow behavior changed.

## Evidence map

| Claim | Evidence |
|---|---|
| Task contract is stable | `.legion/tasks/linear-legion-scheduler-wi-02/plan.md` |
| Approved design continuation is valid | `docs/linear-legion-scheduler/rfc.md`; `.legion/tasks/linear-legion-scheduler-rfc/docs/review-rfc.md`; WI-01 delivery policy |
| SQLite schema and service skeleton exist | `scripts/lib/linear-scheduler/sqlite-store.ts`; `scripts/linear-scheduler.ts`; `scheduler-core-sqlite.md` |
| Claim transaction and outbox behavior are tested | `.legion/tasks/linear-legion-scheduler-wi-02/docs/test-report.md` |
| Native stop / non-success terminal semantics are tested | `linear-scheduler-core.test.ts`; `test-report.md` |
| Readiness review passed | `.legion/tasks/linear-legion-scheduler-wi-02/docs/review-change.md` |

## Verification status

**PASS**

Commands recorded in `docs/test-report.md`:

- `npm run test:linear-scheduler` — 12 tests PASS.
- `npm run test:regression` — 30 tests PASS.
- `npm run scheduler:debug -- health --db :memory:` — PASS.
- `git diff --check` — PASS.

## Review status

**PASS**

`review-change` found no blocking scope, correctness, maintainability or security issue. Security lens was applied because the change defines scheduler machine truth and protocol boundaries; SQL runtime data is parameterized, raw webhook payloads are not stored directly, and Linear native objects remain control-plane only.

## Reviewer checklist

- [ ] Confirm `SchedulerStore` keeps SQLite behind a repository boundary suitable for WI-03 / WI-04 integration.
- [ ] Confirm `claimReadyWorkItem()` enforces snapshot revalidation, active-run uniqueness, locks and outbox enqueue in one transaction.
- [ ] Confirm non-success terminal states and native stop do not satisfy downstream blockers by default.
- [ ] Confirm WI-02 docs accurately describe the local SQLite prototype boundary and later-WI handoff.

## Remaining lifecycle work

This walkthrough does not complete the task by itself. Remaining required lifecycle steps:

1. `legion-wiki` writeback;
2. commit / rebase / push;
3. PR creation / update;
4. checks / review / auto-merge follow-up;
5. worktree cleanup and main workspace refresh after PR terminal state.
