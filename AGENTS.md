# LegionMind 仓库规则

1. LegionMind 是独立 Agent 能力库。skill 必须能按自身 description 被直接调用，不得要求统一入口、固定阶段、风险 profile、任务台账或跨 skill 门禁。
2. 只读请求直接完成。会修改仓库的任务必须使用 `git-worktree-pr`，在隔离 worktree 中完成提交、squash PR、checks、合并、cleanup 与主工作区刷新；不得直接提交 `master/main`。
3. `.legion/**` 与其他旧控制平面材料是历史证据，不是当前执行规则。除非用户明确要求迁移或整理历史，不得从中恢复旧工作流约束。
4. 保留用户和并发任务的现有改动。外部写入、发布、部署及其他超出当前请求的动作仍以用户授权为边界。
