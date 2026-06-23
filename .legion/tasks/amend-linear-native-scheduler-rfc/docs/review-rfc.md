# Review RFC：Linear Native Agent 与终态语义补强

## Verdict

**PASS**

## Review Scope

- `docs/linear-legion-scheduler/rfc.md`
- `docs/linear-legion-scheduler/index.md`
- `docs/linear-legion-scheduler/work-items/WI-01..WI-08`
- `.legion/tasks/amend-linear-native-scheduler-rfc/docs/rfc.md`
- `.legion/tasks/amend-linear-native-scheduler-rfc/docs/research.md`

## First Review Finding and Fix

第一轮 review-rfc 给出 **FAIL**：`run_terminal_success` 仍可能在 `git-worktree-pr` cleanup / main refresh 未完成时解锁 downstream。

已修复：

- 主 RFC §9.5 要求 PR-backed work 的 evidence 包含 PR merged、checks/review 完成、worktree cleanup、main refresh。
- 主 RFC §10.2 要求 `run_terminal_success` 必须包含 `git-worktree-pr` lifecycle completion。
- 新增 failure type `lifecycle_blocked`：PR merged 但 cleanup / main refresh / lifecycle follow-up 缺失时不得标记 done，不得解锁 downstream。
- WI-04 evidence verifier 增加 lifecycle evidence。
- WI-05 terminal unlock 验收要求 PR merged + evidence PASS + cleanup + main refresh。

## Final Review Result

本次 amendment 已满足实现前设计门：

1. Linear Native Agent layer 被正式建模为 presentation/control plane，而不是 Scheduler machine truth。
2. `Issue.delegate`、AgentSession、AgentActivities、Agent Plan、externalUrls、stop signal 和 permission change 都有明确职责与接入 WI。
3. `run_terminal_success` / `run_terminal_non_success` / `blocker_satisfied` 三层术语已拆开；非成功终态默认不释放 downstream。
4. Claim 前 snapshot revalidation 已进入 RFC 与 WI-02。
5. Native side effects 统一走 DB-backed outbox，避免 webhook handler 直接 claim / launch / writeback。
6. OpenCode-only 与 Legion workflow / `git-worktree-pr` hard gates 保持不变。

## Non-blocking Suggestions Applied

- RFC §6.3 的 `done` state mapping 补充 `git-worktree-pr` lifecycle completion。
- WI-05 风险项补充 merged-but-lifecycle-incomplete 不能当 Done。
