# Legion Wiki 布局

## 目录结构

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
| `index.md` | 总导航、查询入口、当前重点页面 |
| `log.md` | wiki 层新增 / 更新记录 |
| `decisions.md` | 当前仍生效的跨任务决策 |
| `patterns.md` | 可复用模式与惯例 |
| `maintenance.md` | 迁移债务、缺失 summary、历史清理、lint backlog |
| `tasks/<task-id>.md` | 任务综合摘要，链接回 raw task docs |

## 边界

- `.legion/wiki/**` 只做综合与导航，不取代 raw docs
- schema 定义仍在 `skills/**` 与 `.opencode/**`
- 若结论已失效，必须显式标记 `superseded-by` 或转入 maintenance
