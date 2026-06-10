# localize-pr-html-render-skill

## 摘要

本任务将 `skills/pr-html-render/SKILL.md` 改为中文为主，以匹配 Legion 仓库当前文档风格，同时保留英文触发 token、artifact 路径、GitHub Actions 权限名、模板文件名和安全边界。`skills/pr-html-render/evals/evals.json` 的 prompt 与 expected output 也同步为中文场景。

## 当前结论

- `pr-html-render` 仍是 support skill，不是 Legion phase。
- `pr-html-render` 只处理已有 HTML artifact 的 rendered preview / artifact-only / internal-host 路径，不生成报告内容，不替代 `report-walkthrough`、`git-worktree-pr` 或 `legion-wiki`。
- `SKILL.md` 中文化后仍保留 `docs/report-walkthrough.html`、`GitHub Pages`、`pull_request_target`、`pages: write`、`contents: write`、`templates/github-pages-pr-render.yml` 与 `templates/cleanup-pr-render.yml` 等关键 token。
- GitHub Actions / PR trust boundary / public Pages 敏感信息安全规则未被中文化削弱。

## 证据

- Contract：`.legion/tasks/localize-pr-html-render-skill/plan.md`
- Verification：`.legion/tasks/localize-pr-html-render-skill/docs/test-report.md`
- Review：`.legion/tasks/localize-pr-html-render-skill/docs/review-change.md`
- Walkthrough：`.legion/tasks/localize-pr-html-render-skill/docs/report-walkthrough.html`

## 验证结果

- `git diff --check` PASS。
- `npm run test:regression` PASS，10/10。
- localization smoke assertions PASS。
- `review-change` PASS，security lens 已应用。

## 后续注意

- 修改 skill 文件后，运行中的 opencode session 不会自动热加载；用户需要重启 opencode 或刷新安装后的 skill，才能使用最新中文文案。
- 本任务 walkthrough 采用 artifact-only/local fallback，不启用仓库 GitHub Pages preview workflow。
