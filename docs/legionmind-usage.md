# LegionMind 使用说明（本仓库）

本文面向需要“少打断、快交付”的操作者，提供从设计到 PR 文案的一站式流程说明。

## 1. LegionMind 是什么

LegionMind 是一套基于 OpenCode 的协作编排方式，由三部分组成：

- 编排器：`legion`，负责流程推进与产物编排。
- 收敛阶段：`brainstorm`，负责把模糊任务先收敛成稳定任务契约，再生成 `plan.md` 与 `tasks.md` 首版。
- 子代理：`engineer`、`spec-rfc`、`review-rfc`、`verify-change`、`review-change`、`report-walkthrough` 等，分工执行设计、实现、验证与报告。
- 持久化状态：`.legion/tasks/**` 保存原始任务文档（`plan.md` + `log.md` + `tasks.md`），`.legion/wiki/**` 保存跨任务综合知识。

核心原则：默认走“延迟批准”，尽量减少人工中断；通过 PR 评审/合并完成人类把关。

## 2. 路径约定（重要）

- 长期文档放根目录 `docs/`（例如本文件 `docs/legionmind-usage.md`）。
- 任务过程产物放任务目录 `.legion/tasks/<task-id>/docs/`。
- 跨任务综合知识放 `.legion/wiki/`。
- `pr-body` 默认也落在 `.legion/tasks/<task-id>/docs/pr-body.md`，仅在需要对外展示时再导出到根目录 `docs/pr-body.md`。

## 2.5 文档语言约定

- LegionMind 任务文档默认使用当前用户与智能体的工作语言。
- 若仓库已经有明确的文档语言规范，则跟随仓库规范。
- 不要因为模板示例、历史标题或 RFC 常见英文段落名，就把新产物默认写成英文。

## 3. 先看哪个文件

- `.legion/tasks/<task-id>/plan.md`：唯一任务契约 + 执行索引。这里放问题定义、验收标准、假设/约束/风险、短目标、要点、允许修改的作用域、设计索引、阶段概览。
- `.legion/tasks/<task-id>/docs/rfc.md`：中高风险任务的设计真源。接口、取舍、迁移、验证映射等细节都在这里。

推荐阅读顺序：`.legion/tasks/<task-id>/plan.md` -> `.legion/tasks/<task-id>/docs/rfc.md`（若存在）-> `.legion/tasks/<task-id>/log.md` / `.legion/tasks/<task-id>/tasks.md`。

使用约定：

- `plan.md` 同时承载稳定任务契约与执行索引，但应保持摘要级，不要扩写成迷你 RFC。
- `plan.md` 的 `设计索引` 在存在轻量设计或 RFC 时必须提供；没有设计文档时可省略。
- 若任务目录有 `config.json`，它只是 `plan.md` 作用域的可机读镜像，不能扩展或违背 `plan.md`。

## 4. 运行模式怎么选

### 默认实现模式

默认入口。适合低风险或中风险的大多数任务，主干是：接管判定 -> 恢复活跃任务或进入 `brainstorm` -> 设计简述 / RFC -> 实现 -> 测试 -> 评审 -> 报告 -> 收口写回。

### 重型设计模式

用于史诗级任务或高风险任务。只做重设计，不写生产代码，主干是：接管判定 -> 恢复或 `brainstorm` -> 调研 / RFC -> RFC 对抗审查 -> 面向评审者的摘要 -> 收口写回。

### 已批准设计后的实现续跑

用于已有稳定契约且设计已经批准后的实现阶段，主干是：恢复任务 -> `engineer` -> `verify-change` -> `review-change` -> `report-walkthrough` -> 收口写回。

### 本地 PR 收尾

这不是工作流真源，而是本地手动提交流程。需要提交、推送或创建 PR 时，直接使用常规 `git` / `gh` 命令。

### 仓库初始化

这也不是子代理派生真源。首次进入新仓库时，先完成安装、CLI 初始化，以及 `.legion/wiki/` / `.legion/playbook.md` 的基础结构建立。

## 5. 典型流程

### 5.1 低风险默认流（推荐）

1. 从 `legion-workflow` 入口开始，让它先判断是否接管、恢复活跃任务，或进入 `brainstorm`。
2. 通过 `brainstorm` 收敛目标、验收、作用域、假设与阶段划分。
3. 用收敛后的任务契约生成 `.legion/tasks/<task-id>/plan.md` 与 `tasks.md` 首版。
4. 进入实现与验证，产出测试与评审报告（均在 `.legion/tasks/<task-id>/docs/`）。
5. 生成 `.legion/tasks/<task-id>/docs/pr-body.md`，直接作为 PR 描述草稿。
6. 本地如需手动提交流程，直接执行常规 `git add/commit/push` 与 `gh pr create`。

### 5.2 重型 RFC 流

触发条件：存在 `rfc:heavy`、`epic`、`risk:high` 标签，或明确要求高强度设计先行。

1. 从 `legion-workflow` 入口开始，并进入重型设计模式（设计阶段，不写生产代码）。
2. 先通过 `brainstorm` 收敛问题定义、验收、作用域与阶段骨架，再生成 `plan.md` / `tasks.md`。
3. 生成设计产物（`plan`、`research`、`rfc`、`review-rfc`、`report-walkthrough`、`pr-body`；其中 `plan.md` 在任务根目录，其余在 `.legion/tasks/<task-id>/docs/`）。
4. 提交仅文档的草稿 PR，等待设计评审与合并。
5. 设计 PR 合并后，使用 `continue` 进入实现阶段，按“已批准设计后的实现续跑”继续。

补充标签语义：

- `plan-only`：只做设计与计划，不进入实现。
- `continue`：从既有 `.legion/` 任务状态继续执行下一阶段。

## 6. 交付物清单（按模式对齐）

### 5.1 实现模式（默认实现流或设计已批准后的实现续跑）

建议在 PR 中逐项勾选：

- `.legion/tasks/<task-id>/plan.md`（必需）
- `.legion/tasks/<task-id>/docs/test-report.md`（必需）
- `.legion/tasks/<task-id>/docs/review-change.md`（必需）
- `.legion/tasks/<task-id>/docs/pr-body.md`（必需）
- `.legion/tasks/<task-id>/docs/rfc.md`（低风险可选；中风险 / 高风险必需）
- `.legion/tasks/<task-id>/docs/review-rfc.md`（低风险可选；中风险 / 高风险必需）
- 安全相关或高风险任务由 `review-change` 在同一份审查中展开安全视角，不再额外要求独立 `review-security.md`

### 5.2 重型设计模式（仅设计）

建议在仅文档的草稿 PR 中逐项勾选：

- `.legion/tasks/<task-id>/plan.md`（必需）
- `.legion/tasks/<task-id>/docs/research.md`（必需）
- `.legion/tasks/<task-id>/docs/rfc.md`（必需）
- `.legion/tasks/<task-id>/docs/review-rfc.md`（必需）
- `.legion/tasks/<task-id>/docs/report-walkthrough.md`（必需）
- `.legion/tasks/<task-id>/docs/pr-body.md`（必需）

说明：重型模式的仅设计阶段通常不产出 `test-report` 与 `review-change`，它们会在进入实现阶段后再生成。

## 7. 本地与 GitHub Actions 的区别

### 本地（CLI）

- 你需要自行决定是否执行常规 `git add/commit/push/gh pr create` 完成本地提交流程。
- `gh pr create` 可直接使用 `.legion/tasks/<task-id>/docs/pr-body.md` 作为 `--body-file`。

### GitHub Actions（Issue/PR 评论触发）

- 常见场景下由工作流自动处理分支、提交与 PR。
- 操作者重点是给清晰指令和标签，不必每一步手动确认。

## 8. 最小排障与回滚

### 常见问题

- 任务未续跑：先检查 `.legion/` 是否存在，再确认当前 active task 是否正确。
- 产物缺失：先检查 `.legion/tasks/<task-id>/docs/`，再重跑实现/验证链路。
- PR 文案不完整：重跑 `report-walkthrough` 以刷新 `.legion/tasks/<task-id>/docs/pr-body.md`。

### 回滚策略

- 文档变更可直接回退到上一提交。
- 重型流程下若设计未通过，保持仅文档 PR，修订 RFC 后再次评审，不要提前改生产代码。

---

建议执行习惯：默认走“默认实现模式”；只有在高风险或明确需要先设计时，再切到“重型设计模式”。
