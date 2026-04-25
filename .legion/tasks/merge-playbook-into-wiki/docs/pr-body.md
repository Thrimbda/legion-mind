## What

- 把 README 中“设计门禁 / 分层验证 / 证据化汇报”改成更直白的入口说明，并明确映射到 `plan.md`、`docs/rfc.md`、`test-report.md`、`report-walkthrough.md`、`pr-body.md` 等实际产物。
- 把跨任务 durable knowledge 统一收敛到 `.legion/wiki/**`，补齐 `.legion/wiki/index.md` 与 `.legion/wiki/patterns.md` 作为最小落点。
- 将 former playbook 的 CLI 薄层约定迁入 `patterns.md`，并删除 `.legion/playbook.md`。

## Why

- 原有 `playbook` / `wiki` 双概念会让 README、技能文档和知识层落点产生重复心智模型，增加理解与维护成本。
- 本次收敛的目标是让“当前真源”只承认统一 wiki 层，并让新读者在入口处就能看懂三个术语的实际含义。

## How

- 依据 [RFC](./rfc.md) 的 unified wiki 方案，把 former playbook-style durable convention 分类迁入 wiki 页面。
- 依据 [测试报告](./test-report.md) 与 [变更评审](./review-change.md) 的现有证据，确认当前真源不再把 `.legion/playbook.md` 当作活跃路径、README 已提供人话解释、`init` 叙事保持不变。

## Testing

- PASS — [test-report.md](./test-report.md)
- PASS — [review-change.md](./review-change.md)

## Risk / Rollback

- 风险：这是一次中等风险的文档/schema 收敛；若后续口径不一致，可能重新引入 `playbook` / `wiki` 双轨概念。
- 回滚：按 [RFC](./rfc.md) 恢复 `.legion/playbook.md`、撤回 unified wiki 表述，并删除或降级本次迁移带来的 wiki 导航/条目。

## Links

- [Plan](../plan.md)
- [RFC](./rfc.md)
- [Testing](./test-report.md)
- [Review](./review-change.md)
- [Walkthrough](./report-walkthrough.md)
