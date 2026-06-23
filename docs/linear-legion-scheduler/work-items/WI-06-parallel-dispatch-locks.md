# WI-06: Parallel dispatch and resource locks

## 目标

在单 WI happy path 稳定后，实现多个 non-conflicting WI 的并行调度，同时通过 resource locks 防止工程冲突。

## 背景

Linear blockers 只表达业务依赖，不表达工程冲突。两个 WI 即使都 ready，也可能同时修改同一 repo、同一 API schema、同一数据库 migration 或同一配置文件。并行调度必须同时看 DAG ready 和 resource locks。

## 范围

- Resource lock key parser：`repo:*`、`area:*`、`mutex:*`。
- Lock acquisition / release policy。
- Global concurrency limit。
- Per-project / per-repo concurrency limit。
- Candidate priority sorting。
- Fair scheduling，避免低优先级永远饥饿。
- Worker pool / dispatcher loop。
- Stale lock detection hooks。

## 非目标

- 不实现复杂自动 merge conflict prediction。
- 不做跨组织全局资源调度。
- 不让两个 worker 共享同一个 worktree。
- 不实现 webhook ingestion。

## 依赖

- WI-02。
- WI-03。
- WI-04。

## 设计要求

### Lock semantics

- `repo:<name>` 默认互斥，除非 repo config 显式允许并行。
- `area:<name>` 在同一 repo 内互斥。
- `mutex:<name>` 全局互斥，例如 `mutex:db-migration`。
- Lock TTL 只用于 stale detection，不表示正常过期自动释放；释放需要 run terminal 或 admin action。

### Scheduling order

Candidate sort should combine：

1. Linear priority。
2. Dependency depth / unblock impact。
3. Age。
4. Fairness / starvation prevention。

### Backpressure

如果 worker pool 满，candidate 保持 ready，不应提前写 `agent:running`。可写 `agent:queued`，但必须能取消或过期。

## 验收标准

- [ ] N 个 non-conflicting WI 可并行启动，不超过配置并发。
- [ ] 冲突 WI 不会同时持有同一 lock。
- [ ] Run terminal 后释放 locks，并触发下一轮 reconcile。
- [ ] Scheduler restart 后能恢复 held locks 与 active runs。
- [ ] Admin report 能说明某个 WI 因哪个 lock 等待。

## 验证

- Unit tests：lock parser、conflict matrix、priority sort。
- Integration tests：10 个 fixture WI，其中 4 个冲突，验证最大并发和 lock release。
- Restart test：active locks persisted，scheduler 不重复启动。

## 风险

- **并发过度保守**: `repo:*` 全互斥会降低吞吐。缓解：先保守，后续按 repo config 放开。
- **锁泄露**: worker crash 后 lock 不释放。缓解：heartbeat + stale recovery + admin release。
- **饥饿**: 高优先级不断进入导致低优先级不跑。缓解：age boosting。
