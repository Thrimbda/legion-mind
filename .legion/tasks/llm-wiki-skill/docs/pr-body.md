## What

这不是首次创建 `llm-wiki` skill，而是对现有版本的一轮**细化迭代**。
本轮继续保持轻量 `SKILL.md`，并把 references 明确为 **4 个文件**，新增 `references/page-types.md`。
同时把 `SKILL.md` 中的流程图收敛为 2 个 Mermaid 状态机，用于 query 三岔路与 ingest 第一落点判断。

## Why

现有 skill 已基本正确，但抽象度偏高；这轮 refinement 旨在把“能理解理念”推进到“能直接执行”。
重点补齐 bootstrap、page families、决策矩阵、4 段式 query 输出，以及等价导航/日志机制的可写前提。

## How

`SKILL.md` 补强 session bootstrap、操作入口和授权写回门槛，仍保持 skill-creator 风格的精简入口。
`architecture.md`、`page-types.md`、`workflows.md`、`conventions.md` 分别承载架构边界、页面落点、逐步工作流/决策矩阵，以及导航/日志/citation 约定。
状态机只放在最容易误判的两个决策点，避免把入口重新写重，同时让执行 agent 能按 guard 直接做状态迁移。

## Testing

- 结果：PASS
- 详情见 [test-report](./test-report.md)
- 已通过 skill-creator quick validate、`git diff --check`、Mermaid 结构检查、前后场景对照，以及任务文档与当前实现的一致性检查。

## Risk / Rollback

- 主要风险是后续文档再次漂移，或宿主误把“结构化输出/沉淀建议”理解成写回授权。
- 如发现边界变松，优先回退到更保守口径：query 只读、仅允许宿主显式声明的导航/日志机制写回。

## Links

- Plan: [../plan.md](../plan.md)
- RFC: [./rfc.md](./rfc.md)
- Review RFC: [./review-rfc.md](./review-rfc.md)
- Review Code: [./review-code.md](./review-code.md)
- Review Security: [./review-security.md](./review-security.md)
- Walkthrough: [./report-walkthrough.md](./report-walkthrough.md)
