# Reframe llm-wiki skill around LLM-owned wiki

## 目标

把 `llm-wiki` skill 重写为更忠于仓库根部 `llm-wiki.md` 原始精神的一版：wiki 是主知识产物，LLM 是 wiki 的程序员，raw 是只读输入层，schema 负责结构与禁区，而不是把正常 wiki 维护默认收紧成“先授权、后写回”的秘书式流程。

## 问题陈述

当前 `llm-wiki` skill 已经具备较强的三层架构、证据纪律与渐进披露能力，但它相对原始构想发生了两类偏移：

1. **行为偏移**：`query` 被收紧成默认严格只读，正常 wiki 写回需要更重的显式授权与宿主流程，弱化了“知识持续沉淀、不断累积”的核心价值。
2. **模型偏移**：skill 引入了 `source summary` 作为 ingest 第一落点，导致 wiki 更像“围绕来源摘要组织的二级缓存”，而不是直接围绕 durable knowledge pages 组织的主知识层。

如果不收敛这些偏移，`llm-wiki` 会长期停留在保守但不够 compounding 的状态，既背离 `llm-wiki.md` 的原始设想，也会让 raw 引用、page lifecycle、长期维护策略继续模糊。

## 验收标准

- [ ] `llm-wiki` skill 明确回到“LLM 作为 wiki 程序员”的默认工作模型，而不是默认秘书式只读问答
- [ ] skill 全面移除 `source summary` 作为 baseline page family 与 ingest 第一落点
- [ ] 新增稳定的 raw 模型：raw bundle、source id、raw locator、raw ref、selector 语义与解析约定
- [ ] `query` / `ingest` / `lint` 工作流与原始 `llm-wiki.md` 的 compounding wiki 精神一致
- [ ] `index.md` / `log.md` 被重新定义为 wiki 的默认工作面，而不是默认只读对象
- [ ] references 之间不再出现“默认不可写”与“自检要求必须同步写回”的内部冲突
- [ ] skill 增补长期维护所需的 page lifecycle / evidence hygiene / canonical scenarios

## 假设 / 约束 / 风险

- **风险等级**: Medium
- **理由**: 这是一个多文件、跨 reference 的公开 skill 语义改造；虽可回滚，但会改变未来 agent 对 `llm-wiki` 的默认操作路径与 durable writeback 语义。
- **假设**: 根部 `llm-wiki.md` 是本次 skill 修订的精神真源，当前用户已批准“取消 source summary、保留原始想象、强化 raw 模型”的方向。
- **约束**: 只改 `llm-wiki` skill 及其 references，不扩展到其他 skill 的实现或仓库 runtime。
- **约束**: 需要保留三层架构、证据可追溯、index-first、宿主 override 优先这些优点。
- **约束**: raw 仍必须保持只读，wiki 写回只能落在 wiki 工作面，不得回写 raw。
- **风险**: 若把“默认应沉淀”表述得过强，可能导致 agent 越界写回宿主未希望持久化的结果；因此需要同时定义 protected scope / host contract discovery / blocked-by-host 路径。
- **风险**: 移除 `source summary` 后，如果 raw locator / ref 语义不够清楚，skill 会失去稳定证据锚点。

## 要点

- 恢复 `llm-wiki.md` 的原始精神：wiki 是主 artifact，LLM 是主要维护者
- 删除 `source summary` page family 与相关 workflow
- 明确 raw bundle / locator / ref / selector 模型
- 让 `query` 的 durable knowledge 默认能回写 wiki，除非被 host contract 阻止
- 补足 page lifecycle、search 升级点与 evidence hygiene
- 为长期演化增加 canonical scenarios，降低 skill 漂移

## 范围

- `skills/llm-wiki/SKILL.md`
- `skills/llm-wiki/references/architecture.md`
- `skills/llm-wiki/references/workflows.md`
- `skills/llm-wiki/references/conventions.md`
- `skills/llm-wiki/references/page-types.md`
- `skills/llm-wiki/references/raw-model.md`（新增）
- `skills/llm-wiki/references/scenarios.md`（新增）
- `skills/llm-wiki/references/lint-contract.md`（同 skill 内一致性收口）
- `skills/llm-wiki/references/templates.md`（同 skill 内一致性收口）
- `skills/llm-wiki/references/canonical-layout.md`（同 skill 内一致性收口）
- `.legion/tasks/reframe-llm-wiki-skill/**`

## 非范围

- 不修改仓库根部 `llm-wiki.md` 的原始 idea 文本
- 不为 `llm-wiki` 新增 CLI / MCP / resolver 脚本
- 不扩展到 `legion-wiki` 或其他仓库 skill 的语义重写

## 设计索引 (Design Index)

> **Design Source of Truth**: `.legion/tasks/reframe-llm-wiki-skill/docs/rfc.md`

**摘要**:
- 把 `schema` 从“逐次授权门禁”重构为“结构/禁区/命名/引用契约”。
- 把 `raw` 从模糊证据层具体化为 raw bundle + raw locator + raw ref，并让 durable pages 直接引用 raw。

## 阶段概览

1. **Phase 1** - 收敛 task contract，起草并评审 RFC
2. **Phase 2** - 依据 RFC 改写 `llm-wiki` skill 与 references
3. **Phase 3** - 做一致性验证、代码/文档评审并生成交付摘要

---

*创建于: 2026-04-23 | 最后更新: 2026-04-23*
