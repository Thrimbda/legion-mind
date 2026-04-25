---
name: llm-wiki
description: 当 Agent 需要在受宿主约束的 markdown wiki 中持续沉淀、维护、查询 durable knowledge 时使用；wiki 是主知识产物，LLM 是 wiki 的程序员，raw 是只读证据层。
---

# llm-wiki

`llm-wiki` 的核心工作模型是：**wiki 是主知识产物，LLM 是 wiki 的程序员**。

- raw 是只读输入层与最终证据层；
- wiki 是 durable knowledge 的主承载层；
- schema / host contract 描述结构、禁区、命名、引用与可写边界；
- query 默认是：**先回答，再判断是否形成 durable knowledge；若形成且未被 host 阻止，则正常写回 wiki**。

## 第一原则

1. **wiki 优先于聊天**：高价值知识不应只留在对话里。
2. **raw 只读**：永不回写 raw bundle。
3. **index-first**：先读导航面，再读页面，再回 raw。
4. **证据直达 raw**：durable pages 的关键结论应直接引用 raw ref。
5. **host override 优先**：宿主规则高于 baseline。
6. **protected scope 优先**：命中禁区就阻断，不绕写。
7. **schema 是契约**：负责结构 / 禁区 / 命名 / 引用 / 可写范围，不是逐次授权门禁。

## 什么时候用

- 需要构建、维护、查询一个会持续积累的 markdown wiki
- 需要把 raw 来源整理成 durable knowledge
- 需要在回答后判断是否该把结果沉淀到 wiki
- 需要做 navigation、evidence hygiene、page lifecycle、maintenance

## 默认工作模型

### 三层

- **raw layer**：原始输入层；只读；最终证据锚点
- **wiki layer**：durable knowledge layer；主知识产物
- **schema layer**：结构 / 禁区 / 命名 / 引用 / 可写范围契约

### query

1. 先回答问题；
2. 再判断结果是否形成 durable knowledge；
3. 若只是当前对话所需，则不写回；
4. 若形成 durable knowledge，且 target 可判定、证据充分、未命中 protected scope，则正常写回 wiki；
5. 若有沉淀价值但被 host contract 阻止，则返回 `blocked-by-host`，不做变通写回。

### ingest

- 识别 raw bundle 与 `source_id`
- 从 raw 提取可复用知识
- **直接更新 durable pages**
- 不再把 `source summary` 作为 ingest 第一落点或 canonical 证据中转层
- legacy `source summary` 可读但非 canonical，默认不新建、不更新

### lint

- 检查导航、引用、状态、冲突、孤儿页、维护债
- 优先产出 issue list 与 maintenance 更新
- 不把 lint 变成默认全库重写

## Host Contract

durable writeback 的真正前提不是“每次额外授权”，而是宿主已提供或可可靠推断以下最低条件：

- `wiki_root` 可发现
- 本次 writable target 可判定
- target 不在 `protected scope`
- 至少存在一种可执行的 raw ref 引用方式

以下属于可选增强项，缺失时应回退 baseline，而不是自动阻断：

- `writable_scopes`
- `page_families`
- `naming_rule`
- `citation_rule`
- `index_surface`
- `log_surface`
- `search_policy`

## Protected Scope

必须保护：

- raw roots
- 宿主显式声明的禁写目录 / 文件 / field / section / operation

冲突时遵守：**更具体的 deny 覆盖更宽泛的 allow**。

## 主工作流

1. **bootstrap**：发现 wiki root、导航面、可写范围与 protected scope
2. **ingest**：从 raw 直接更新 durable pages
3. **query**：先回答，再判断是否 durable writeback
4. **lint**：检查结构债、证据问题与维护缺口

## durable writeback 判断

写回前按顺序判断：

1. 是否形成 durable knowledge
2. 是否能定位既有 canonical page 或合法新页
3. 是否有足够 raw ref 支撑关键结论
4. 是否命中 protected scope
5. 若涉及新页 / rename / split / merge，index 是否允许同步

只有 1-3 成立且 4-5 不阻断时，才执行正常写回。

## 非目标

- 不引入脚本、CLI、索引器或新系统
- 不要求统一 frontmatter 或统一 citation 字面格式
- 不要求删除已有 `source summary`

## 读取导航

- 架构与边界：读 [references/architecture.md](./references/architecture.md)
- 工作流：读 [references/workflows.md](./references/workflows.md)
- 约定与证据纪律：读 [references/conventions.md](./references/conventions.md)
- 页型：读 [references/page-types.md](./references/page-types.md)
- raw 模型：读 [references/raw-model.md](./references/raw-model.md)
- 典型场景：读 [references/scenarios.md](./references/scenarios.md)
- layout 与默认目录/页型关系：读 [references/canonical-layout.md](./references/canonical-layout.md)
- lint 硬检查：读 [references/lint-contract.md](./references/lint-contract.md)
- 页面模板：读 [references/templates.md](./references/templates.md)
