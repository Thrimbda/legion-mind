## Summary

- Implement WI-03 dry-run Linear graph scanner in `scheduler/`.
- Add Linear GraphQL project snapshot fetcher with Relay pagination, dependency graph builder, cycle detection, terminal blocker policy, skipped reason taxonomy and native action preview.
- Add `scan project` / `scan fixture` CLI paths and persist scanner observations to `work_item_snapshots`.
- Add delivery docs and Legion evidence for WI-03.

## Verification

- `npm --prefix scheduler test` PASS, 17 tests.
- `npm --prefix scheduler run health -- --db :memory:` PASS.
- `npm run test:regression` PASS, 18 tests.
- `npm run pack:dry-run` PASS.
- `git diff --check` PASS.

## Evidence

- Plan: `.legion/tasks/linear-legion-scheduler-wi-03/plan.md`
- Test report: `.legion/tasks/linear-legion-scheduler-wi-03/docs/test-report.md`
- Review: `.legion/tasks/linear-legion-scheduler-wi-03/docs/review-change.md`
- Walkthrough: `.legion/tasks/linear-legion-scheduler-wi-03/docs/report-walkthrough.html`
- Delivery doc: `docs/linear-legion-scheduler/linear-graph-scanner.md`

## Notes

- Scanner does not claim runs, launch workers or mutate Linear.
- Real `scan project` against a live Linear test project was not executed because this environment does not provide a repo-local `LINEAR_API_KEY`; mock GraphQL pagination and fixture CLI coverage are included.
- PR lifecycle still needs checks/review/merge, worktree cleanup and main workspace refresh.
