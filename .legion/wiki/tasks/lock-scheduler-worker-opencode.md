# lock-scheduler-worker-opencode

## Metadata

- `task-id`: `lock-scheduler-worker-opencode`
- `status`: `completed`
- `risk`: `medium`
- `schema-version`: `2026-06-23`
- `historical`: `false`
- `supersedes`: `(none)`
- `superseded-by`: `(none)`

## Outcome Summary

- 本任务更新 Linear + Legion scheduler RFC，把首版 worker runtime 明确锁定为 OpenCode。
- 当前有效结论：scheduler 只实现 OpenCode worker launcher；OpenClaw / Codex / custom worker adapter 不属于当前 RFC scope。
- OpenCode worker startup contract 已写入 RFC：scheduler 生成 prompt artifact，在目标 repo 上下文启动 OpenCode worker，worker 第一动作进入 `legion-workflow`。
- `review-rfc` PASS，无 blocking findings。

## Reusable Decisions

- 外部调度器接入 Legion 时，首版 worker runtime 可以也应该先锁定一个具体 runtime，避免过早 adapter 抽象。
- 当前 Linear + Legion scheduler 只支持 OpenCode worker；未来 runtime 扩展必须单独 RFC。
- 不要用 OpenCode 进程退出码替代 Legion evidence verifier；完成 gate 仍需要 result block、GitHub PR state 和 Legion evidence。

## Related Raw Sources

- `plan`: `.legion/tasks/lock-scheduler-worker-opencode/plan.md`
- `log`: `.legion/tasks/lock-scheduler-worker-opencode/log.md`
- `tasks`: `.legion/tasks/lock-scheduler-worker-opencode/tasks.md`
- `rfc`: `.legion/tasks/lock-scheduler-worker-opencode/docs/rfc.md`
- `review-rfc`: `.legion/tasks/lock-scheduler-worker-opencode/docs/review-rfc.md`
- `report`: `.legion/tasks/lock-scheduler-worker-opencode/docs/report-walkthrough.md`
- `proposal-rfc`: `docs/linear-legion-scheduler/rfc.md`
- `wi-04`: `docs/linear-legion-scheduler/work-items/WI-04-legion-worker-runner.md`

## Notes

- 本任务不实现 OpenCode launcher，也不写死最终 OpenCode CLI 参数。
- 此处修正的是 `linear-legion-scheduler-rfc` 的 design proposal，不改变 LegionMind 自身 OpenCode / OpenClaw 安装支持面。
