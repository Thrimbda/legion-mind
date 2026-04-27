# LegionMind 入口规则

本仓库使用 Legion。

在任何由 Legion 管理的非简单多步骤工程工作开始代码、git、文件探索，或开始实现、追问、派生子代理之前：

1. 先加载 `legion-workflow`。它是由 Legion 管理工作的 mandatory first gate。
2. 严格遵循它的入口门规则。
3. 用户指令始终优先。

不要绕过这条入口序列。不要先打补丁再补规则，不要忽略 `.legion/`，不要在当前请求没有明确恢复任务时跳过 `brainstorm`，也不要在任务契约尚未稳定前启动 `engineer`。

对会修改仓库文件的 Legion 开发任务，`legion-workflow` 完成入口/恢复并确认非 bypass 后，必须使用 `git-worktree-pr` lifecycle envelope：在 `.worktrees/<task-id>/` 中开发并通过 PR 跟进 checks/review/cleanup/主工作区刷新。进入该 envelope 后，commit、push PR branch、创建或更新 PR、跟进 checks/review/auto-merge、cleanup 和主工作区刷新都是默认生命周期动作，不需要用户逐项显式授权；用户沉默不是跳过 commit / push / PR 的理由。只有用户明确要求不提交、不 push、不开 PR、不继续 PR lifecycle，或明确 bypass 时，才改变默认闭环，并必须记录为 explicit bypass/blocker。主工作区只允许准备、只读检查和最终基线刷新；不得在主工作区实现、提交或推进 PR 分支。push 前必须在 worktree 内执行 `git fetch origin && git rebase origin/master`；禁止直接向 `master`/`main` 提交或 push，禁止使用本地 `master`/`main` 承载开发。PR 创建、blocked handoff、保留 worktree 或跳过刷新都不构成完成。所有写操作、日志、临时产物和持久化缓存必须留在 repo 内。通用速度/autopilot 表达不豁免此规则。
