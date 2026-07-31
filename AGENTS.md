# LegionMind 入口规则

1. **普通路径**：只读回答/诊断、命令建议或无行为变化的文档整理；不改代码/运行时配置/协议/schema/持久状态，直接完成，不加载 `legion-workflow`。
2. **明确微操作**：目标明确、无设计分叉、低风险、不涉安全/数据/外部合约/跨模块，且单个检查可验收；直接修改验证，否则升级。
3. **Legion 路径**：多步骤、范围/验收不稳、中高风险、跨模块或用户明确要求 Legion。探索、追问、写入或派生前先加载 `legion-workflow`；bypass 优先。

仅为并行或 Standard/Strict 独立审查/验证派生子代理。运行 `skills/legion-workflow/scripts/subagent-name.mjs`；职责用 `agentType`，回显用 `displayName`，API 支持才传 `transportId`。

修改型 Legion 任务须加载 `git-worktree-pr`，只在 `.worktrees/<task-id>/` 开发并完成 rebase、squash PR、checks/review、cleanup、主工作区刷新；不得提交主分支。PR terminal 后的事实只写外部 lifecycle/最终交接，不得自动开 closeout/status-writeback PR。后续仓库改动等待用户明确授权，授权可包含新 PR。
