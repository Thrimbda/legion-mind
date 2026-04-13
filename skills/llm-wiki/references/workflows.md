# 工作流

## 目录

- [1. bootstrap](#1-bootstrap)
- [2. ingest](#2-ingest)
- [3. query](#3-query)
- [4. lint](#4-lint)

## 1. bootstrap

### 步骤

1. 定位这次唯一被授权给本 skill 管理的 wiki 根目录。
2. 补齐 canonical layout：`raw/`、`sources/`、`entities/`、`topics/`、`comparisons/`、`overviews/`、`maintenance/`、`index.md`、`log.md`。
3. 若存在散落页面、混放 source、缺失维护入口等情况，先规范化：把 source 归到 `raw/`，把页面归到正确的 page family，并修正链接。
4. 补齐 `maintenance/backlog.md`。
5. 扫描当前页面，重建或刷新 `index.md`。
6. 若 bootstrap 改变了目录结构或新增了关键控制文件，向 `log.md` 追加一次 bootstrap / normalization 记录。

### 最小输出

- canonical layout 已存在。
- `index.md` 可作为唯一导航入口。
- `log.md` 与 `maintenance/backlog.md` 已就位。
- 若做过规范化，已记录变动摘要。

## 2. ingest

### 触发

- 用户提供新 source；或原始资料已进入待归档状态。

### 标准步骤

1. 把 source 归档到 `raw/`。
2. 在 `sources/` 下创建或更新同 stem 的 source summary。
3. 显式回查受影响的 `entities/`、`topics/`、`comparisons/`、`overviews/`、`maintenance/` 页面；对每个受影响高层页，要么更新，要么说明为何未变。
4. 仅当现有页面无法承载时，才新增高层页。
5. 若出现冲突，标记 `contested`、`superseded` 或 `needs-verification`，而不是静默覆盖。
6. 若目录结构或页面集合发生变化，更新 `index.md`。
7. 向 `log.md` 追加 ingest 记录。

### 自检

- raw source 内容未被改写。
- source summary 已创建或更新。
- 没有把更新止步于 source summary。
- 高层页更新可追溯到 source evidence。
- `index.md` 与 `log.md` 已同步。

## 3. query

### 默认路径

1. 先读 `index.md`，定位相关页面。
2. 优先复用已有 `comparisons/`、`overviews/`、`topics/`、`entities/` 页面。
3. 证据不足时，再回到 `sources/` 或 `raw/` 补证据。
4. 输出固定为 4 段：答案 / 关键依据 / 冲突与不确定性 / 下一步 wiki 动作。

### durable writeback 判定

满足任一条件时，应写回 canonical wiki：

- 形成了新的稳定比较；
- 形成了新的跨 source 综合结论；
- 回答了一个很可能会再次被问到的问题；
- 暴露了结构性缺口，应落到 `maintenance/`；
- 明显改善了已有页面的准确性或可读性。

### 标准步骤

1. 完成 4 段式回答。
2. 若结果值得持久化，更新现有 canonical 页面；若无合适页面，再新增一个。
3. 若页面集合或结构变化，更新 `index.md`。
4. 只有发生 durable writeback 时，向 `log.md` 追加 `query` 记录。

### 自检

- 页面落点是否符合 canonical page family？
- 是否优先更新了已有页面，而不是新建近似重复页？
- 若未写回，是否真的属于一次性回答？

## 4. lint

### 检查目标

- 事实冲突、过期断言、证据不足
- orphan page、缺失互链、`index.md` 失真
- 缺失 source summary、过载页面、重复页面
- `overviews/` 与 `comparisons/` 长期未更新
- `maintenance/backlog.md` 积压、状态失真

### 标准步骤

1. 读取 `index.md`、`log.md` 与各 page family。
2. 按严重程度归类问题，并列出受影响页面。
3. 证据足够时直接修正文档；证据不足时降级断言或写入 `maintenance/backlog.md`。
4. 更新受影响页面、`index.md` 与 `maintenance/backlog.md`。
5. 向 `log.md` 追加 lint 记录。

### 自检

- 每个问题是否都有影响范围与建议动作？
- 是否把能直接修的内容修掉，而不是一律只报问题？
- 是否避免把证据不足的猜测写成事实？
