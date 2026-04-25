# RFC：将 llm-wiki skill 重塑为以 wiki 为主知识产物的持续沉淀模型

## 1. 摘要 / 动机

本 RFC 旨在把 `llm-wiki` skill 拉回仓库根部 `llm-wiki.md` 的原始精神：**wiki 是主知识产物，LLM 是 wiki 的程序员，human 负责提供 source 与提出问题**。当前 skill 已经具备三层架构、index-first、证据纪律、host override 优先等优点，但在两个关键点上发生了偏移：

1. **行为偏移**：`query` 被定义为默认严格只读，只有用户显式要求持久化且宿主显式定义写回流程时才允许落盘（见 `~/.agents/skills/llm-wiki/SKILL.md:10-13,23-26` 与 `references/workflows.md:53-83`）。这会削弱“每次提问都可能让知识库变强”的复利效果。
2. **模型偏移**：`ingest` 以 `source summary` 为第一落点，并要求 durable pages 经由来源摘要中转（见 `references/page-types.md:5-16`、`references/workflows.md:38-50`、`references/architecture.md:17-24`）。这会把 wiki 变成围绕来源摘要组织的二级缓存，而不是围绕 durable knowledge pages 组织的主知识层。

本 RFC 采用**最小复杂度修正**：不新增脚本、CLI 或 runtime，只改 `llm-wiki` skill 文档与 references，把 schema 从“逐次授权门禁”改为“结构 / 禁区 / 命名 / 引用契约”，删除 `source summary` page family，明确 raw model，并把 query 语义改为“**先回答，再判断是否形成 durable knowledge；若形成且未被 protected scope 阻止，则正常写回 wiki**”。

## 2. 目标与非目标

### 2.1 目标

- 恢复 `llm-wiki.md` 的核心工作模型：wiki 是持续累积的主知识层，LLM 默认负责维护它。
- 删除 `source summary` page family，并停止把它作为 ingest 第一落点。
- 维持 `raw` 只读，并让 durable knowledge pages **直接引用 raw**，而不是经由 `source summary` 中转。
- 保留并强化现有优点：`index-first`、evidence discipline、host override 优先于 baseline。
- 定义清晰的 **host contract / protected scope**，防止“默认可沉淀”被误解为“默认可在任意文件写回”。
- 让 `query`、`ingest`、`lint` 之间不存在自相矛盾的写回语义。
- 让 page families 收敛为：`entity` / `topic` / `comparison` / `synthesis` / `maintenance`。
- 补足 raw bundle / source id / raw locator / raw ref / selector / lifecycle / evidence hygiene / scenarios 的稳定文档真源。

### 2.2 非目标

- 不修改仓库根部 `llm-wiki.md` 的原始 idea 文本。
- 不新增或要求任何脚本、CLI、MCP、索引器或 runtime。
- 不重写 `legion-wiki` 或其他 skill 的语义。
- 不为所有宿主强制统一目录树、frontmatter 模板或 citation 字面格式。
- 不把 `query` 改成“无条件自动写回”；所有写回仍受 host contract 与 protected scope 约束。

## 3. 第一原则

1. **wiki 优先于聊天**：高价值知识不应只留在对话历史里；若知识具备复用价值，应优先沉淀到 wiki。
2. **raw 不可变**：raw 是输入层与最终证据层，永远只读，不被 LLM 回写。
3. **schema 是契约，不是逐回合审批器**：schema 应描述结构、边界、命名、引用和可写范围，而不是把正常维护都变成额外授权流程。
4. **host override 高于 baseline**：baseline 只填补宿主缺失，不覆盖宿主已声明规则。
5. **index-first**：默认先读导航面，再读页面，再回到 raw；搜索只是定位器，不是事实来源。
6. **证据直达 raw**：durable knowledge 的稳定结论必须能直接追溯到 raw ref 或现有 durable page 中的 raw ref 链。
7. **protected scope 先于“默认沉淀”**：任何默认沉淀都只发生在宿主声明可写的 wiki scope 内，且不得跨越宿主禁区。
8. **最小机制**：只引入解释当前行为所必需的概念，不发明与文档改造无关的新系统。

## 4. 定义

- **raw bundle**：一个不可变的原始来源单元及其必要附件集合。可以是单文件，也可以是“主文档 + 图片 / PDF / 数据附件”的只读集合。
- **source id**：指向一个 raw bundle 的稳定标识符。应在宿主范围内唯一、可复用、可安全出现在日志与页面引用中。
- **raw locator**：在 raw bundle 内定位证据位置的结构化位置描述。它由 `artifact` 与 `selector` 两部分组成。
- **selector**：针对某类 raw artifact 的具体选区语义，如标题锚点、行号区间、页码区间、时间戳区间、表格区域、图片区域等。
- **raw ref**：durable page 中使用的证据引用单元，最少包含 `source id + raw locator`，可附带安全摘录、注释或置信说明。
- **durable knowledge**：对当前聊天之外仍有复用价值、可被后续 query / ingest / lint 持续复用的知识沉淀；通常落在 wiki 页面中。
- **ephemeral answer**：仅服务当前问答、无需进入长期知识层的回答；可以有证据，但不需要写回 wiki。
- **protected scope**：宿主明确声明不可由本 skill 回写的范围，可按目录、文件、字段、页面家族、页面分区或操作类型表达。
- **host contract**：宿主对本 skill 的操作契约。它分为“最低写回前提”和“可选增强项”：前者决定是否允许安全写回，后者决定写回体验是否更贴合宿主偏好。

## 5. 设计方案

### 5.1 总体重构方向

本次重构将 `llm-wiki` 的核心语义从：

- “先做 host-schema handshake；query 默认严格只读；durable writeback 依赖额外授权流程；ingest 先写 source summary”

改为：

- “先识别 host contract；在明确的结构 / 禁区 / 命名 / 引用契约内正常维护 wiki；query 先回答，再判断是否形成 durable knowledge；若形成且未被 protected scope 阻止，则正常写回 wiki；ingest 直接更新 durable pages，不创建 source summary。”

这不是放松边界，而是把边界从“逐回合审批”前移为“宿主契约 + 禁区声明”。

### 5.2 schema：从逐次授权门禁转为结构契约

`schema` 的职责调整为定义以下内容：

| 契约项 | baseline 语义 | 宿主可覆盖点 |
|---|---|---|
| raw roots | 只读输入层 | 目录、附件组织、source id 规则 |
| wiki root | durable knowledge 根 | 目录结构、页面组织 |
| writable scope | 允许本 skill 写入的 wiki 范围 | 目录 / 文件 / 字段 / 页型 |
| protected scope | 明确不可写范围 | 目录、文件、字段、页面分区、操作类型 |
| page families | entity/topic/comparison/synthesis/maintenance | 命名、子类型、模板 |
| naming | 稳定 slug / ID / 标题约定 | frontmatter、别名、路径策略 |
| citation | raw ref 必须可追溯 | 具体 markdown / footnote / Dataview 格式 |
| navigation | 默认 `index.md` 或宿主等价物 | 索引页、目录页、Dataview 视图 |
| logging | 默认 `log.md` 或宿主等价物 | 追加格式、安全字段 |
| search | 仅定位增强 | 工具、入口、允许条件 |

新的 baseline 不再把“用户逐次显式授权”当作 durable writeback 的前置必要条件；**真正的前置条件是：该写回是否命中宿主声明的可写 wiki scope，且未落入 protected scope。**

### 5.3 host contract / protected scope

为避免“默认可沉淀”演变成无边界越权，本 RFC 要求 skill 明确以下判断顺序：

1. 是否存在宿主声明的 `wiki root` 与 `writable scope`。
2. 当前目标页或目标字段是否落在该可写范围内。
3. 当前目标是否被 `protected scope` 禁止。
4. 是否已有足够命名、页面家族与引用约定，能让写回保持可导航、可审计、可追溯。

#### 5.3.1 最低写回前提 vs 可选增强项

`host contract` 不应再被理解为“宿主必须先把所有规则写全，skill 才能维护 wiki”。它应拆成两层：

**A. 最低写回前提（缺一不可）**

- 能发现或可靠推断 `wiki_root`；
- 能为本次写回判定一个具体 writable target（现有页、允许新建的 canonical 页、或 maintenance 页）；
- 能判断该 target 未落入 `protected scope`；
- 有至少一种可执行的 baseline citation 写法，使证据能直达 raw。

**B. 可选增强项（缺失时回退到 baseline）**

- 宿主专用 `citation_rule`；
- 宿主专用 `naming_rule`；
- 自定义 `page_families` 子类或模板；
- 自定义 `index_surface` / `log_surface`；
- `search_policy` 与工具链增强。

换句话说：**可选增强项缺失时，不应自动阻断写回；只有最低写回前提缺失时，才进入 blocked / degraded 路径。**

#### 5.3.2 最小发现 / 降级算法

为让“不完整宿主”仍可在最小复杂度下运行，skill 应采用以下 3 步算法：

1. **发现 wiki root**
   - 优先使用宿主显式声明的 `wiki_root`；
   - 若宿主未显式声明，但当前工作目录本身就是 wiki 根，或存在唯一可识别的导航面（如 `index.md` / 等价导航），可将其视为已发现；
   - 若出现两个及以上同等候选，则直接进入 `blocked-by-host`；**不得猜测**；
   - 若无法可靠发现 `wiki_root`，则 durable writeback 进入 `blocked-by-host`，只回答不写回。
2. **判定 writable target**
   - 优先写入相关既有 canonical page；
   - 若不存在既有页，则在 `wiki_root` 下按 baseline page family 与命名规则创建新页；
   - 若命名规则缺失，采用保守 baseline 命名；若连 target 落点都无法唯一判定，则降级为 `maintenance` 或 `blocked-by-host`。
3. **应用 protected scope 与降级规则**
   - 命中 `protected scope` 则阻断，不得绕写；
   - 未命中禁区且 target 明确时，允许在 baseline 规则下写回；
   - 若只有导航 / 日志不可写，则按其各自降级策略处理，不得改写其他宿主文件代偿。

这条算法的目标是：**不把“完整宿主契约”变成新的逐次授权门槛，同时也不允许在边界不清时自由发挥。**

**protected scope** 推荐支持但不限于以下表达：

- 目录禁区：如 `templates/`、`published/`、`archive/`、`vendor/`。
- 文件禁区：如宿主维护的首页、手写综述、外部导出物。
- 字段禁区：frontmatter 中由人工维护或其他系统维护的字段。
- 页面分区禁区：页面中特定 section、callout、表格区域。
- 操作禁区：如禁止 rename / archive / supersede，仅允许 append maintenance note。

#### 5.3.3 protected scope 优先级

为减少临场解释空间，冲突时采用固定优先级：

`operation > section/field > file > directory`

并且遵守一条总规则：**更具体的 deny 永远覆盖更宽泛的 allow。**

### 5.4 query：先回答，再判断是否沉淀

新的 query 默认路径如下：

1. 先按 `index-first` 读取导航面并定位相关 durable pages。
2. 需要时回到 raw bundle，通过 raw ref 补证据。
3. 先输出回答，不因“尚未决定是否写回”而推迟回答。
4. 回答完成后，判断本次结果是 `ephemeral answer` 还是 `durable knowledge`。
5. 若形成 durable knowledge 且命中可写 wiki scope、且未被 protected scope 阻止，则正常写回 wiki。
6. 若形成 durable knowledge 但被 host contract 阻止，则返回 **blocked-by-host**：回答保留，但不写回，并明确指出缺口或禁区。

这里的“被 host contract 阻止”只包括两类情况：

- 最低写回前提缺失（如无法发现 `wiki_root`、无法判定 writable target、无法写出最小 raw ref）；
- 明确命中 `protected scope`。

可选增强项缺失本身不构成阻断理由。

#### 5.4.1 三种结果

| 结果 | 条件 | 行为 |
|---|---|---|
| 只回答不写回 | 结果仅服务当前对话；或证据不足；或不值得长期复用 | 返回答案 + 依据 + 不确定性；不改 wiki |
| 正常沉淀 | 结果具有跨会话复用价值，证据充分，能落入既有页或合法新页，且未被 protected scope 阻止 | 更新相应 durable page；必要时同步 index；按允许条件追加 log |
| 被 host 阻止 | 结果具备沉淀价值，但目标路径 / 文件 / 字段 / 操作落在 protected scope，或宿主未提供足够 contract 使写回可审计 | 返回答案，并明确写出 blocked reason；不做变通写回 |

#### 5.4.2 durable knowledge 判定

一个 query 结果只有同时满足以下条件时，才应视为 durable knowledge：

- 对未来问题仍可能复用；
- 可以稳定归属到某个 page family；
- 有足够 raw ref 或现有 durable page 证据支撑；
- 不是纯粹一次性措辞、偏好表达或临时工作记忆；
- 写回不会破坏命名、导航、引用与 protected scope 约束。

### 5.5 ingest：直接更新 durable pages，不创建 source summary

新的 ingest 流程：

1. 识别 raw bundle，并确认或生成稳定 `source id`。
2. 从 raw bundle 提取关键事实、争议、限制与可复用知识点。
3. 直接判断受影响的 durable pages：`entity` / `topic` / `comparison` / `synthesis` / `maintenance`。
4. 直接把新证据合并进这些 durable pages，并使用 raw ref 标注依据。
5. 若出现冲突，不静默覆盖，而是标记 `contested` / `superseded` / `needs-verification`。
6. 若产生新 canonical page 或结构变化，则同步更新 index。
7. 若宿主允许，向 log 追加安全摘要；若 log 不可写，不得改写其他宿主文件代偿。

**不再存在**“先写 source summary，再扇出更新其他页面”的 baseline。raw 不需要一个额外的 wiki 摘要页才能进入知识层。

### 5.6 raw model：locator / ref 直接成为证据锚点

为替代 `source summary` 的中转角色，本 RFC 引入稳定 raw model：

#### 5.6.1 raw bundle

raw bundle 至少应具备以下语义字段：

- `source_id`：稳定唯一 ID。
- `bundle_root`：bundle 根位置或主 artifact 位置。
- `artifact_kind`：如 markdown / pdf / image / audio / table / mixed。
- `immutable`：固定为 true。
- `metadata`：可选的标题、作者、日期、来源类型等安全元数据。

#### 5.6.2 raw locator

raw locator 由两部分组成：

- `artifact`：bundle 内具体文件或主对象。
- `selector`：该 artifact 内的定位语义。

 selector 采用“baseline 必需 + 宿主扩展示例”的设计：

**baseline 必需支持**

- markdown / text：heading、anchor、line-range。
- pdf：page、page-range。
- audio / video / transcript：timestamp、time-range。

**宿主扩展示例（非强制）**

- table：sheet、row-range、cell-range。
- image：region、caption、adjacent-note。
- richer text objects：paragraph、figure、caption。

这样可以避免文档把未来所有 selector 能力都承诺成 baseline 负担。

#### 5.6.3 raw ref

raw ref 是 durable pages 的证据引用单元，最小字段为：

- `source_id`
- `locator`

可选字段为：

- `quote`：安全短摘录；
- `note`：说明为何引用该证据；
- `confidence`：当 selector 只能近似定位时的保守说明。

raw ref 的关键约束是：**必须能让后续 agent 回到 raw bundle 中重新定位证据，不依赖中间摘要页。**

### 5.7 page families：只保留五类 durable pages

baseline page families 收敛为：

- `entity`
- `topic`
- `comparison`
- `synthesis`
- `maintenance`

其中：

- `entity`：对象页。
- `topic`：概念 / 议题 / 方法页。
- `comparison`：横向比较页。
- `synthesis`：跨多页的阶段性综合页。
- `maintenance`：冲突、缺口、待验证项、结构债务工作台。

`source summary` 不再是 baseline page family，也不作为 ingest 第一落点。宿主若需要单独的来源目录展示，可在自己的 schema 中定义额外展示层，但本 skill 不再把它视为知识沉淀的核心页型。

### 5.8 page lifecycle：split / merge / archive / supersede

随着 wiki 演化，page lifecycle 需要成为显式规则：

- **split**：当页面过载、主题分叉、或需要将子主题升级为独立 durable page 时执行；原页保留摘要与跳转。
- **merge**：当多个页面实际承载同一对象或同一问题时执行；保留 canonical page，其他页重定向或标记 merged。
- **archive**：当页面只保留历史价值、不再作为当前 canonical knowledge 入口时执行；必须保留可导航回链。
- **supersede**：当旧结论被新证据取代，但保留历史上下文仍有价值时执行；旧页或旧 section 保留 superseded 标记与跳转。

默认策略应尽量保守：**先 append / update / 标记状态，只有导航负担或 canonical 冲突已经明显时，才做 split / merge / archive / supersede 这类结构性动作。**

生命周期操作必须满足两点：

1. 不破坏现有 raw ref 的可追溯性；
2. 不制造导航断裂或孤儿页。

### 5.9 evidence hygiene

新的 evidence hygiene 基线：

- 区分 **来源事实**、**wiki 综合判断**、**待验证推测**。
- durable knowledge 的关键结论必须直接引用 raw ref，不通过 `source summary` 转述背书。
- 证据不足时使用 `needs-verification`，而不是把推测写成确定事实。
- 证据冲突时保留冲突双方与各自 raw ref，必要时标记 `contested` 或 `superseded`。
- log 只记录安全摘要、source id / page id / 授权或阻断原因；不复制大段原文、敏感路径或隐私信息。

### 5.10 index / log / search 的角色与升级点

- **index**：默认主导航面。它描述 durable knowledge 的可发现结构，而不是时间线。只有结构变化、canonical page 新增/重命名/合并等影响可导航性时才必须同步。
- **log**：追加式变更时间线。它是审计与最近活动视图，不是事实主来源。log 不应承担知识正文。
- **search**：定位增强器。只有在导航不足且宿主允许时使用；命中结果仍需回到 durable pages 或 raw refs 验证。

升级点：

1. index 需要反映 page lifecycle（如 split / merge / archive / supersede）的 canonical 去向；
2. log 需要能表达本次动作是 `ingest` / `query writeback` / `lint` / `blocked-by-host`；
3. search 的文档应从“是否可以搜索”升级为“搜索只能缩短定位路径，不能替代证据判断”。

### 5.11 legacy source summary 兼容策略

删除 `source summary` baseline 并不等于要求宿主先清理历史来源摘要页。为保证迁移可验证、回滚可行，本 RFC 明确：

1. **可读但非 canonical**：已有 `source summary` 页面可以作为辅助上下文或旧导航面读取，但不再是 baseline 证据中转层。
2. **默认不新建、不要求更新**：除非宿主 override 明确要求，否则后续 `ingest` / `query` / `lint` 都不应再创建新的 `source summary`，也不把其缺失视为问题。
3. **不做破坏性清理**：本次 skill 语义迁移不删除、不重命名、不批量迁移既有 `source summary` 页面。
4. **durable pages 不再依赖它们背书**：新的 canonical 结论必须直引 raw ref；旧 `source summary` 若被引用，只能作为辅助阅读，而不能替代 raw 证据。
5. **回滚语义简单**：若未来回退到旧 skill，既有 `source summary` 页面仍完整可用；若不回退，新 skill 也不会因为它们存在而执行破坏性动作。

## 6. 备选方案

### 6.1 备选方案 A：保留 source summary，但弱化其地位

**方案**：继续保留 `source summary`，只是不再强调它是“最终事实源”。

**为什么放弃**：

- 仍会把 ingest 的默认工作心智拉回“先整理来源摘要，再更新知识页”；
- durable pages 依然容易通过摘要页间接引用 raw，无法形成“证据直达 raw”的强约束；
- 无法真正消除当前 references 中围绕 `source summary` 建立的大量内部耦合。

### 6.2 备选方案 B：保留 query 默认严格只读，只在显式授权时写回

**方案**：延续当前模型，把 wiki 写回继续视为例外动作。

**为什么放弃**：

- 与 `llm-wiki.md` 中“问题与探索本身也应复利沉淀”的精神不一致；
- 会让高价值比较、综合、关系发现停留在聊天历史，而不是进入 durable knowledge；
- 让 schema 变成审批器，而不是结构契约。

### 6.3 备选方案 C：引入新的 CLI / manifest / 解析器保证 raw ref 结构化

**方案**：新增脚本或 runtime，为 raw bundle / locator / ref 提供强制校验。

**为什么放弃**：

- 超出本任务 scope；
- 会把文档级语义重构升级为工具链工程；
- 当前任务的目标是先把 skill 契约说清楚，而不是引入额外系统。

## 7. 数据模型 / 接口

### 7.1 host contract 最小字段

| 字段 | 层级 | 说明 |
|---|---|---|
| `raw_roots` | 推荐 | 只读 raw bundle 所在范围；若宿主已有固定 raw 区，建议显式声明 |
| `wiki_root` | 最低写回前提 | durable knowledge 根；可显式声明或按 5.3.2 可靠发现 |
| `writable_scopes` | 最低写回前提（可 fallback） | 可写 wiki 范围；宿主缺失时默认回退为 `wiki_root` 内 baseline 页面与导航面 |
| `protected_scopes` | 最低写回前提（可 fallback） | 禁写范围；缺失时视为“无额外禁区”，但 raw 与宿主外部路径仍天然禁写 |
| `page_families` | 增强项 | 至少映射五类 baseline 页型；缺失时使用 baseline |
| `naming_rule` | 增强项 | 页面命名 / slug / ID 规则；缺失时使用保守 baseline |
| `citation_rule` | 增强项 | raw ref 的宿主呈现格式；缺失时使用 baseline 引用样式 |
| `index_surface` | 增强项 | 默认 `index.md` |
| `log_surface` | 增强项 | 默认 `log.md` |
| `search_policy` | 增强项 | 是否允许搜索及其边界 |

兼容策略：宿主可以自定义命名、frontmatter 与 citation 字面格式，但不能改变以下语义约束：raw 只读、durable page 直引 raw、index-first、protected scope 优先、host override 高于 baseline。

补充说明：`host contract` 的真阻断只发生在两种情况下——`wiki_root` 无法可靠发现，或 writable target 无法安全判定。其他字段若未显式声明，应先尝试 baseline fallback，而不是自动阻断。

### 7.2 raw bundle / locator / ref 接口语义

| 接口 | 最小字段 | 约束 |
|---|---|---|
| raw bundle | `source_id`, `bundle_root`, `artifact_kind`, `immutable` | `immutable=true`；宿主内唯一 |
| raw locator | `artifact`, `selector` | selector 必须与 artifact 类型匹配 |
| raw ref | `source_id`, `locator` | 必须可回溯到 raw；可附加安全摘录 |

兼容策略：允许宿主把这些字段映射到脚注、内链、frontmatter 或表格列，但不允许退化成“仅写一个模糊来源标题、无法重新定位证据”。

### 7.3 page interface 语义

| 页型 | 必需接口 |
|---|---|
| entity | 对象定义、关键事实、关系、争议/待验证、raw refs |
| topic | 主题边界、核心观点、子主题/相关页、争议/缺口、raw refs |
| comparison | 比较问题、维度、结论、限制/冲突、raw refs |
| synthesis | 综合问题、核心结论、支撑页、竞争解释、open questions |
| maintenance | issue、severity/status、触发来源、受影响页、建议动作 |

兼容策略：宿主可调整栏目名称与格式，但不能删除“可追溯证据”和“当前状态/不确定性”这两个核心接口。

## 8. 错误语义

| 场景 | 语义 | 可恢复性 / 重试 |
|---|---|---|
| 宿主未声明 `wiki_root` 或 `writable_scopes` | contract gap | 可恢复；待宿主补充后重试写回 |
| 目标落入 protected scope | blocked-by-host | 不应绕行重试；需宿主显式调整边界 |
| raw locator 无法稳定定位 | evidence gap | 可恢复；改用更稳健 selector 或降级为 `needs-verification` |
| 命名冲突 / canonical page 不明确 | structure conflict | 可恢复；先 merge/split/rename 再继续 |
| 新证据与旧结论冲突 | knowledge conflict | 可恢复；应标记 `contested` / `superseded`，不可静默覆盖 |
| index 不可写但需要创建新 canonical page | navigation block | 应视为 blocked-by-host；因为会破坏可发现性 |
| log 不可写 | logging degraded | 一般可继续；输出中明确“未记录日志”，不得改写其他宿主文件代偿 |
| 证据不足但用户要求结论化沉淀 | unsafe writeback | 不应重试同样写法；应降级断言或转 maintenance |

补充说明：

- `writable_scopes` 缺失但 `wiki_root` 已可靠发现时，可按 baseline 视 `wiki_root` 内 durable pages、`index.md`、`log.md` 为默认工作面；
- `citation_rule` / `naming_rule` 缺失不构成 `contract gap`，应使用 baseline；
- 只有当 `wiki_root` 无法发现，或 target 无法安全判定时，才应将其视为真正阻断 durable writeback 的 `contract gap`。

重试原则：

- **可恢复错误**：补充 contract、补证据、澄清 canonical 目标后可重试；
- **不可绕过错误**：protected scope、raw 只读、宿主明确禁写；
- **降级优先**：能通过降级为只回答、maintenance、或 `needs-verification` 解决时，不要硬写确定性 durable page。

## 9. 安全考虑

### 9.1 滥用与越权

- 永不回写 raw。
- 仅在宿主声明的 writable scope 内写入。
- protected scope 一旦命中，禁止用“换个文件写”“先写日志再补正文”等方式绕过。

### 9.2 输入校验

- raw locator 的 selector 必须与 artifact 类型匹配，避免伪定位。
- source id 必须稳定且不泄露不必要的敏感路径。
- raw ref 中的摘录应保持最小必要，避免泄露整段敏感原文。

### 9.3 资源耗尽与失控 fan-out

- ingest 默认按单 source 或小批次进行，避免一次性扩散到不可审计的大量页面。
- query 写回只应触及直接相关 durable pages，不把“能想到的所有相关页”都改一遍。
- lint 应优先产生 issue list 与 maintenance 更新，而不是全库重写。

### 9.4 事实安全

- 搜索结果不是事实；最终结论必须回到 durable pages 或 raw refs。
- 冲突证据必须显式保留，不静默抹平。
- 未能稳定定位的内容只能降级为 `needs-verification`。

## 10. 向后兼容、迁移与 rollout / rollback

### 10.1 保留不变的能力

以下原则保持不变：

- 三层结构：raw / wiki / schema；
- `index-first`；
- evidence discipline；
- host override 优先于 baseline；
- log 仍是追加式、以安全摘要为主。

### 10.2 必须删除或改写的旧说法

以下现有表述应从 scoped files 中删除或改写：

1. “`query` 默认严格只读，只有用户显式要求沉淀且宿主显式定义写回流程时才允许写回。”
2. “`ingest` 先生成或更新 `source summary`，不要跳过来源页直接散写到多处。”
3. “`source summary` 是 baseline page family / evidence index / 重要 raw source 的默认对应页。”
4. 任何把 durable pages 的引用链写成“raw -> source summary -> durable page”的表述。
5. 任何将 `source summary` 缺失视为 lint 必修项的规则。

### 10.3 迁移方式

本任务只改 skill 文档与 references，因此迁移是**文档语义迁移**，不是数据迁移：

1. 重写 `SKILL.md` 总纲与入口语义；
2. 重写 `architecture.md`，定义第一原则、host contract、protected scope；
3. 重写 `workflows.md`，替换 bootstrap / ingest / query / lint 的决策路径；
4. 重写 `conventions.md`，建立 raw ref 与 evidence hygiene 基线；
5. 重写 `page-types.md`，删除 `source summary`，补 page lifecycle；
6. 新增 `raw-model.md` 与 `scenarios.md` 作为 raw 语义与 canonical scenarios 真源。

对已有宿主内容的兼容语义见 `5.11 legacy source summary 兼容策略`：旧 `source summary` 页面可继续存在并被读取，但不再是 baseline canonical layer，也不再是默认维护对象。

### 10.4 rollout

建议 rollout 顺序：

1. 先落 RFC；
2. 再实施文档改写；
3. 做 references 一致性检查；
4. 以 canonical scenarios 验证 read-only / durable writeback / blocked-by-host 三条主路径；
5. 通过 `review-rfc` / 实施后 review 再合入。

### 10.5 rollback

由于没有 runtime 与数据迁移，rollback 方式简单：

- 直接回退本次 skill 文档改动；
- 不需要迁移 raw 或 wiki 数据；
- 风险主要是文档心智回摆，而不是系统状态不一致。

## 11. 验证计划

### 11.1 关键行为与验收映射

| 关键行为 | 验收方式 |
|---|---|
| `source summary` 被彻底移除 | scoped files 不再把 `source summary` 列为 baseline page family、ingest 第一落点、lint 必选项或引用中转层 |
| references 无自相矛盾 | `SKILL.md`、`architecture.md`、`workflows.md`、`conventions.md`、`page-types.md` 对 query/ingest/writeback 语义一致 |
| raw model 可执行 | `raw-model.md` 能独立解释 raw bundle / source id / raw locator / raw ref / selector，且与其他 references 用词一致 |
| query 结果分流清晰 | canonical scenarios 覆盖“只回答不写回 / 正常沉淀 / blocked-by-host”三条路径 |
| durable pages 直接引 raw | page type 与 conventions 不再要求经由 `source summary` 承接证据 |
| index/log/search 角色清晰 | 文档中明确 index 是导航、log 是时间线、search 是定位增强 |
| page lifecycle 可操作 | 至少定义 split / merge / archive / supersede 的触发条件与约束 |

### 11.2 推荐审查问题

供 `review-rfc` 重点挑战：

1. “默认可沉淀”是否已经被 `host contract + protected scope` 充分收边？
2. 移除 `source summary` 后，raw ref 是否足以承担证据锚点职责？
3. index 不可写时阻断新 canonical page，这一约束是否足够清晰且合理？
4. log 不可写但正文可写时的降级策略，是否会导致审计盲区？
5. page lifecycle 是否仍保持最小复杂度，没有引入额外系统。

### 11.3 边界验证矩阵

除正向流程外，还应至少覆盖以下负向或降级用例：

| 场景 | 预期行为 |
|---|---|
| `wiki_root` 可发现，但 `index.md` 不可写 | 可更新既有正文；若需创建新 canonical page 则 blocked-by-host |
| 目录可写，但某字段/section 被 protected | 命中更具体 deny，局部阻断，不得绕写 |
| `log.md` 不可写，但正文可写 | 允许正文写回；输出中明确 logging degraded |
| 宿主存在 legacy `source summary` | 可读取但非 canonical；默认不更新、不新建 |
| 仅有一次性问答，无 durable value | 只回答不写回 |
| durable value 明确，但无法判定 target | 降级为 maintenance 或 blocked-by-host，不硬写新页 |

## 12. Open Questions

- 非阻塞问题：baseline 是否要提供一个“推荐 raw ref 字面示例”，还是只保留语义字段、把具体书写格式完全交给宿主。建议在实施时给出**非强制示例**，但不把它写成强制统一语法。

## 13. 落地计划

### 13.1 文件变更点

- `~/.agents/skills/llm-wiki/SKILL.md`
  - 重写总纲、bootstrap、ingest、query、lint 入口语义。
- `~/.agents/skills/llm-wiki/references/architecture.md`
  - 重写三层职责、第一原则、host contract、protected scope、index/log/search 边界。
- `~/.agents/skills/llm-wiki/references/workflows.md`
  - 重写 bootstrap / ingest / query / lint 流程与自检。
- `~/.agents/skills/llm-wiki/references/conventions.md`
  - 重写 citation、raw ref、日志安全、状态标记、互链与 evidence hygiene。
- `~/.agents/skills/llm-wiki/references/page-types.md`
  - 删除 `source summary`，只保留五类 durable page，并加入 lifecycle 约束。
- `~/.agents/skills/llm-wiki/references/raw-model.md`
  - 新增 raw bundle / locator / ref / selector 真源文档。
- `~/.agents/skills/llm-wiki/references/scenarios.md`
  - 新增 canonical scenarios，覆盖 read-only / durable writeback / blocked-by-host。

### 13.2 验证步骤

1. 审读 scoped files，确认没有残留 `source summary` 作为 baseline page family 或 ingest 第一落点。
2. 逐文件比对术语：`raw bundle`、`source id`、`raw locator`、`raw ref`、`selector`、`protected scope` 的定义完全一致。
3. 检查 query 文档是否明确区分三种结果：只回答不写回、正常沉淀、被 host 阻止。
4. 检查 ingest 文档是否明确“直接更新 durable pages，不创建 source summary”。
5. 检查 page lifecycle、index/log/search、evidence hygiene 是否都已在 references 中有唯一真源。
6. 在 `scenarios.md` 中走完三条 canonical scenarios，确保 workflow 与 contract 能闭环。
