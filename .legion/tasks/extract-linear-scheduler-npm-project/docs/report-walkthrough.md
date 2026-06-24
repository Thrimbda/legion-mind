# Report Walkthrough: Extract Linear Scheduler into an Independent npm Project

> **Mode**: implementation<br>
> **Task**: `extract-linear-scheduler-npm-project`<br>
> **Verdict**: ready for PR lifecycle

## What Changed

Scheduler is no longer represented as a root `scripts/` utility inside the `lgmind` npm package. It now lives under a dedicated standalone npm project at `scheduler/`.

| Area | Change |
|---|---|
| Project boundary | Added `scheduler/package.json` and `scheduler/README.md` |
| Runtime source | Moved scheduler CLI and core source to `scheduler/src/` |
| Tests | Moved scheduler tests to `scheduler/tests/` |
| Root package | Removed root `scheduler:debug` and `test:linear-scheduler` scripts |
| Docs | Updated `docs/linear-legion-scheduler/**` to describe `scheduler/` project shape |
| Legion evidence | Added plan, tasks, log, test report, and review evidence under this task |

## Reviewer Map

| Reviewer question | Evidence |
|---|---|
| Is scheduler actually outside root `scripts/`? | `scheduler/src/**`; deleted `scripts/linear-scheduler.ts` and `scripts/lib/linear-scheduler/**` |
| Is scheduler a separate npm project? | `scheduler/package.json`; `scheduler/README.md` |
| Do scheduler tests still pass after migration? | `docs/test-report.md` → `npm --prefix scheduler test` PASS, 12 tests |
| Does the debug CLI still start? | `docs/test-report.md` → `npm --prefix scheduler run health -- --db :memory:` PASS |
| Did the root package boundary stay clean? | `docs/test-report.md` → `npm run pack:dry-run` PASS; package list excludes `scheduler/` |
| Did root regression remain healthy? | `docs/test-report.md` → `npm run test:regression` PASS, 18 tests |
| Did review find blockers? | `docs/review-change.md` → PASS, no blocking findings |

## Validation Summary

- `npm --prefix scheduler test` — PASS, 12 tests.
- `npm --prefix scheduler run health -- --db :memory:` — PASS.
- `npm run test:regression` — PASS, 18 tests.
- `npm run pack:dry-run` — PASS; root package does not include `scheduler/`.
- `git diff --check` — PASS.

## Scope Notes

- This change intentionally preserves scheduler runtime semantics: state machine, SQLite schema, claim transaction, locks, native/worker outbox, and debug service behavior are unchanged except for project-relative paths.
- Historical `.legion/tasks/linear-legion-scheduler-wi-02/**` evidence is not rewritten; it remains raw evidence for the original WI-02 delivery. Current docs and wiki are updated by this task.
- No real Linear, GitHub, OpenCode worker, or webhook integration is introduced.

## Risks / Follow-up

- **CI visibility**: a future CI job should explicitly run `npm --prefix scheduler test` if the scheduler project becomes a maintained runtime component.
- **Packaging**: current verification confirms root `lgmind` package does not include `scheduler/`; keep this boundary explicit if root package files are changed later.
