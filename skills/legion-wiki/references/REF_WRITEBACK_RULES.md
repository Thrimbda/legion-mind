# Legion Wiki 写回规则

## 何时写 `tasks/<task-id>.md`

- 一个 task 已经产出值得复用或再次查询的结果
- 当前查询需要先读 task summary，而不是直接读 raw docs

## 何时写 `decisions.md`

- 结论是“当前有效规则”
- 它跨越单个 task，且短期内不会因为 task 结束而失效
- 条目更像“必须 / 禁止 / 当前标准”，而不是经验性做法

## 何时写 `patterns.md`

- 结论是可复用工作模式、实践或约定
- 它不像 decisions 那样是硬规则，但能显著减少重复调研
- former playbook 风格的 durable conventions 默认落在这里

## 何时写 `maintenance.md`

- 缺少 task summary
- 旧任务缺少 `historical` / `superseded-by`
- 某个关键结论只留在 raw docs，尚未进入 wiki
- 需要后续 lint 或迁移
- 当前还无法稳定判断该写 decisions 还是 patterns

## former playbook 条目映射

- 带有背景、做法、适用边界、陷阱、最小示例的条目 → `patterns.md`
- 带有“必须 / 禁止 / 当前规则”语义的条目 → `decisions.md`
- 证据不足或分类不稳的条目 → `maintenance.md`
- 不再创建独立 playbook 文件承接这些内容

## 最小 task summary 字段

- `task-id`
- `status`
- `risk`
- `schema-version`
- `historical`
- `supersedes / superseded-by`
- `outcome summary`
- `reusable decisions`
- raw source links
