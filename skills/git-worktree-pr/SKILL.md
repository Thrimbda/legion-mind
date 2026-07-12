---
name: git-worktree-pr
description: 为 Legion 修改型开发任务提供隔离 worktree、squash PR、checks/review、终态、cleanup 与主工作区刷新外壳。
---

# git-worktree-pr

这是修改型 Legion 任务的 Git/PR lifecycle envelope，不定义阶段顺序，也不是第四种模式。默认中文记录；命令、hash、URL 和平台字段保持原样。

## 硬门

- `legion-workflow` 接管并稳定 contract 后、任何可写探索或实现前进入本 envelope。
- 默认 base 为 `origin/master`；worktree 只能是仓库内 `.worktrees/<task-id>/`，从最新远端 base 创建。推荐分支 `legion/<task-id>-<slug>`。
- 主工作区只做入口/恢复、只读准备和最终刷新；不得实现、提交或推进 PR 分支。禁止直接 commit/push `master/main`。
- 所有文档、日志、临时输出和缓存留在仓库内。
- 进入后 commit、rebase、push、PR、auto-merge 尝试、checks/review、终态、cleanup、刷新均为默认动作。用户沉默或提速表达不是停止条件；只有明确禁止或 bypass 才改变，并记录 explicit bypass/blocker。

## 生命周期

1. **Prepare**：主工作区 `git fetch origin`；确认 task、scope、base、状态、分支和 worktree 路径。
2. **Open**：从最新远端 base 创建 worktree；所有 Legion 阶段和写入在其中完成。
3. **Commit**：提交 scope 内变更，不混入用户或无关改动。
4. **Rebase**：push 前在 worktree 运行 `git fetch origin && git rebase origin/master`，或仓库明确覆盖的 base。
5. **Push/PR**：push 同一开发分支；创建或更新 squash PR，并链接 plan/RFC/test/review/walkthrough/wiki 证据。
6. **Auto-merge**：PR 创建后立即尝试启用；`review/decide` attention 未解除时停在其门禁。不得绕过 branch protection、checks 或审批。
7. **Follow**：优先 `gh pr checks <pr> --watch --required`；scope 内 check/review 失败继续修。落后 base、冲突或更新要求仍在同一 worktree/branch/PR 中 rebase 后继续。
8. **Terminal**：merged 是成功；closed/confirmed abandoned 是非成功终态，须记录原因、影响和下一步；blocked handoff 不是终态。
9. **Cleanup**：终态且后续 review 已处理后删除 worktree；仍有动作不得删。
10. **Refresh**：回主工作区 `git fetch origin && git checkout origin/master` 或覆盖后的 base，并核对基线。

## Attention 边界

- `none/skim`：按 lifecycle 正常推进。
- `review`：允许 commit、push、PR、checks；禁止 auto-merge、merge、cleanup 和完成声明，直至复核落盘。
- `decide`：只允许保存证据/决策说明；受影响实现和 merge lifecycle 等待决定。

定义和恢复只认 `legion-workflow/references/REF_HUMAN_ATTENTION.md`。

## 完成定义

必须同时满足：

- Legion 适用阶段、verification/review/walkthrough/wiki 证据已完成；
- PR 已 merged，或 closed/confirmed abandoned 且记录完整；
- 无 blocking review、冲突、required check 失败或保护规则阻塞；
- worktree 已删除；主工作区已刷新到远端 base。

PR created、branch pushed、blocked handoff、保留 worktree或跳过刷新都不是完成。

## 阻塞交接与记录

权限、平台、checks/review 或保护规则阻塞时记录：blocker，已完成/未完成动作，base、branch、worktree、PR URL/state，checks/review state，cleanup/refresh state，下一步 owner 与恢复条件；不得称 done。

禁止强推覆盖他人工作、使用非 squash 合并、把 lifecycle 写成 Legion 新模式，或把持久输出写到 repo 外。
