# Legion 日志同步协议

目标：完整证据落文件，会话只传判断增量，避免重复阅读和责任漂移。

## Subagent handoff

统一使用最多五个字段：

```text
结果: <displayName> · <stage> · <PASS|FAIL|BLOCKED|DONE> · attention:<level>
变化: <判断变化与关键发现合计最多三条>
风险: <仅当前有效风险；无则省略>
下一步: <一个自动动作；review/decide 时写唯一人类动作与停止点>
证据: <最多三个 repo-relative locator>
```

不得复制 contract、diff、长日志、命令全量输出或已落盘正文。投影与证据冲突、风险无法收敛、证据 locator 缺失，或 `review/decide` 缺停止点时不得继续。

## Orchestrator 归档

- 稳定 contract 变化写 `plan.md`；过程/决定/风险/下一步追加 `log.md`；可验收动作同步 `tasks.md`。
- RFC、review、验证和报告正文写 `docs/`；跨任务 durable 知识写 wiki。
- 对话不重复文件正文；派生前从 repo locator 读取所需片段。

## 角色边界

- `spec-rfc` 设计；`review-*` 只读审查；`engineer` 实现与最小自检；`verify-change` 正式验证；orchestrator 独占 `.legion` 三文件同步与生命周期闭环。
