# optimize-token-cognitive-efficiency

## Metadata

- `task-id`: `optimize-token-cognitive-efficiency`
- `status`: `completed`
- `risk`: `medium`
- `schema-version`: `2026-07-12`
- `historical`: `false`
- `supersedes`: `(none)`
- `superseded-by`: `(none)`

## Outcome Summary

- Legion 入口现在区分普通路径、明确微操作与 Legion 路径；普通只读、无行为文档整理和明确低风险修改不再默认启动完整 workflow。
- 阶段完整证据继续写入 task docs，对话与 subagent 只投影五字段判断增量；`none | skim | review | decide` 和声明级五状态仍保留原门禁。
- 子代理由脚本生成随机 role-adjective-noun `displayName`，同时保留固定 `agentType` 权限职责与可选 `transportId`，避免 OpenCode 把实例名误作 agent type。
- 14 个 hot 文件从 70,581 降至 23,559 个 Unicode 字符，中风险闭包从 96,146 降至 34,254；报告由单一 `report-data.json` 通过 schema 与固定模板生成 HTML、Markdown 和 PR body。

## Reusable Decisions

- Legion 只为不确定、多步骤或高风险工作接管；安全、数据、外部合约和跨模块变更不得降级。
- 完整证据与低噪音会话交接分层：文件保存可审计上下文，会话只传当前结论、变化、风险、下一步和证据入口。
- 子代理的权限职责与人类可辨识实例名必须分离；随机名称不参与权限选择。
- reviewer artifact 只维护一份 schema 数据源，生成产物不手写；生成失败不能退回双真源。

## Related Raw Sources

- `plan`: `.legion/tasks/optimize-token-cognitive-efficiency/plan.md`
- `log`: `.legion/tasks/optimize-token-cognitive-efficiency/log.md`
- `tasks`: `.legion/tasks/optimize-token-cognitive-efficiency/tasks.md`
- `rfc`: `.legion/tasks/optimize-token-cognitive-efficiency/docs/rfc.md`
- `reviews`: `.legion/tasks/optimize-token-cognitive-efficiency/docs/review-rfc.md`、`.legion/tasks/optimize-token-cognitive-efficiency/docs/review-change.md`
- `verification`: `.legion/tasks/optimize-token-cognitive-efficiency/docs/test-report.md`
- `report`: `.legion/tasks/optimize-token-cognitive-efficiency/docs/report-walkthrough.md`、`.legion/tasks/optimize-token-cognitive-efficiency/docs/report-walkthrough.html`

## Notes

- 本页只保存当前可查询结论；精确入口、预算、命名、attention、认知验证和生成规则仍以 `skills/**` 与 `AGENTS.md` 为真源。
- `completed` 表示实现内容已通过阶段验证与审查；PR 终态、checks/review、worktree cleanup 与主工作区刷新仍由 `git-worktree-pr` lifecycle 独立判定，本页不能替代该证据。
- 当前 HTML 渲染交接为 `artifact-only`，因为仓库没有既有 Pages/预览 workflow；这不是 rendered URL。
