# 约定

## 1. 导航：固定使用 `index.md`

- `index.md` 是唯一导航入口，不使用替代导航文件。
- `index.md` 至少按 page family 列出：`sources/`、`entities/`、`topics/`、`comparisons/`、`overviews/`、`maintenance/`。
- 每个页面条目至少包含：链接 + 一句话说明。
- 新增、删除、合并、重命名页面后，要同步更新 `index.md`。

## 2. 日志：固定使用 `log.md`

- `log.md` 是唯一时间线，采用 append-only。
- 推荐标题前缀：
  - `## [YYYY-MM-DD] bootstrap | normalization`
  - `## [YYYY-MM-DD] ingest | <source-id>`
  - `## [YYYY-MM-DD] query | <page-id>`
  - `## [YYYY-MM-DD] lint | <scope>`
- 每条日志至少包含：动作类型、触达页面、变更摘要、follow-up。
- 动作级最小字段：
  - **bootstrap**：规范化内容、创建的控制文件、后续待办。
  - **ingest**：source ID、触达页面、是否更新了高层页、关键结论。
  - **query**：目标页 ID、为什么值得写回、关键更新。
  - **lint**：scope、问题摘要、修复动作或残余缺口。
- 日志只写安全摘要，不复制敏感原文、密钥、隐私数据或内部路径。

## 3. 命名

- markdown 页面文件名统一用 kebab-case。
- source summary 文件名与对应 raw source 的 stem 一致。
- comparison 页面优先使用问题或对象对的 kebab-case slug。
- 页面只放在 canonical page family 中，不创建平行目录。

## 4. citation

- 每个稳定结论都必须能回溯到 source summary；必要时再回到 `raw/` 中的原始文件页码或片段。
- 页面底部固定保留 `## Sources` 区块。
- `## Sources` 至少列出：source summary 链接，以及 raw source 的页码 / 章节信息（若适用）。
- 若某条内容暂时无法追溯来源，只能标为 `needs-verification`。

## 5. 状态标记

- 统一使用：`confirmed`、`needs-verification`、`contested`、`superseded`。
- 新 source 与旧结论冲突时，不静默覆盖；先保留冲突，再更新状态。

## 6. 互链

- 新页面创建后，至少补两类链接：
  - 回到 `index.md` 可导航；
  - 连到至少一个相关页面或 source summary。
- 若发现两个页面承载同一主题，优先合并，而不是长期并存。

## 7. 复利优先

- 新 source 到来后，优先更新已有高层页，而不是并排再造一个近似摘要页。
- query 如果形成稳定综合，应写回 canonical page family，而不是只留在聊天里。
- 页面数量增长不是目标；减少重复发现、提高下一次进入成本更低，才是目标。

## 8. 最小自检

每次 ingest / durable query writeback / lint 后，至少确认：

1. raw source 内容未被改写；
2. 页面落点符合 canonical layout；
3. `index.md` 已反映结构变化；
4. `log.md` 已追加记录；
5. 新结论可追溯，且没有把猜测写成事实。
