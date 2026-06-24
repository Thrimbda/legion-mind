# extract-linear-scheduler-npm-project

## Metadata

- `task-id`: `extract-linear-scheduler-npm-project`
- `status`: `completed-through-review`
- `risk`: `low-to-medium`
- `schema-version`: `2026-06-24`
- `historical`: `false`
- `supersedes`: `(none)`
- `superseded-by`: `(none)`

## Outcome Summary

- Linear + Legion scheduler runtime code has been extracted from root `scripts/` into a standalone npm project at `scheduler/`.
- Scheduler source now lives in `scheduler/src/`; scheduler tests now live in `scheduler/tests/`.
- `scheduler/package.json` owns `debug`, `health` and `test` scripts; root `package.json` no longer exposes `scheduler:debug` or `test:linear-scheduler`.
- Root `lgmind` package dry-run excludes `scheduler/`, preserving the root package publish boundary.
- Current scheduler docs under `docs/linear-legion-scheduler/**` now describe `scheduler/` as the WI-02 project home.

## Reusable Decisions

- Scheduler runtime work should be treated as its own npm project under `scheduler/`, not as root package maintenance scripts under `scripts/`.
- Root `lgmind` package publish files should not include `scheduler/` unless a future task explicitly changes the package boundary.
- Scheduler validation should run through `npm --prefix scheduler test` and scheduler debug smoke through `npm --prefix scheduler run health -- --db :memory:`.
- Root regression (`npm run test:regression`) and scheduler regression are now intentionally separate validation surfaces.

## Verification / Review

- `npm --prefix scheduler test` — PASS, 12 tests.
- `npm --prefix scheduler run health -- --db :memory:` — PASS.
- `npm run test:regression` — PASS, 18 tests.
- `npm run pack:dry-run` — PASS; root package file list excludes `scheduler/`.
- `git diff --check` — PASS.
- `review-change` — PASS, no blocking findings.

## Related Raw Sources

- `plan`: `.legion/tasks/extract-linear-scheduler-npm-project/plan.md`
- `log`: `.legion/tasks/extract-linear-scheduler-npm-project/log.md`
- `tasks`: `.legion/tasks/extract-linear-scheduler-npm-project/tasks.md`
- `test-report`: `.legion/tasks/extract-linear-scheduler-npm-project/docs/test-report.md`
- `review`: `.legion/tasks/extract-linear-scheduler-npm-project/docs/review-change.md`
- `walkthrough`: `.legion/tasks/extract-linear-scheduler-npm-project/docs/report-walkthrough.md`
- `delivery`: `scheduler/README.md`, `scheduler/package.json`, `docs/linear-legion-scheduler/scheduler-core-sqlite.md`

## Notes

- This task only fixes scheduler project/package boundaries. It does not change scheduler DB semantics, Linear integration scope, worker runtime scope, or PR tracking behavior.
- Historical `.legion/tasks/linear-legion-scheduler-wi-02/**` raw docs may still mention old `scripts/` paths because they are evidence for the earlier WI-02 delivery state.
