# 架构

## 1. 总体模型

`llm-wiki` 采用三层模型：

1. **raw layer**：原始来源层；只读；最终证据层
2. **wiki layer**：durable knowledge layer；主知识产物
3. **schema layer**：结构与边界契约；描述命名、引用、可写范围、禁区与导航面

核心精神：**wiki 是主 artifact，LLM 是 wiki 的程序员**。

## 2. 第一原则

1. **wiki 优先于聊天**：高价值知识优先沉淀到 wiki。
2. **raw 不可变**：raw bundle 永远只读。
3. **schema 是契约，不是审批器**：负责结构 / 禁区 / 命名 / 引用 / 可写范围，不把正常维护变成逐回合授权。
4. **index-first**：默认先读导航面，再读页面，再回 raw。
5. **证据直达 raw**：关键结论必须能追溯到 raw ref。
6. **host override 优先**：宿主规则高于 baseline。
7. **protected scope 优先**：命中禁区即阻断。
8. **最小机制**：不引入与文档重写无关的新系统。

## 3. host contract

### 3.1 最低写回前提

只有以下条件成立时，durable writeback 才可正常发生：

- 能发现或可靠推断 `wiki_root`
- 能判定本次写回的具体 target
- target 不在 `protected scope`
- 至少存在一种可执行的 raw ref 写法

若缺少以上任一项，应降级为只回答、maintenance，或 `blocked-by-host`。

### 3.2 可选增强项

以下项目用于提升体验，缺失时不应自动阻断：

- `raw_roots`
- `writable_scopes`
- `page_families` 扩展映射
- `naming_rule`
- `citation_rule`
- `index_surface`
- `log_surface`
- `search_policy`

baseline 可以保守回退，但不能越过宿主已声明的边界。

## 4. protected scope

`protected scope` 可以按以下粒度表达：

- 目录
- 文件
- section
- field
- operation（如 rename / archive / supersede）

冲突优先级：

`operation > section/field > file > directory`

总规则：**更具体的 deny 覆盖更宽泛的 allow**。

raw roots 永远属于天然 protected scope。

## 5. wiki 工作面

### 5.1 index

- `index.md` 或宿主等价导航面是默认工作面
- index 负责可发现性、canonical 去向、结构入口
- 只有结构变化时才必须同步：新 canonical page、rename、split、merge、archive、supersede
- index 不是时间线，不承担正文事实主来源职责

### 5.2 log

- `log.md` 或宿主等价面是追加式变更时间线
- 用于审计、最近活动、安全摘要、阻断原因
- log 不是知识正文，不承载 canonical facts
- 若 log 不可写，属于 `logging degraded`；不可改写其他文件代偿

### 5.3 search

- search 只是定位增强器，不是事实来源
- 只有在导航不足且宿主允许时才使用
- 搜索命中后仍需回到 durable page 或 raw ref 验证

## 6. page families 边界

baseline durable pages 只保留五类：

- `entity`
- `topic`
- `comparison`
- `synthesis`
- `maintenance`

`source summary` 不再是 baseline page family，也不是 ingest 第一落点。

legacy `source summary`：

- 可读取
- 非 canonical
- 默认不新建
- 默认不更新
- 不做破坏性清理

## 7. 证据路径

canonical 证据路径应为：

`raw bundle -> raw locator -> raw ref -> durable page`

而不是：

`raw -> source summary -> durable page`

durable page 的关键结论必须能沿 raw ref 回到 raw；durable pages 之间可以互相引用，但不能替代 raw 证据链本身。

## 8. 写回边界

### 8.1 正常写回

当结果具有 durable value，且 target 明确、证据充分、未命中 protected scope 时：

- 更新既有 canonical page，或
- 在允许范围内创建新 canonical page，或
- 在不宜直接定论时写入 maintenance

必要时同步 index；若宿主允许，再追加 log。

### 8.2 blocked-by-host

以下情况应返回 `blocked-by-host`：

- 无法可靠发现 `wiki_root`
- 无法安全判定 writable target
- 命中 `protected scope`
- 需要创建新 canonical page，但 index 不可写且会破坏可发现性

`blocked-by-host` 的语义是：答案照常给出，但不写回 wiki，也不绕写其他文件。

### 8.3 degraded but allowed

以下情况一般允许继续正文写回：

- `log.md` 不可写
- 缺少宿主专用 `citation_rule`
- 缺少宿主专用 `naming_rule`

此时应使用 baseline，并在输出中注明降级点。
