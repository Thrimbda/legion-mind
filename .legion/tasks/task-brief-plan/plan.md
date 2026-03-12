# 精简 task-brief 与 plan 的职责边界

## 目标

将 LegionMind 重构为 plan-only 工作流：移除 `task-brief.md`，由 `plan.md` 同时承载稳定任务契约与执行索引，并同步更新相关技能、命令与使用文档。

## 问题陈述

当前 LegionMind 同时维护 `docs/task-brief.md` 与 `plan.md` 两份人类可读任务契约，导致初始化、续跑、评审与文档维护都要在双真源之间切换。

这种结构放大了 prompt、schema、command 与 usage docs 的漂移风险，也让当前任务本身无法作为 plan-only 样例复用。

## 验收标准

- [ ] 核心 LegionMind 文档、agent prompt、commands、usage guide 不再把 `task-brief.md` 或 `taskBriefPath` 作为标准输入/输出。
- [ ] `plan.md` 被定义为唯一的人类可读任务契约，覆盖问题定义、验收、假设/约束/风险、目标、要点、范围、设计索引、阶段概览，且保持摘要级。
- [ ] `context.md` 仍只负责进度、决策、handoff，`tasks.md` 仍只负责机器可读 checklist，`rfc.md` 仍只在中高风险任务下承载详细设计。
- [ ] LegionMind 任务文档默认跟随当前用户与 agent 的工作语言，不再把英文视为隐式默认值。
- [ ] 当前任务 `task-brief-plan` 自身完成 plan-only 化：关键信息并入 `plan.md`，并移除 `docs/task-brief.md`。

## 假设 / 约束 / 风险

- **假设**: 本次改造聚焦 LegionMind 层契约与文档，不修改 `.legion` MCP 工具实现。
- **约束**: `plan.md` 必须保持摘要级，详细设计、迁移与验证细节继续放在 `docs/rfc.md` 等附属文档；`config.json` 若存在，只能镜像 `plan.md` Scope。
- **风险**: 若仍有少量 workflow 文档残留旧字段，后续新增任务可能重新引入双真源；因此需要同步更新模板、命令和样例任务。

## 要点

- 移除 `task-brief.md`，不做 LegionMind 层向后兼容
- 把 `plan.md` 定义为唯一任务契约与执行索引
- 确保命令、agent 提示词、schema 与使用文档口径一致
- 当前任务本身作为 plan-only 示例完成收敛

## 范围

- skills/legionmind/**
- .opencode/agents/**
- .opencode/commands/**
- docs/**
- .legion/**

## 设计索引

> **Design Source of Truth**: `.legion/tasks/task-brief-plan/docs/rfc.md`

**摘要**:
- 工作流模型：`plan.md` 固定问题、验收、假设/约束/风险、目标、要点、范围、设计索引与阶段概览；`rfc.md` 仅承载中高风险任务的详细设计。
- 验证策略：通过 `review-rfc`、轻量验证、代码审查与安全审查确认 contract、语言规则、scope 真源与越界门禁一致。

## 阶段概览

1. **建模与设计** - 2 个任务
2. **实现与同步** - 2 个任务
3. **验证与交付** - 2 个任务

---

*创建于: 2026-03-12 | 最后更新: 2026-03-12*
