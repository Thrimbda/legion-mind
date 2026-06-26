# Report Walkthrough: Prepare Linear Scheduler Production Acceptance

## Mode

Documentation / fixture delivery with implementation-chain verification evidence. No scheduler runtime code changed.

## What Changed

- Added a top-level production acceptance runbook: `docs/linear-legion-scheduler/production-acceptance-runbook.md`.
- Added scheduler-local acceptance assets:
  - `scheduler/docs/production-acceptance-checklist.md`
  - `scheduler/docs/runbooks/secrets-sops.md`
  - `scheduler/docs/runbooks/linear-sandbox-setup.md`
  - `scheduler/docs/runbooks/github-sandbox-setup.md`
  - `scheduler/docs/templates/acceptance-evidence.md`
  - `scheduler/docs/templates/linear-sandbox-issues.md`
  - `scheduler/docs/templates/secrets.linear-scheduler.sops.yaml`
- Added fake fixture coverage: `scheduler/tests/fixtures/project.json` plus draft/failing/merged/closed PR fixtures.
- Updated `scheduler/README.md` and `docs/linear-legion-scheduler/index.md` to point operators at the acceptance package and current blockers.
- Fixed fixture path examples for `npm --prefix scheduler` command context.

## Main Reviewer Takeaway

This prepares acceptance execution; it does not run production acceptance and does not implement missing production capabilities.

The package keeps these blockers visible:

- Missing production Linear native writeback adapter.
- Missing live `dispatch project` command.
- Missing packaged webhook server/outbox runner.
- Real OpenCode worker E2E remains a later sandbox-only stage.

## Verification

- `scan fixture` with `tests/fixtures/project.json` — PASS.
- `dispatch fixture` with `tests/fixtures/project.json` — PASS.
- `health --db :memory:` — PASS.
- `npm --prefix scheduler test` — PASS, 57/57.
- `review-change` verdict — PASS.

## Suggested Review Focus

1. Confirm the runbook does not imply production readiness.
2. Confirm commands match existing CLI capabilities and mark DB-mutating behavior clearly.
3. Confirm secret templates contain placeholders only.
4. Confirm fake fixtures exercise the intended sandbox cases.
