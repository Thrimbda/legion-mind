# llm-wiki skill RFC

## Executive Summary

- 本任务要新增一个 `skills/llm-wiki/` skill，把 `llm-wiki.md` 中“由 LLM 持续维护 wiki”的模式收敛成可复用操作契约。
- 首版最小交付物仅包含：`SKILL.md` + 必要 `references/`；范围严格限制在 `skills/llm-wiki/**`。
- `SKILL.md` 只保留使用时机、核心原则、操作入口与 references 导航；较长说明下沉到 references。
- 默认不新增 `scripts/`，因为 `llm-wiki.md` 把工具视为可选增强，而不是模式成立前提。
- skill 需要覆盖三层架构（raw sources / wiki / schema）、三类操作（ingest / query / lint）、以及 `index.md` / `log.md` 的最小记账约定。
- `query` 默认且严格只读；只有当用户明确要求沉淀，且宿主 schema 预先声明了显式写回流程时，才允许写回 wiki，并必须记入 `log.md`。
- skill 只提供 schema baseline；具体领域的页面分类、命名细节和额外规则由宿主 wiki 自行补充。
- 验证以文本级检查 + 三个最小行为样例为主，证明该 skill 可被稳定执行，而不仅是“文档存在”。

## 摘要 / 动机

仓库内已有 `llm-wiki.md`，但尚未把它固化为可复用 skill。若每次都把原文当普通参考资料，agent 会反复重新理解 wiki 分层、操作节奏与索引/日志语义，难以形成稳定维护行为。

因此，本 RFC 要把 `llm-wiki.md` 收敛成一个符合 skill-creator 约束的新 skill：入口精简、细节外移、范围受控、默认无脚本，并以最小可验证行为描述取代大而全理念文档。

## 目标与非目标

### 目标

- 新增 `skills/llm-wiki/SKILL.md`，且 frontmatter 仅包含 `name`、`description`。
- 明确 `SKILL.md` 与 `references/` 的职责边界。
- 明确默认不新增 `scripts/` 的原因与例外门槛。
- 将 `llm-wiki.md` 的三层架构、三类操作、`index.md` / `log.md` 约定映射成稳定 workflow。
- 提供可执行的验证、观察与回滚路径。

### 非目标

- 不规定具体业务领域的 wiki 目录树。
- 不引入 CLI、MCP、搜索引擎或其他自动化工具链。
- 不新增 `README`、`CHANGELOG`、`INSTALLATION_GUIDE` 等额外文档。
- 不修改 `skills/llm-wiki/**` 之外的仓库文件。

## 设计决策

### 1. skill 的角色：schema baseline，而不是完整宿主 schema

- `raw sources`：只读输入层，LLM 读取但不改写。
- `wiki`：LLM 维护的 markdown 知识层，允许新增/更新/互链页面。
- `schema`：规则层；本 skill 只提供通用 baseline，定义最小 workflow 与约束。

宿主 wiki 仍可在自身 `AGENTS.md`、`CLAUDE.md` 或其他规则文件中增加领域专属页面类型、命名方式和 frontmatter 约定。本 skill 不替代这些领域规则；若宿主 schema 未定义写回权限、目标落点与记账方式，则 query 一律保持只读。

### 2. `SKILL.md` MUST / MUST NOT

`SKILL.md` 必须包含：

- 何时使用本 skill。
- 核心原则：原始资料只读、wiki 由 LLM 维护、答案优先基于现有 wiki、索引与日志需同步维护。
- 三类操作入口：ingest / query / lint 的触发条件与最小输出要求。
- references 导航。

`SKILL.md` 不应包含：

- 长篇背景故事或理念阐述。
- 过长的目录模板、字段清单、排障列表。
- 安装说明、工具推荐清单、扩展阅读。
- 与某个具体 wiki 仓库强绑定的实现细节。

### 3. `references/` 最小结构

首版采用 3 个 references 文件：

- `references/architecture.md`
  - 三层架构职责与边界。
  - skill baseline 与宿主 schema 的关系。
- `references/workflows.md`
  - ingest / query / lint 标准步骤。
  - 每类操作的最小输入、输出、何时写 wiki、何时写 `log.md`。
- `references/conventions.md`
  - `index.md` / `log.md` 约定。
  - 页面命名、互链、追加写、最小验证清单。

不单独拆 `verification.md`，避免首版 references 过碎。

### 4. `scripts/` 结论

首版不新增 `scripts/`。

原因：

- `llm-wiki.md` 将 CLI/搜索等工具视为可选增强。
- 当前交付目标是 skill 契约，而非自动化基础设施。
- 三类操作都可以通过 `SKILL.md + references/` 稳定表达。

仅当后续验证证明“某个关键步骤无法仅靠文档稳定执行”时，才允许补充 `scripts/`。

### 5. 三类操作的行为边界

#### ingest

- 读取新 source。
- 产出来源摘要或来源页。
- 更新相关主题/实体/综合页。
- 更新 `index.md`。
- 向 `log.md` 追加一次 ingest 记录。

#### query

- 默认只读。
- 先读 `index.md`，再钻取相关页面综合回答。
- 只有在以下条件同时满足时，才允许写回 wiki：
  1. 用户明确要求把答案沉淀为页面、卡片或维护项；
  2. 宿主 schema 已预先声明显式写回流程，并同时定义可执行写回的操作者/权限、目标页面类型或落点、允许变更范围，以及 `index.md` / `log.md` 的记账方式。
- 若缺少任一条件，query 仍保持只读；最多提出沉淀建议或升级为后续 ingest / maintenance 任务。
- 一旦写回，只在必要时更新 `index.md`，并追加带授权依据的安全 `log.md` 记录。
- “稳定的结构化产物”只作为写回内容质量约束，不作为写回授权来源。

#### lint

- 检查冲突、陈旧结论、孤儿页、缺失互链、重要概念缺页、证据缺口。
- 输出修复建议或维护页。
- 将本次检查追加到 `log.md`。

### 6. `index.md` / `log.md` 最小契约

- `index.md` 是内容目录：列出页面链接与一句话说明，服务于定位与导航。
- `log.md` 是时间线：必须追加写入，不覆盖历史；若发现误记，追加更正记录而不是改写历史。
- 日志标题采用可解析前缀，例如：`## [YYYY-MM-DD] ingest | <source-id-or-safe-title>`。
- 默认只写安全 ID 与动作摘要，不复制敏感原文、凭证、个人数据或内部路径。
- ingest / query（若产生高价值沉淀或显著分析）/ lint 都应写入日志。

## 最小行为样例（用于验证）

### 样例 A：ingest

- 输入：新增 1 篇文章 markdown 到 raw sources。
- 期望行为：生成或更新来源摘要页；至少更新 1 个相关主题/实体页；`index.md` 新增该页面入口；`log.md` 新增一条 ingest 记录。

### 样例 B：query

- 输入：基于现有 wiki 回答某个比较问题。
- 期望行为：先查 `index.md` 再读相关页面；默认只输出答案，不写回 wiki。
- 只有当用户追加“把这个比较沉淀成页面”，且宿主 schema 已明确规定该类比较由谁写、写到哪个页面类型/位置、如何记账时，才允许新增页面并同步更新 `index.md` / `log.md`。

### 样例 C：lint

- 输入：发现 1 个 orphan page 与 1 条可能过期结论。
- 期望行为：输出问题说明与修复建议；不在证据不足时强改结论；`log.md` 新增一条 lint 记录。

## Alternatives

### 方案 A：只写单个 `SKILL.md`

不选。优点是文件更少；缺点是入口会迅速膨胀，丢失 skill-creator 要求的精简定向能力。

### 方案 B：首版就加入搜索脚本或 CLI

不选。优点是未来可能更自动化；缺点是超出当前 scope，也把可选增强误变成默认依赖。

## Observability

最小观察/排障入口如下：

- 结构观察：`SKILL.md` frontmatter 是否只有 `name`、`description`。
- 导航观察：`SKILL.md` 是否能明确导向 3 个 references 文件。
- 覆盖观察：三层架构、三类操作、`index/log` 契约是否都有对应说明。
- 行为观察：3 个最小样例是否都能从文档中推导出唯一且稳定的期望行为。
- 排障入口：若 agent 执行不稳定，先看是入口过重（应改 `SKILL.md`）、细节缺失（应改 references）、还是宿主 wiki 规则缺失（应由宿主 schema 补充）。

## Milestones

1. **M1 - 最小入口**
   - 交付 `SKILL.md`。
   - 验收：入口精简、frontmatter 合规、明确 references 导航。
2. **M2 - 最小细节**
   - 交付 3 个 references 文件。
   - 验收：三层/三类操作/index-log 约定齐全，且未引入 scripts。
3. **M3 - 文本级验收与交付**
   - 完成对照检查、review、walkthrough、PR body。
   - 验收：3 个最小样例成立，目录边界正确，结论可回滚。

## Rollout / Rollback

### Rollout

1. 先创建 `skills/llm-wiki/SKILL.md`，只放最小入口契约。
2. 再创建 `references/architecture.md`、`workflows.md`、`conventions.md`。
3. 依据“最小行为样例”做文本级自检。
4. 完成 code review / test report / walkthrough / PR body。

### Rollback

1. 若 `SKILL.md` 过重：把细节继续下沉到 references，不改 name/description 接口。
2. 若 references 过碎：在 `skills/llm-wiki/**` 内合并文件，但保留主文精简。
3. 若 `query` 写回边界导致误写风险：立即收紧为“彻底只读”，直到宿主 schema 明确写回权限与落点。
4. 若 `log.md` 规则导致敏感信息误记：通过追加更正/撤销记录修复，并回到“仅 ID + 安全摘要”的最低基线。
5. 本 RFC 的回滚边界仅限 `skills/llm-wiki/**`；不涉及跨目录清理。

## 安全与误用边界

- 不得把聊天内容伪装成来源事实。
- 来源不清晰时，只能记为待确认笔记，不得写成确定性结论。
- lint 发现冲突但证据不足时，不得覆盖旧结论，只能标记争议与待验证项。
- 默认依赖 `index.md` 导航，避免每次全库盲扫。
- `log.md` 默认只记录安全 ID、动作摘要与授权依据，不复制敏感摘录。

## 验证计划

- 检查 `skills/llm-wiki/**` 之外没有新增文件。
- 检查没有新增 `scripts/`、README、CHANGELOG、INSTALLATION_GUIDE。
- 检查 `SKILL.md` frontmatter 仅有 `name`、`description`。
- 检查 `SKILL.md` 主文只包含使用时机、核心原则、操作入口、references 导航。
- 对照 `llm-wiki.md`，确认三层架构、三类操作、`index.md` / `log.md` 契约均已覆盖。
- 用 3 个最小行为样例验证文档可推导出稳定行为。

## 文件变更点

- `skills/llm-wiki/SKILL.md`
- `skills/llm-wiki/references/architecture.md`
- `skills/llm-wiki/references/workflows.md`
- `skills/llm-wiki/references/conventions.md`
