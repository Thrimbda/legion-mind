# Legion Wiki 布局

## 目录结构

这是 wiki 的目标布局，不等于 `init` 默认落盘集合。Legion 当前只保留这一套跨任务知识层，不再单列 `.legion/playbook.md`。

```text
.legion/
  wiki/
    index.md
    log.md
    decisions.md
    patterns.md
    maintenance.md
    tasks/
      <task-id>.md
```

## 页职责

| 文件 | 职责 |
|---|---|
| `index.md` | 总导航、查询入口、当前重点页面；只负责告诉你去哪看 |
| `log.md` | wiki 层新增 / 更新记录 |
| `decisions.md` | 当前仍生效的跨任务决策；适合“必须 / 禁止 / 当前规则” |
| `patterns.md` | 可复用模式与惯例；former playbook 风格条目的默认落点 |
| `maintenance.md` | 迁移债务、缺失 summary、历史清理、lint backlog |
| `tasks/<task-id>.md` | 任务综合摘要，链接回 raw task docs |

## 边界

- `.legion/wiki/**` 只做综合与导航，不取代 raw docs
- schema 定义仍在 `skills/**` 与 `.opencode/**`
- former playbook 风格的 durable conventions 必须并入 wiki 页面，而不是再新建平行载体
- 若结论已失效，必须显式标记 `superseded-by` 或转入 maintenance
