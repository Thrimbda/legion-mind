# <task-id>

## Metadata

- `task-id`: `<task-id>`
- `status`: `active | completed | historical | archived`
- `risk`: `low | medium | high`
- `schema-version`: `<current-schema-generation>`
- `historical`: `true | false`
- `supersedes`: `(none)`
- `superseded-by`: `(none)`

## Outcome Summary

用 3-6 行写清：

- 这个任务解决了什么
- 现在什么是当前有效结论
- 哪些地方仍然只是历史快照

## Reusable Decisions

- `<decision 1>`
- `<decision 2>`

## Related Raw Sources

- `plan`: `.legion/tasks/<task-id>/plan.md`
- `log`: `.legion/tasks/<task-id>/log.md`
- `tasks`: `.legion/tasks/<task-id>/tasks.md`
- `rfc`: `.legion/tasks/<task-id>/docs/rfc.md`
- `reviews`: `.legion/tasks/<task-id>/docs/...`
- `report`: `.legion/tasks/<task-id>/docs/report-walkthrough.md`

## Notes

- 这里写 summary，不复制 raw docs 正文
- 若需要更多证据，回到 raw docs
- 若某个 raw source 在当前 schema 下不存在，就省略该条，不要制造死链，也不要引入 legacy 命名兼容说明。
