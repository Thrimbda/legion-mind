# WI-07: Webhooks, retries, and stale recovery - 任务清单

## 快速恢复

**Linear issue**: `0XC-62` — https://linear.app/0xc1/issue/0XC-62/wi-07-add-webhooks-retries-and-stale-recovery
**当前阶段**: 阶段 5 - Delivery closure
**当前检查项**: 完成 PR lifecycle
**进度**: 17/19 任务完成

---

## 阶段 1: Contract / envelope ✅ COMPLETE

- [x] 读取 Linear issue 与 blockers | 验收: `0XC-60` / `0XC-61` 均为 Done，`0XC-62` contract stable
- [x] 打开 `git-worktree-pr` envelope | 验收: worktree `.worktrees/linear-0xc-62-webhooks-retry-recovery` created from `origin/master`
- [x] 物化 task contract | 验收: `plan.md` / `tasks.md` / `log.md` 写入可恢复 contract

---

## 阶段 2: Design gate ✅ COMPLETE

- [x] 起草 `.legion/tasks/linear-0xc-62-webhooks-retry-recovery/docs/rfc.md` | 验收: RFC 覆盖 webhook raw-body/signature, dedupe/outbox, retry taxonomy, stale recovery, native stop/cancel, lock release safety
- [x] 完成 `review-rfc` | 验收: `docs/review-rfc.md` 结论 PASS，无 blocking design gap

---

## 阶段 3: Implementation ✅ COMPLETE

- [x] 实现 Linear webhook endpoint 与 raw-body signature verification | 验收: handler verify -> dedupe -> ack -> enqueue，不直接 claim/launch worker
- [x] 实现 webhook dedupe / event persistence / event-to-reconcile routing | 验收: duplicate 与 out-of-order webhook 不重复调度，current snapshot 决策仍由 reconcile 负责
- [x] 实现 AgentSessionEvent native outbox routing | 验收: created/prompted/stopped/delegated/permission change 进入 outbox 或 stop/cancel transition
- [x] 实现 failure taxonomy 与 retry policy | 验收: retryable / conditionally retryable / non-retryable / control signal 行为可测试
- [x] 实现 stale heartbeat / stale run / attempt recovery | 验收: stale 检测先确认 worker 是否仍存活，不产生第二个 active run
- [x] 实现 native stop/cancel recovery 与 safe lock release | 验收: stop/cancel 写 terminal non-success，downstream 默认不解锁，lock release 有 terminal/dead/admin 条件

---

## 阶段 4: Verification ✅ COMPLETE

- [x] 运行 unit tests | 验收: signature verification、dedupe key、failure taxonomy、native stop state transition PASS
- [x] 运行 integration / fault-injection tests | 验收: duplicate webhook + periodic reconcile 只 claim 一次，fake worker timeout/crash/malformed output 行为符合预期
- [x] 记录 `docs/test-report.md` | 验收: 命令、结果、失败/跳过原因与覆盖面可审阅

---

## 阶段 5: Delivery closure

- [x] 完成 `review-change` | 验收: `docs/review-change.md` PASS 或明确 blocker
- [x] 生成 `docs/report-walkthrough.md` 与 `docs/pr-body.md` | 验收: reviewer 可直接阅读变更、验证与风险
- [x] 完成 `legion-wiki` writeback | 验收: wiki 记录 WI-07 当前真相 / reusable pattern
- [ ] 完成 PR lifecycle | 验收: commit, `git fetch origin && git rebase origin/master`, push branch, create/update PR, enable auto-merge or record blocker, checks/review/merge terminal, cleanup worktree, refresh main
- [ ] 更新 Linear lifecycle | 验收: PR link/comment/status 写回；成功时 `0XC-62` Done，非成功时 blocked/failed/canceled reason 明确

---

## 发现的新任务

- (暂无)

---

*最后更新: 2026-06-25 10:18*
