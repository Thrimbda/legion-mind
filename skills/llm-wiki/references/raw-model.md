# raw model

## 1. 目标

raw model 用来定义 raw 层如何成为 durable knowledge 的最终证据锚点，而不依赖 `source summary` 作为中转层。

## 2. raw bundle

`raw bundle` 是一个不可变的原始来源单元及其必要附件集合。它可以是：

- 单个 markdown / text 文件
- 单个 PDF
- 音频 / 视频与 transcript
- 主文档加附件的只读集合
- 混合型来源集合

最小语义字段：

- `source_id`
- `bundle_root`
- `artifact_kind`
- `immutable = true`

可选元数据：

- 标题
- 作者 / 机构
- 时间
- 来源类型

## 3. source id

`source_id` 是 raw bundle 的稳定标识符。

要求：

- 在宿主范围内唯一
- 可复用
- 可安全出现在页面与日志中
- 不暴露不必要的敏感路径

## 4. raw locator

`raw locator` 用来定位 raw bundle 内的具体证据位置，由两部分组成：

- `artifact`：bundle 内具体文件或主对象
- `selector`：该 artifact 内的选区语义

## 5. selector

selector 采用“baseline 必需 + 宿主可扩展”模型。

### baseline 必需支持

- markdown / text：`heading`、`anchor`、`line-range`
- pdf：`page`、`page-range`
- audio / video / transcript：`timestamp`、`time-range`

### 宿主可扩展示例

- table：`sheet`、`row-range`、`cell-range`
- image：`region`、`caption`、`adjacent-note`
- richer text object：`paragraph`、`figure`、`caption`

约束：selector 必须与 artifact 类型匹配；若无法稳定定位，应降级为 `needs-verification`。

## 6. raw ref

`raw ref` 是 durable page 中使用的证据引用单元。

最小字段：

- `source_id`
- `locator`

可选字段：

- `quote`
- `note`
- `confidence`

关键约束：raw ref 必须让后续 agent 能回到 raw bundle 重新定位证据。

## 7. baseline 解析规则

当宿主未提供更强结构时，按以下顺序保守解析：

1. 先确定 raw bundle 边界
2. 再分配稳定 `source_id`
3. 再识别当前证据位于 bundle 中的哪一个 `artifact`
4. 最后为该 artifact 选择最稳健的 `selector`

解析原则：

- 选最小但可复现的定位方式
- 能用结构化 selector 就不用模糊自然语言定位
- 无法稳定定位时，不伪造精确引用

## 8. durable page 与 raw 的关系

canonical 关系为：

`durable page <- raw ref <- raw locator <- raw bundle`

durable pages 可互链、可综合，但关键结论的最终证据应能落回 raw。

## 9. legacy source summary 兼容

若宿主已有 `source summary`：

- 可以读取其上下文
- 不能把它当作 canonical raw 证据替身
- 默认不新建、不更新
- 新结论仍应直接引用 raw ref
