# Task Summary: pr-html-render-skill

## 当前结论

`pr-html-render` 已作为独立 support skill 加入仓库。它负责把已有 HTML artifact，例如 `.legion/tasks/<task-id>/docs/report-walkthrough.html`，转成 reviewer 可使用的 rendered preview path、artifact-only fallback 或 authenticated/internal host handoff。它不是 Legion phase，不生成 walkthrough 内容，也不判断 PR lifecycle 完成。

`report-walkthrough` 已同步改造：PR-backed HTML artifact 完成后默认需要 `pr-html-render` handoff，或记录 explicit render bypass / blocker。

## 主要变更

- 新增 `skills/pr-html-render/SKILL.md`，定义 artifact input、Legion handoff、安全规则、GitHub Pages template 使用方式与 output checklist。
- 新增 `skills/pr-html-render/templates/github-pages-pr-render.yml`，用于同仓库可信 PR 的 GitHub Pages rendered preview starting point。
- 新增 `skills/pr-html-render/templates/cleanup-pr-render.yml`，用于可选 PR close cleanup，且限制为 metadata cleanup，不执行 PR head code。
- 新增 `skills/pr-html-render/evals/evals.json`，覆盖 walkthrough HTML preview、fork PR 安全拒绝、敏感报告不发 public Pages。
- 更新 `skills/report-walkthrough/SKILL.md` 与 HTML template reference，加入 Render Handoff、return condition 与 red flag。
- 更新 `scripts/setup-opencode.ts`，OpenCode 默认安装 `pr-html-render`。
- 更新 `tests/regression/skill-surface.test.ts`，将 `pr-html-render` 作为 support skill 保护，而不是 phase skill。

## 验证与审查

- `docs/review-rfc.md`: PASS，无 blocking findings。
- `docs/test-report.md`: `git diff --check` PASS，`npm run test:regression` 10/10 PASS，`pr-html-render` smoke assertions PASS，walkthrough HTML smoke check PASS。
- `docs/review-change.md`: PASS，无 blocking findings；已应用 security lens。

## 可复用模式

- `report-walkthrough` 继续只生成 evidence-based HTML-first artifact，不发布 preview、不写 CI workflow、不创建 PR comment。
- `pr-html-render` 只处理已有 HTML artifact 的渲染/发布路径。
- 对 GitHub Pages preview，PR code build job 只读；deploy/comment job 有写权限但不 checkout 或执行 PR head code。
- public fork 自动发布不是 simple template 的适用范围，需要独立 hardened design。
- 敏感 HTML 报告走 artifact-only 或 authenticated internal host，不发 public Pages。
- PR preview URL 不是 PR lifecycle 完成证据；completion 仍由 `git-worktree-pr` 判定。

## Raw evidence

- plan: `.legion/tasks/pr-html-render-skill/plan.md`
- rfc: `.legion/tasks/pr-html-render-skill/docs/rfc.md`
- review-rfc: `.legion/tasks/pr-html-render-skill/docs/review-rfc.md`
- test-report: `.legion/tasks/pr-html-render-skill/docs/test-report.md`
- review-change: `.legion/tasks/pr-html-render-skill/docs/review-change.md`
- walkthrough markdown: `.legion/tasks/pr-html-render-skill/docs/report-walkthrough.md`
- walkthrough html: `.legion/tasks/pr-html-render-skill/docs/report-walkthrough.html`
- pr-body: `.legion/tasks/pr-html-render-skill/docs/pr-body.md`
