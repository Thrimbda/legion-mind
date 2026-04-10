# llm-wiki skill RFC

## Executive Summary

- 本轮不是从零创建 `llm-wiki` skill，而是把现有“正确但偏抽象”的版本细化为更可执行的公共 skill 契约。
- 交付仍限制在 `skills/llm-wiki/**`，默认不新增 scripts；通过增强 `SKILL.md` 与 `references/` 的具体度解决问题。
- `SKILL.md` 继续保持轻量，但要明确 session bootstrap、host-schema handshake、index-first 读取路径、durable writeback 边界，以及 ingest / query / lint 的入口动作。
- `references/` 要从“抽象说明”升级为“可直接操作的手册”，至少补齐：宿主 schema 清单、推荐页面类型基线、逐步工作流与操作后自检。
- 新增的具体度必须是“推荐 baseline”，不能冒充宿主强制规范；宿主 schema 仍决定目录、命名、frontmatter、写权限和落点。
- `query` 继续默认严格只读；只有“用户明确要求沉淀 + 宿主 schema 显式允许并定义流程”双重满足时，才允许写回。
- 文档要吸收 `llm-wiki.md` 中此前未充分显式化的建议：高价值 query 可沉淀回 wiki、index 在中等规模可作为主导航、图片/附件/搜索是可选增强、LLM 负责 bookkeeping 而不是人肉维护。
- **统一术语规则**：凡文中提到 `index.md` / `log.md`，均指这两个默认文件，**或宿主 schema 明确声明的等价导航 / 日志机制**；若宿主未声明，则以这两个文件作为默认基线。
- 验证仍以文本级检查为主，但要额外证明：agent 现在能从 skill 中推导出首次接管、页面归类、输出结构、lint 优先级和写回判定，而不仅仅是理解理念。

## 摘要 / 动机

当前 `skills/llm-wiki/` 已经合规，但用户反馈其“太过简单”。问题不在 correctness，而在 operational specificity：

- agent 知道有 ingest / query / lint，却不够清楚第一次接管 wiki 时要盘点什么；
- agent 知道要更新实体/主题页，却没有被明确告知一套推荐页面家族与何时创建/更新；
- agent 知道 query 可能写回，却缺少更具体的回答结构、写回升级路径和落地页类型；
- agent 知道 lint 要查冲突/孤儿页/陈旧结论，却缺少 issue taxonomy、优先级和输出形态。

`llm-wiki.md` 本来就不是实现文档，而是理念草案。因此这轮 RFC 的目标是：**在不牺牲 skill-creator 的精简原则下，把理念落成足够具体的默认执行基线。**

## 目标与非目标

### 目标

- 保持 `skills/llm-wiki/SKILL.md` 的 skill-creator 合规性，同时补齐更具体的会话入口规则。
- 为宿主 wiki 明确一份“首次接管 checklist”：源目录、wiki 根、index/log 等价机制、命名/ID、写回权限、可选搜索/附件处理。
- 为 agent 提供一套推荐页面家族与职责：source summary、entity、topic/concept、comparison、synthesis、maintenance。
- 将 ingest / query / lint 细化为逐步工作流，明确每步的最小输入、输出、何时更新 index/log、何时仅给建议不写回。
- 明确 citations / status markers / conflict handling / link hygiene / append-only logging 的具体约定。
- 继续保持回滚边界清晰、默认无脚本、范围受控。

### 非目标

- 不把 skill 改造成某个具体业务域的 wiki 模板。
- 不强制固定目录树；若宿主已有等价结构，仍应优先遵循宿主 schema。
- 不引入 CLI、MCP、搜索引擎、Dataview、Marp、Obsidian 插件等依赖，只描述它们何时可以作为可选增强。
- 不新增 `README`、`CHANGELOG`、`INSTALLATION_GUIDE` 等额外文档。
- 不修改 `skills/llm-wiki/**` 之外的仓库代码或文档。

## 设计决策

### 1. skill 的角色：更具体的 baseline，而不是唯一实现

三层架构保持不变：

- `raw sources`：只读输入层；source of truth。
- `wiki`：LLM 维护的 markdown 知识层；承载摘要、实体页、主题页、综合页等。
- `schema`：规则层；定义目录、命名、frontmatter、写回权限、维护节奏与记账方式。

本轮变化在于：skill 不再只说“有这三层”，而要明确 **agent 接管时必须向 schema 对齐哪些问题**。如果宿主没有明说，则采用保守推荐 baseline；一旦宿主已有约定，宿主规则优先。

### 2. `SKILL.md` 的职责：给出 session-level operating rules

`SKILL.md` 必须继续短，但需要比首版更可执行。它应包含：

- 什么时候使用本 skill（尤其是“想把知识持续编译进 wiki，而不是临时 RAG”时）；
- session bootstrap：第一次接管时先确认 raw/wiki/schema/index/log/写回权限/页面族；
- 核心原则：index-first、raw 只读、wiki 可累积、聊天结论不直接当事实、durable artifacts 要沉淀；
- ingest / query / lint 三类入口的高层动作；
- references 导航。

它不应直接塞入大段页面模板、长检查表或宿主特定目录树——这些继续放在 references。

### 3. `references/` 结构升级为 4 个文件

本轮采用以下结构：

- `references/architecture.md`
  - 三层架构职责。
  - 首次接管 checklist。
  - 推荐 baseline 与宿主 schema 的优先级关系。
  - 中等规模 index-first / 大规模搜索增强的边界。
- `references/page-types.md`
  - 推荐页面家族、何时创建/更新、每类页面最小栏目。
  - durable query output 如何映射到 comparison / synthesis / maintenance 等页面。
- `references/workflows.md`
  - bootstrap / ingest / query / lint 的逐步工作流。
  - 最小输入/输出、升级路径、何时写回、何时只建议。
  - 每类操作后的自检清单。
- `references/conventions.md`
  - `index.md` / `log.md`（或宿主等价机制）约定。
  - citation、状态标记、命名、互链、冲突处理、附件/图片记录、日志安全基线。

### 4. 推荐页面家族：给出默认 taxonomy，但允许宿主覆盖

`llm-wiki.md` 虽未强制页面类型，但其示例已暗示几类高频页面。本 skill 应显式提供默认 baseline：

- **source summary**：单个 source 的摘要、关键论点、证据、涉及页面、待验证项。
- **entity**：人物、公司、项目、地点、产品等“对象页”。
- **topic/concept**：主题、概念、问题域页。
- **comparison**：针对某个问题的横向对比页，可来自 query 或 ingest 汇总。
- **synthesis/overview**：更高层的 thesis、阶段总结、研究进展页。
- **maintenance**：冲突、缺口、待补 source、待验证假设等 backlog / health 页；它是维护工作台，不是兜底杂项页。

这不是强制目录树，而是一套帮助 agent 决定“该往哪类页面写”的思考模型。

### 5. 首次接管 checklist：把“先理解宿主 schema”具体化

当 agent 首次接管某个 llm-wiki 时，应优先确认：

1. raw sources 在哪里，是否还有 `raw/assets` 或图片目录；
2. wiki 根目录在哪里；
3. `index.md` / `log.md` 是否存在，或宿主是否用等价导航 / 日志机制替代；
4. 现有页面家族、目录分层和命名/slug/ID 规则；
5. frontmatter / Dataview / metadata 约定（如果有）；
6. query 结果可否写回、由谁写、写到哪里、允许写哪些字段；
7. maintenance backlog 放在哪；
8. 当 `index.md`（或等价导航机制）不足以导航时，是否允许使用搜索工具；
9. 图片/附件是否需要单独下载、命名和引用。

若这些信息缺失，agent 采取最保守策略：只读 query、最少新增页面、明确提出缺失 schema 点。

### 6. 工作流要更像 playbook，而不是口号

#### ingest

- 默认按单 source 或小批次处理，避免一次摄入过多后失去可审计性。
- 先生成或更新 source summary，再决定要触达哪些 entity/topic/synthesis/maintenance 页面。
- 冲突信息不静默覆盖，必须标记为 contested / superseded / needs-verification。
- 若 source 含图片或附件，除非宿主 schema 另有规定，否则只记录其存在与价值，不默认在日志里复制路径或大量摘录。

#### query

- 默认 index-first（或宿主等价导航机制），再读相关页面，必要时回到 source summary 或原始 source。
- 输出至少要有：答案、关键依据、冲突/不确定点、缺口/下一步。
- 如果用户要 durable artifact，可以产出 comparison page、synthesis page、maintenance task，必要时再衍生 markdown table / slide deck / chart / canvas；但 durable writeback 仍需要显式授权。

#### lint

- 不只是“找问题”，还要给出 issue taxonomy（如 critical/major/minor）与建议动作。
- 重点检查：错误或被新证据推翻的断言、孤儿页、缺失互链、重要概念缺页、source summary 缺失、maintenance backlog 积压、日志/导航索引不同步。
- 若证据不足，优先降级断言或创建 maintenance 项，而非直接重写结论。

#### 最小决策矩阵

| 场景 | 默认输入 | 默认输出 | 允许写哪些页 | 必做自检 |
|------|----------|----------|--------------|----------|
| ingest | 1 个 source（或小批次）+ 宿主 schema | source summary + 受影响页面更新 + maintenance 项（如需要） | 先 source summary；再 entity/topic/comparison/synthesis；最后才是 maintenance | raw 未改写；导航索引/日志已同步或明确无需同步；冲突已显式标记 |
| query（只读） | 用户问题 + 导航索引 + 相关页面 | 4 段式回答：答案 / 依据 / 冲突与不确定性 / 缺口与下一步 | 不写 wiki | 若宿主写回规则缺失，必须显式说明“本次保持只读” |
| query（建议沉淀） | 用户问题 + 高价值答案，但无授权写回 | 回答 + 建议的 page type / 落点 / 需要的授权缺口 | 不写 wiki，只能提出建议 | 不得把“结构化输出”当作授权来源 |
| query（授权写回） | 用户明确要求沉淀 + 宿主显式写回流程 | 回答 + durable page + 导航索引/日志同步 | comparison / synthesis / maintenance，或宿主明确允许的等价页型 | 记录授权依据；只写允许字段；未命中流程则立刻退回只读 |
| lint | 导航索引/日志 + 相关页面 + 最近 source / maintenance 记录 | 带优先级的问题清单 + 建议动作 | 可更新 maintenance 页；仅在证据充足且宿主允许时直接修正文档 | 证据不足时只能降级断言或建 maintenance，不得静默改写 |

### 7. `index.md` / `log.md` / citation 要更具体

- `index.md`（或宿主等价导航机制）是内容导航而不是 changelog，应按页面家族分组，并给出一句话摘要。
- `log.md`（或宿主等价日志机制）是 append-only 时间线，记录 ingest / authorized query writeback / lint 及必要更正；默认只记录安全 ID、动作摘要、授权依据、涉及页面。
- 页面正文而非日志承载长内容；日志不复制敏感摘录、凭证、个人信息、内部路径。
- 页面中应显式区分 source facts、wiki synthesis 和 open questions；必要时用状态标记辅助 lint。

### 8. `scripts/` 仍保持缺省关闭

`llm-wiki.md` 将搜索/CLI/插件视为后期增强，而不是基础模式的组成部分。本轮问题来自文档抽象度，因此仍优先通过 references 解决。

只有当后续验证证明“没有脚本就无法稳定完成关键步骤”时，才考虑在 scope 内补 scripts。

## 最小行为样例（用于验证）

### 样例 A：首次接管

- 输入：一个已有 `raw/`、`wiki/`，以及 `index.md` / `log.md` 或宿主等价机制的新知识库。
- 期望行为：agent 先盘点 schema 和页面族，而不是直接改文件；若发现 query 写回规则未定义，后续 query 默认只读，并显式报告缺失的 schema 点。

### 样例 B：ingest 单篇文章

- 输入：新增 1 篇文章 markdown，含 2 张引用图片。
- 期望行为：生成/更新 source summary；更新至少 1 个 entity/topic/synthesis 页面；记录图片/附件处理方式遵循宿主规则；同步更新 `index.md` / `log.md` 或宿主等价机制。

### 样例 C：query 形成高价值比较

- 输入：用户问两个方案的异同，并要求“把这次比较沉淀为 wiki 页面”。
- 期望行为：先回答问题，且输出固定为“答案 / 依据 / 冲突与不确定性 / 缺口与下一步”4 段；只有命中宿主显式写回流程时，才将结果落为 comparison/synthesis 页面并更新 `index.md` / `log.md` 或宿主等价机制；否则只返回建议的沉淀方案。

### 样例 D：lint 发现结构与事实问题

- 输入：发现 1 个 orphan page、1 个过期断言、1 个关键概念缺页。
- 期望行为：按优先级给出 issue list；证据不足时不直接重写；必要时创建/更新 maintenance 页面，并记录 lint 日志或宿主等价机制。

## Alternatives

### 方案 A：继续维持极简 baseline

不选。优点是文档更短；缺点是不能回应“skill 太简单”的反馈，也无法给 agent 足够具体的执行框架。

### 方案 B：直接规定完整目录树与页面模板

不选。优点是更具体；缺点是会把宿主 schema 的空间挤掉，违背 `llm-wiki.md` 的“实现需按域定制”原则。

### 方案 C：用 scripts 替代文档细化

不选。优点是流程更机械；缺点是当前问题不是“不会做”，而是“做法不够具体”，过早引入脚本会增加维护和依赖负担。

## Observability

最小观察/排障入口如下：

- 结构观察：`SKILL.md` frontmatter 是否仍只有 `name`、`description`。
- 导航观察：`SKILL.md` 是否能导向 architecture / page-types / workflows / conventions。
- 具体度观察：agent 是否能从文档推导出 bootstrap checklist、页面家族与 query 输出结构。
- 行为观察 1：当宿主未声明写回流程时，agent 是否必须停在只读并显式报缺口。
- 行为观察 2：当用户要求沉淀且宿主已显式授权时，agent 是否能唯一落到 comparison / synthesis / maintenance 或宿主等价页型。
- 行为观察 3：当宿主使用等价导航 / 日志机制时，agent 是否不会强行新建 `index.md` / `log.md`。
- 覆盖观察：三层架构、三类操作、index/log（或等价机制）、citation/status/conflict handling 是否都有说明。
- 边界观察：文档是否清楚区分“推荐 baseline”和“宿主 schema 覆盖项”。
- 排障入口：若执行不稳定，先判定问题在入口过重、reference 不够具体，还是宿主 schema 缺失。

## Milestones

1. **M1 - 设计细化**
   - 更新 RFC 与 plan。
   - 验收：明确“更具体但不越权”的设计边界。
2. **M2 - skill 细化实现**
   - 更新 `SKILL.md` 与 4 个 references 文件。
   - 验收：agent 可从文档直接推导出首次接管、页面落点和操作后的自检。
3. **M3 - 再验证与交付**
   - 完成 quick validate、文本检查、review、walkthrough、PR body。
   - 验收：目录边界正确、skill-creator 合规、行为样例成立。

## Rollout / Rollback

### Rollout

1. 先更新 RFC 与 plan，收敛更具体的默认基线。
2. 更新 `SKILL.md`，补齐 bootstrap 与操作入口。
3. 扩展 `references/`（含新增 `page-types.md`），落实页面家族、工作流与约定。
4. 运行 quick validate + 文本检查。
5. 完成 review / test report / walkthrough / PR body。

### Rollback

1. 若 `SKILL.md` 变重：把细节再下沉回 references，不改 `name` / `description` 接口。
2. 若 references 过度模板化：保留页面族思维模型，但弱化为推荐示例而非强制模板。
3. 若 query 写回边界被误放宽、或“用户要求沉淀但宿主未授权”时仍发生写回：立即回退到“彻底只读”基线，直到宿主 schema 补齐显式授权。
4. 若实现把宿主等价导航 / 日志机制误写死为 `index.md` / `log.md`：立即回退到“默认文件或宿主等价机制”的统一表述，并删除硬编码假设。
5. 若首次接管在 schema 缺失时仍继续写入多类页面：回退到“只读 + 显式报缺口 + 最少新增页面”的保守模式。
6. 本 RFC 的回滚边界仅限 `skills/llm-wiki/**` 与对应任务文档。

## 安全与误用边界

- 不得把聊天内容伪装成来源事实。
- 来源不清晰时，只能记为待确认笔记，不得写成确定性结论。
- lint 发现冲突但证据不足时，不得覆盖旧结论，只能标记争议与待验证项。
- 默认依赖 `index.md`（或宿主等价导航机制）导航，避免每次全库盲扫；若宿主允许搜索，也只能把搜索作为加速器而不是新 source of truth。
- `log.md`（或宿主等价日志机制）默认只记录安全 ID、动作摘要与授权依据，不复制敏感摘录、图片路径、凭证或内部路径。
- 附件/图片只在宿主 schema 允许的方式下记录与引用；不擅自搬运或外泄。

## 验证计划

- 检查 `skills/llm-wiki/**` 之外没有实现范围外的代码改动。
- 检查没有新增 `scripts/`、README、CHANGELOG、INSTALLATION_GUIDE。
- 检查 `SKILL.md` frontmatter 仅有 `name`、`description`。
- 检查 `SKILL.md` 主文仍保持精简，但已包含 bootstrap / 操作入口 / references 导航。
- 检查 `references/` 已覆盖 architecture / page-types / workflows / conventions 四类内容。
- 对照 `llm-wiki.md`，确认三层架构、三类操作、index/log（或等价机制）、答案沉淀、lint 健康检查、可选工具/附件增强均有对应表述。
- 用 4 个最小行为样例验证文档可推导出稳定行为。
- 行为级验收门槛：
  1. 首次接管缺 schema 时，agent 必须停在只读并显式报告缺口；
  2. 用户要求沉淀但宿主未声明写回流程时，agent 只能给建议，不能写 wiki；
  3. 若宿主使用等价导航 / 日志机制，agent 不得强行新建或写死 `index.md` / `log.md`。
- 运行 skill-creator 的 quick validator，确认 skill 结构仍合法。

## 文件变更点

- `skills/llm-wiki/SKILL.md`
- `skills/llm-wiki/references/architecture.md`
- `skills/llm-wiki/references/page-types.md`
- `skills/llm-wiki/references/workflows.md`
- `skills/llm-wiki/references/conventions.md`
