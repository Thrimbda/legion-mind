# Merge playbook into wiki and clarify README terms

## 目标

把 README 中“设计门禁 / 分层验证 / 证据化汇报”改写成更直白、可直接理解的说明，同时取消 playbook 与 wiki 的分裂语义，把跨任务知识沉淀统一收敛到 wiki / `legion-wiki`。

## 问题陈述

当前 README 用几个抽象词概括 LegionMind 的工程方法，但没有在入口处把这些词解释清楚，读者需要先猜语义再往下读。与此同时，仓库又把跨任务知识分成 `playbook` 与 `wiki` 两套概念：前者偏“应该怎么做”，后者偏“当前系统是什么状态”。这导致 README、usage、`legion-docs`、`legion-wiki` 和现有 `.legion/playbook.md` 之间形成重复心智模型，增加理解与维护成本。

## 验收标准

- [ ] README 不再只抛出“设计门禁 / 分层验证 / 证据化汇报”术语，而是在正文中给出直白解释与落地含义
- [ ] 当前真源文档不再把 playbook 与 wiki 作为两套并列的持久化知识层来定义
- [ ] `legion-wiki` 明确接管原先 playbook 承担的跨任务模式 / 约定 / 沉淀职责
- [ ] `legion-docs`、README、usage、相关 references 对跨任务知识落点的说法一致
- [ ] 现有 `.legion/playbook.md` 的内容被迁移到统一 wiki 落点，并避免继续作为独立概念保留

## 假设 / 约束 / 风险

- **风险等级**: **Medium**。理由：会同时修改 README、usage、`legion-docs`、`legion-wiki`、agent / reference 等当前真源，对外收敛 Legion 的知识层定义与 reviewer 心智模型；若收口不完整，容易再次制造概念漂移。
- **假设**: 统一后的跨任务知识层仍以 `.legion/wiki/**` 为主要落点，避免再引入第三套结构。
- **约束**: 不在本任务中扩展 `init` 行为；是否预建 wiki skeleton 仍保持当前最小初始化策略。
- **约束**: 保留 raw task docs 与综合知识层的边界，不让 `.legion/tasks/**` 再兼任 wiki。
- **风险**: 这是一次中等风险的 schema / workflow 文案收敛，涉及多个当前真源文档与技能，若改动不完整会再次制造术语漂移。
- **风险**: 需要决定 playbook 内容在 wiki 中的精确归宿（例如 `patterns.md` / `decisions.md` / `index.md`），否则可能只是换名不收敛。

## 要点

- README 术语去玄学化
- playbook 与 wiki 合并为单一知识层
- `legion-wiki` 接管 playbook 式沉淀
- 迁移现有 `.legion/playbook.md` 内容

## 范围

- `README.md`
- `docs/legionmind-usage.md`
- `skills/legion-docs/SKILL.md`
- `skills/legion-docs/references/REF_SCHEMAS.md`
- `skills/legion-wiki/SKILL.md`
- `skills/legion-wiki/references/*.md`
- `skills/spec-rfc/references/TEMPLATE_RESEARCH.md`
- `.opencode/agents/legion.md`
- `.legion/playbook.md`
- `.legion/wiki/**`
- `.legion/tasks/merge-playbook-into-wiki/**`

## 设计索引 (Design Index)

> **Design Source of Truth**: `.legion/tasks/merge-playbook-into-wiki/docs/rfc.md`

**摘要**:
- 统一跨任务 durable knowledge 到 `.legion/wiki/**`，取消 playbook / wiki 双概念；former playbook 条目按 decision / pattern / maintenance 分类进入 wiki。
- README 首次出现“设计门禁 / 分层验证 / 证据化汇报”时必须直接解释人话含义，并映射到真实产物而非停留在口号层。

## 阶段概览

1. **Phase 1** - 收敛 playbook/wiki 合并方案与 README 解释策略
2. **Phase 2** - 更新文档、skill 与知识层落点，并迁移现有 playbook 内容
3. **Phase 3** - 验证术语与路径一致性，生成交付摘要

---

*创建于: 2026-04-23 | 最后更新: 2026-04-23*
