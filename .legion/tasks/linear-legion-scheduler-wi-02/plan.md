# Linear Scheduler WI-02: SQLite-backed Scheduler Core and Durable State

## 目标

完成 `docs/linear-legion-scheduler/work-items/WI-02-scheduler-core-state.md` 的首个运行时实现层：建立 TypeScript / Node.js scheduler core skeleton，并用 SQLite 作为本地 durable state，提供 run / attempt / snapshot / lock / event / webhook / native outbox 的迁移、状态机、claim transaction 与最小 debug service。

## 问题陈述

Linear 可以承载人类可见的 WI 队列，但不能保存调度器机器真相。WI-03 scanner、WI-04 worker runner、WI-05 PR tracker 与后续 retry / webhook 都需要同一套可恢复的 DB truth：同一 Linear issue 不能被并发重复 claim，资源锁必须可审计，claim 前必须重新校验 snapshot，worker / native side effects 必须通过 outbox 避免事务成功后进程崩溃造成丢任务或重复启动。

本任务把已通过 review-rfc 的逻辑模型落成 repo-local SQLite prototype。SQLite 是用户明确约束，用于降低本地开发和测试门槛；实现必须保留清晰的 repository / transaction 边界，避免把 SQLite 细节泄露到后续 scanner / runner 协议中。

## 验收标准

- [ ] 本地能启动 scheduler debug service，并连接 SQLite 测试 DB 或 `:memory:` DB。
- [ ] Migration 能创建 `runs`、`run_attempts`、`work_item_snapshots`、`resource_locks`、`scheduler_events`、`webhook_events`、`native_outbox` 七类核心表及关键约束 / indexes。
- [ ] Run state transition 集中校验，覆盖合法转换与非法转换测试。
- [ ] Claim API 在并发或重复调用下只会为同一个 Linear issue 创建一个 active run，并返回可解释的 conflict / stale result。
- [ ] Claim 前会 revalidate snapshot；issue updatedAt、snapshot hash、labels、contract、blocker 或 resource hint 变化时拒绝旧 ready 结果并写 `stale_snapshot` 事件。
- [ ] Claim 成功后会创建第一条 attempt、持有 resource locks，并写入 native outbox 与 worker dispatch outbox；重复 outbox dispatch 不会重复创建 active run。
- [ ] AgentSession create/find、delegate、activity、external URL、stop/final response 用 `native_outbox` 幂等键建模。
- [ ] Resource lock acquisition / release 有单元测试。
- [ ] Non-success terminal states 不会释放 downstream；admin override 只能通过 audit event 表达。
- [ ] Event log 能重建某个 run 的 timeline。
- [ ] 更新 WI-02 文档 / index 链接到交付物，并留下 test-report、review、walkthrough、wiki 与 PR lifecycle 证据。

## 范围

- 新增 scheduler core runtime source / tests，优先放在 `scripts/lib/linear-scheduler/` 与 `tests/regression/`。
- 新增 repo-local debug entrypoint / npm script，支持 migration、empty service start / health check、run list 或 inspect 级别的最小调试。
- 新增 reviewer-facing WI-02 交付文档，说明 SQLite schema、state machine、claim / outbox 边界。
- 更新 `docs/linear-legion-scheduler/index.md` 与 WI-02 work item 状态 / 链接。
- 维护 `.legion/tasks/linear-legion-scheduler-wi-02/**` 阶段证据与 `.legion/wiki/**` writeback。

## 非目标

- 不连接真实 Linear API；本任务只接受测试 fixture / snapshot DTO。
- 不启动真实 OpenCode agent worker；worker dispatch 只落入 outbox。
- 不实现 PR tracking、GitHub checks / review / merge gate。
- 不实现 webhook HTTP server；只建 `webhook_events` 表与后续 WI 可复用的 dedupe shape。
- 不实现 full admin CLI；只保留最小 debug command / service skeleton。
- 不改变 `legion-workflow`、`git-worktree-pr` 或 WI-01 已完成的 Linear issue contract policy。
- 不把 SQLite 作为永久生产架构承诺；本任务只要求本地 durable state 和可迁移边界。

## 假设 / 约束 / 风险

- **假设**: `linear-legion-scheduler-rfc` 已通过 `review-rfc`，WI-01 已交付 Linear WI contract policy；本任务属于 approved-design continuation mode。
- **约束**: 用户明确要求 DB 使用 SQLite；不得引入 Postgres / Temporal / 外部队列作为本 WI 的运行依赖。
- **约束**: Scheduler DB 是 claim、attempt、locks、terminal gate、evidence 的 machine truth；Linear native agent 对象只做 presentation / control plane。
- **约束**: 修改型开发必须在 `.worktrees/linear-legion-scheduler-wi-02/` 内完成，并通过 PR lifecycle 收口。
- **风险**: SQLite 写并发有限，可能掩盖未来生产 DB 的并发差异。缓解：集中 transaction API、使用 unique partial indexes / busy timeout / WAL，并在文档中标明本地 prototype 边界。
- **风险**: 过早实现完整 scheduler 会扩大 scope。缓解：只实现 core state、claim、outbox、debug skeleton，真实 Linear / worker / PR 留给后续 WI。
- **风险**: Event payload 或 snapshots 泄露 Linear 私有内容。缓解：测试和文档使用摘要 / sanitized JSON，raw payload 只建 URI 字段。

## 设计摘要

- 采用 Node.js `node:sqlite` / `DatabaseSync` 作为零外部服务 SQLite runtime，schema 以 `STRICT` tables、foreign keys、JSON text payload 和 partial unique indexes 表达 machine truth。
- Core 边界拆成 migration、repository、state machine、claim service、outbox service、debug service；后续 WI 通过 DTO / repository API 接入，不直接拼 SQL。
- Claim transaction 的核心顺序为：读取并重校验 snapshot、检查 active run、获取 locks、创建 run / attempt、写 scheduler event、写 native outbox 与 worker dispatch outbox。
- Run terminal 语义区分 `done` 与 `cancelled` / `abandoned` / `failed` 等 non-success；downstream unlock 的真实 predicate 留给后续 graph scanner，但本任务保证 non-success 不被表示为 blocker satisfied。
- Debug service 提供可在本地启动的 SQLite-backed skeleton，用于 migration health、event timeline 和 run list，不承担生产 admin CLI 的完整职责。

## 阶段拆分

1. **Contract / Envelope**: 进入 Legion workflow，收敛 WI-02 task contract，创建 `git-worktree-pr` worktree。
2. **Engineer**: 实现 SQLite migration、state machine、claim transaction、locks、native / worker outbox、debug service，并更新 WI-02 docs。
3. **Verify**: 运行 targeted unit / integration tests、debug service smoke、regression tests，并记录 test-report。
4. **Review**: 执行 `review-change`，检查 scope、并发/幂等、SQLite 边界、安全与文档一致性。
5. **Close**: 生成 walkthrough / PR body，执行 `legion-wiki` writeback，commit / rebase / push / PR / checks / cleanup / main refresh。

## 设计来源

- `docs/linear-legion-scheduler/rfc.md`
- `docs/linear-legion-scheduler/linear-wi-contract-policy.md`
- `docs/linear-legion-scheduler/work-items/WI-02-scheduler-core-state.md`
- `.legion/tasks/linear-legion-scheduler-rfc/docs/review-rfc.md`（PASS）
- `.legion/tasks/linear-legion-scheduler-wi-01/docs/report-walkthrough.md`

---
*Created: 2026-06-24*
