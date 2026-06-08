# Review RFC: HTML-first report-walkthrough output

## 结论

PASS。

RFC 可以进入实现阶段。方案将 HTML-first 作为 `report-walkthrough` 的输出协议升级，但保留 Markdown source/fallback 与 PR body 边界，不改变 Legion 阶段链，不新增运行时依赖，验证路径明确。

## 审查范围

- `.legion/tasks/html-first-report-walkthrough/plan.md`
- `.legion/tasks/html-first-report-walkthrough/docs/rfc.md`
- 当前 `skills/report-walkthrough/SKILL.md`
- 上一轮 polished HTML artifact：`.legion/tasks/harden-report-walkthrough/docs/report-walkthrough.html`

## Blocking findings

无。

## 审查判断

| 维度 | 判断 | 证据 |
|---|---|---|
| Scope 清晰度 | PASS | RFC 将改动限制在 `report-walkthrough` skill、HTML template reference、当前任务文档和 wiki。 |
| 可实现性 | PASS | 只需更新 Markdown skill/reference，不新增 generator、脚本或 runtime。 |
| 可验证性 | PASS | RFC 提供文本断言、模板断言、HTML smoke test、设计禁忌断言、`git diff --check` 和 regression 验证。 |
| 可回滚性 | PASS | 改动集中且 additive，revert PR 即可恢复旧输出协议。 |
| 兼容性 | PASS | HTML-first 不等于 HTML-only，Markdown 和 PR body 角色保留。 |
| 设计边界 | PASS | clean-doc / impeccable 原则被用于 `report-walkthrough` 输出质量，不修改对应外部 skill。 |

## 非阻塞建议

- `TEMPLATE_REPORT_WALKTHROUGH_HTML.md` 应避免放入过长的固定 CSS，以免 future agent 只复制皮肤；更重要的是结构、约束、质量检查和必要 skeleton。
- `SKILL.md` 中 HTML 规则应足够明确，但不要重复 template 全文。
- 验证断言应同时检查“HTML-first”和“非 HTML-only”，避免 future agent 移除 Markdown source/fallback。

## 下一步

进入实现阶段：更新 `report-walkthrough` skill，新增 HTML walkthrough reference template，并生成当前任务的 HTML-first walkthrough 证据。
