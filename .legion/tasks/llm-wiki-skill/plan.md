# 基于 llm-wiki 创建新 skill

## 目标

基于仓库内 `llm-wiki.md` 的模式描述，按 skill-creator 规范新增一个可直接放入 `skills/llm-wiki/` 使用的 skill，让 agent 能以“持久化 wiki 维护者”的方式处理知识库的 ingest / query / lint 工作流。

## 问题陈述

仓库当前只有 `skills/legionmind`，还没有把 `llm-wiki.md` 中“由 LLM 持续维护 wiki，而不是每次临时 RAG”的模式落成一个可复用 skill。若直接把 `llm-wiki.md` 当普通参考文本，后续 agent 每次都要重新理解 wiki 分层、索引/日志约定与 ingest/query/lint 流程，难以形成稳定操作习惯。

用户要求“根据 llm-wiki，使用 skill-creator 创建一个新的 skill 放到 skills 目录下”，因此需要把该模式收敛为一个符合 skill-creator 约束的正式 skill：`SKILL.md` 保持精简、必要细节下沉到 `references/`，并避免额外 README/安装说明等冗余文档。

## 验收标准

- [ ] 新增 `skills/llm-wiki/SKILL.md`，frontmatter 只保留 `name` 与 `description`，正文使用命令式说明，结构符合 skill-creator 风格。
- [ ] skill 内容覆盖 `llm-wiki.md` 的核心模型：raw sources / wiki / schema 三层、ingest / query / lint 三类操作，以及 `index.md` / `log.md` 的职责。
- [ ] 细节按需下沉到 `skills/llm-wiki/references/`，不新增 README、CHANGELOG、INSTALLATION_GUIDE 等非 skill-creator 推荐文档。
- [ ] 新 skill 的范围仅限 `skills/llm-wiki/**`，不引入无关仓库改动。
- [ ] `.legion/tasks/llm-wiki-skill/docs/` 下补齐 `rfc.md`、`review-rfc.md`、`test-report.md`、`review-code.md`、`report-walkthrough.md`、`pr-body.md`。

## 假设 / 约束 / 风险

- **假设**: 用户未另行指定 skill 名称或更细的目录结构，因此本次默认将新 skill 命名为 `llm-wiki`，落在 `skills/llm-wiki/`。
- **约束**: 领域输入仅使用仓库内 `llm-wiki.md`；不得擅自扩展到外部产品定位、复杂脚本或安装流程；若实现时发现最小可用 skill 必须越出 `skills/llm-wiki/**`，需先升级决策。
- **风险（Medium）**: 这是新增 public skill 契约，而不是一次性笔记整理；若 `SKILL.md` 过重、references 过散、或对 llm-wiki 的操作边界表达不清，后续 agent 会产生错误工作流或重复维护成本。因此先产出简短 RFC，并通过 review-rfc 收敛内容边界后再实施。

## 要点

- 以 `llm-wiki.md` 为唯一领域输入，提炼 wiki 架构、ingest/query/lint 工作流与索引/日志约定。
- 遵循 skill-creator 约束：`SKILL.md` 精简、frontmatter 仅保留 `name`/`description`、细节下沉到 `references/`，仅在确有必要时新增 `scripts/`。
- 默认不新增脚本；优先通过 skill 指令和 references 表达可重复流程。
- 将新增文件严格限制在 `skills/llm-wiki/**`，避免无关仓库改动。

## 范围

- skills/llm-wiki/**

## 设计索引 (Design Index)

> **Design Source of Truth**: `.legion/tasks/llm-wiki-skill/docs/rfc.md`

**摘要**:
- 结构策略：`SKILL.md` 只保留使用时机、执行原则与 references 入口；把目录结构、页面职责、操作流程等较长说明下沉到 `references/`。
- 验证策略：以 `llm-wiki.md` 对照检查 coverage，并用文本级自检确保 frontmatter、目录边界与新增文档类型符合 skill-creator 约束。

## 阶段概览

1. **阶段 1 - 调研与设计** - 梳理 llm-wiki 与 skill-creator 约束，完成风险分级与 RFC。
2. **阶段 2 - 实现** - 创建 `skills/llm-wiki/` 下的 `SKILL.md` 与必要 references。
3. **阶段 3 - 验证与交付** - 完成自检、评审、walkthrough 与 PR body。

---

*创建于: 2026-04-08 | 最后更新: 2026-04-08*
