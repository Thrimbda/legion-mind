# linear-legion-scheduler-wi-02

## Metadata

- `task-id`: `linear-legion-scheduler-wi-02`
- `status`: `completed-through-review`
- `risk`: `medium`
- `schema-version`: `2026-06-24`
- `historical`: `false`
- `supersedes`: `(none)`
- `superseded-by`: `extract-linear-scheduler-npm-project` (project layout only)

## Outcome Summary

- WI-02 now has a SQLite-backed scheduler core implementation using Node.js `node:sqlite` / `DatabaseSync`.
- The implementation adds migrations for `runs`, `run_attempts`, `work_item_snapshots`, `resource_locks`, `scheduler_events`, `webhook_events` and `native_outbox`.
- `SchedulerStore.claimReadyWorkItem()` owns the local durable claim transaction: snapshot revalidation, active-run check, lock acquisition, run / attempt creation, scheduler event and native / worker outbox enqueue.
- The run state machine is now located in `scheduler/src/state-machine.ts`; `done` is the only terminal success state, while `failed`, `cancelled` and `abandoned` remain terminal non-success.
- Native stop is represented in DB state and an idempotent `final_response` outbox job; it does not satisfy downstream blockers by default.
- `docs/linear-legion-scheduler/scheduler-core-sqlite.md` is the WI-02 delivery artifact and handoff for WI-03 / WI-04 / WI-05; runtime code now lives in standalone npm project `scheduler/`.
- Current validation surface after project extraction: `npm --prefix scheduler test`, `npm --prefix scheduler run health -- --db :memory:`, root `npm run test:regression`, root `npm run pack:dry-run`, and `git diff --check`.

## Reusable Decisions

- WI-02 uses SQLite for the local durable-state prototype per user constraint. This is not a permanent production DB decision; later backends must preserve the same repository, transaction, lock and outbox semantics.
- Scheduler DB remains machine truth for active runs, attempts, locks, events, native mapping, delivery / evidence gates and downstream unlock. Linear native agent objects remain presentation/control plane.
- Worker launch must be driven by an outbox row (`worker_dispatch`) rather than happening inside the claim transaction.
- Runtime data SQL must be parameterized; only locally defined enum lists are interpolated into schema SQL.
- Non-success terminal states do not satisfy blockers. Admin override is represented only as an audit event and does not convert the run to success.

## Related Raw Sources

- `plan`: `.legion/tasks/linear-legion-scheduler-wi-02/plan.md`
- `log`: `.legion/tasks/linear-legion-scheduler-wi-02/log.md`
- `tasks`: `.legion/tasks/linear-legion-scheduler-wi-02/tasks.md`
- `test-report`: `.legion/tasks/linear-legion-scheduler-wi-02/docs/test-report.md`
- `review`: `.legion/tasks/linear-legion-scheduler-wi-02/docs/review-change.md`
- `walkthrough`: `.legion/tasks/linear-legion-scheduler-wi-02/docs/report-walkthrough.md`
- `delivery`: `docs/linear-legion-scheduler/scheduler-core-sqlite.md`
- `work-item`: `docs/linear-legion-scheduler/work-items/WI-02-scheduler-core-state.md`
- `layout-amendment`: `.legion/tasks/extract-linear-scheduler-npm-project/plan.md`

## Notes

- This task does not connect to real Linear, GitHub, webhook HTTP handlers or OpenCode worker launch. Those remain WI-03 / WI-04 / WI-05 / WI-07 responsibilities.
- PR lifecycle still determines final delivery status; this wiki page records the completed Legion evidence state before GitHub terminal state.
- Historical raw docs for WI-02 may still mention the original root `scripts/` placement; current layout truth is the later `extract-linear-scheduler-npm-project` task and `scheduler/` project.
