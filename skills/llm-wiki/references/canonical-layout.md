# Canonical layout

`llm-wiki` 的 baseline layout 不再假设一个固定、完整、必须预先建好的目录树。它只要求：

- 存在可发现的 `wiki_root`
- 存在可发现或可回退到宿主等价面的导航面（默认 `index.md`）；这里的“回退”仅指识别宿主等价导航面，不指默认创建新的 `index.md` / `log.md`
- durable pages 落在宿主允许的 page families 中
- raw 位于只读输入层，不被回写

`log.md` 是默认工作面之一，但**不是最低写回前提**：只有宿主允许且可写时才追加；否则进入 `logging degraded`，不得默认创建或绕写。

## 1. baseline durable page families

baseline 只保留五类：

- `entities/`
- `topics/`
- `comparisons/`
- `synthesis/`
- `maintenance/`

这些是**默认目录名**；对应的 page family 语义名分别是 `entity / topic / comparison / synthesis / maintenance`。

宿主可以覆盖目录名或再分层，但不应改变这些页型的职责边界。

## 2. baseline working surfaces

### `index.md`

- 默认主导航面
- 负责 canonical 发现与结构入口
- 结构变化时需要同步

### `log.md`

- 默认追加式变更时间线
- 负责安全摘要、阻断原因、降级说明
- 不承载知识正文
- 仅在宿主允许且可写时追加；缺失或不可写不阻断正文写回

### raw roots

- 原始来源层
- 只读
- 不在 raw 中写 durable knowledge

## 3. 不再是 baseline 的旧结构

以下不再是 baseline 强制项：

- `sources/`
- `overviews/`
- `maintenance/source-registry.md`
- `maintenance/schema-changes.md`
- “每个重要 raw source 都必须有 source summary”

兼容语义：

- 若宿主已有这些结构，可读取
- 它们不是新的 canonical 依赖
- 默认不要求新建、不要求补齐、不要求迁移

## 4. normalization 原则

当宿主 wiki 不完全符合 baseline 时，不要默认把它强行整理成固定目录树。

优先级应为：

1. 先发现 `wiki_root`
2. 再发现 index / log / durable pages
3. 再判断可写范围与 protected scope
4. 只在宿主允许时做最小 normalization

禁止把“规范化”理解成：

- 强制创建 `sources/` / `overviews/`
- 为每个 raw source 补 source summary
- 无宿主允许地批量搬移目录

## 5. 命名基线

- durable page 文件名使用稳定、可复用的 slug
- slug 应表达对象、主题、比较问题或综合范围
- 不用聊天标题、临时问题、日期堆砌作为长期 canonical slug

示例：

```text
topics/llm-wiki.md
comparisons/llm-wiki-vs-rag.md
synthesis/persistent-ai-memory.md
entities/anthropic-claude-skills.md
maintenance/evidence-gaps.md
```

## 6. 受控扩展

若宿主需要新增目录或 page family，必须同时满足：

1. 现有 baseline 无法合理承载
2. 新结构有稳定长期职责
3. 宿主明确允许
4. index / 命名 / evidence / lifecycle 规则能同步保持一致

临时输出、一次性导出、草稿，不应默认升级成 canonical layout 的新部分。
