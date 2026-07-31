# enforce-single-pr-lifecycle-v1

## Metadata

- `task-id`: `enforce-single-pr-lifecycle-v1`
- `status`: `delivery-ready`
- `risk`: `high`
- `schema-version`: `single-pr-lifecycle-v1`
- `historical`: `false`
- `supersedes`: same-task implementation PR plus post-terminal closeout/publish-result PR
- `superseded-by`: `(none)`

## Outcome Summary

Legion task 的 PR 配额固定为 `0..1`。仓库内 contract、实现、验证、review、walkthrough 与 wiki 在唯一 PR terminal 前收敛为 `delivery-ready`；merged/closed 后只允许外部 lifecycle、worktree cleanup、主工作区 refresh 与最终报告，不再回写仓库。

Scheduler 使用 `repoKey + taskId` 的 task-level write-once binding，原子拒绝不同 PR identity、并发首次绑定冲突、terminal 后新 run 与 legacy 多 identity。fresh binding 为 `open`；历史 `done` 回填为 `merged`，其他单一 legacy identity 为 `unknown`，必须等 tracker 观察同一 PR 后才可能恢复。Git lifecycle 由 Scheduler 直接观察 worktree、fetch、base、dirty state 与 merge ancestry，不再接受 worker 自报 JSON。

## Reusable Decisions

- 同一 task 不存在 closeout、publish-result、deploy-result、wiki-only 或 replacement PR 例外。
- PR-backed repo state 使用 `delivery-ready`；GitHub/Scheduler 是 delivery terminal 真源。
- 纯外部发布/部署可重试；需要仓库修改时停止原 task，由用户明确创建新 task。
- merged 后缺 repo evidence 直接成为 final non-success：释放 run locks、保持 downstream locked，并禁止 original task 的 repository repair。
- design 与 implementation 属于同一 task 时必须留在同一 Draft/正式 PR；plan-only/rfc-only 后的实现是新的用户任务。

## Related Raw Sources

- `plan`: `.legion/tasks/enforce-single-pr-lifecycle-v1/plan.md`
- `log`: `.legion/tasks/enforce-single-pr-lifecycle-v1/log.md`
- `tasks`: `.legion/tasks/enforce-single-pr-lifecycle-v1/tasks.md`
- `research`: `.legion/tasks/enforce-single-pr-lifecycle-v1/docs/research.md`
- `rfc`: `.legion/tasks/enforce-single-pr-lifecycle-v1/docs/rfc.md`
- `review-rfc`: `.legion/tasks/enforce-single-pr-lifecycle-v1/docs/review-rfc.md`
- `verification`: `.legion/tasks/enforce-single-pr-lifecycle-v1/docs/test-report.md`
- `review-change`: `.legion/tasks/enforce-single-pr-lifecycle-v1/docs/review-change.md`
- `report`: `.legion/tasks/enforce-single-pr-lifecycle-v1/docs/report-walkthrough.md`

## Notes

- 本页只声明当前 tree 内可证明的 `delivery-ready`，不预写唯一 PR 的 merge、cleanup 或 refresh。
- delivery terminal 由唯一 PR、Scheduler/lifecycle 观察与最终交接承载；本页不会在 terminal 后追写 `completed`。
