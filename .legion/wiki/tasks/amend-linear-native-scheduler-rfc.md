# amend-linear-native-scheduler-rfc

## Metadata

- `task-id`: `amend-linear-native-scheduler-rfc`
- `status`: `completed`
- `risk`: `high`
- `schema-version`: `2026-06-23`
- `historical`: `false`
- `supersedes`: `(none)`
- `superseded-by`: `(none)`

## Outcome Summary

- 本任务修正 Linear + Legion scheduler RFC 与 8 个 WI 文档，不实现 runtime code。
- 当前有效结论：Linear Native Agent layer 是 presentation/control plane，不是 Scheduler machine truth。
- `Issue.delegate`、AgentSession、AgentActivities、Agent Plan、externalUrls、stop/cancel 与 PermissionChange 都必须被建模，但 claim、attempt、locks、evidence、terminal gate 和 downstream unlock 仍归 Scheduler DB。
- `Done` 只代表 `run_terminal_success`。`canceled`、`abandoned`、`duplicate`、`closed-unmerged`、`superseded`、`human rejected`、terminal evidence failure 等是 `run_terminal_non_success`，默认不释放 downstream。
- `run_terminal_success` 对 PR-backed work 要求 PR merged、checks/review satisfied、Legion evidence PASS、`git-worktree-pr` cleanup 和 main refresh 完成。
- PR merged 但 cleanup / main refresh / lifecycle evidence 缺失时进入 `lifecycle_blocked`，不得标记 done，不得解锁 downstream。
- Claim 前必须做 snapshot revalidation；native AgentSession / activity / externalUrls / stop 等 side effects 必须走 DB-backed `native_outbox`。
- `review-rfc` 第一轮 FAIL 后修复 lifecycle gate；最终 PASS。`review-change` 第一轮 FAIL 后修复 WI-06 依赖；最终 PASS。

## Reusable Decisions

- 外部 scheduler 的 native UI layer 只能做 control plane；不能替代 DB truth。
- AgentSession state 可辅助人类观察，但不能用于 `isBlockerSatisfied()`。
- 任何 terminal non-success 都不应默认解锁 downstream；需要 admin explicit ignore / supersede 并写 audit。
- Parallel dispatch / lock release 必须等待 PR terminal tracking 和 lifecycle gate，因此 WI-06 依赖 WI-05。

## Related Raw Sources

- `plan`: `.legion/tasks/amend-linear-native-scheduler-rfc/plan.md`
- `log`: `.legion/tasks/amend-linear-native-scheduler-rfc/log.md`
- `tasks`: `.legion/tasks/amend-linear-native-scheduler-rfc/tasks.md`
- `research`: `.legion/tasks/amend-linear-native-scheduler-rfc/docs/research.md`
- `rfc`: `.legion/tasks/amend-linear-native-scheduler-rfc/docs/rfc.md`
- `review-rfc`: `.legion/tasks/amend-linear-native-scheduler-rfc/docs/review-rfc.md`
- `test-report`: `.legion/tasks/amend-linear-native-scheduler-rfc/docs/test-report.md`
- `review-change`: `.legion/tasks/amend-linear-native-scheduler-rfc/docs/review-change.md`
- `report`: `.legion/tasks/amend-linear-native-scheduler-rfc/docs/report-walkthrough.md`
- `proposal-rfc`: `docs/linear-legion-scheduler/rfc.md`
- `work-items`: `docs/linear-legion-scheduler/work-items/`

## Notes

- 已创建的 Linear issues 如需同步，应以合并后的 repo docs 为真源再进行外部 writeback。
