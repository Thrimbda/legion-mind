# 工作流

本文所有 `index.md` / `log.md` 表述，都兼容宿主声明的等价导航 / 日志机制。

## 目录

- [1. bootstrap](#1-bootstrap)
- [2. ingest](#2-ingest)
- [3. query](#3-query)
- [4. lint](#4-lint)

## 1. bootstrap

### 步骤

1. 找到 raw sources、wiki 根、以及宿主规则文件。
2. 确认导航机制、日志机制、页面家族、命名 / frontmatter / citation 规则。
3. 判断 query 写回是否被显式定义；若没有，锁定为只读路径。
4. 确认等价导航 / 日志机制是否满足统一可写前提：宿主显式声明其职责、目标位于可写 scope、且允许字段与写法已定义。
5. 确认 maintenance 页、lint issue 落点、附件 / 搜索是否允许。
6. 用一句话明确本次 session 的操作边界：能 ingest 什么、query 是否只读、哪些 durable writeback 被允许。

### 最小输出

- 已确认的宿主 schema 要点。
- 缺失的 schema 点。
- 本次 session 的保守执行边界。
- 不可写但可读的等价机制（如有）。

## 2. ingest

### 触发

- 用户提供新 source 并要求处理；或宿主流程要求定期摄入 raw sources。

### 标准步骤

1. 读取单个 source 或小批次 source，提取关键事实、主张、时间、角色、数据与不确定点。
2. 先生成或更新 source summary；不要跳过来源页直接散写到多处。
3. 判断受影响页面：entity、topic / concept、comparison、synthesis / overview、maintenance，或宿主等价页型。
4. 合并新信息并补 citations；若与旧结论冲突，显式标记 contested / superseded / needs-verification，而不是静默覆盖。
5. 仅在新增页面、重命名、分类变化或目录说明失真时更新导航机制；若宿主等价导航机制不可写，则报告缺口，不擅自写入其他宿主文件。
6. 仅当日志机制满足可写前提时追加一次 ingest 记录；否则记录“日志机制只读，待宿主补规则”的缺口。

### 自检

- raw sources 未被改写。
- source summary 已创建或更新。
- 每个新增结论都能回到 source 或已有页面证据。
- 导航 / 日志同步策略已执行，或明确说明本次为何无法同步。
- 冲突信息未被静默覆盖。

## 3. query

### 默认路径：严格只读

1. 先读导航机制，定位相关页面。
2. 优先复用已有 comparison / synthesis / topic / entity 页面。
3. 证据不足时，再回到 source summary 或 raw source 补证据。
4. 输出固定为 4 段：答案 / 关键依据 / 冲突与不确定性 / 缺口与下一步。

### 三岔路决策

- **query（只读）**：用户只是问答，或宿主未声明写回流程。输出 4 段答案，不写 wiki。
- **query（建议沉淀）**：答案有长期价值，但用户未明确授权、或宿主未定义流程。输出 4 段答案 + 建议 page type / 落点 / 需要的授权缺口，不写 wiki。
- **query（授权写回）**：只有当用户明确要求沉淀，且宿主 schema 显式规定写回流程、目标页型、允许字段、导航 / 日志同步方式时，才允许写回。

### 授权写回步骤

1. 记录授权依据与命中的宿主写回流程。
2. 先给出 4 段答案，再决定 durable artifact 的 page type。
3. 只写 comparison / synthesis / maintenance 或宿主明确允许的等价页型。
4. comparison / synthesis / maintenance 是 wiki 内的 page type；table / slide deck / chart / canvas 是可能的输出载体。只有当宿主 schema 明确允许其写回或登记方式时，才把这些载体纳入 durable writeback。
5. 必要时同步导航机制，并仅向满足可写前提的日志机制追加安全摘要。
6. 若中途发现授权、可写 scope 或 schema 不完整，立即退回只读 / 建议沉淀路径。

### 自检

- 本次 query 是否保持了默认只读？若没有，是否同时满足双重显式条件？
- 4 段式输出是否完整？
- 建议沉淀与实际写回是否被清晰区分？
- 若发生写回，是否只触达宿主允许字段、页型与可写 scope？

## 4. lint

### 检查目标

- 事实冲突、过期断言、证据不足
- orphan page、缺失互链、索引 / 日志不同步
- 重要概念缺页、source summary 缺失
- maintenance backlog 积压、状态失真

### issue 分类

- **critical**：错误事实、被新证据推翻却未标记、敏感信息误入日志。
- **major**：关键页面缺失、严重孤儿化、重要互链缺失、关键来源未沉淀。
- **minor**：命名不一致、摘要陈旧、轻度结构噪音、低风险缺口。

### 标准步骤

1. 读取导航机制、日志机制与相关页面。
2. 按 issue taxonomy 归类问题，并为每项列出受影响页面。
3. 判断证据是否足够直接修复；不足时只降级断言或创建 maintenance 项。
4. 默认只在宿主允许的范围内更新 maintenance 页或必要的状态标记；只有宿主对其他页型修复有显式流程时，才直接修正文档。
5. 仅向满足可写前提的日志机制追加 lint 摘要，不把全部明细直接倒入日志。

### 最小决策矩阵

| 场景 | 默认输入 | 默认输出 | 默认写回 | 必做自检 |
|------|----------|----------|----------|----------|
| bootstrap | 宿主规则 + 目录结构 | schema 摘要 + 缺口 | 不写 wiki | 是否已确认导航 / 日志等价机制及其可写前提 |
| ingest | 1 个 source 或小批次 | source summary + 受影响页面更新 | 允许 | raw 未改写；冲突已标记 |
| query（只读） | 用户问题 + 导航机制 + 相关页面 | 4 段式答案 | 不允许 | 是否明确保持只读 |
| query（建议沉淀） | 高价值答案但无完整授权 | 4 段式答案 + 沉淀建议 | 不允许 | 是否把授权缺口说清楚 |
| query（授权写回） | 用户明确要求 + 宿主显式流程 | 4 段式答案 + durable page | 仅允许宿主页型与可写 scope | 是否记录授权依据 |
| lint | 导航 / 日志 + 页面集合 | issue list + 建议动作 | 默认仅 maintenance，或宿主显式允许修正 | 证据不足时是否避免重写 |

### 自检

- 每个 issue 是否有 severity、影响范围、建议动作？
- 是否区分了直接修复与仅建 maintenance 项？
- 日志是否只保留安全摘要？
