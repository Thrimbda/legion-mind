# Report Walkthrough: 全仓库 Skill 中文输出约束

## Profile

implementation

## Reviewer Summary

- 本任务为仓库 13 个 `skills/*/SKILL.md` 增加“输出语言与文档产物”约束。
- 默认行为现在明确为中文回答；如果 skill 产出人类阅读型文档产物，也默认使用中文。
- 约束同时保留代码、命令、路径、机器可读字段、错误原文和平台术语，避免中文化破坏执行或审查语义。
- RFC、review-rfc、验证和 review-change 均已通过。

## Scope

**In scope**

- `skills/brainstorm/SKILL.md`
- `skills/engineer/SKILL.md`
- `skills/git-worktree-pr/SKILL.md`
- `skills/legion-docs/SKILL.md`
- `skills/legion-wiki/SKILL.md`
- `skills/legion-workflow/SKILL.md`
- `skills/llm-wiki/SKILL.md`
- `skills/pr-html-render/SKILL.md`
- `skills/report-walkthrough/SKILL.md`
- `skills/review-change/SKILL.md`
- `skills/review-rfc/SKILL.md`
- `skills/spec-rfc/SKILL.md`
- `skills/verify-change/SKILL.md`
- `.legion/tasks/localize-skill-outputs/**`

**Out of scope**

- 不修改全局安装副本。
- 不修改 frontmatter `name` / `description`。
- 不改安装脚本、workflow template、测试 harness 或 Git lifecycle 语义。

## Evidence Map

| Claim | Evidence | Status |
|---|---|---|
| Contract 稳定，scope 明确 | `plan.md` | PASS |
| 需要中风险设计门并已完成 | `docs/rfc.md`、`docs/review-rfc.md` | PASS |
| 13 个 skill 均新增中文输出约束 | 当前 diff、`docs/test-report.md` 静态 smoke | PASS |
| Regression 未回退 | `docs/test-report.md` | PASS |
| 实现符合 scope 且无 blocker | `docs/review-change.md` | PASS |

## Delivery Path

1. Brainstorm：物化 `plan.md`、`tasks.md`、`log.md`。
2. Spec RFC：定义统一原则、例外和 per-skill 落点。
3. Review RFC：PASS，允许进入实现。
4. Engineer：更新 13 个 `SKILL.md`。
5. Verify Change：`git diff --check`、静态 smoke、regression 全部 PASS。
6. Review Change：PASS，无 blocking findings。
7. 当前阶段：本 walkthrough 产物已生成，下一步进入 `legion-wiki` writeback 和 PR lifecycle。

## What Changed / What Was Decided

- 所有 skill 新增同名小节 `## 输出语言与文档产物`，方便后续静态维护。
- 文档型 skill 明确对应产物，例如 `plan.md`、`docs/rfc.md`、`docs/test-report.md`、`docs/report-walkthrough.html`、`.legion/wiki/**`。
- 流程型和实现型 skill 明确保留机器可读内容和外部原文。
- 决策不修改 frontmatter discovery 字段，避免影响 skill 自动触发。

## Verification / Review Status

- `git diff --check`：PASS。
- 静态 smoke check：`skillFiles: 13`，`failures: []`。
- `npm run test:regression`：13/13 PASS。
- `review-change`：PASS，security trigger 未命中，PR trust boundary 文案未被削弱。

## Risks and Limits

- 本任务只更新仓库内 skill 真源；已安装到用户本机的副本需要重新安装/同步并重启运行时后才会加载新约束。
- 未新增 per-skill subagent pressure eval。若后续某个 skill 仍偏离中文输出，可按单独任务补充 eval。
- PR lifecycle 尚未完成；PR 创建、checks、review、merge、cleanup 和主工作区 refresh 仍由 `git-worktree-pr` 后续处理。

## Render Handoff

`docs/report-walkthrough.html` 已作为 reviewer-facing HTML artifact 生成。本任务不修改 GitHub Pages preview workflow，记录为 artifact-only/local fallback；如 reviewer 需要 rendered URL，可在后续按 `pr-html-render` 处理。

## Reviewer Checklist

- [ ] 新增语言约束是否覆盖全部 13 个仓库 skill？
- [ ] 约束是否保留了代码、命令、路径、机器可读字段和外部原文？
- [ ] 是否没有改变 frontmatter、阶段链、Git lifecycle 或安装脚本语义？
- [ ] 验证证据是否足以支撑交付？

## Next Stage

进入 `legion-wiki` writeback，然后执行 `git-worktree-pr` lifecycle：commit、rebase、push、创建/更新 PR、跟进 checks/review/auto-merge、终态、cleanup 和主工作区 refresh。
