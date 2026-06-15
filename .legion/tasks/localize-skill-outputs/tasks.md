# 全仓库 Skill 中文输出约束任务状态

## 当前阶段

- 阶段：Git / PR lifecycle
- 模式：默认实现模式，中风险，需 `spec-rfc -> review-rfc` 后进入实现
- Worktree：`.worktrees/localize-skill-outputs/`
- Branch：`legion/localize-skill-outputs-chinese-docs`
- Base：`origin/master`

## Checklist

- [x] 进入 `legion-workflow` 入口门。
- [x] 加载 `brainstorm` 并收敛任务契约。
- [x] 加载 `git-worktree-pr` 并创建隔离 worktree。
- [x] 加载 `legion-docs` 并物化 `plan.md`、`tasks.md`、`log.md`。
- [x] 执行 `spec-rfc` 并产出 `docs/rfc.md`。
- [x] 执行 `review-rfc` 并产出 `docs/review-rfc.md`。
- [x] 执行 `engineer` 更新 13 个仓库 skill。
- [x] 执行 `verify-change` 并写入 `docs/test-report.md`。
- [x] 执行 `review-change` 并写入 `docs/review-change.md`。
- [x] 执行 `report-walkthrough` 并产出 Markdown / HTML / PR body。
- [x] 执行 `legion-wiki` writeback。
- [ ] 完成 commit、rebase、push、PR、checks/review、merge、cleanup、主工作区刷新。

## 备注

- Scope 限定为仓库 `skills/*/SKILL.md` 与本任务证据文档。
- 中文输出是默认约束，不覆盖用户显式指定语言、代码/命令/路径/机器可读字段和第三方原文。
