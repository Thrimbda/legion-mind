# Review Change: 全仓库 Skill 中文输出约束

## 结论

PASS。当前实现满足 task contract 与 RFC，未发现 blocking findings。

## 审查输入

- `plan.md`
- `docs/rfc.md`
- `docs/review-rfc.md`
- `docs/test-report.md`
- 当前 diff：13 个 `skills/*/SKILL.md` 各新增 6 行“输出语言与文档产物”约束；新增本任务 `.legion/tasks/localize-skill-outputs/**` 证据。

## Blocking findings

无。

## Scope compliance

- PASS：skill 变更限定在仓库 13 个 `skills/*/SKILL.md`。
- PASS：没有修改 frontmatter `name` / `description`，未影响 skill discovery 文本。
- PASS：没有修改安装脚本、测试 harness、workflow template、运行模式、阶段链或 Git lifecycle 行为。
- PASS：每个 skill 的新增段落都保留了代码、命令、路径、机器可读字段、错误原文和平台术语的例外。

## Correctness / maintainability

- PASS：所有新增约束使用同一 heading，便于未来静态检查和维护。
- PASS：措辞按 skill 职责定制，文档型 skill 明确具体产物；实现/验证/review 型 skill 没有虚构额外交付物。
- PASS：验证证据覆盖核心验收与 regression surface。

## Security lens

Security trigger 未命中：本任务不修改 auth、permission、token、crypto、数据暴露或执行路径。仍做了敏感边界确认：`git-worktree-pr`、`pr-html-render` 和 `report-walkthrough` 中已有 PR trust boundary 与敏感信息规则未被削弱；新增语言约束明确机器可读字段和错误原文不强制翻译。

## Non-blocking suggestions

- 如果后续发现某个外部运行时仍忽略中文输出约束，可针对该运行时增加安装后 smoke/eval，而不是扩大本任务 scope。

## 交付准入

允许进入 `report-walkthrough`。后续仍需完成 wiki writeback 与 PR lifecycle；PR 创建本身不代表完成。
