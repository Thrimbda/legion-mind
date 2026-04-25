# Align Legion entry semantics

## 目标

收敛 Legion 当前关于 active task、`init`、wiki skeleton、CLI 命名和入口叙事的语义，使 README、workflow 真源、使用说明和实现行为重新一致。

## 问题陈述

在去掉 CLI 的 `config.json` / `ledger.csv` 之后，仓库已经去掉了持久化 active task 注册表，但 README、`legion-workflow`、`brainstorm`、`AGENTS.md` 仍混用“活跃任务”“默认入口”“执行 init 后生成 wiki 索引”等旧表述。这会让用户继续误以为存在持久化 current task、CLI 仍是默认入口、或 `init` 已负责生成 wiki skeleton，形成新的概念漂移。

## 验收标准

- [ ] active task / restore 语义在 README、AGENTS、workflow、brainstorm、usage 中收敛为同一套说法
- [ ] `init` 的行为与 README / usage / wiki 文档一致：要么真实生成 wiki skeleton，要么文档不再宣称它会生成
- [ ] `legion-workflow` 与 `legion.ts` 的命名/入口关系在 README 与参考文档中表达清楚
- [ ] `REF_TOOLS.md` 不再把 CLI 写成“默认入口”
- [ ] playbook 与 wiki 的关系在 README / usage 中至少有一句稳定定义

## 假设 / 约束 / 风险

- **假设**: 当前最小改动路径是保留“任务恢复”概念，但把它明确定义为“从已有 `.legion/tasks/<task-id>/` 恢复”，而不是恢复持久化 active task 注册表。
- **约束**: 优先收敛现有 README / docs / skill 叙事；只在必要时改少量实现。
- **约束**: 不重新引入新的状态文件去承载 active task。
- **风险**: 若选择让 `init` 生成 wiki skeleton，会牵涉 `legion-wiki` 的布局契约，需要同步对齐。
- **风险**: 若只改文档不改实现，必须确保文案不再暗示旧语义。

## 要点

- active task 概念去歧义
- `init` 与 wiki skeleton 契约一致
- `legion-workflow` vs `legion.ts` 命名拆清
- README 更准确表达 playbook / wiki 分工

## 范围

- `README.md`
- `AGENTS.md`
- `docs/legionmind-usage.md`
- `skills/legion-workflow/SKILL.md`
- `skills/brainstorm/SKILL.md`
- `skills/legion-workflow/references/*.md`
- `skills/legion-wiki/references/*.md`
- `skills/legion-workflow/scripts/*.ts`
- `skills/legion-workflow/scripts/lib/*.ts`
- `.legion/tasks/align-legion-entry-semantics/**`

## 设计索引 (Design Index)

> **Design Source of Truth**: `.legion/tasks/align-legion-entry-semantics/docs/rfc.md`

**摘要**:
- workflow 入口语义与本地 CLI 命令语义应严格拆开，避免“默认入口”与“本地调用方式”混淆。
- active task 若保留，只能表示“当前会话/当前请求正在恢复的 task”，不再表示持久化 registry 状态。

## 阶段概览

1. **Phase 1** - 收敛入口语义与最小实现策略
2. **Phase 2** - 更新文档/skills/必要实现
3. **Phase 3** - 复核 README 一致性并生成交付摘要

---

*创建于: 2026-04-23 | 最后更新: 2026-04-23*
