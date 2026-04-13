# 架构

## 目标

把授权的 wiki 根目录维护成一个**会持续积累知识的 markdown 知识库**，而不是每次 query 都回到 raw source 临时重新拼答案。

## 固定三层

### 1. raw sources (`raw/`)

- 角色：原始输入层，存放 PDF、网页归档、文章、会议纪要、截图说明、数据摘录等 source。
- 约束：内容只读，不改写。
- 允许动作：归档进 `raw/`、规范命名、引用、摘要。

### 2. wiki pages (`sources/`、`entities/`、`topics/`、`comparisons/`、`overviews/`、`maintenance/`)

- 角色：LLM 维护的知识层。
- 责任：
  - 吸收新 source；
  - 更新旧页面中的结论、互链与冲突；
  - 把可复用 query 结果编译回 wiki；
  - 记录证据缺口与待验证项。

### 3. canonical control files (`index.md`、`log.md`)

- `index.md`：唯一导航入口。
- `log.md`：唯一追加式时间线。
- 本 skill 不支持替代导航 / 日志机制；固定就用这两个文件。

## 单一 canonical layout

- 根目录固定为一个完整的 wiki root，而不是等待外部 schema 来定义结构。
- 页面 family 固定，目录职责固定，写回边界固定。
- 如果目录里已有散落页面或 raw source，先规范化到 canonical layout，再继续维护。

## 复利式维护

- ingest 不只是新增 source summary；还必须回查现有 `entities/`、`topics/`、`comparisons/`、`overviews/`、`maintenance/` 页面是否需要修正。
- query 不只是回答；当答案具有可复用价值时，应被编译成 canonical wiki 页面，而不是遗失在聊天记录里。
- lint 不只是找错；还要找“哪些知识还停留在零散页面或聊天回答里，尚未沉淀成稳定页面”。
- 如果 source 不断增加，但高层页长期不更新，说明 wiki 正在退化回临时检索，而不是持续积累。

## 本 skill 拥有什么权力

- 可以创建、重命名、移动、整理 canonical wiki 页面与 control files。
- 可以把 source 归档进 `raw/` 并保持其内容只读。
- 可以重建 `index.md`、维护 `log.md`、拆分过载页面、补齐缺失页、整理目录结构。
- 不应把归档结果写到 canonical layout 之外，也不应依赖外部规则文件决定 page family。

## 搜索的角色

- 默认入口永远是 `index.md`。
- 搜索只用于加速定位，不改变 canonical 结构，也不替代 source 证据。

## 为什么这样设计

- 目录结构固定，意味着 agent 不必每次重新判断“哪儿可写、哪儿是导航、哪儿该记账”。
- raw source、source summary、高层综合页之间的关系固定，意味着新 source 到来时更容易做系统性更新。
- `index.md` + `log.md` + 固定 page families，让 wiki 既可浏览，也可持续维护。
