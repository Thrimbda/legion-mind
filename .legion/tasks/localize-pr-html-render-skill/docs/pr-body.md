# Implementation Review（实现交付）

> 本 PR body 只是 PR 创建/更新输入，不代表 checks/review/merge、auto-merge、worktree cleanup 或主工作区 refresh 已完成。

## 交付摘要

- 将 `skills/pr-html-render/SKILL.md` 改为中文为主，匹配 Legion 仓库文档风格。
- 保留关键英文触发词、artifact 路径、GitHub Actions 权限名、模板文件名和安全边界。
- 将 `skills/pr-html-render/evals/evals.json` 的场景文案同步为中文。

## 范围

**In scope**

- `pr-html-render` skill 文案中文化。
- Eval prompt / expected output 中文化。
- Task evidence、walkthrough 与 wiki writeback。

**Out of scope**

- 不修改 GitHub Actions templates 逻辑。
- 不启用当前仓库 Pages preview workflow。
- 不修改 `report-walkthrough` 协议或 PR lifecycle 规则。

## 主要改动

- `skills/pr-html-render/SKILL.md`：frontmatter description、正文和 section 标题改为中文为主。
- `skills/pr-html-render/evals/evals.json`：三个 eval 场景改为中文 prompt / expected output。
- `.legion/tasks/localize-pr-html-render-skill/**`：新增 contract、test report、review、walkthrough 和 PR body。
- `.legion/wiki/**`：记录中文化后的当前结论。

## 验证与审查

- 验证: `.legion/tasks/localize-pr-html-render-skill/docs/test-report.md`
  - `git diff --check` PASS
  - `npm run test:regression` PASS, 10/10
  - localization smoke assertions PASS
- 变更审查: `.legion/tasks/localize-pr-html-render-skill/docs/review-change.md`
  - PASS
  - security lens 已应用

## 风险与限制

- 已保留英文技术 token，以降低中文化对 skill 触发与模板引用的影响。
- 本 PR 不启用 rendered preview workflow；walkthrough HTML 采用 artifact-only/local fallback。
- 用户需要重启 opencode 或刷新安装后的 skill，才能让运行时使用更新后的中文文案。

## Render Handoff

- HTML artifact: `.legion/tasks/localize-pr-html-render-skill/docs/report-walkthrough.html`
- Render state: artifact-only/local fallback
- Reason: 本任务只改 skill 文案，不新增 Pages preview workflow。

## 评审重点

- [ ] `pr-html-render` skill 是否中文为主且保留关键 token？
- [ ] 安全边界是否完整保留？
- [ ] Eval 中文场景是否仍覆盖 same-repo preview、fork PR 安全和敏感 HTML 三类重点？
- [ ] PR lifecycle disclaimer 是否清楚？

## 证据链接

- plan: `.legion/tasks/localize-pr-html-render-skill/plan.md`
- test-report: `.legion/tasks/localize-pr-html-render-skill/docs/test-report.md`
- review-change: `.legion/tasks/localize-pr-html-render-skill/docs/review-change.md`
- report-walkthrough: `.legion/tasks/localize-pr-html-render-skill/docs/report-walkthrough.html`
