# `.legion/wiki` 可选布局

```text
.legion/wiki/
  index.md
  decisions.md
  patterns.md
  maintenance.md
  log.md            # 可选
  topics/           # 可选主题页
```

- `index.md` 只做导航。
- `decisions.md` 保存当前仍生效的跨任务决定。
- `patterns.md` 保存可复用方法及适用边界。
- `maintenance.md` 保存待核实、迁移或清理事项。
- `log.md` 只在宿主需要变更时间线时使用。
- 主题页按知识域组织，不要求与任务 id 对应。

这是 host layout，不是必须初始化的文件集合。已有仓库采用不同等价布局时遵循现状。
