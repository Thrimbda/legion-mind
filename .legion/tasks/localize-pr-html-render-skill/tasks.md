# pr-html-render skill 中文化任务状态

## 当前阶段

- 阶段：PR lifecycle in progress
- 模式：默认实现模式，低风险，无需 RFC 设计门
- Worktree：`.worktrees/localize-pr-html-render-skill/`
- Branch：`legion/localize-pr-html-render-skill`
- Base：`origin/master`

## Checklist

- [x] 进入 `legion-workflow` 入口门。
- [x] 加载 `brainstorm` 并收敛任务契约。
- [x] 加载 `git-worktree-pr` 并创建隔离 worktree。
- [x] 物化 `plan.md`、`tasks.md`、`log.md`。
- [x] 中文化 `skills/pr-html-render/SKILL.md`。
- [x] 必要时更新 eval 文案。
- [x] 执行验证并写入 `docs/test-report.md`。
- [x] 执行 `review-change` 并写入 `docs/review-change.md`。
- [x] 执行 `report-walkthrough` 并产出 Markdown / HTML / PR body。
- [x] 执行 `legion-wiki` writeback。
- [ ] 完成 commit、rebase、push、PR、checks/review、merge、cleanup、主工作区刷新。

## 备注

- 主工作区既有 `.opencode/package-lock.json` 脏改动不属于本任务。
- 主工作区未跟踪 `pr-html-report-preview-skill.zip` 是上一步输入材料，不属于本任务提交范围。
