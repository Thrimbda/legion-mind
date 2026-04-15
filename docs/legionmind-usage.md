# LegionMind 使用指南（本仓库）

本文面向需要“少打断、快交付”的操作者，提供从设计到 PR 文案的一站式流程说明。

## 1. LegionMind 是什么

LegionMind 是一套基于 OpenCode 的协作编排方式，由三部分组成：

- Orchestrator：`legion`，负责流程推进与产物编排。
- Brainstorm：`brainstorm`，负责把模糊任务先收敛成稳定 task contract，再生成 `plan.md` 与 `tasks.md` 首版。
- Subagents：`engineer`、`spec-rfc`、`review-rfc`、`run-tests`、`review-code`、`review-security`、`report-walkthrough` 等，分工执行设计、实现、验证与报告。
- 持久化状态：`.legion/tasks/**` 保存 raw task docs（`plan.md` + `log.md` + `tasks.md`），`.legion/wiki/**` 保存跨任务综合知识。

核心原则：默认走“延迟批准”，尽量减少人工中断；通过 PR 评审/合并完成人类把关。

## 2. 路径约定（重要）

- 长期文档放根目录 `docs/`（例如本文件 `docs/legionmind-usage.md`）。
- 任务过程产物放任务目录 `.legion/tasks/<task-id>/docs/`。
- 跨任务综合知识放 `.legion/wiki/`。
- `pr-body` 默认也落在 `.legion/tasks/<task-id>/docs/pr-body.md`，仅在需要对外展示时再导出到根目录 `docs/pr-body.md`。

## 2.5 文档语言约定

- LegionMind 任务文档默认使用当前用户与 agent 的工作语言。
- 若仓库已经有明确的文档语言规范，则跟随仓库规范。
- 不要因为模板示例、历史标题或 RFC 常见英文段落名，就把新产物默认写成英文。

## 3. 先看哪个文件

- `.legion/tasks/<task-id>/plan.md`：唯一任务契约 + 执行索引。这里放问题定义、验收标准、假设/约束/风险、短目标、要点、允许修改的 Scope、设计索引、阶段概览。
- `.legion/tasks/<task-id>/docs/rfc.md`：中高风险任务的设计真源。接口、取舍、迁移、验证映射等细节都在这里。

推荐阅读顺序：`.legion/tasks/<task-id>/plan.md` -> `.legion/tasks/<task-id>/docs/rfc.md`（若存在）-> `.legion/tasks/<task-id>/log.md` / `.legion/tasks/<task-id>/tasks.md`。

使用约定：

- `plan.md` 同时承载稳定任务契约与执行索引，但应保持摘要级，不要扩写成 mini-RFC。
- `plan.md` 的 `设计索引` 在存在 design-lite 或 RFC 时必须提供；没有设计文档时可省略。
- 若任务目录有 `config.json`，它只是 `plan.md` Scope 的 machine-readable mirror，不能扩展或违背 `plan.md`。

## 4. 命令什么时候用

### `/legion`

默认入口。适合 Low/Medium 风险的大多数任务，自动执行：brainstorm task contract -> 设计简述 / RFC -> 实现 -> 测试 -> 评审 -> 报告。

### `/legion-rfc-heavy`

用于 Epic 或 High-risk。只做重设计，不写生产代码：调研 -> RFC -> RFC 对抗审查 -> RFC-only PR 文案。

### `/legion-impl`

用于已有设计上下文后的实现阶段（例如重 RFC 合并后继续）。执行：实现 -> 测试 -> 代码评审 -> 报告。

### `/legion-pr`

本地收尾命令。用于手动提交、推送、创建 PR。GitHub Actions 通常不需要单独执行。

### `/legion-bootstrap`

新仓库初始化命令。用于生成/更新 `.legion/wiki/` 与 `.legion/playbook.md`，建立跨任务查询入口与项目规约索引。

## 5. 典型流程

### 5.1 Low risk 默认流（推荐）

1. 运行 `/legion`。
2. 先通过 brainstorm 收敛目标、验收、Scope、假设与阶段划分。
3. 用收敛后的 task contract 生成 `.legion/tasks/<task-id>/plan.md` 与 `tasks.md` 首版。
4. 进入实现与验证，产出测试与评审报告（均在 `.legion/tasks/<task-id>/docs/`）。
5. 生成 `.legion/tasks/<task-id>/docs/pr-body.md`，直接作为 PR 描述草稿。
6. 本地如需手动提交流程，再执行 `/legion-pr`。

### 5.2 Heavy RFC 流

触发条件：存在 `rfc:heavy`、`epic`、`risk:high` 标签，或明确要求高强度设计先行。

1. 运行 `/legion-rfc-heavy`（设计阶段，不写生产代码）。
2. 先通过 brainstorm 收敛问题定义、验收、Scope 与阶段骨架，再生成 `plan.md` / `tasks.md`。
3. 生成设计产物（`plan`、`research`、`rfc`、`review-rfc`、`report-walkthrough`、`pr-body`；其中 `plan.md` 在任务根目录，其余在 `.legion/tasks/<task-id>/docs/`）。
4. 提交 docs-only Draft PR，等待设计评审与合并。
5. 设计 PR 合并后，使用 `continue` 进入实现阶段（通常执行 `/legion-impl` 或回到 `/legion` 自动续跑）。

补充标签语义：

- `plan-only`：只做设计与计划，不进入实现。
- `continue`：从既有 `.legion/` 任务状态继续执行下一阶段。

## 6. 交付物清单（按模式对齐）

### 5.1 实现模式（`/legion` 或 `/legion-impl`）

建议在 PR 中逐项勾选：

- `.legion/tasks/<task-id>/plan.md`（必需）
- `.legion/tasks/<task-id>/docs/test-report.md`（必需）
- `.legion/tasks/<task-id>/docs/review-code.md`（必需）
- `.legion/tasks/<task-id>/docs/pr-body.md`（必需）
- `.legion/tasks/<task-id>/docs/rfc.md`（Low 可选；Medium/High 必需）
- `.legion/tasks/<task-id>/docs/review-rfc.md`（Low 可选；Medium/High 必需）
- `.legion/tasks/<task-id>/docs/review-security.md`（可选；安全相关或高风险任务建议必需）

### 5.2 Heavy 设计模式（`/legion-rfc-heavy`，design-only）

建议在 docs-only Draft PR 中逐项勾选：

- `.legion/tasks/<task-id>/plan.md`（必需）
- `.legion/tasks/<task-id>/docs/research.md`（必需）
- `.legion/tasks/<task-id>/docs/rfc.md`（必需）
- `.legion/tasks/<task-id>/docs/review-rfc.md`（必需）
- `.legion/tasks/<task-id>/docs/report-walkthrough.md`（必需）
- `.legion/tasks/<task-id>/docs/pr-body.md`（必需）

说明：Heavy 的 design-only 阶段通常不产出 `test-report` 与 `review-code`，它们在进入实现阶段后再生成。

## 7. 本地与 GitHub Actions 的区别

### 本地（CLI）

- 你需要自行决定是否执行 `/legion-pr` 完成 `git add/commit/push/gh pr create`。
- `gh pr create` 可直接使用 `.legion/tasks/<task-id>/docs/pr-body.md` 作为 `--body-file`。

### GitHub Actions（Issue/PR 评论触发）

- 常见场景下由 workflow 自动处理分支、提交与 PR。
- 操作者重点是给清晰指令和标签，不必每一步手动确认。

## 8. 最小排障与回滚

### 常见问题

- 任务未续跑：先检查 `.legion/` 是否存在，再确认当前 active task 是否正确。
- 产物缺失：先检查 `.legion/tasks/<task-id>/docs/`，再重跑实现/验证链路。
- PR 文案不完整：重跑 `report-walkthrough` 以刷新 `.legion/tasks/<task-id>/docs/pr-body.md`。

### 回滚策略

- 文档变更可直接回退到上一提交。
- Heavy 流程下若设计未通过，保持 docs-only PR，修订 RFC 后再次评审，不要提前改生产代码。

---

建议执行习惯：默认先跑 `/legion`；只有在高风险或明确需要先设计时，再切换 `/legion-rfc-heavy`。
