---
name: git-worktree-pr
description: 强制 Legion 修改型开发任务在隔离 Git worktree 中实现、通过 PR 交付，并跟进 checks/review/cleanup/主工作区刷新到终态。
---

# git-worktree-pr

## 概览

`git-worktree-pr` 是 Legion 修改型开发任务的 Git / PR 生命周期外壳。它包裹 `legion-workflow` 选定的既有执行模式，但不定义阶段顺序，也不是第四种执行模式。

## Hard Gate

- 在 Legion-managed 仓库中，任何会修改仓库文件的开发任务，在实现、可写探索、提交或 PR 分支开发前，必须先进入本 envelope。
- 默认 base ref 是 `origin/master`，除非用户或仓库规则明确覆盖。
- worktree 路径必须位于仓库根目录的 `.worktrees/<task-id>/`。
- 推荐分支命名：`legion/<task-id>-<slug>`，其中 slug 使用 2-4 个关键词。
- push 前必须在 worktree 内执行 `git fetch origin && git rebase origin/master`（或明确覆盖后的 base ref）；禁止基于过时 base 直接 push。
- 禁止直接向 `master` / `main` 提交或推送；禁止使用本地 `master` / `main` 分支承载开发、验证或临时改动。
- 任何写操作、任务产物、日志、临时诊断输出或持久化缓存都必须留在当前 repo 内；禁止写到用户主目录、系统临时目录或 repo 外路径。
- “快点”“直接改”“autopilot / don’t ask me”等通用提速表达不豁免本 envelope；只有用户明确要求绕过或不使用 worktree/PR 时才升级确认并记录。

## 主工作区边界

主工作区只允许：

- 运行 `legion-workflow` 入口门、恢复任务、读取 task/design 文档。
- 为创建 worktree 做只读检查、获取/刷新 base ref、确认路径。
- envelope 结束后的 cleanup 检查与主工作区 baseline refresh。

主工作区禁止：

- 实现编辑、测试驱动改动、文档交付改动或“先快速 patch 一下”。
- 开发分支提交、PR 分支推进、修复 checks/review 的改动。
- 把主工作区脏改动当作正常交付物。

## 生命周期阶段

1. **Prepare**：在主工作区执行 `git fetch origin`，确认 task id、scope、base ref、仓库状态与分支名。
2. **Open worktree**：只从最新 `origin/master`（或明确覆盖后的 base ref）创建 `.worktrees/<task-id>/`，禁止从本地分支创建。
3. **Run Legion mode**：在 worktree 内运行 `legion-workflow` 选定的既有阶段链。
4. **Commit**：只提交 scope 内变更；不得提交到 `master` / `main`。
5. **Rebase before push**：push 前必须在 worktree 内执行 `git fetch origin && git rebase origin/master`（或明确覆盖后的 base ref）。
6. **Push branch**：只 push PR 分支，禁止直接 push `master` / `main`。
7. **Open PR**：创建 PR，并链接或摘要 Legion 证据（plan/RFC/test-report/review/walkthrough/wiki）。
8. **Enable auto-merge**：PR 创建后必须立即尝试启用 auto-merge；若仓库策略、权限或平台状态不允许，记录阻塞原因并持续跟进，直到启用或确认无法启用。
9. **Follow PR**：持续跟进 checks 与 review；优先使用 `gh pr checks <pr> --watch --required` 等待 required checks，避免无界手动轮询。范围内失败要修复，权限/保护规则/产品决策阻塞要记录。
10. **Terminal decision**：PR merged 是成功路径；closed 或 confirmed abandoned 是非成功终态，必须记录原因、影响和下一步；blocked 只是 handoff，不是任务完成。
11. **Cleanup**：PR 已 merged / closed / confirmed abandoned 且后续 review 处理完成后，必须删除对应 worktree；仍需处理后续动作时不得删除。
12. **Main refresh**：worktree 删除后，回到主工作区执行 `git fetch origin && git checkout origin/master`（或明确覆盖后的 base ref）刷新基线。

## Checks / review / auto-merge 语义

- PR 创建不是完成。
- PR 创建后必须立即尝试启用 auto-merge；无法启用时记录阻塞并持续跟进，直到启用或确认无法启用。
- 跟进 required checks 时优先使用 `gh pr checks <pr-url-or-number> --watch --required`，不得用无界手动轮询替代。
- checks failing 且修复在 scope 内时，继续在 worktree 分支修复；超出 scope 时记录 blocker。
- review comments 在 scope 内时继续处理；changes requested 未解决不得声明成功完成。
- PR 落后 base、Linear History Rule 阻塞、merge conflict 或需要 update 时，必须在同一 worktree / 同一分支 / 同一 PR 中先 `git fetch origin && git rebase origin/master`，再 push 并继续跟进。
- auto-merge 只能在仓库策略允许、checks/review 满足、PR 内容仍在 scope 内时生效；不得绕过审批、checks 或 branch protection。
- 不得绕过分支保护、强推覆盖他人工作，或把 human review 缺失伪装成通过。

## Completion Definition

修改型开发任务完成必须同时满足：

- Legion 适用阶段链完成，并已产出 verification / review / walkthrough / wiki evidence。
- PR 已 merged，或已 closed / confirmed abandoned 且原因、影响和下一步已记录。
- 后续 review 处理已完成；不存在 blocking review、merge conflict、required checks failure 或仓库保护规则阻塞。
- 对应 worktree 已删除。
- 主工作区已执行 `git fetch origin && git checkout origin/master`（或明确覆盖后的 base ref）完成 baseline refresh。

## Blocked Handoff

- checks/review/权限/保护规则/平台状态阻塞时，可以产出 blocked handoff，但不得称为开发任务完成。
- blocked handoff 必须记录 blocker、已完成动作、未完成动作、对应 PR/worktree/branch、下一步 owner 与恢复条件。
- 仍需继续处理 checks、review、merge、cleanup 或主工作区 refresh 时，不得宣告 done。

## Red Flags

- 在 envelope 应打开后仍直接改主工作区。
- 把“PR created”或“branch pushed”说成 done。
- 从可 fetch 但未 fetch 的陈旧 base 创建分支。
- push 前跳过 `git fetch origin && git rebase origin/master`。
- 直接 commit/push `master` 或 `main`，或用本地 `master` / `main` 承载开发。
- 忽略 checks/review，并用 autopilot 或速度要求合理化。
- worktree 留存但没有原因、owner 或下一步。
- 把 blocked handoff、kept worktree 或 skipped refresh 写成完成。
- 把日志、临时产物或缓存写到 repo 外。
- Git lifecycle 文字被写成第四种 Legion 执行模式。

## 常见合理化与现实

| Rationalization | Reality |
|---|---|
| “只是文档/一行小改，主工作区更快。” | 只要是修改型开发任务，就进入 worktree；低风险不等于无 envelope。 |
| “PR 已经开了，所以任务完成。” | PR 创建只是交付载体开始；还要 checks/review/终态/cleanup/refresh。 |
| “autopilot 表示不用等 review/checks。” | autopilot 表示继续跟进并少打扰人，不表示跳过保护规则。 |
| “worktree 以后再清。” | cleanup 是完成条件；保留必须记录原因。 |
| “先 push，之后再 rebase。” | push 前必须 fetch + rebase 最新 base；过时分支不能出站。 |
| “blocked 已记录，所以算完成。” | blocked handoff 不是完成；完成必须满足 PR 终态、review/checks、cleanup、refresh。 |
| “临时日志写到 /tmp 或 home 更方便。” | 所有持久化输出必须留在 repo 内。 |
| “Git 流程可以作为新模式。” | Git 是 repository lifecycle envelope；执行模式仍只有三种。 |

## 输出记录

在任务日志、handoff 或 PR body 中记录：base ref、branch、worktree path、PR URL/state、checks state、review state、cleanup state、main refresh state。
