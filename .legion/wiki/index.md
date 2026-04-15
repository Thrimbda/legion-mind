# Legion Wiki Index

## 角色分层

- **schema**：`skills/**` + `.opencode/**`
- **wiki**：`.legion/wiki/**`
- **raw**：`.legion/tasks/**`

默认查询路径：

```text
schema -> wiki index -> task summary -> raw task docs
```

## 当前页面

- [decisions.md](./decisions.md) - 当前有效的跨任务决策
- [patterns.md](./patterns.md) - 可复用模式
- [maintenance.md](./maintenance.md) - 待迁移 / 待补齐事项
- [log.md](./log.md) - wiki 层更新记录

## Task Summaries

- [legion-schema-skills-logmd](./tasks/legion-schema-skills-logmd.md) - schema skills 拆分、`log.md` 切换、`legion-wiki` 引入

## 使用约定

- 先读 schema，确认当前规则
- 再读 wiki，确认当前有效结论
- 若仍需证据，再下钻 task raw docs
