# workflow-profiles-model-routing-v1

## Metadata

- `task-id`: `workflow-profiles-model-routing-v1`
- `status`: `active`
- `risk`: `high`
- `schema-version`: `profile-disposition-v1`
- `historical`: `false`
- `supersedes`: fixed Legion stage chain and OpenCode custom-agent installation layer
- `superseded-by`: (none)

## Outcome Summary

Legion 任务从固定长链改为 Lite、Standard、Strict 三档最低 profile。walkthrough 与 Wiki 改为独立、只升不降的 disposition；日志改为事件驱动。OpenCode custom agents 退出配置、安装与 npm 包，旧 managed agents 使用可回滚且保留用户漂移的迁移。主工作区刷新改为本地分支 + fast-forward 脚本，避免 detached HEAD。

scheduler 与 per-spawn 模型路由明确延期，本任务未修改 scheduler 源码。

## Reusable Decisions

- profile 只按风险、边界和回滚代价升级，不以 LOC、文件数或耗时降级。
- Strict 强制 walkthrough；Lite/Standard 默认为 summary。Wiki 只为 durable knowledge 写回。
- 独立上下文不依赖 OpenCode custom agent 文件。
- retired asset 必须显式声明；required source 缺失不能被推断为退役。
- tests 优先验证可观察行为；机器协议、schema 和 Verdict 保持精确。

## Related Raw Sources

- `plan`: `.legion/tasks/workflow-profiles-model-routing-v1/plan.md`
- `log`: `.legion/tasks/workflow-profiles-model-routing-v1/log.md`
- `tasks`: `.legion/tasks/workflow-profiles-model-routing-v1/tasks.md`
- `rfc`: `.legion/tasks/workflow-profiles-model-routing-v1/docs/rfc.md`
- `review`: `.legion/tasks/workflow-profiles-model-routing-v1/docs/review-rfc.md`

## Notes

- 精确规则以 `skills/**`、`opencode.json`、setup scripts 和行为测试为真源。
- 当前 status 在 PR lifecycle 完成前保持 active。
