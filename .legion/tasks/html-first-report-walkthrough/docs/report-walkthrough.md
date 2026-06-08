# Report Walkthrough: HTML-first report-walkthrough output

## Profile

implementation。

本任务修改的是 `report-walkthrough` skill 与 HTML template reference，不是生产业务代码；但它走过实现、验证与 `review-change`，因此按 implementation walkthrough profile 生成 reviewer-facing 交付摘要。

## Reviewer Summary

- 将 `report-walkthrough` 的默认输出升级为 HTML-first：`docs/report-walkthrough.html` 是主 reviewer artifact。
- 保留 `docs/report-walkthrough.md` 作为 compact source / fallback，保留 `docs/pr-body.md` 作为 PR 创建或更新输入。
- 将 `clean-doc` 的读者、决策、信息取舍和 certainty level 原则写入 skill。
- 将 `impeccable` 的 standalone HTML、OKLCH、响应式、print-friendly 和设计禁忌写入 skill。
- 新增 `TEMPLATE_REPORT_WALKTHROUGH_HTML.md`，让 future agent 能按同一原则生成 HTML walkthrough，而不是依赖聊天记忆。

## Scope

### In scope

- `skills/report-walkthrough/SKILL.md`
- `skills/report-walkthrough/references/TEMPLATE_REPORT_WALKTHROUGH_HTML.md`
- `.legion/tasks/html-first-report-walkthrough/**`
- `.legion/wiki/**`

### Out of scope

- 不新增自动 Markdown-to-HTML generator 或 CLI。
- 不把 HTML walkthrough 做成交互式应用。
- 不修改 `impeccable`、`clean-doc` 或 `legion-workflow`。
- 不同步用户主目录下已安装 skill。

## Evidence Map

| Claim | Evidence | Status |
|---|---|---|
| 任务契约稳定，且文档输出要求中文 | `plan.md`、`tasks.md`、`log.md` | PASS |
| HTML-first 输出设计可实现、可验证、可回滚 | `docs/rfc.md` | PASS |
| 设计门已通过 | `docs/review-rfc.md` | PASS |
| Skill 和 template 文本断言、格式检查、regression 均通过 | `docs/test-report.md` | PASS |
| 只读交付审查无阻塞 | `docs/review-change.md` | PASS |
| HTML-first 输出协议已写入 skill | `skills/report-walkthrough/SKILL.md` | PASS |
| HTML reference template 已新增 | `skills/report-walkthrough/references/TEMPLATE_REPORT_WALKTHROUGH_HTML.md` | PASS |
| 本任务 HTML artifact 已生成 | `docs/report-walkthrough.html` | PASS |

## What Changed / What Was Decided

- `report-walkthrough` 以后默认生成 HTML reviewer artifact，而不是只生成 Markdown。
- Markdown walkthrough 继续存在，但角色是 compact source / fallback。
- PR body 继续只是 PR 创建或更新输入，不代表 PR lifecycle 完成。
- HTML 生成先做 clean-doc 信息选择，再做 impeccable 质量门检查。
- HTML 必须 standalone、语义化、响应式、print-friendly，不依赖外部资源。

## Verification / Review Status

- HTML-first 文本断言：PASS。
- 追加 description 触发关键词断言：PASS。
- `git diff --check`：PASS。
- `npm run test:regression`：PASS，10/10 tests passed。
- `review-rfc`：PASS，无 blocking findings。
- `review-change`：PASS，无 blocking findings，安全视角未触发。

## Risks and Limits

- 本任务没有新增自动 HTML generator；未来 HTML 质量仍依赖 agent 遵守 skill 和 reference。
- HTML-first 会增加 report 阶段输出成本，但换来更好的 reviewer 扫读和证据判断。
- 当前没有 `PRODUCT.md` / `DESIGN.md`，因此默认按 product evidence interface 生成；未来若项目加入设计上下文，应优先遵守项目上下文。

## Reviewer Checklist

- [ ] `docs/report-walkthrough.html` 是否明确成为主 reviewer artifact？
- [ ] Markdown fallback 与 PR body 角色是否仍清楚？
- [ ] clean-doc 信息选择原则是否足以防止 HTML 变成背景资料袋？
- [ ] impeccable HTML quality gate 是否足以防止模板化、外部依赖和设计禁忌？
- [ ] 证据链是否仍可从 HTML 回到 raw task docs？

## Next Stage

交给 `legion-wiki` 做 durable writeback。随后继续 `git-worktree-pr` lifecycle：commit、rebase、push、创建/更新 PR、跟进 checks/review、终态、cleanup 与主工作区 refresh。
