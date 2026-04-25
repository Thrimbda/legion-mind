# 约定

## 1. raw ref 约定

durable page 中的关键结论应直接附 raw ref。raw ref 的语义最少包括：

- `source_id`
- `locator`

可选补充：

- 安全短摘录
- 注释
- 置信说明

关键要求：后续 agent 必须能靠 raw ref 回到 raw bundle 重新定位证据。

## 2. citation 约定

- baseline 只规定**可追溯语义**，不强制统一 markdown 字面格式
- 宿主可自定义脚注、内链、表格列、frontmatter 字段等表现形式
- 不允许退化成“只写模糊来源标题、无法重新定位证据”
- durable knowledge 不应依赖 `source summary` 作为 canonical 中转层

## 3. evidence discipline

默认区分三类内容：

1. **来源事实**：可直接由 raw ref 支撑
2. **wiki 综合判断**：基于多个 raw ref 或 durable page 的综合结论
3. **待验证推测**：证据不足但值得保留的问题或假设

规则：

- 关键事实直引 raw ref
- 推测必须显式标记，不能伪装成确定事实
- 冲突证据应保留双方，不静默覆盖
- 需要时使用 `needs-verification`、`contested`、`superseded`

## 4. 日志安全

`log.md` 或宿主等价日志面只记录安全摘要，例如：

- source id
- page id / page slug
- 动作类型（ingest / query writeback / lint / blocked-by-host）
- 阻断原因或降级原因

不要在日志中：

- 复制大段原文
- 暴露敏感路径
- 记录超出必要范围的隐私信息
- 把 log 写成知识正文

## 5. 状态标记

推荐使用下列语义状态：

- `needs-verification`：证据不足或 selector 不稳定
- `contested`：存在冲突证据或竞争解释
- `superseded`：旧结论已被新证据取代，但仍保留历史上下文
- `archived`：页面保留历史价值，但不再是当前 canonical 入口
- `merged`：内容已并入其他 canonical page

状态标记用于暴露不确定性与生命周期，不是装饰性标签。

## 6. page lifecycle 约定

### split

适用：页面过载、主题分叉、子主题已具备独立 durable value。

要求：

- 原页保留摘要与跳转
- index 反映 canonical 去向

### merge

适用：多个页面实际描述同一对象 / 问题。

要求：

- 明确 canonical page
- 被合并页保留回链或状态标记

### archive

适用：历史价值保留，但不再作为当前入口。

要求：

- 不制造孤儿页
- 保留可导航回链

### supersede

适用：旧结论被新证据替代，但保留历史仍有价值。

要求：

- 保留 superseded 标记
- 新旧结论都可回溯到各自证据

默认先 append / update / 标记状态；只有结构负担明显时才做结构性生命周期动作。

## 7. 互链与导航

- index 负责主导航
- durable pages 之间可互链，但互链不能替代 index 的 canonical 发现职责
- 新 canonical page、rename、split、merge、archive、supersede 后应同步 index
- search 只是定位增强器，不是引用来源

## 8. 自检约定

写回前快速检查：

1. 目标页是否位于可写 wiki scope？
2. 是否命中 protected scope？
3. 关键结论是否有 raw ref？
4. 是否误把一次性回答写成 durable knowledge？
5. 是否需要同步 index？
6. log 不可写时，我是否正确降级而非绕写？
7. 我是否避免创建或更新新的 `source summary`？
