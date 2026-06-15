# localize-skill-outputs

## Metadata

- `task-id`: `localize-skill-outputs`
- `status`: `active`
- `risk`: `medium`
- `schema-version`: `skills-output-language-constraint`
- `historical`: `false`
- `supersedes`: `(none)`
- `superseded-by`: `(none)`

## Outcome Summary

本任务为仓库 13 个 `skills/*/SKILL.md` 增加了明确的“输出语言与文档产物”约束。当前有效结论是：仓库 skill 默认用中文回答；若产出人类阅读型文档产物，也默认使用中文；代码、命令、路径、机器可读字段、错误原文和平台术语保持原文。实现未修改 frontmatter discovery 字段、安装脚本、阶段链或 Git lifecycle 语义。

## Reusable Decisions

- 新增或改写仓库 skill 时，应在 skill 本体保留 `## 输出语言与文档产物` 约束，而不是只依赖仓库级入口规则。
- 文档型/流程型 skill 应明确其具体产物的默认语言；实现、验证和 review 型 skill 应同时说明命令输出、代码标识符和错误原文保留原样。
- 中文输出约束不覆盖用户显式指定语言、外部系统原文、机器可读字段或必须保持稳定的技术 token。

## Related Raw Sources

- `plan`: `.legion/tasks/localize-skill-outputs/plan.md`
- `log`: `.legion/tasks/localize-skill-outputs/log.md`
- `tasks`: `.legion/tasks/localize-skill-outputs/tasks.md`
- `rfc`: `.legion/tasks/localize-skill-outputs/docs/rfc.md`
- `review-rfc`: `.legion/tasks/localize-skill-outputs/docs/review-rfc.md`
- `test-report`: `.legion/tasks/localize-skill-outputs/docs/test-report.md`
- `review-change`: `.legion/tasks/localize-skill-outputs/docs/review-change.md`
- `report`: `.legion/tasks/localize-skill-outputs/docs/report-walkthrough.md`
- `pr-body`: `.legion/tasks/localize-skill-outputs/docs/pr-body.md`

## Notes

- 该任务摘要描述当前 skill 文档约束；具体执行规则仍以各 `skills/*/SKILL.md` 为 schema 真源。
- 已安装到用户本机的 skill 副本需要重新安装/同步并重启运行时后才会加载新约束。
