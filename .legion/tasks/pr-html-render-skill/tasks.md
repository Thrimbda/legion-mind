# pr-html-render skill 集成任务状态

## 当前阶段

- 阶段：Wiki writeback complete
- 模式预判：默认实现模式，中等风险，需先走 `spec-rfc -> review-rfc`
- Worktree：`.worktrees/pr-html-render-skill/`
- Branch：`legion/pr-html-render-skill-preview`
- Base：`origin/master`

## Checklist

- [x] 进入 `legion-workflow` 入口门。
- [x] 加载 `brainstorm` 并收敛新任务契约。
- [x] 加载 `git-worktree-pr` 并创建隔离 worktree。
- [x] 物化 `plan.md`、`tasks.md`、`log.md`。
- [x] 编写 `docs/rfc.md`。
- [x] 执行 `review-rfc` 并记录 `docs/review-rfc.md`。
- [x] 迁移 zip 内容为 `skills/pr-html-render/**`。
- [x] 改造 `skills/report-walkthrough/**` 接入 `pr-html-render`。
- [x] 更新必要 regression / install surface。
- [x] 执行验证并写入 `docs/test-report.md`。
- [x] 执行 `review-change` 并写入 `docs/review-change.md`。
- [x] 执行 `report-walkthrough` 并产出 HTML / Markdown / PR body。
- [x] 执行 `legion-wiki` writeback。
- [ ] 完成 commit、rebase、push、PR、checks/review、merge、cleanup、主工作区刷新。

## 备注

- 主工作区既有 `.opencode/package-lock.json` 脏改动不属于本任务。
- 用户提供的 `pr-html-report-preview-skill.zip` 是输入材料，默认不提交原始 zip。
