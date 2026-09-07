---
name: git-worktree-pr
description: 为需要仓库修改和 GitHub PR 交付的任务提供隔离 worktree、提交、rebase、squash PR、checks、合并、cleanup 与主工作区刷新。仓库规则要求时必须使用。
---

# git-worktree-pr

这是独立的 Git/PR 交付能力，不依赖任务系统、设计阶段、验证报告或其他 Legion skill。

## 安全不变量

- 从最新远端默认分支创建独立 worktree；优先使用仓库约定路径和分支前缀。
- 主工作区只做准备、只读检查、最终 cleanup 和刷新；实现与提交都在 worktree。
- 不混入用户或并发任务的改动，不直接 commit/push `master` 或 `main`，不强推覆盖他人工作。
- push 前 fetch 并 rebase 最新远端 base；冲突时在 worktree 内解决并重新验证。
- PR 使用 squash merge，遵守 required checks、review 和 branch protection。
- 外部交付推进到用户请求或仓库持久政策指定的目标；用户明确要求合并时持续跟进到 terminal、cleanup 和 refresh。

## 生命周期

1. 核对主工作区状态、远端、默认分支、现有 worktrees 和目标范围。
2. 在仓库内 `.worktrees/<task-id>/` 或仓库指定位置创建隔离 worktree。
3. 在 worktree 中实施并运行与风险相称的检查。
4. 只提交本次范围内变更。
5. fetch/rebase 远端 base，必要时重跑检查，然后 push 当前开发分支。
6. 创建或更新一个 squash PR；处理当前范围内的 checks 和 review。
7. 用户或仓库政策要求 merge 时启用或执行 squash merge并确认 terminal 状态。
8. terminal 且无后续动作后删除本次 worktree，再安全 fast-forward 主工作区。

## 停止条件

权限不足、base 分叉、无法安全保留用户改动、required check 或 review 需要范围外修复、PR 被关闭未合并时，报告精确 blocker、branch/worktree/PR 状态和恢复条件。不得用 reset、强推或删除用户内容绕过阻塞。

默认 base 为 `origin/master` 时可使用 `scripts/refresh-main-workspace.mjs` 完成安全刷新；其他默认分支显式传入对应 remote 与 branch。
