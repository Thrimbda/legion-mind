# 基于 llm-wiki 创建新 skill

## 目标

基于仓库内 `llm-wiki.md` 的模式描述，按 skill-creator 规范持续打磨 `skills/llm-wiki/`，让它不仅说明“LLM 持续维护 wiki”的理念，还能具体指导 agent 以可执行、可审计、可复用的方式完成 wiki 的 bootstrap / ingest / query / lint 工作。

## 问题陈述

仓库已经有一个 `skills/llm-wiki/` 初版，但用户反馈它“过于简单”，更像抽象 baseline，而不是可直接落地的操作手册。当前版本虽然覆盖了三层架构、三类操作和 `index.md` / `log.md` 约定，但对以下内容仍不够具体：

- 宿主 wiki 首次接管时应先确认哪些 schema 信息；
- wiki 内应优先维护哪些页面类型、各自承担什么职责；
- ingest / query / lint 每一步的最小输入、输出、记账和自检动作；
- 如何把 `llm-wiki.md` 中关于“答案也可沉淀回 wiki”“图片/附件/搜索是可选增强”“index 在中等规模足够好用”等建议收敛成稳定执行规则。

因此，本轮不是重建 skill，而是在原有实现基础上细化它：保持 `SKILL.md` 精简，但把“抽象概念”升级为“更具体的默认工作流、页面族基线、宿主 schema 清单与操作检查表”。

## 验收标准

- [ ] `skills/llm-wiki/SKILL.md` 仍保持 skill-creator 风格：frontmatter 只保留 `name` 与 `description`，正文精简，但新增 session bootstrap / 操作入口 / 导航规则等更具体的主说明。
- [ ] skill 内容继续覆盖 `llm-wiki.md` 的核心模型：raw sources / wiki / schema 三层、ingest / query / lint 三类操作，以及 `index.md` / `log.md` 的职责。
- [ ] `references/` 至少补足“页面类型基线、宿主 schema 清单、操作检查表、引用/状态/记账约定”中的关键缺口，让 agent 能按文档直接执行，而不是只获得抽象理念。
- [ ] 具体化后的 skill 明确区分“推荐 baseline”和“宿主 schema 覆盖项”，避免把某个默认目录树或模板误写成强制要求。
- [ ] 继续不新增 README、CHANGELOG、INSTALLATION_GUIDE 等非 skill-creator 推荐文档；仅在确有必要时新增 references，不默认新增 scripts。
- [ ] 新一轮改动的范围仅限 `skills/llm-wiki/**` 与 `.legion/tasks/llm-wiki-skill/**` 任务产物，不引入无关仓库改动。

## 假设 / 约束 / 风险

- **假设**: 用户当前并不是要把 skill 改成某个具体业务 wiki 模板，而是要把抽象 skill 细化为“更可操作的通用基线”；因此本轮会给出推荐页面族、工作步骤和检查表，但仍保留宿主 schema 的最终控制权。
- **约束**: 领域输入仍以仓库内 `llm-wiki.md` 为主，不擅自引入外部产品定位、复杂自动化工具链或安装流程；若实现时发现最小可用 skill 必须越出 `skills/llm-wiki/**`，需先升级决策。
- **风险（Medium）**: 这仍是 public skill 契约变更。若细化过度，可能把宿主可配置项误固化为“必须如此”；若细化不足，又会继续停留在抽象口号层。因此需要在 RFC 中明确“推荐 baseline vs 宿主覆盖”的边界，并用更具体的 page types / workflows / conventions 收敛实现。

## 要点

- 以 `llm-wiki.md` 为领域源，补齐它暗示但当前 skill 还未显式展开的实操细节：首次接管、页面类型、答案沉淀、lint 分类、可选工具与附件处理。
- 遵循 skill-creator 约束：`SKILL.md` 精简、frontmatter 仅保留 `name` / `description`、细节优先下沉到 `references/`，仅在确有必要时新增新文件。
- 默认不新增脚本；优先通过更强的文档契约、模板和检查表表达可重复流程。
- 明确“推荐 baseline 可更具体，但宿主 schema 拥有最终裁决权”，避免把通用 skill 写成单一 wiki 实现。

## 范围

- skills/llm-wiki/**
- .legion/tasks/llm-wiki-skill/**

## 设计索引 (Design Index)

> **Design Source of Truth**: `.legion/tasks/llm-wiki-skill/docs/rfc.md`

**摘要**:
- 结构策略：`SKILL.md` 保持精简，但新增 bootstrap / index-first / durable writeback / host-schema handshake 等主规则；更具体的页面类型、操作步骤和约定下沉到 `references/`。
- 细化策略：在不新增 scripts 的前提下，把当前 3 个 references 扩展为更可执行的操作资料，并视需要新增页面类型参考文件。
- 验证策略：以 `llm-wiki.md` 对照检查 coverage，并用 quick_validate + 文本级自检确认 frontmatter、目录边界、具体度和宿主覆盖边界都成立。

## 阶段概览

1. **阶段 1 - 重新设计** - 结合用户反馈，更新 plan / RFC，明确哪些抽象处要细化、哪些仍保留为宿主 schema 决策。
2. **阶段 2 - 细化实现** - 更新 `skills/llm-wiki/` 下的 `SKILL.md` 与 references，使 skill 具备更具体的操作指导。
3. **阶段 3 - 再验证与交付** - 重新执行 quick validate / 文本检查 / review，更新 walkthrough 与 PR body。

---

*创建于: 2026-04-08 | 最后更新: 2026-04-09*
