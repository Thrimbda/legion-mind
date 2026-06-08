# HTML-first report-walkthrough output

> 本 PR body 只是 PR 创建/更新输入，不代表 checks/review/merge、auto-merge、worktree cleanup 或主工作区 refresh 已完成。

---

## 交付摘要

- 将 `report-walkthrough` 的默认输出升级为 HTML-first：`docs/report-walkthrough.html` 是主 reviewer artifact。
- 保留 `docs/report-walkthrough.md` 作为 compact source / fallback，保留 `docs/pr-body.md` 作为 PR 创建或更新输入。
- 将 `clean-doc` 信息选择原则和 `impeccable` HTML 质量门固化到 skill。
- 新增 `TEMPLATE_REPORT_WALKTHROUGH_HTML.md`，指导 future agent 生成 standalone、响应式、print-friendly 的 HTML walkthrough。

## 范围

**In scope**

- `skills/report-walkthrough/SKILL.md`
- `skills/report-walkthrough/references/TEMPLATE_REPORT_WALKTHROUGH_HTML.md`
- `.legion/tasks/html-first-report-walkthrough/**`
- `.legion/wiki/**`

**Out of scope**

- 不新增自动 HTML generator 或 CLI。
- 不修改 `impeccable`、`clean-doc` 或 `legion-workflow`。
- 不取消 Markdown fallback 或 PR body。

## 验证与审查

- RFC: `.legion/tasks/html-first-report-walkthrough/docs/rfc.md`
- review-rfc: `.legion/tasks/html-first-report-walkthrough/docs/review-rfc.md`（PASS）
- test-report: `.legion/tasks/html-first-report-walkthrough/docs/test-report.md`（PASS）
- review-change: `.legion/tasks/html-first-report-walkthrough/docs/review-change.md`（PASS）
- walkthrough markdown: `.legion/tasks/html-first-report-walkthrough/docs/report-walkthrough.md`
- walkthrough html: `.legion/tasks/html-first-report-walkthrough/docs/report-walkthrough.html`

## 评审重点

- [ ] HTML-first 是否清楚表达为主 reviewer artifact，而不是 HTML-only？
- [ ] Markdown fallback 与 PR body 角色是否仍清晰？
- [ ] HTML quality gate 是否足以约束 future walkthrough 的可读性、响应式、print-friendly 和外部资源边界？
- [ ] Evidence map / delivery path 是否继续保持 Legion 证据可追溯？

## 证据链接

- plan: `.legion/tasks/html-first-report-walkthrough/plan.md`
- rfc: `.legion/tasks/html-first-report-walkthrough/docs/rfc.md`
- review-rfc: `.legion/tasks/html-first-report-walkthrough/docs/review-rfc.md`
- test-report: `.legion/tasks/html-first-report-walkthrough/docs/test-report.md`
- review-change: `.legion/tasks/html-first-report-walkthrough/docs/review-change.md`
- report-walkthrough: `.legion/tasks/html-first-report-walkthrough/docs/report-walkthrough.md`
- html walkthrough: `.legion/tasks/html-first-report-walkthrough/docs/report-walkthrough.html`
