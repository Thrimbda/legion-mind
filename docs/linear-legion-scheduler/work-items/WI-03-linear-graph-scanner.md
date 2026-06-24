# WI-03: Linear API integration and ready graph scanner

> **Status**: Delivered by [Linear graph scanner and skipped reason report](../linear-graph-scanner.md).

## 目标

实现 Linear API 集成、project snapshot 拉取、dependency graph 构建、cycle 检测、ready / skipped reason 计算，并提供 dry-run scanner。

## 背景

调度器的第一个可见价值是回答：“现在项目里哪些 WI 可以跑？哪些不能跑，为什么？” 这个 WI 不启动 worker，只把 Linear 项目转成可解释的 ready graph。

## 范围

- Linear API client，优先官方 GraphQL API / `@linear/sdk`。
- Project issue fetch：issue、state、labels、priority、assignee、relations、comments summary（按需）。
- Blocker relation normalization。
- Dependency graph builder。
- Cycle detection。
- Eligibility parser，使用 WI-01 policy。
- `isBlockerSatisfied()` terminal gate，不能只看 Linear Done。
- Ready candidate sorting。
- Skipped reason report。
- Native action preview：如果 claim，会 create/find 哪个 AgentSession、设置哪个 delegate、发哪些 initial activities / externalUrls。
- Dry-run CLI / service endpoint。

## 非目标

- 不 claim run。
- 不启动 worker。
- 不写回 Linear labels / comments，除非明确 dry-run report artifact。
- 不实现 webhook server。

## 依赖

- WI-01。
- WI-02。

## 设计要求

### Scanner output

Dry-run 输出至少包含：

```json
{
  "project": "...",
  "observedAt": "...",
  "ready": [
    {
      "identifier": "ENG-123",
      "priority": 2,
      "locks": ["repo:api", "area:billing"],
      "snapshotHash": "...",
      "linearUpdatedAt": "...",
      "nativePreview": {
        "delegate": "linear-agent-app-user",
        "agentSession": "create_or_find",
        "initialActivity": "thought: checking ready conditions",
        "externalUrls": ["scheduler_run"]
      }
    }
  ],
  "skipped": [
    { "identifier": "ENG-124", "reason": "blocked_by", "details": ["ENG-120"] }
  ],
  "cycles": []
}
```

### Skipped reasons

必须覆盖：

- missing `agent:ready`;
- missing `contract:stable`;
- unresolved blocker;
- cycle;
- `agent:needs-human`;
- missing repo mapping;
- active run exists;
- resource conflict;
- project paused。
- stale snapshot after revalidation。

## 验收标准

- [x] 能拉取指定 Linear project 的 issue snapshot。
- [x] 能从 blocker relations 构建 DAG。
- [x] 能检测 dependency cycle，并给出 cycle path。
- [x] 能按 scheduler terminal policy 判断 blocker 是否满足，覆盖 manual done 与 scheduler-run terminal success / non-success。
- [x] 能输出 ready list 和 skipped reason report。
- [x] Dry-run ready output 包含 snapshot hash / Linear updatedAt，以及 native action preview。
- [x] Scanner 不会修改 Linear。
- [x] Scanner 写入 `work_item_snapshots`，供后续 diff / debug。

## 验证

- Unit tests：graph builder、cycle detection、skip reason、`isBlockerSatisfied()`。
- Integration tests：mock Linear API snapshot -> expected ready/skipped output。
- Manual dry-run：对一个测试 project 输出 report，人工核对 3-5 个 issue。

## 风险

- **Linear API pagination / rate limit**: 大项目可能分页多。缓解：分页封装、rate limit backoff、snapshot hash。
- **relation 语义误读**: blocked-by 方向必须明确。缓解：测试用例覆盖 blocker -> blocked 方向。
- **skipped reason 不透明**: 如果只输出 ready list，人无法修复队列。缓解：skipped reason 是验收项。
