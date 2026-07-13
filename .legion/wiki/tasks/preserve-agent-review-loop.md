# preserve-agent-review-loop

## Metadata

- `task-id`: `preserve-agent-review-loop`
- `status`: `completed`
- `risk`: `high`
- `schema-version`: `2026-07-13 / report-data v1.1`
- `historical`: `false`
- `supersedes`: `(none)`
- `superseded-by`: `(none)`

## Outcome Summary

- 三项原始缺陷已经修复：PASS 收口报告会重读当前阶段唯一、规范的 `## Verdict`；无真实 verifier 的 `domain` / `authority` 未决主张可如实表达而不伪造 provenance；OpenCode 报告 Agent 可精确写入 `docs/report-data.json`，原 Markdown 权限保持不变。
- `report-data.json` 是机器中间真源，不是第四份人类报告；renderer 校验后一次、事务式派生 HTML、Markdown 和 PR body，worker 到 scheduler 的 `reportData` locator 也已纳入完整证据门。
- renderer 与 scheduler 对固定 repo-relative locator 和精确 canonical realpath 同时绑定，拒绝仓库外、跨 task、同 task 其他文件及中间目录 symlink，同时保留 repo root 经 symlink 访问的合法正例。
- RFC 作者与独立 reviewer、engineer 与 verifier、verifier 与独立 acceptance reviewer 仍由不同阶段 Agent 执行，失败仍回到对应作者阶段；token 优化只来自按需加载、校验去重和五字段短交接。
- 实现、独立验证与独立变更审查均为 `PASS`；当前权威报告为 `claims=[]`、`attention: skim`，HTML 使用 `render.state=local` fallback。真实多任务、多模型旧新版本 A/B 只是一项可选、非阻塞的后续效果评估建议，不是当前 claim 或 merge gate。

## Reusable Decisions

- 完成性门必须从固定 locator 重读当前阶段 Verdict，不能信任报告自身的 PASS 声明，也不能从正文任意位置搜索历史状态。
- 固定 locator 不仅要做字面匹配和目录 containment，还必须绑定规范仓库根下的精确 canonical realpath；跨 task、同 task 其他文件与中间目录 symlink 都应 fail-closed。
- 缺少领域或权威 verifier 时不得隐藏 claim 或伪造 provenance；应保留未决状态、证据缺口、升级或延后协议、唯一人类动作、停止点与证据入口。
- 报告内容修改回到 `report-data.json`，布局修改回到共享模板；三个面向人的生成产物不得形成第二套手写真源。
- OpenCode 权限只精确开放 `.legion/tasks/**/docs/report-data.json`，不得扩张为 `*.json`；这项权限用于正常 edit/write，不把 shell 绕过当作流程能力。
- 不得以减少 token 为由删除真实阶段派生、独立写审对或 FAIL 回退。会话只传判断增量，完整证据仍落在 task docs。

## Related Raw Sources

- `plan`: `.legion/tasks/preserve-agent-review-loop/plan.md`
- `log`: `.legion/tasks/preserve-agent-review-loop/log.md`
- `tasks`: `.legion/tasks/preserve-agent-review-loop/tasks.md`
- `rfc`: `.legion/tasks/preserve-agent-review-loop/docs/rfc.md`
- `reviews`: `.legion/tasks/preserve-agent-review-loop/docs/review-rfc.md`、`.legion/tasks/preserve-agent-review-loop/docs/review-change.md`
- `verification`: `.legion/tasks/preserve-agent-review-loop/docs/test-report.md`
- `report data`: `.legion/tasks/preserve-agent-review-loop/docs/report-data.json`
- `report`: `.legion/tasks/preserve-agent-review-loop/docs/report-walkthrough.md`、`.legion/tasks/preserve-agent-review-loop/docs/report-walkthrough.html`、`.legion/tasks/preserve-agent-review-loop/docs/pr-body.md`

## Notes

- 精确 schema、Verdict 解析、阶段集合、attention 与权限规则仍以 `skills/**`、`.opencode/**` 和 scheduler 代码为真源；本页不复制字段定义。
- 当前实现保证固定 repo-relative locator 与规范真实路径的读取边界，不宣称抵抗恶意本机并发替换，也不提供跨 transport 身份 attestation。
- 当前报告没有登记未决领域或权威 claim；真实多任务、多模型 A/B 可在未来用固定模型与固定任务套件评估，但不阻塞本次交付。
- 当前 HTML 仅提供本地可打开的 fallback；仓库尚无受控 preview，后续若提供受控机制或明确批准 Pages，再恢复 rendered URL。
- 主交付 PR #50 已 squash merge 为 `df90d72`；当时仓库没有 required checks 或 GitHub review 阻塞，隔离 worktree、远端/本地任务分支均已清理，主工作区已刷新到合并后的 `origin/master`。本页状态因此为 `completed`。
