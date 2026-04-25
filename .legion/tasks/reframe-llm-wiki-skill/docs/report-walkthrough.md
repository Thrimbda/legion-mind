# Reviewer Walkthrough：重塑 llm-wiki 为以 wiki 为主知识产物的持续沉淀模型

## 目标与范围

本任务目标是把 `llm-wiki` skill 拉回仓库根部 `llm-wiki.md` 的原始精神：**wiki 是主知识产物，LLM 是 wiki 的程序员，raw 是只读证据层**。这次不是新增工具链，而是一次针对 skill 语义、边界与 reference 真源的重构。

本次 review scope 仅包含：

- `skills/llm-wiki/SKILL.md`
- `skills/llm-wiki/references/*.md`

不包含 runtime、CLI、其他 skill、仓库根部 `llm-wiki.md` 原文改写。

## 设计摘要

设计真源见：[`docs/rfc.md`](./rfc.md)

本次改造聚焦六个 reviewer 应关注的主变化：

1. **回到 `llm-wiki.md` 原始精神**：从“偏秘书式、默认只读”收回到“wiki 持续沉淀、query 可形成复利知识”的主模型。
2. **删除 `source summary` baseline**：不再把它当作 baseline page family、ingest 第一落点或 canonical 证据中转层；legacy 页面仅保留兼容可读语义。
3. **引入 raw model 真源**：新增 `raw bundle / source_id / raw locator / raw ref / selector` 的稳定定义，让 durable page 可以直接锚定 raw。
4. **query 改为“先回答，再判断 durable writeback”**：回答不再被写回判定阻塞；形成 durable knowledge 且边界允许时才正常写回 wiki。
5. **host contract / protected scope 收边**：把边界从“逐回合授权”前移为“宿主契约 + 禁区判断 + blocked-by-host 降级”。
6. **references 一致化**：architecture / workflows / conventions / page-types / raw-model / scenarios / canonical-layout / lint-contract / templates 已围绕同一模型收口。

## 改动清单

### 1. `skills/llm-wiki/SKILL.md`

- 重写 skill 总纲与 description，明确“wiki 是主知识产物，LLM 是 wiki 的程序员”。
- 把默认 query 语义改成“先回答，再判断是否 durable writeback”。
- 明确 ingest 直接更新 durable pages，不再以 `source summary` 作为第一落点。
- 重写 Host Contract 与 Protected Scope，突出“最低写回前提 / 可选增强项 / 禁区优先”。

### 2. `references/architecture.md`

- 重写三层模型职责：raw / wiki / schema。
- 明确 schema 是结构契约，不是逐回合审批器。
- 固化 `blocked-by-host`、`logging degraded`、index/log/search 的角色边界。
- 收敛 baseline page families，仅保留五类 durable pages。

### 3. `references/workflows.md`

- 重写 bootstrap：先发现 `wiki_root`、导航面、可写范围与 protected scope。
- 重写 ingest：直接把 raw bundle 更新到 `entity / topic / comparison / synthesis / maintenance`。
- 重写 query：显式区分 `ephemeral answer`、`durable knowledge`、`blocked-by-host` 三条路径。
- 重写 lint：从“全库重写倾向”收回到“检查结构债、证据问题与维护缺口”。

### 4. `references/conventions.md`

- 建立 raw ref / citation / evidence discipline 的统一基线。
- 明确 durable knowledge 的关键结论应直引 raw ref。
- 补齐日志安全、状态标记、生命周期与互链约定。

### 5. `references/page-types.md`

- 删除 `source summary` 的 baseline 页型地位。
- 仅保留 `entity / topic / comparison / synthesis / maintenance` 五类 durable pages。
- 为 split / merge / archive / supersede 增加统一 lifecycle 约束。

### 6. 新增真源文档

- `references/raw-model.md`：补齐 raw model 的结构真源，解决删除 `source summary` 后的证据锚点问题。
- `references/scenarios.md`：补齐 canonical scenarios，覆盖只回答不写回 / 正常沉淀 / blocked-by-host / legacy `source summary` 兼容路径。

### 7. 其他 references 收口

- `references/canonical-layout.md`：明确 baseline layout 不是固定目录树，导航面与日志面分离，`log.md` 不是最低写回前提。
- `references/lint-contract.md`：删除对 `source summary` 的 baseline 依赖，补足强 claim、canonical discoverability、lifecycle 等检查项。
- `references/templates.md`：模板与五类 durable pages、raw ref 语义对齐。

## 如何验证

验证结论见：[`docs/test-report.md`](./test-report.md)

已记录的验证命令：

```bash
git diff -- "skills/llm-wiki/SKILL.md" "skills/llm-wiki/references"
rg -n "source summary|baseline page family|page famil(y|ies)|maintenance backlog|Backlog / Maintenance|blocked-by-host|logging degraded|先回答，再判断|逐回合授权|审批器|默认目录名|语义名" "skills/llm-wiki"
```

定向检查文件：`SKILL.md`、`architecture.md`、`workflows.md`、`canonical-layout.md`、`page-types.md`、`raw-model.md`、`conventions.md`、`lint-contract.md`、`templates.md`、`scenarios.md`

预期结果：

- `source summary` 不再作为 baseline page family、ingest 第一落点、lint 必选项或 canonical 证据中转层。
- `query` 语义统一为“先回答，再判断 durable writeback”。
- `raw bundle / source_id / raw locator / raw ref / selector` 在主文档与 references 中保持一致。
- `log` 不再被当作最低写回前提；`blocked-by-host`、`logging degraded` 等降级语义清晰。

已有结论：

- **test-report：PASS**
- **review-code：PASS WITH NOTES**，无阻塞问题；仅留一条非阻塞 note，提示 `canonical-layout.md` 中“可回退到宿主等价面的导航面”建议再补一句，避免被误读成默认创建 `index.md`。

补充设计审查：[`docs/review-rfc.md`](./review-rfc.md) 结论为 **PASS WITH NOTES**，主要围绕 host contract 文案收边与 legacy `source summary` 场景示例，已不构成阻塞。

## 风险与回滚

### 主要风险

- **默认可沉淀的语义被误读为默认可任意写回**：本次已通过 `host contract / protected scope / blocked-by-host` 收边，但 reviewer 仍应重点确认表述没有回摆。
- **删除 `source summary` 后证据锚点不清**：本次通过 `raw-model.md` 明确 raw ref 体系来承接。
- **跨 references 语义漂移**：本次重点价值之一就是把整个 skill reference 集收口为单一模型。

### 回滚策略

- 本次仅改 skill 文档与 references，无 runtime / 数据迁移。
- 若需要回滚，直接回退本次文档改动即可。
- legacy `source summary` 未被破坏性清理，因此回滚成本低、状态简单。

## 未决项与下一步

### 未决项

- 无阻塞未决项。
- 仅有 1 条 reviewer note：可在 `canonical-layout.md` 再补一句“这里的回退仅指识别宿主等价导航面，不指默认创建新的 `index.md` / `log.md`”，进一步降低误读概率。

### 下一步

1. reviewer 重点确认：六个主变化是否已在所有 references 中一致表达。
2. 若接受当前非阻塞 note，可直接合入。
3. 若希望零歧义，可先补齐 `canonical-layout.md` 的显式说明后再合入。
