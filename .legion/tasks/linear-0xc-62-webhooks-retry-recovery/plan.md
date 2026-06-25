# WI-07: Webhooks, retries, and stale recovery

## 目标

增加 Linear webhook ingestion、retry policy、stale run recovery 和 failure taxonomy，让 `scheduler/` 从“能跑”进入“能长期恢复”。本任务交付的是 Linear + Legion scheduler 的可靠性闭环：webhook 只能触发 reconcile，失败和重试必须可分类、可恢复、可审计，stale worker / lock 不能导致双 worker。

## 问题陈述

WI-03/WI-05/WI-06 已经建立 Linear graph、PR delivery writeback 与并行锁语义。剩余风险集中在长期运行：Linear/GitHub/API transient failure、webhook 重复或乱序、worker crash、scheduler restart、native stop/cancel、heartbeat stale 与 lock 泄露。如果没有明确的 dedupe、retry taxonomy、stale recovery 和 stop/cancel state transition，scheduler 可能重复启动 worker、错误释放 downstream，或在 Linear UI 中留下不可恢复的 agent session。

## 验收标准

- [ ] Webhook signature verification 测试通过，且验证使用 raw body。
- [ ] AgentSessionEvent `created` / `prompted` / `stopped` / `delegated` 进入 dedupe + outbox，而不是直接 claim/launch worker。
- [ ] 重复 webhook 不会重复调度。
- [ ] Webhook 乱序时仍以 Linear 当前 snapshot / reconcile 结果为准。
- [ ] Retry policy 按 failure type 行为不同，并覆盖 retryable / conditionally retryable / non-retryable / control signal。
- [ ] Worker stale 后不会产生重复 active run。
- [ ] Stale lock release 需要 terminal run、confirmed dead worker 或 admin action；TTL 只触发检测，不自动释放。
- [ ] Native stop 会 cancel/kill worker 并写 terminal non-success；downstream 默认不解锁。

## 假设 / 约束 / 风险

- **假设**: WI-05 与 WI-06 已完成并合并，PR tracking、delivery gate、resource locks 与 worker pool 基础可被本 WI 复用。
- **假设**: 当前实现仍是本地 scheduler MVP；首版 worker runtime 继续固定为 OpenCode-only。
- **约束**: Webhook handler 必须快速 ack，只做 signature verification、dedupe persistence 与 enqueue；不得直接 claim WI 或启动 worker。
- **约束**: Webhook 不是唯一调度来源；periodic / manual reconcile 仍是 current-truth path。
- **约束**: Native stop / admin cancel 是 control signal，不自动 retry，也不默认 satisfy blockers。
- **约束**: 不绕过 GitHub branch protection、PR review 或 `git-worktree-pr` lifecycle。
- **风险**: body parser 改写 raw body 会导致签名校验失效，需要测试锁定 raw-body path。
- **风险**: 错误分类 non-retryable / control signal 会造成盲目 retry 或下游误解锁，需要硬编码 taxonomy 测试。
- **风险**: TTL 过期即释放 lock 会制造双 worker；必须结合 heartbeat、worker existence check、active-run 唯一约束与 admin audit。

## 范围

- `scheduler/` reliability implementation: webhook endpoint/handler, dedupe persistence, event routing, retry taxonomy, stale recovery, native stop/cancel recovery, safe lock release conditions.
- Tests under `tests/` or scheduler-local test suites covering signature verification, dedupe, retry classes, native stop, stale worker / lock behavior and duplicate trigger integration.
- Task-local Legion evidence under `.legion/tasks/linear-0xc-62-webhooks-retry-recovery/**`.

## 非目标

- 不把 webhook 作为唯一调度来源。
- 不自动解决产品 / contract 阻塞。
- 不自动 force-push 或绕过 PR review。
- 不实现完整 incident dashboard。
- 不引入 OpenClaw / Codex / custom runner adapter 抽象；runtime 仍为 OpenCode-only。
- 不改变 Linear issue 原始 contract 与 WI 分拆策略。

## 设计索引 (Design Index)

> **Upstream Design Source**: `docs/linear-legion-scheduler/rfc.md` and `docs/linear-legion-scheduler/work-items/WI-07-webhooks-retry-recovery.md`.

> **Task Design Source of Truth**: `.legion/tasks/linear-0xc-62-webhooks-retry-recovery/docs/rfc.md` (required because this WI is labeled `risk:high`).

**推荐方向**:

- Add a minimal HTTP webhook surface that preserves raw request bytes, verifies Linear signature before parsing, persists a deterministic dedupe record, and enqueues reconcile or native outbox work.
- Route all scheduling decisions through reconcile / DB-backed state transitions. Webhook events lower latency but do not own current truth.
- Model failure as explicit taxonomy with bounded retry policy and retry eligibility separate from run terminal state.
- Treat stale heartbeat as a recovery investigation: confirm worker/process/job liveness before retrying, releasing locks, or starting another attempt.
- Implement native stop/cancel as terminal non-success by default: record stop request, cancel active attempt, kill worker, emit final native response/error, keep downstream locked unless admin explicitly ignores/supersedes.

## 阶段概览

1. **Phase 1 - Contract / envelope**: Materialize this task, open `.worktrees/linear-0xc-62-webhooks-retry-recovery`, and keep Linear `0XC-62` lifecycle in sync.
2. **Phase 2 - Design gate**: Produce high-risk RFC and `review-rfc` PASS before implementation.
3. **Phase 3 - Implementation**: Add webhook, retry taxonomy/policy, stale recovery, native stop/cancel, and safe lock release changes inside the worktree.
4. **Phase 4 - Verification**: Run unit/integration/fault-injection coverage and record `docs/test-report.md`.
5. **Phase 5 - Delivery closure**: Run `review-change`, generate walkthrough / PR body, write wiki summary, commit, rebase, push, open/merge PR, update Linear, cleanup worktree, and refresh main workspace.

---

*创建于: 2026-06-25 | 最后更新: 2026-06-25*
