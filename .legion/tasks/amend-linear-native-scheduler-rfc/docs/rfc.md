# RFC Amendment：Linear Native Agent 与终态语义补强

## Summary

本 amendment 不推翻原 Linear + Legion scheduler 四层设计。它修复实现前必须收敛的两个风险：

1. Linear native agent 能力不能停留在 comments / labels / status 层，否则后续 delegation、session progress、stop/cancel 与权限变化无法可靠建模。
2. `Done` 语义必须只表示成功完成；`abandoned`、`canceled`、`closed-unmerged` 等只能是 terminal non-success，默认不能释放 downstream。

## Decision

### 1. Linear Native Agent 是 presentation/control plane

RFC 现在明确：`Issue.delegate`、AgentSession、AgentActivities、Agent Plan、externalUrls 和 stop signal 负责人类可见交互与控制，不负责机器真相。

机器真源仍然是 Scheduler DB：

- claim / active run
- run attempt
- resource locks
- idempotency / webhook dedupe
- terminal success / non-success
- Legion evidence gate
- downstream unlock

AgentSession state 可以辅助 UI，但不能直接驱动 `isBlockerSatisfied()`。

### 2. Terminal success 与 terminal non-success 分离

RFC 现在采用三层术语：

- `run_terminal_success`: Legion evidence PASS + PR merged + checks/review satisfied + `git-worktree-pr` cleanup/main refresh complete + final writeback。
- `run_terminal_non_success`: canceled、abandoned、duplicate、closed-unmerged、superseded、human rejected、terminal evidence failure。
- `blocker_satisfied`: 默认只有 `run_terminal_success` 能满足 implementation blocker；设计型 blocker 需要显式 policy；terminal non-success 只有 admin explicit ignore / supersede 才能释放 downstream。

这避免实现者把 “terminal” 误读为 “done”。

### 3. Native side effects 走 outbox

AgentSession create/find、delegate、activity、plan、externalUrls 和 final response/error 都通过 DB-backed `native_outbox` 幂等执行。

Webhook handler 只做：

```text
verify signature -> dedupe -> persist -> ack fast -> enqueue reconcile/native outbox
```

它不能直接 claim、启动 worker 或写散落的 UI side effects。

### 4. Claim 前必须 revalidate snapshot

Scanner 的 ready 结果只是候选。Claim 前必须重新校验 current issue / blockers / labels / contract / resource hints。若 snapshot 过期，拒绝 claim 并进入下一轮 reconcile。

### 5. 不新增 WI-09

Native 能力按职责切入现有 8 个 WI：

- WI-01: Linear model / labels / native object / terminal terminology。
- WI-02: DB fields、native outbox、snapshot revalidation、terminal state machine。
- WI-03: dry-run native action preview。
- WI-04: AgentSession startup、delegate、initial activity、stop signal。
- WI-05: PR state -> native writeback、terminal success/non-success。
- WI-06: lock/capacity waiting visibility。
- WI-07: AgentSessionEvent、stop、retry/recovery。
- WI-08: app actor scopes、PermissionChange、安全与观测。

## Alternatives Considered

### Keep comments/labels-only MVP

- 优点：实现更快。
- 缺点：不能自然表达 delegate、AgentSession progress、stop/cancel、Agent Plan 和 native unresponsive 语义。
- 结论：拒绝作为“native agent”目标；可作为 fallback / compatibility，但不是主协议。

### Make AgentSession the run truth

- 优点：UI 和状态看似统一。
- 缺点：无法可靠表达 DB claim、attempt、locks、PR terminal gate、evidence verifier 与 retry recovery。
- 结论：拒绝。AgentSession 只做 control plane。

### Add WI-09 Linear Native Agent

- 优点：把 native API scope 单独隔离。
- 缺点：会让 WI-01/WI-04/WI-05/WI-07/WI-08 在实现时继续缺关键 contract；依赖图反而更难执行。
- 结论：拒绝。切入现有 8 个 WI。

## Rollback

本任务只修改文档。若 review 认为 native agent MVP scope 过大，可回退为：

1. 保留 terminal success/non-success 拆分。
2. 将 AgentSession / Activities 标记为 Phase 2 enhancement。
3. 明确 MVP 名称降级为 “Linear queue + app writeback”，不要称为 native agent。

## Verification Plan

- 静态检查 RFC 中不再把 closed/abandoned 写入 Done gate。
- 检查 RFC 和 8 个 WI 都包含 native layer 或明确受其影响的边界。
- 运行 `review-rfc` 对 amendment 做对抗审查。
