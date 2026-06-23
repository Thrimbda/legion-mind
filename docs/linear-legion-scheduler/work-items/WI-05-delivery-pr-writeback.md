# WI-05: PR tracking and Linear delivery writeback

## 目标

让 scheduler 能跟踪 worker 产出的 PR 状态，并把运行进展、PR 链接、阻塞原因和最终摘要写回 Linear。

## 背景

Legion 的 `git-worktree-pr` 规定 PR 创建不是完成。Scheduler 必须理解 PR lifecycle：open、draft、checks pending/failing、review requested、merged、closed。Linear 侧也需要持续可见状态，否则人只能查 DB 或 worker logs。

## 范围

- PR link extraction and persistence。
- GitHub PR client：checks、review、merge state、closed state。
- Run state update：`running -> in_review -> done/blocked/failed`。
- Linear writeback：comments、labels、state mapping。
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

### Linear comment cadence

建议只在关键节点 comment：

1. Claimed / started。
2. PR created / in review。
3. Blocked / failed with next owner。
4. Done / final summary。

普通 heartbeat 不应刷 Linear comment，可留在 scheduler events / metrics。

### Final summary

Final comment 至少包含：

- PR URL。
- Legion task path。
- Result：merged / closed / blocked / failed。
- Verification / checks summary。
- Downstream reconcile triggered or not。

### Done unlock

只有 PR merged 或明确 terminal design-only completion 才能解锁 downstream WI。PR open / in_review 不解锁。

PR merged 也不是单独的充分条件：scheduler-side Legion evidence verifier 必须通过。若 PR merged 但缺少 required evidence，run 进入 `blocked` / `legion_evidence_missing`，下游不解锁，Linear comment 指明缺失项。

## 验收标准

- [ ] Run 能关联 PR URL。
- [ ] Scheduler 能查询 PR checks / review / merge / closed 状态。
- [ ] PR open 时 Linear 显示 In Review / equivalent。
- [ ] PR merged 后 run 标记 done，释放 locks，触发 reconcile。
- [ ] PR merged 但 Legion evidence 缺失时不会标记 done，也不会释放 downstream。
- [ ] Checks failing 或 review changes requested 时 run 标记 blocked，并写明 owner / next step。
- [ ] Linear writeback 幂等，不因 repeated reconcile 重复发同一条 comment。

## 验证

- Unit tests：PR state mapping、writeback dedupe key。
- Integration tests：mock GitHub API states -> run transitions。
- Manual：用测试 PR 或 fixture 验证 In Review -> Done / Blocked。

## 风险

- **把 PR open 当 Done**: 会错误解锁 downstream。缓解：done gate 必须绑定 merged / terminal reason。
- **Linear spam**: 频繁 reconcile 可能重复 comment。缓解：writeback event idempotency。
- **GitHub API 权限不足**: 无法读 checks/reviews。缓解：进入 `pr_blocked` 并写明 token scope。
