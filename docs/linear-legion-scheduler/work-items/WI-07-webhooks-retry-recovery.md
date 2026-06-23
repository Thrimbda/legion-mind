# WI-07: Webhooks, retries, and stale recovery

## 目标

增加 Linear webhook ingestion、retry policy、stale run recovery 和 failure taxonomy，让 scheduler 从“能跑”进入“能长期恢复”。

## 背景

仅靠定时 reconcile 会有延迟；仅靠 webhook 会丢事件和重复事件。长期运行还会遇到 worker crash、GitHub / Linear API transient failure、PR blocked、locks 泄露、scheduler restart。这个 WI 负责可靠性闭环。

## 范围

- Linear webhook HTTP endpoint。
- AgentSessionEvent webhook category：created / prompted / stopped / delegated / permission changes。
- Raw body signature verification。
- Webhook dedupe / event persistence。
- Event -> project reconcile trigger。
- Failure taxonomy implementation。
- Retry policy：backoff、retry limit、non-retryable 分类。
- Stale heartbeat detection。
- Stale run / attempt recovery。
- Native stop/cancel recovery。
- Safe lock release conditions。

## 非目标

- 不把 webhook 作为唯一调度来源。
- 不自动解决产品/contract 阻塞。
- 不自动 force-push 或绕过 PR review。
- 不实现完整 incident dashboard。

## 依赖

- WI-03。
- WI-05。
- WI-06。

## 设计要求

### Webhook handling

```text
receive webhook
  -> verify signature using raw body
  -> store dedupe record
  -> ack quickly
  -> enqueue reconcile(project) or native outbox action
```

Webhook handler 不直接 claim WI；它只触发 reconcile。

AgentSessionEvent `created` 也不直接启动 worker。Handler 必须快速 ack；outbox worker create/find mapping 后在短时间内 emit `thought` 或更新 `externalUrls`，避免 Linear UI 显示 agent unresponsive。

### Native stop handling

Stop signal 流程：

```text
AgentSession stopped event
  -> verify/dedupe/persist
  -> set runs.native_stop_requested_at
  -> attempt canceling
  -> kill/cancel worker
  -> cleanup policy
  -> terminal_non_success cancelled
  -> final AgentSession response/error
```

Stop/cancel 不表示 blocker satisfied。只有 admin explicit ignore / supersede 才能释放 downstream。

### Retry classes

- Retryable：Linear API 5xx、GitHub API transient、worker infra crash、network timeout。
- Conditionally retryable：verification failure、merge conflict、checks failure，如果 worker 能在 scope 内修复。
- Non-retryable：contract missing、needs-human、security blocked、dependency cycle、permission denied without new token。
- Control signal：native stop / admin cancel，不自动 retry，等待人类重新 delegate 或 admin retry。

### Recovery rule

Stale run recovery 必须先判断 worker 是否仍存活；不能因为 TTL 过期就释放 lock 并启动第二个 worker。

## 验收标准

- [ ] Webhook signature verification 测试通过。
- [ ] AgentSessionEvent created/prompted/stopped/delegated 进入 dedupe + outbox，而不是直接 claim/launch worker。
- [ ] 重复 webhook 不会重复调度。
- [ ] Webhook 乱序时仍以 Linear 当前 snapshot 为准。
- [ ] Retry policy 按 failure type 行为不同。
- [ ] Worker stale 后不会产生重复 active run。
- [ ] Stale lock release 需要 terminal run、confirmed dead worker 或 admin action。
- [ ] Native stop 会 cancel/kill worker 并写 terminal non-success；downstream 默认不解锁。

## 验证

- Unit tests：signature verification、dedupe key、failure taxonomy、native stop state transition。
- Integration tests：重复 webhook + periodic reconcile 同时触发，只 claim 一次。
- Fault injection：fake worker timeout / crash / malformed output。

## 风险

- **webhook 验签错误**: body parser 改写 raw body 会失败。缓解：endpoint 保留 raw body。
- **盲目 retry**: contract / security failure 被重复跑。缓解：non-retryable 分类硬编码测试。
- **双 worker**: stale 判断过激。缓解：heartbeat + process/job existence check + DB active unique constraint。
