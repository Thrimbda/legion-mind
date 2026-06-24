# Linear + Legion Scheduler 设计入口

本目录是 Linear + Legion 自动调度器的设计提案，不替代 LegionMind 当前 README / wiki 真源。当前设计要求 Linear Native Agent 层只做人类可见 presentation/control plane；Scheduler DB 仍是 claim、attempt、locks、evidence 和 downstream unlock 的 machine truth。

## 总体设计

- [RFC: Linear + Legion 自动调度器](rfc.md)
- [WI-01 交付: Linear WI contract and scheduling policy](linear-wi-contract-policy.md)

## Work Items

后续实现拆成 8 个 Work Items。它们按依赖顺序排列，既能分阶段交付，又避免把任务拆得过碎。

WI-01 已落成可执行 policy 文档；后续 scanner / runner / writeback WI 应以 [`linear-wi-contract-policy.md`](linear-wi-contract-policy.md) 作为 Linear 侧 contract 输入。

1. [WI-01 Linear WI contract and scheduling policy](work-items/WI-01-linear-wi-contract.md)
2. [WI-02 Scheduler core service and durable state](work-items/WI-02-scheduler-core-state.md)
3. [WI-03 Linear API integration and ready graph scanner](work-items/WI-03-linear-graph-scanner.md)
4. [WI-04 Legion task mapping and worker runner](work-items/WI-04-legion-worker-runner.md)
5. [WI-05 PR tracking and Linear delivery writeback](work-items/WI-05-delivery-pr-writeback.md)
6. [WI-06 Parallel dispatch and resource locks](work-items/WI-06-parallel-dispatch-locks.md)
7. [WI-07 Webhooks, retries, and stale recovery](work-items/WI-07-webhooks-retry-recovery.md)
8. [WI-08 Admin CLI, observability, and security hardening](work-items/WI-08-operations-security.md)

## 推荐执行顺序

```text
WI-01
  ↓
WI-02
  ↓
WI-03 ───────────────┐
  ↓                  │
WI-04 → WI-05 ───────┤
  ↓                  │
  └────────────────→ WI-06 → WI-07 → WI-08
```

WI-06 必须等待 WI-03、WI-04、WI-05：并行 dispatch 不能早于 graph scanner、worker runner 和 PR terminal / lifecycle gate。

## 最小闭环

完成 WI-01 到 WI-05 后，应具备最小可用闭环：

```text
Linear ready WI
  -> scheduler claim
  -> AgentSession / delegate / initial activity
  -> worker enters Legion workflow
  -> PR created / tracked
  -> run_terminal_success writeback
```

`Done` 只代表成功终态。`abandoned`、`canceled`、`closed-unmerged`、native stop 等属于 terminal non-success，默认不释放 downstream。

完成 WI-06 到 WI-08 后，系统才进入可长期运行的自动调度器形态：并行、可靠恢复、可观测、可运维、权限边界清晰。
