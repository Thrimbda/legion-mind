# remove-pr-quota-enforcement-v1

## Metadata

- `task-id`: `remove-pr-quota-enforcement-v1`
- `status`: `delivery-ready`
- `risk`: `high`
- `schema-version`: `no-auto-closeout-v1`
- `historical`: `false`
- `supersedes`: `enforce-single-pr-lifecycle-v1` hard quota/binding decision
- `superseded-by`: `(none)`

## Outcome Summary

当前 Legion workflow 不设 task 级 PR 数量配额或永久 PR identity。Scheduler 只把 PR URL 作为当前 run metadata，fresh DB 不创建 binding table，已升级数据库的旧表保留但由 runtime 忽略。

真正保留的流程边界是：PR terminal 后的 checks、merge、cleanup、refresh、publish/deploy 等事实只进入外部 lifecycle 与最终交接，不自动创建 status-writeback PR。用户明确授权后，后续仓库交付可以使用新的 branch/PR。

## Reusable Decisions

- 自动流程不得仅为 terminal 状态写回创建 closeout、publish-result、deploy-result 或 wiki-only PR。
- 用户明确授权的后续仓库改动不受 task 级数字配额或跨 run identity gate 限制。
- `delivery-ready` 只表示当前 commit 内 repo evidence 完成；delivery terminal 由 GitHub、Scheduler 与本地 lifecycle 观察决定。
- direct Git lifecycle observation、checks/review 与 evidence gate 继续保留。

## Related Raw Sources

- `plan`: `.legion/tasks/remove-pr-quota-enforcement-v1/plan.md`
- `log`: `.legion/tasks/remove-pr-quota-enforcement-v1/log.md`
- `tasks`: `.legion/tasks/remove-pr-quota-enforcement-v1/tasks.md`
- `research`: `.legion/tasks/remove-pr-quota-enforcement-v1/docs/research.md`
- `rfc`: `.legion/tasks/remove-pr-quota-enforcement-v1/docs/rfc.md`
- `review-rfc`: `.legion/tasks/remove-pr-quota-enforcement-v1/docs/review-rfc.md`
- `test-report`: `.legion/tasks/remove-pr-quota-enforcement-v1/docs/test-report.md`
- `review-change`: `.legion/tasks/remove-pr-quota-enforcement-v1/docs/review-change.md`
- `report-data`: `.legion/tasks/remove-pr-quota-enforcement-v1/docs/report-data.json`
- `walkthrough`: `.legion/tasks/remove-pr-quota-enforcement-v1/docs/report-walkthrough.md`

## Notes

- 当前实现、返修后独立验证与独立复审均为 `PASS`；repo evidence 已达到 `delivery-ready`，不预写 PR merge、cleanup 或 refresh 结果。
- 历史 hard quota/binding 证据仍保留在 `.legion/tasks/enforce-single-pr-lifecycle-v1/`，但不再是当前规范。
