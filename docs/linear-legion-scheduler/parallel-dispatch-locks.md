# 并行 Dispatch 与 Resource Locks

> **WI**: [WI-06 并行 dispatch 与 resource locks](work-items/WI-06-parallel-dispatch-locks.md)<br>
> **状态**: WI-06 交付物<br>
> **运行时**: 独立 `scheduler/` npm project<br>
> **设计来源**: [RFC](rfc.md), [WI-05 PR delivery writeback](delivery-pr-writeback.md)

## 1. WI-06 交付内容

WI-06 在 scanner、SQLite store、OpenCode worker outbox 和 PR delivery tracker 之上增加了一个保守的 parallel dispatcher。当 ready WIs 之间不存在 scheduler resource lock 冲突，并且 global / project / repo capacity 允许时，它可以在一次 reconcile pass 中 claim 多个 ready WI。

交付源码：

| 路径 | 用途 |
|---|---|
| `scheduler/src/resource-locks.ts` | 解析 / 规范化 `repo:*`、`area:*`、`mutex:*`；支持 repo-scoped area locks；定义 conflict matrix |
| `scheduler/src/dispatcher.ts` | 纯 dispatch planning、公平候选排序、capacity enforcement、lock-wait / capacity-wait / blocker-wait 可见性和 claim execution |
| `scheduler/src/scanner.ts` | Ready candidates 现在包含 dispatch 所需 metadata；lock keys 使用 canonical parser；`parallelRepoKeys` 可以让某个 repo 退出默认 repo-wide mutual exclusion |
| `scheduler/src/sqlite-store.ts` | Held-lock inspection、stale-lock detection events、claim transaction 内的 conflict-matrix checks、可选 lock TTL metadata |
| `scheduler/src/cli.ts` | 增加 `dispatch fixture` debug command，用于本地 parallel claim runs，不启动 workers |
| `scheduler/tests/linear-dispatcher.test.ts` | 覆盖 parser、conflict matrix、fairness、parallel claim、capacity wait、restart recovery、terminal release 和 stale-lock hook |

## 2. Lock 语义

Scheduler 把 resource locks 视为调度约束的 machine truth，而不是 Linear label truth。

| 输入 | 行为 |
|---|---|
| `repo:<name>` | Repo-wide mutual exclusion。除非 repo 已列入 `parallelRepoKeys`，否则会根据 repo mapping 默认添加。 |
| `area:<name>` | 规范化为 `area:<repo>/<name>`，让相同 area name 可以在不同 repo 中独立运行。 |
| `mutex:<name>` | 跨所有 repos / projects 的 global mutex。 |

Claim transaction 现在通过 lock matrix 检查冲突，而不是只做精确 SQL key matching。这样可以捕获 `repo:legion-mind` 与 `area:legion-mind/scheduler` 冲突这类情况。

配置后，lock TTL 会存储在 `resource_locks.expires_at`。`listStaleHeldLocks()` 和 `stale_lock_detected` events 只是 inspection hooks；stale detection 不会释放 locks，也不会满足 downstream blockers。

## 3. Dispatcher 模型

`dispatchParallelWorkItems(store, { project, config })` 执行一次本地 reconcile / dispatch pass：

1. 使用给定 config 运行 `scanLinearProject()`。
2. 从 SQLite 检查 active runs 和 held locks。
3. 对超过 TTL 的 held locks 记录 stale-lock detection events。
4. 按 effective priority 排序 ready candidates：
   - Linear priority；
   - downstream unblock impact；
   - dependency depth；
   - age / starvation boost；
   - deterministic identifier tie-break。
5. 在配置限制下规划 `toClaim` 与 `waiting`：
   - `globalConcurrency`；
   - `perProjectConcurrency`；
   - `perRepoConcurrency`。
6. 只对计划 claim 的项调用 `SchedulerStore.claimReadyWorkItem()`。
7. 对 wait states 或 races 记录 `dispatch_waiting` / `dispatch_claim_skipped` events。

Capacity 会在 claim 前生效。等待 worker capacity 的 candidate 会保持 unclaimed，不持有 locks，也不会变成 `running`。

## 4. Waiting 可见性

Waiting records 是 dispatcher output 和 scheduler events 的一等对象：

| Reason | 详情 |
|---|---|
| `waiting_for_lock` | requested lock keys，以及 holder run ids / conflicting lock keys |
| `waiting_for_capacity` | scope（`global`, `project`, `repo`）、active count 和 configured limit |
| `waiting_for_blocker` | scanner dependency-blocked details |

每条 waiting record 都包含 native-agent-compatible preview，其中有 `waitingReason` 和 `activityMessage`。WI-06 不实现 production Linear adapter，但 payload 会刻意避免 `agent:running`；只有 claimed runs 才会创建 worker dispatch outbox rows。

## 5. Debug 命令

Fixture mode 会把 ready work claim 到本地 SQLite DB，并打印 dispatch report：

```bash
npm --prefix scheduler run debug -- dispatch fixture \
  --fixture tests/fixtures/project.json \
  --db .cache/linear-scheduler/dev.sqlite \
  --parallel-repos legion-mind \
  --global-concurrency 4 \
  --per-repo-concurrency 4
```

该命令不会启动 OpenCode workers。要消费单个 pending `worker_dispatch` outbox row，请使用现有 `worker dispatch` 命令。

## 6. 后续 WI 边界

- WI-07 负责 webhook ingestion、retry/backoff、active stale recovery 和 admin release flows。
- WI-08 负责 production-grade admin UX、metrics 和 security hardening。
- 未来 repo-specific parallelism 可以把 `parallelRepoKeys` 扩展为更丰富的 repo configuration，而不改变核心 lock parser 或 claim transaction boundary。
