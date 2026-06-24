## Summary

- Extract the Linear + Legion scheduler prototype from root `scripts/` into a standalone `scheduler/` npm project.
- Move scheduler source to `scheduler/src/` and tests to `scheduler/tests/`.
- Remove root `scheduler:debug` / `test:linear-scheduler` scripts and update scheduler docs to point at the standalone project.

## Validation

- `npm --prefix scheduler test` — PASS, 12 tests.
- `npm --prefix scheduler run health -- --db :memory:` — PASS.
- `npm run test:regression` — PASS, 18 tests.
- `npm run pack:dry-run` — PASS; root package does not include `scheduler/`.
- `git diff --check` — PASS.

## Review Evidence

- Legion task: `.legion/tasks/extract-linear-scheduler-npm-project/`
- Test report: `.legion/tasks/extract-linear-scheduler-npm-project/docs/test-report.md`
- Change review: `.legion/tasks/extract-linear-scheduler-npm-project/docs/review-change.md` — PASS
- Walkthrough: `.legion/tasks/extract-linear-scheduler-npm-project/docs/report-walkthrough.md`
