# 典型场景

## 1. ephemeral answer

### 场景

用户提出一次性问题；现有 wiki 或 raw 足以回答，但结论仅服务当前对话，不具备明显跨会话复用价值。

### 期望行为

1. 按 `index-first` 查找相关页
2. 必要时回 raw 补证据
3. 正常回答
4. 不写回 wiki

### 关键判断

- 没有新的 durable knowledge
- 不需要创建 maintenance
- 不同步 index / log

## 2. durable writeback

### 场景

用户的问题触发了一个可复用的新结论、补充关系、重要比较或综合判断；结果可以稳定归属到既有页或合法新页。

### 期望行为

1. 先回答问题
2. 判断结果具备 durable value
3. 定位既有 canonical page，或在允许范围内创建新页
4. 直接用 raw ref 更新 durable page
5. 如结构发生变化，同步 index
6. 若宿主允许，向 log 追加安全摘要

### 关键判断

- 有足够 raw ref 支撑关键结论
- target 明确
- 未命中 protected scope
- 不通过 `source summary` 中转背书

## 3. blocked-by-host

### 场景

答案具备 durable value，但写回被宿主契约或 protected scope 阻止。

### 常见触发

- `wiki_root` 无法可靠发现
- writable target 无法安全判定
- 命中禁写目录 / 文件 / section / field / operation
- 需要创建新 canonical page，但 index 不可写

### 期望行为

1. 先回答问题
2. 明确指出 blocked reason
3. 不写回 wiki
4. 不通过改写其他文件绕过限制

## 4. legacy source summary

### 场景

宿主已有历史 `source summary` 页面，但当前 skill 已不再把它们视为 baseline canonical layer。

### 期望行为

1. 可以读取这些页面辅助理解旧结构
2. 不把它们当作 raw 证据中转层
3. 默认不新建新的 `source summary`
4. 默认不更新旧的 `source summary`
5. 新的 durable knowledge 直接引用 raw ref

### 关键判断

- `source summary` 是兼容语义，不是主工作流
- skill 不做破坏性清理
- 新旧心智可共存，但 canonical 证据链必须回到 raw
