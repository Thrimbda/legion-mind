# WI-08 Implementation Plan

## Milestone 1 — Store and admin service

- Add `project_controls` migration and store APIs.
- Add `src/admin.ts` for reason-required admin operations, run inspection, project health, retry/cancel, lock release, and project pause/resume.
- Tests: reason guards, audit events, project control state, run inspection aggregation.

## Milestone 2 — CLI routing

- Extend `src/cli.ts` with WI-required command vocabulary.
- Keep existing debug commands working.
- Ensure JSON output is redacted and deterministic enough for tests.
- Tests: command-level smoke for pause/resume, inspect, retry/cancel, locks release/list.

## Milestone 3 — Dispatch controls and security handling

- Merge durable paused/security-blocked project IDs into scan/dispatch config.
- Add permission-change/security validation helper that records security event and blocks affected project.
- Tests: paused project does not claim, active run remains inspectable, PermissionChange blocks affected project.

## Milestone 4 — Observability and redaction

- Add `src/observability.ts` with redaction, structured log, metrics helpers.
- Wire representative admin/reconcile/dispatch/PR/lock/API/security metrics and logs.
- Tests: redaction snapshots and metrics family coverage.

## Milestone 5 — Docs and evidence

- Update `scheduler/README.md` command examples and current capability summary.
- Update `docs/linear-legion-scheduler/work-items/WI-08-operations-security.md` delivery notes/checklist as needed.
- Run full scheduler tests and write `docs/test-report.md`.
- Complete `review-change`, walkthrough, PR body, wiki writeback, and PR lifecycle.
