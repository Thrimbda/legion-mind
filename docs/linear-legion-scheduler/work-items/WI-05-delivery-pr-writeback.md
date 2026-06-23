# WI-05: PR tracking and Linear delivery writeback

## 目标

让 scheduler 能跟踪 worker 产出的 PR 状态，并把运行进展、PR 链接、阻塞原因和最终摘要写回 Linear native layer 与 coarse labels/status。

## 背景

Legion 的 `git-worktree-pr` 规定 PR 创建不是完成。Scheduler 必须理解 PR lifecycle：open、draft、checks pending/failing、review requested、merged、closed。Linear 侧也需要持续可见状态，否则人只能查 DB 或 worker logs。

## 范围

- PR link extraction and persistence。
- GitHub PR client：checks、review、merge state、closed state。
- Run state update：`running -> in_review -> done/blocked/failed/cancelled/abandoned`，其中 `done` 仅代表 success。
- Linear native writeback：AgentActivities、Agent Plan、externalUrls、comments、labels、state mapping。
- Idempotent writeback，避免重复刷屏。
- Final summary template。

## 非目标

- 不实现 worker 自己修复 failing checks。
- 不绕过 GitHub branch protection。
- 不实现 auto-merge policy 的所有细节；只记录和观察。
- 不实现 parallel dispatch。

## 依赖

- WI-04。

## 设计要求

### Linear native writeback cadence

优先写 AgentActivities，必要时同步 comments / labels / status 作为看板筛选：

1. Claimed / started：`thought` / `action`。
2. PR created / in review：`action` + PR `externalUrl`。
3. Blocked / failed / awaiting input：`elicitation` 或 `error`，写明 next owner。
4. Done：`response` final summary。
5. Terminal non-success：`error` 或 `response`，说明 canceled / abandoned / closed-unmerged 不释放 downstream。

普通 heartbeat 不应刷 Linear comment，可留在 scheduler events / metrics。

### Final summary

Final comment 至少包含：

- PR URL。
- Legion task path。
- Result：merged / closed / blocked / failed。
- Verification / checks summary。
- `git-worktree-pr` lifecycle summary：PR merged、worktree cleanup、main refresh。
- Downstream reconcile triggered or not。
- Terminal kind：`run_terminal_success` or `run_terminal_non_success`。

### Terminal unlock

只有 `run_terminal_success` 才能默认解锁 downstream WI。PR open / in_review / canceled / abandoned / closed-unmerged 不解锁。

PR merged 也不是单独的充分条件：scheduler-side Legion evidence verifier 必须通过，且 `git-worktree-pr` lifecycle 必须完成 worktree cleanup 与 main refresh。若 PR merged 但缺少 required evidence，run 进入 `blocked` / `legion_evidence_missing`；若 lifecycle follow-up 缺失，run 进入 `blocked` / `lifecycle_blocked`。两者都不解锁下游。

Closed-unmerged、native stop、admin cancel、human rejected、superseded 必须记录为 `run_terminal_non_success`，释放 locks 只表示该 run 不再活动，不表示 blocker satisfied。

## 验收标准

- [ ] Run 能关联 PR URL。
- [ ] Scheduler 能查询 PR checks / review / merge / closed 状态。
- [ ] PR open 时 Linear 显示 In Review / equivalent。
- [ ] PR open 时 AgentSession externalUrls 包含 PR URL，并有 activity 说明等待 checks/review。
- [ ] PR merged、evidence verifier PASS、worktree cleanup 完成、main refresh 完成后，run 才标记 done，释放 locks，触发 reconcile。
- [ ] PR merged 但 Legion evidence 缺失时不会标记 done，也不会释放 downstream。
- [ ] PR merged 但 cleanup / main refresh 缺失时进入 `lifecycle_blocked`，不会释放 downstream。
- [ ] Closed-unmerged / cancelled / abandoned 被标记 terminal non-success，不会默认释放 downstream。
- [ ] Checks failing 或 review changes requested 时 run 标记 blocked，并写明 owner / next step。
- [ ] Linear native writeback 幂等，不因 repeated reconcile 重复发同一条 activity/comment。

## 验证

- Unit tests：PR state mapping、terminal success/non-success mapping、native writeback dedupe key。
- Integration tests：mock GitHub API states -> run transitions。
- Manual：用测试 PR 或 fixture 验证 In Review -> Done / Blocked。

## 风险

- **把 PR open、closed-unmerged 或 merged-but-lifecycle-incomplete 当 Done**: 会错误解锁 downstream。缓解：done gate 只能绑定 merged + evidence PASS + `git-worktree-pr` cleanup/main refresh；非成功终态和 `lifecycle_blocked` 单独建模。
- **Linear spam**: 频繁 reconcile 可能重复 comment。缓解：writeback event idempotency。
- **GitHub API 权限不足**: 无法读 checks/reviews。缓解：进入 `pr_blocked` 并写明 token scope。
