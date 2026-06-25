# WI-07: Webhooks, retries, and stale recovery - 日志

## 会话进展 (2026-06-25)

### ✅ 已完成

- 入口按 `legion-workflow` 执行；当前请求没有现有 Legion task 目录，因此进入 `brainstorm` materialization。
- 读取 Linear issue `0XC-62`，确认 contract 已由 Linear 标记为 `contract:stable`，风险为 `risk:high`。
- 读取 blocker：`0XC-60` (WI-05) 与 `0XC-61` (WI-06) 均为 Done，WI-07 可启动。
- 加载 `git-worktree-pr` envelope，并从 `origin/master` 创建 worktree `.worktrees/linear-0xc-62-webhooks-retry-recovery`，分支 `legion/linear-0xc-62-webhooks-recovery`。
- 将 Linear `0XC-62` 更新为 In Progress，并写入开始执行评论。
- 物化本任务 `plan.md` / `tasks.md` / `log.md`。
- 完成高风险 design gate：写入 `docs/research.md`、`docs/rfc.md`、`docs/implementation-plan.md`，并通过 `docs/review-rfc.md`（Verdict: PASS）。
- 完成 WI-07 implementation：新增 `scheduler/src/webhook.ts`、`scheduler/src/retry-policy.ts`、`scheduler/src/recovery.ts`，扩展 `sqlite-store.ts` 与 `worker-runner.ts`，新增 `scheduler/tests/linear-reliability.test.ts`，更新 scheduler README 与 WI-07 delivery doc。
- Engineer 阶段本地最小检查已运行：`npm --prefix scheduler test`，50/50 PASS。
- Verification 阶段正式运行 `npm --prefix scheduler test`，50/50 PASS，并写入 `docs/test-report.md`。
- Review 阶段完成 `docs/review-change.md`，结论 PASS；已应用 security lens（webhook signature / trust boundary / payload routing）。
- Report 阶段生成 `docs/report-walkthrough.md` 与 `docs/pr-body.md`。
- Wiki writeback 完成：新增 `.legion/wiki/tasks/linear-0xc-62-webhooks-retry-recovery.md`，更新 wiki index / patterns / maintenance / log。

### 🟡 进行中

- 阶段 5：Delivery closure，下一步进入 commit / PR lifecycle。

### ⚠️ 阻塞/待定

- 无阻塞。

---

## 关键文件

- **`docs/linear-legion-scheduler/rfc.md`** [source]
  - 作用: Linear + Legion scheduler 总体 RFC 与 reliability 语义真源
- **`docs/linear-legion-scheduler/work-items/WI-07-webhooks-retry-recovery.md`** [source]
  - 作用: WI-07 upstream work-item contract
- **`.legion/tasks/linear-0xc-62-webhooks-retry-recovery/plan.md`** [active]
  - 作用: 本任务 task contract
- **`.legion/tasks/linear-0xc-62-webhooks-retry-recovery/docs/rfc.md`** [planned]
  - 作用: 高风险实现设计门

---

## 关键决策

| 决策 | 原因 | 替代方案 | 日期 |
|------|------|----------|------|
| 使用 taskId `linear-0xc-62-webhooks-retry-recovery` | Deterministic mapping from Linear issue id and WI title; retry/restoration should reuse same task directory | 使用非 Linear 前缀 task id | 2026-06-25 |
| 进入高风险 RFC gate | Linear labels include `risk:high`; scope spans webhook, DB state, retry, stale recovery and native stop semantics | 低风险直接实现 | 2026-06-25 |
| Webhook only triggers reconcile / outbox | RFC 要求 webhook 不是 scheduler truth，避免 duplicate/out-of-order event 直接 claim | Webhook handler 直接 launch worker | 2026-06-25 |
| 采用 zero-dependency raw webhook handler | Scheduler prototype 当前无 runtime deps；raw handler 更易测试签名与 replay | 引入 Express / SDK handler | 2026-06-25 |
| Retry 用 `blocked` active state + outbox retry | 保持 one active run/task invariant，避免 terminal failed 过早中断可恢复失败 | 所有 worker failure 直接 terminal failed | 2026-06-25 |
| Safe lock release 默认拒绝非 terminal run | TTL 只能触发调查，不能授权释放锁；防止双 worker | 保留 caller 自行保证 | 2026-06-25 |

---

## 快速交接

**下次继续从这里开始：**
1. 在 worktree `/home/c1/Work/legion-mind/.worktrees/linear-0xc-62-webhooks-retry-recovery` 中继续。
2. 先完成 `spec-rfc -> review-rfc`，通过后再进入 `engineer`。
3. 实现和验证完成后必须继续 `verify-change -> review-change -> report-walkthrough -> legion-wiki -> git-worktree-pr PR lifecycle`。

**注意事项：**
- 不要在主工作区实现或提交；主工作区只用于只读准备和最终 refresh。
- Push 前必须在 worktree 内执行 `git fetch origin && git rebase origin/master`。
- PR open 不是完成；完成需要 merged / terminal, checks/review done, worktree cleanup and main refresh。

---

*最后更新: 2026-06-25 10:18 by Legion orchestrator*
