# Task Brief - LegionMind 使用文档交付

## 问题定义

当前仓库提供了 `legion` 相关命令与流程约束，但缺少一份面向操作者的单点使用说明，无法快速回答以下问题：

- 何时使用 `/legion`、`/legion-rfc-heavy`、`/legion-impl`、`/legion-pr`
- 如何在“最少人工打断”前提下完成端到端交付
- 任务过程产物应落在哪个目录

## 目标与验收

目标：产出一份可直接用于团队执行的 LegionMind 使用文档，并完整走通一次 Autopilot 交付流程。

验收标准：

1. 新增 LegionMind 使用说明文档（`docs/legionmind-usage.md`）。
2. 生成并保留本任务核心产物（统一在任务目录）：
   - `.legion/tasks/legionmind/docs/task-brief.md`
   - `.legion/tasks/legionmind/docs/test-report.md`
   - `.legion/tasks/legionmind/docs/review-code.md`
   - `.legion/tasks/legionmind/docs/report-walkthrough.md`
   - `.legion/tasks/legionmind/docs/pr-body.md`
3. 风险分级与设计策略明确记录（Low/Medium/High + 是否 Epic）。

## 非目标

- 不改动业务代码与运行时逻辑。
- 不在本次任务内执行远端推送或创建线上 PR。

## 假设

1. 当前仓库用于沉淀 Agent 编排模板，文档变更是本次交付主对象。
2. `legion` 相关命令以 `.opencode/commands/*.md` 为准。
3. 本次任务未显式提供 `rfc:heavy` / `epic` / `risk:high` / `plan-only` / `continue` 标签，按默认路径执行。

## 风险/规模分级

- Risk: **Low**
- Epic: **No**
- 标签识别：`[]`（空）
- 设计强度：`design-lite`（无需 RFC）

分级理由：

- 仅涉及文档与流程说明，不涉及外部 API 合约、数据迁移或安全边界变更。
- 变更可快速回滚，且影响面可控。

## 范围

- `docs/legionmind-usage.md`
- `README.md`
- `.opencode/**`
- `skills/legionmind/references/**`
- `.legion/**`

## 验证计划

1. 由 `engineer` 生成/更新使用说明文档。
2. 由 `run-tests` 生成 `.legion/tasks/legionmind/docs/test-report.md`。
3. 由 `review-code` 生成 `.legion/tasks/legionmind/docs/review-code.md`。
4. 由 `report-walkthrough` 生成 `.legion/tasks/legionmind/docs/report-walkthrough.md` 与 `.legion/tasks/legionmind/docs/pr-body.md`。

## 回滚策略

- 回滚方式：直接回退本次文档改动（`docs/`、`.opencode/`、`skills/`）即可。
- 无数据迁移与状态兼容风险。
