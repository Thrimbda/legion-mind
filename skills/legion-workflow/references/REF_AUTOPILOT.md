# 自动推进协议

Autopilot 只减少非阻塞打扰，不跳过入口、contract、profile 要求的设计/验证/review、delivery/wiki disposition 或 PR lifecycle。

## 默认行为

- 在 contract 允许范围内采用可回滚、局部、保守的默认值，并记录假设；安全、数据迁移、外部合约自动升级风险。
- 修改型 Legion 任务默认继续 commit、push 前 rebase、push、创建/更新当前 squash PR、auto-merge 尝试、checks/review、终态、cleanup 和主工作区刷新。当前 PR open 时优先继续同一 branch/PR；terminal 状态只做 external-only finalization，不自动创建状态写回 PR。只有用户明确禁止或 bypass 才停止，并记录未完成动作与恢复条件。
- PR 是集中批准载体，但 PR created 不是完成，不能绕过 branch protection、checks、review 或 attention 门。
- release/deploy/post-merge failure 只做外部重试和报告，不自动触发 closeout/follow-up PR；需要仓库修改时停止并等待用户明确授权，授权后可开始新的仓库交付。

## 人类介入

- `none/skim`：投影五字段 handoff 后自动继续。
- `review`：可继续准备证据、PR 和 checks；auto-merge/merge 前等待复核。
- `decide`：只提出一个问题与必要选项、取舍、推荐；停止阶段转换和普通回退。决定写入 `log.md`、状态同步 `tasks.md` 后按声明点恢复。

完整等级与恢复只认 `REF_HUMAN_ATTENTION.md`。

## 工程默认值

- 分支：`legion/<task-id>-<slug>`；worktree：`.worktrees/<task-id>/`；base：`origin/master`，除非仓库覆盖。
- push 前：`git fetch origin && git rebase origin/master`。
- commit：Conventional Commits；验证先跑最快的可信检查。
- 完整证据落 task docs；会话和子代理只传五字段判断增量。
- token 优化使用按需上下文和五字段 handoff；不为阶段切换强制派生。Standard/Strict 的直接作者与 reviewer 仍须分离，Strict verifier 也须独立。名称或 session id 不是身份 attestation。
- 当前 PR open 时优先用 `gh pr checks <pr> --watch --required`；scope 内失败在同一 PR 继续修，外部阻塞做 blocked handoff，但不得称 done。PR terminal 后不得为了记录终态自动回到 engineer 或创建 PR；后续仓库工作等待用户明确授权。

## 重型设计

Epic/High-risk 或用户指定 `rfc:heavy` 时先生成 `plan + research + rfc + review-rfc`；需要 reviewer walkthrough 时再生成 `pr-body`。设计与实现属于同一连续交付时默认在当前 branch/PR 内推进；用户指定 `plan-only/rfc-only` 时该交付以设计结束，后续实现必须先取得用户明确授权，不得把设计终态自动扩成实现交付。
