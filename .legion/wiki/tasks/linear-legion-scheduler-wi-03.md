# linear-legion-scheduler-wi-03

## Metadata

- `task-id`: `linear-legion-scheduler-wi-03`
- `status`: `completed-through-review`
- `risk`: `medium`
- `schema-version`: `2026-06-24`
- `historical`: `false`
- `supersedes`: `(none)`
- `superseded-by`: `(none)`

## Outcome Summary

- WI-03 now delivers a dry-run Linear graph scanner in the standalone `scheduler/` npm project.
- `scheduler/src/scanner.ts` fetches Linear project issues through the GraphQL API shape, normalizes labels / state / relation data, builds a `blocker -> blocked` dependency graph, detects cycles and emits a deterministic `ready` / `skipped` / `cycles` report.
- Scanner output includes ready item priority, lock keys, `snapshotHash`, `linearUpdatedAt` and a native action preview for future AgentSession / delegate / activity / external URL side effects.
- Scanner is read-only toward Linear: it does not claim runs, launch workers, mutate Linear labels/comments/state/delegate, create AgentSessions or send AgentActivities.
- Scanner persists observations to WI-02 `work_item_snapshots` so later diff/debug and claim-time revalidation can use the same durable snapshot boundary.
- `isBlockerSatisfied()` now exists at scanner level and uses Scheduler DB truth before Linear fallback: run `done` only satisfies when delivery/evidence gates pass; terminal non-success and inconsistent terminal state do not unlock downstream; manual Linear Done is accepted only when no scheduler run exists and no active agent labels are present.
- `scheduler/src/cli.ts` now exposes `scan project` and `scan fixture` dry-run commands.
- WI-03 delivery artifact is `docs/linear-legion-scheduler/linear-graph-scanner.md`.

## Reusable Decisions

- Linear project scanning is a pure evaluation step. It may persist snapshots and print reports, but it must not execute native agent side effects or claim transactions.
- Required skipped reasons are typed and reportable: `agent_ready_missing`, `contract_not_stable`, `dependency_blocked`, `dependency_cycle`, `human_gate`, `repo_mapping_missing`, `active_run_exists`, `resource_conflict`, `project_paused` and `stale_snapshot`; additional policy/debug reasons can be included without replacing the required taxonomy.
- Graph direction remains `blocker -> blocked`. Downstream readiness depends on every incoming blocker satisfying `isBlockerSatisfied()`.
- Linear API / relation field assumptions should stay isolated in the scanner adapter and locked with mock GraphQL fixtures before being trusted by dispatcher WIs.
- Root `npm run test:regression` and scheduler `npm --prefix scheduler test` remain separate validation surfaces. WI-03 expands scheduler tests to scanner behavior.

## Validation Summary

- `npm --prefix scheduler test`: PASS, 17 tests.
- `npm --prefix scheduler run health -- --db :memory:`: PASS.
- `npm run test:regression`: PASS, 18 tests.
- `npm run pack:dry-run`: PASS.
- `git diff --check`: PASS.
- Real `scan project` against a live Linear test project was not run because no repo-local `LINEAR_API_KEY` / dedicated test project was available.

## Related Raw Sources

- `plan`: `.legion/tasks/linear-legion-scheduler-wi-03/plan.md`
- `log`: `.legion/tasks/linear-legion-scheduler-wi-03/log.md`
- `tasks`: `.legion/tasks/linear-legion-scheduler-wi-03/tasks.md`
- `test-report`: `.legion/tasks/linear-legion-scheduler-wi-03/docs/test-report.md`
- `review`: `.legion/tasks/linear-legion-scheduler-wi-03/docs/review-change.md`
- `walkthrough-html`: `.legion/tasks/linear-legion-scheduler-wi-03/docs/report-walkthrough.html`
- `walkthrough-md`: `.legion/tasks/linear-legion-scheduler-wi-03/docs/report-walkthrough.md`
- `render-handoff`: `.legion/tasks/linear-legion-scheduler-wi-03/docs/render-handoff.md`
- `delivery`: `docs/linear-legion-scheduler/linear-graph-scanner.md`
- `work-item`: `docs/linear-legion-scheduler/work-items/WI-03-linear-graph-scanner.md`

## Notes

- Rendered HTML preview is blocked until PR exists and repository Pages / preview policy is confirmed. Reviewers can still open the committed HTML artifact from the PR branch.
- Claim transaction, OpenCode worker dispatch, PR tracking, parallel dispatch, webhook recovery and operations/security hardening remain later WIs.
