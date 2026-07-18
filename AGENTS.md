# LegionMind 入口规则

先按请求本身分类：

1. **普通路径**：不修改代码、运行时配置、协议/schema 或持久状态的工作，包括回答、解释、总结、状态检查、只读审阅/诊断、给命令及不改变行为的文档整理，直接完成，不加载 `legion-workflow`。
2. **明确微操作**：目标和位置明确、无设计分叉、低风险、不涉及安全/数据/外部合约/跨模块，且一个有界检查即可验收，直接修改并验证；任一条件失效就停止并升级。
3. **Legion 路径**：多步骤、范围或验收不稳、中高风险、跨模块，或用户明确要求 Legion。探索文件/git、追问、写入或派生前必须先加载 `legion-workflow`；用户显式 bypass 优先。

只为并行工作或 Standard/Strict 的独立审查/验证派生子代理。派生前运行 `skills/legion-workflow/scripts/subagent-name.mjs`；职责用 `agentType`，回显用 `displayName`，API 支持时才传 `transportId`。

修改型 Legion 任务还必须加载 `git-worktree-pr`：只在 `.worktrees/<task-id>/` 开发，完成 commit、push 前 rebase、squash PR、checks/review、终态、cleanup 与主工作区刷新；禁止直接修改或提交主分支。所有产物留在仓库内。
