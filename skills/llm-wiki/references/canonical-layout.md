# Canonical layout

授权给本 skill 的 wiki 根目录固定采用下面这套结构：

```text
wiki-root/
├── index.md
├── log.md
├── raw/
├── sources/
├── entities/
├── topics/
├── comparisons/
├── overviews/
└── maintenance/
    └── backlog.md
```

## 固定规则

- `index.md`：唯一导航入口。
- `log.md`：唯一追加式日志。
- `raw/`：原始 source 文件，只读。
- 其他目录：可写 markdown 页面。
- 所有持久化 markdown 只允许出现在这些 page family 中，不再定义其他 durable markdown 类别。

## 规范化规则

- 如果 source 文件不在 `raw/`，先把它们归档到 `raw/`。
- 如果 markdown 页面不在对应 page family，先移动到正确目录，再修正链接。
- 如果缺少 `index.md`、`log.md`、`maintenance/backlog.md`，先补齐。
- 如果目录里存在与 canonical layout 冲突的平行导航文件、平行日志文件或临时归档目录，优先合并回 canonical 结构。

## 命名规则

- markdown 文件统一用 kebab-case。
- source summary 文件名与 raw source stem 保持一致。
- 新增页面优先用“主题 / 问题 / 对象”的稳定 slug，不用临时聊天标题。

## 写入边界

- 持久化归档一律写回这套 canonical 结构。
- 不把 durable result 写到 root 之外。
- 不把 durable result 写成其他格式来替代 canonical markdown 页面。
