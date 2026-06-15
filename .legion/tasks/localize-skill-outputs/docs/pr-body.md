# Implementation Review（全仓库 Skill 中文输出约束）

> 本 PR body 只是 PR 创建/更新输入，不代表 checks/review/merge、auto-merge、worktree cleanup 或主工作区 refresh 已完成。

## 交付摘要

- 为仓库 13 个 `skills/*/SKILL.md` 新增 `## 输出语言与文档产物` 小节。
- 默认要求 skill 用中文回答；若产出人类阅读型文档产物，也默认使用中文。
- 明确保留代码、命令、路径、机器可读字段、错误原文、平台字段和用户指定语言，避免中文化破坏执行语义。

## 范围

**In scope**

- `skills/*/SKILL.md`
- `.legion/tasks/localize-skill-outputs/**`

**Out of scope**

- 不改全局安装副本。
- 不改 frontmatter `name` / `description`。
- 不改安装脚本、workflow template、测试 harness 或 Git lifecycle。

## 主要改动

- `brainstorm`、`spec-rfc`、`review-rfc`、`verify-change`、`review-change`、`report-walkthrough` 等文档/证据阶段明确其文档产物默认中文。
- `legion-workflow`、`git-worktree-pr`、`legion-docs`、`legion-wiki`、`llm-wiki` 明确 task docs、lifecycle 记录和 wiki 产物默认中文。
- `engineer`、`pr-html-render` 明确保留代码、命令、HTML/URL/Actions 字段等原文，同时中文说明交接与风险。

## 验证与审查

- RFC: `.legion/tasks/localize-skill-outputs/docs/rfc.md`
- RFC review: `.legion/tasks/localize-skill-outputs/docs/review-rfc.md`，PASS
- Verification: `.legion/tasks/localize-skill-outputs/docs/test-report.md`
  - `git diff --check` PASS
  - 静态 smoke check：13 个 `SKILL.md` 均命中，0 failures
  - `npm run test:regression` PASS，13/13
- Change review: `.legion/tasks/localize-skill-outputs/docs/review-change.md`，PASS
- Walkthrough: `.legion/tasks/localize-skill-outputs/docs/report-walkthrough.md` / `.html`

## 风险与限制

- 已安装到用户本机的 skill 副本需要重新安装/同步并重启运行时后才会加载新约束。
- 本任务未新增 per-skill pressure eval；如后续发现单个 skill 不遵守中文输出，可单独补 eval。
- PR lifecycle 仍需 checks/review/merge/cleanup/refresh 后才算完成。

## 评审重点

- [ ] 全部仓库 skill 是否都有明确中文输出与文档产物约束？
- [ ] 新约束是否没有修改 frontmatter、触发语义、阶段链或 lifecycle？
- [ ] 例外规则是否足以保护代码、命令、路径、机器可读字段和外部原文？

## Render Handoff

`docs/report-walkthrough.html` 已生成。本任务不新增 GitHub Pages preview workflow，当前记录为 artifact-only/local fallback；如 reviewer 需要 rendered URL，可后续使用 `pr-html-render`。
