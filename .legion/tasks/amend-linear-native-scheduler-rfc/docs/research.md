# Research：Linear Native Agent 能力核对

## 读者与用途

读者是后续实现 WI-01 / WI-04 / WI-05 / WI-07 / WI-08 的工程 owner。用途是说明本次 RFC amendment 为什么要把 Linear native agent 层正式建模，以及哪些 API 语义需要进入设计门。

## Context7 查询

- Library resolve: `/websites/linear_app_developers`，Source Reputation: High。
- Query 1: `Linear Agent Sessions Agent Activities Issue delegate stop signal OAuth actor app externalUrls Agent API webhooks`。
- Query 2: `Linear Agent Session create on issue delegate stop signal externalUrls app actor issue delegate assignable mentionable`。

## 已确认的 API / 产品语义

- Linear Agent Sessions 是 agent run 的用户可见 lifecycle。Session 会在 agent 被 mention 或 delegated issue 时自动创建。
- AgentSession 状态用于让用户看到 agent 是否在工作、等待输入、错误或完成；状态会随 Agent Activities 自动更新，不应由 scheduler 当成 machine truth。
- Agent Activities 可由 SDK `createAgentActivity` 或 GraphQL `agentActivityCreate` 创建，内容类型包括 `thought`、`action`、`elicitation`、`response`、`error`；`prompt` 是用户生成的 follow-up，不由 agent 创建。
- AgentSessionEvent webhook 需要在 OAuth application 中启用。Webhook receiver 需要在 5 秒内响应。
- 收到 AgentSession `created` event 后，应在 10 秒内发送 activity 或更新 external URL，否则 Linear UI 可能显示 agent unresponsive。
- `app:assignable` 允许 agent 成为 issue delegate；`app:mentionable` 允许 agent 被 editor mention。Linear 的 delegate 语义保留人类 assignee 的 primary ownership。

## 对设计的影响

1. Linear native layer 必须是 presentation/control plane，而不是 scheduler truth plane。
2. Session/activity/external URL 都应由 DB-backed outbox 驱动，不能散落在 webhook handler 或 runner 临时代码中。
3. 每个 scheduler run 需要幂等映射到一个 `linear_agent_session_id`，否则 reconcile/retry 可能创建重复 session。
4. Webhook handler 只能验签、去重、持久化、快速 ack、enqueue；实际 session activity 和 claim/dispatch 必须交给 outbox worker。
5. Stop/cancel 要作为控制信号进入 run state machine 和 worker launcher，而不是普通 comment / label。

## 不确定性

- Linear Agent API 仍带 preview 性质，最终字段名和 SDK 类型可能变化。RFC 应固定语义、数据边界和幂等要求；具体 SDK 调用和字段名在实现 WI 中用当前文档/SDK 测试锁定。
