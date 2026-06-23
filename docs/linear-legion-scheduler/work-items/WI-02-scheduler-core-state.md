# WI-02: Scheduler core service and durable state

## 目标

建立调度器服务骨架和持久化状态模型，让后续 Linear scanner、worker runner、PR tracker 和 retry recovery 都有统一的 run / attempt / lock / event 真源。

## 背景

Linear 适合做人类可见队列，但不适合保存机器运行细节。调度器必须有自己的 DB 来处理并发 claim、幂等、worker attempt、resource locks、webhook dedupe、stale run recovery 和审计日志。

## 范围

- TypeScript / Node.js scheduler service skeleton。
- 配置系统：Linear、GitHub、repo mapping、project mapping、concurrency。
- DB migration 基础设施。
- 表：`runs`、`run_attempts`、`work_item_snapshots`、`resource_locks`、`scheduler_events`、`webhook_events`。
- Run state machine。
- Transactional claim API。
- Transactional outbox for worker dispatch。
- Repo-local development / test setup。

## 非目标

- 不连接真实 Linear API。
- 不启动真实 agent worker。
- 不实现 PR tracking。
- 不实现 full admin CLI，只保留最小 debug command。

## 依赖

- WI-01。

## 设计要求

### Run states

```text
queued -> running -> in_review -> done
                      ├────────-> blocked
                      ├────────-> failed
                      └────────-> cancelled
```

State transition 必须集中校验，不允许任意 update。

### Claim transaction

Claim 必须在一个 transaction 中完成：

1. 检查 `linear_issue_id` 没有 active run。
2. 检查资源锁可用。
3. 创建 `runs`。
4. 创建第一条 `run_attempts`。
5. 写入 `resource_locks`。
6. 写入 `scheduler_events`。
7. 写入 DB-backed outbox job。
8. 返回 run id 给 dispatcher。

Worker launch 必须由 outbox 驱动，避免 claim transaction 成功后进程崩溃导致 worker 永远不启动，或 worker 已启动但 claim rollback。

### Event log

所有状态改变都写 `scheduler_events`，用于审计和恢复。事件 payload 应结构化，包含 `trace_id`、`run_id`、`linear_identifier`、`task_id`。

## 验收标准

- [ ] 本地能启动 scheduler service，并连接测试 DB。
- [ ] Migration 能创建所有核心表。
- [ ] Claim API 在并发调用下只会为同一个 Linear issue 创建一个 active run。
- [ ] Claim 成功后会产生 outbox job；outbox worker 可重试 dispatch，且不会重复启动同一 active run。
- [ ] Resource lock acquisition / release 有单元测试。
- [ ] Run state transition 有非法转换测试。
- [ ] Event log 能重建某个 run 的 timeline。

## 验证

- Unit tests：state machine、claim transaction、lock conflict。
- Integration tests：并发 claim 同一 issue，只成功一次。
- Manual：启动 service，执行一次 empty reconcile / debug run list。

## 风险

- **DB model 过度复杂**: 过早引入 workflow engine 会拖慢 MVP。缓解：先用 Postgres + job queue 抽象，保留未来迁移 Temporal 的接口。
- **幂等不足**: Linear webhook 和 timer 可能同时触发 claim。缓解：DB unique constraint + transaction 是硬要求。
- **日志泄密**: event payload 可能包含 issue private content。缓解：默认保存摘要，raw payload 另行 redaction。
