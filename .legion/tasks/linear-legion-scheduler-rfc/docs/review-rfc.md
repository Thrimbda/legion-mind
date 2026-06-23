# Review RFC: Linear + Legion 自动调度器

> **Task**: `linear-legion-scheduler-rfc`  
> **Review target**: `docs/linear-legion-scheduler/rfc.md` + `docs/linear-legion-scheduler/work-items/*.md`  
> **Created**: 2026-06-23

---

## Iteration 1 — FAIL

### Verdict

FAIL

### Blocking findings

1. **Ready dependency “terminal done” 没有确定真源算法，可能错误解锁 downstream。**
   - 影响文件：`docs/linear-legion-scheduler/rfc.md` §8.2、§6.3、§10.2；`WI-03-linear-graph-scanner.md`。
   - 原因：RFC 只说 blocker “terminal done” 后可 ready，但没有定义 Linear Done、Scheduler DB run、GitHub PR merge 与人工完成之间的优先级。实现者无法验证 downstream unlock 是否正确。

2. **Contract eligibility 存在互相冲突的规则。**
   - 影响文件：`docs/linear-legion-scheduler/rfc.md` §8.1、§19；`WI-01-linear-wi-contract.md`。
   - 原因：RFC 允许 `contract:stable OR project config allows brainstorm-first`，但 WI-01 与 open question 又要求 MVP 必须 `contract:stable`。若保留 brainstorm-first，需要独立 run kind、状态、锁、完成/回滚语义。

3. **Legion 嵌入主要依赖 prompt，缺少 scheduler-side 可验证 gate。**
   - 影响文件：`docs/linear-legion-scheduler/rfc.md` §9.2、§9.3、§10.2；`WI-04`、`WI-05`。
   - 原因：RFC 要求 worker 进入 `legion-workflow`，但没有定义 scheduler 如何验证 stage chain complete。若 worker 只返回 PR URL，系统可能在 PR merged 后错误标记 Done。

### Applied edits

- 在 RFC §8.1 统一 MVP implementation-ready 必须 `contract:stable`，把 brainstorm-only 限定为未来独立 run kind。
- 在 RFC §8.2.1 新增 `isBlockerSatisfied()` terminal policy，定义 scheduler-run、manual done、design-only、closed-unmerged / abandoned PR 的 downstream unlock 规则。
- 在 RFC §8.4 新增 transactional outbox，避免 claim 成功但 worker enqueue 丢失。
- 在 RFC §9.4 新增 scheduler-side Legion evidence verifier，明确缺 evidence 时 `legion_evidence_missing` 且不得 Done / unlock downstream。
- 在 RFC §10.2 / §11 / §17 增加 evidence verifier gate、failure taxonomy 和 negative tests。
- 更新 WI-01、WI-03、WI-04、WI-05，使实现任务覆盖 blocker terminal gate 与 evidence verifier。

---

## Iteration 2 — PASS

### Verdict

PASS

### Blocking findings

None.

### Non-blocking suggestions addressed

- RFC §10.1 的 PR state 表补充：`merged` 只是 Done 候选，必须经过 §10.2 done gate / evidence verifier 才能释放 locks 和触发 downstream reconcile。
- RFC §7 的 `runs` 表补充 `run_kind`、`delivery_gate_status`、`evidence_status`，便于持久化 `isBlockerSatisfied()` 和 evidence verifier 状态。
- WI-02 补充 transactional outbox，避免 claim 成功但 worker enqueue 丢失。
