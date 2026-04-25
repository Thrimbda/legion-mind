# Reframe llm-wiki skill around LLM-owned wiki - 日志

## 会话进展 (2026-04-23)

### ✅ 已完成

- 基于 `writing-skills` 对 `llm-wiki` skill 做了针对长期维护性的静态审视。
- 与用户收敛出明确方向：不接受当前偏移，保留 `llm-wiki.md` 中“LLM 作为 wiki 程序员”的原始想象。
- 明确取消 `source summary` page family，允许直接引用 raw，但不再为 raw 额外生成摘要页。
- 收敛出 raw 模型设计方向：raw bundle、source id、raw locator、raw ref、selector 语义与 evidence hygiene。
- 新建本任务的 Legion contract，准备进入 RFC 设计阶段。
- 已生成 RFC 初稿并完成首轮 `review-rfc`。
- 根据 `review-rfc` 的 blocking 反馈补齐两类设计缺口：
  - host contract 从“完整声明集合”收缩为“最低写回前提 + 可选增强项”，并加入最小发现 / 降级算法；
  - 新增 legacy `source summary` 兼容策略，明确其“可读但非 canonical、默认不新建不更新、不做破坏性清理”。
- 同时收边 raw selector baseline、protected scope 优先级、page lifecycle 默认保守策略，并补入边界验证矩阵。
- 第二轮 `review-rfc` 已通过（PASS WITH NOTES），RFC 进入可实施状态。
- 已按 RFC 改写仓库内真实目标路径 `skills/llm-wiki/**` 的主干文件：`SKILL.md`、`architecture.md`、`workflows.md`、`conventions.md`、`page-types.md`、`raw-model.md`、`scenarios.md`。
- 在实施后核验中确认：任务最初写入 plan 的外部 skill 路径与仓库内真实目标路径不一致；现已把 scope 修正为仓库内 `skills/llm-wiki/**`。
- 在主干核验中发现 `references/lint-contract.md`、`templates.md`、`canonical-layout.md` 仍残留旧的 `source summary / fixed layout / overviews` 语义，会与新的 skill 总纲形成内部漂移；决定在同任务中一并收口，避免交付后 skill 自相矛盾。
- 已完成 residual references 收口，并修复验证与 review-code 暴露的 blocking / note：
  - 移除“占位 raw ref”误导说法，改为 evidence gap / maintenance 降级；
  - 把 `log.md` 从 baseline requirement 收回为“默认工作面之一，但非最低写回前提”；
  - 补充 `page_families` 可选增强项、maintenance 降级显式语义、模板状态按需使用说明；
  - 把 `canonical-layout`、`lint-contract`、`templates` 纳入 `SKILL.md` 读取导航，并收紧“可回退”措辞。
- 已重新运行定向验证：`test-report.md` 结论为 PASS。
- 已重新运行只读审查：`review-code.md` 结论为 PASS（PASS WITH NOTES），且最后一条关于 `canonical-layout` “回退”措辞的 note 已顺手补齐。
- 已生成交付文档：`report-walkthrough.md` 与 `pr-body.md`。
- 本任务已完成；`skills/llm-wiki/**` 现已围绕同一模型收口：wiki 是主知识产物，LLM 是 wiki 的程序员，raw 只读，durable pages 直引 raw，query 先回答再判断 durable writeback，legacy `source summary` 仅保留兼容可读语义。

### 🟡 进行中

- 无。

### ⚠️ 阻塞/待定

- 无阻塞。

---

## 关键文件

- **`skills/llm-wiki/SKILL.md`** [completed]
  - 作用: skill 主入口与语义总纲
  - 备注: 已切回“wiki 是主知识产物，LLM 是 wiki 程序员”的默认模型
- **`skills/llm-wiki/references/raw-model.md`** [completed]
  - 作用: raw bundle / locator / ref 真源
  - 备注: 已新增，并承接取消 source summary 后的证据模型
- **`skills/llm-wiki/references/lint-contract.md`** [in_progress]
  - 作用: lint 规则真源
  - 备注: 仍残留旧 canonical layout / source summary 假设，需收口
- **`skills/llm-wiki/references/templates.md`** [in_progress]
  - 作用: 页面模板真源
  - 备注: 仍残留 `sources/` / `overviews/` / source summary 模板，需收口
- **`skills/llm-wiki/references/canonical-layout.md`** [in_progress]
  - 作用: layout baseline 真源
  - 备注: 仍写死旧目录树与 source summary，需改为 host-contract + baseline families
- **`.legion/tasks/reframe-llm-wiki-skill/docs/rfc.md`** [completed]
  - 作用: 本任务设计真源
  - 备注: 已通过 review-rfc，当前用于实现与验收

---

## 关键决策

| 决策 | 原因 | 替代方案 | 日期 |
|------|------|----------|------|
| 新开独立 Legion 任务来重构 llm-wiki skill | 这是独立的 skill 语义与长期维护问题，不能混在之前的入口/文档任务里 | 直接无契约 patch skill | 2026-04-23 |
| 保留 `llm-wiki.md` 原始精神，不接受当前偏移 | 用户已明确要求回到“LLM 作为 wiki 程序员”的默认想象 | 继续保留当前更保守的秘书式模型 | 2026-04-23 |
| 删除 `source summary` 作为 baseline page family | 用户明确不要 source summary，且它会把 durable knowledge 组织重新拉回来源摘要中心 | 保留 source summary 但弱化其地位 | 2026-04-23 |
| 在同任务内继续收口 `lint-contract/templates/canonical-layout` | 它们与新总纲属于同一 skill 的直接 references，若保留旧语义会导致交付后内部自相矛盾 | 另开后续任务处理 | 2026-04-23 |

---

## 快速交接

**下次继续从这里开始：**
1. 收口 `lint-contract.md`、`templates.md`、`canonical-layout.md`，移除旧的 source summary / fixed layout / overviews 语义。
2. 跑针对性验证，确认 `skills/llm-wiki/**` 内不再存在相互冲突的工作模型。
3. 再做 review-code、test-report、walkthrough / PR body。

**注意事项：**
- `raw` 仍必须只读。
- 取消 `source summary` 之后，证据锚点必须直接落在 raw locator / ref 上。

---

*最后更新: 2026-04-23 12:05 by Legion orchestrator*
