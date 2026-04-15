# legion-schema-skills-logmd

## Metadata

- `task-id`: `legion-schema-skills-logmd`
- `status`: `completed`
- `risk`: `medium`
- `schema-version`: `post-skill-split-log-wiki`
- `historical`: `false`
- `supersedes`: `(none)`
- `superseded-by`: `(none)`

## Outcome Summary

这个任务完成了 Legion schema 层的大规模重构：

- 把旧的 `legionmind` 大 skill 拆成 `legion-workflow`、`legion-docs` 与各 subagent skills
- 把现行 raw task docs 命名从 `context.md` 收敛为 `log.md`
- 把 subagent dispatch 真源集中到 `legion-workflow`
- 新增 `legion-wiki`，正式为 `.legion/wiki/**` 指定 owner

## Reusable Decisions

- `.legion/tasks/**` 只负责 raw task docs，不再兼任 wiki
- `.legion/wiki/**` 负责跨任务综合知识与 task summary
- command 只声明 mode，不再定义独立 subagent dispatch 顺序

## Related Raw Sources

- `plan`: `.legion/tasks/legion-schema-skills-logmd/plan.md`
- `tasks`: `.legion/tasks/legion-schema-skills-logmd/tasks.md`
- `report`: `.legion/tasks/legion-schema-skills-logmd/docs/report-walkthrough.md`

## Notes

- 这是当前 wiki 层落地的起点任务
- 后续历史 task summary 与 lint 仍在 maintenance backlog 中
