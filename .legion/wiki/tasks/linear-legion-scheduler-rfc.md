# linear-legion-scheduler-rfc

## Metadata

- `task-id`: `linear-legion-scheduler-rfc`
- `status`: `completed`
- `risk`: `high`
- `schema-version`: `2026-06-23`
- `historical`: `false`
- `supersedes`: `(none)`
- `superseded-by`: `(none)`

## Outcome Summary

- 本任务为 Linear + Legion 自动调度器产出总体 RFC 与 8 个后续实现 WI，不包含 scheduler 运行时代码。
- 当前有效结论：Linear 管 WI / 依赖 / 人机协作状态，Scheduler DB 管 run / lock / event / idempotency，Legion 管单 WI 执行协议，GitHub PR 管交付终态。
- `review-rfc` 第一轮 FAIL 后已修复 blocking gaps：blocker terminal gate、MVP `contract:stable` eligibility、scheduler-side Legion evidence verifier。第二轮 `review-rfc` PASS。
- 设计 PR merge 应视为设计批准；后续实现必须按 8 个 WI 分别重新进入 Legion workflow。

## Reusable Decisions

- 外部调度器不应直接让 agent 改代码；应启动 worker，并要求 worker 第一动作进入 `legion-workflow`。
- MVP implementation-ready 必须要求 `contract:stable`；brainstorm-only 若要自动化，必须是独立 run kind。
- Downstream unlock 不应只看 Linear Done 或 PR open；必须通过 scheduler 的 `isBlockerSatisfied()` terminal policy。
- Scheduler 必须有 Legion evidence verifier，拒绝“只有 PR URL、缺 Legion 证据”的结果。
- 后续实现 WI 为 8 个：contract policy、scheduler core state、Linear graph scanner、Legion runner、PR writeback、parallel locks、webhooks/retry/recovery、operations/security。

## Related Raw Sources

- `plan`: `.legion/tasks/linear-legion-scheduler-rfc/plan.md`
- `log`: `.legion/tasks/linear-legion-scheduler-rfc/log.md`
- `tasks`: `.legion/tasks/linear-legion-scheduler-rfc/tasks.md`
- `research`: `.legion/tasks/linear-legion-scheduler-rfc/docs/research.md`
- `rfc-entry`: `.legion/tasks/linear-legion-scheduler-rfc/docs/rfc.md`
- `review-rfc`: `.legion/tasks/linear-legion-scheduler-rfc/docs/review-rfc.md`
- `report`: `.legion/tasks/linear-legion-scheduler-rfc/docs/report-walkthrough.md`
- `proposal-rfc`: `docs/linear-legion-scheduler/rfc.md`
- `proposal-index`: `docs/linear-legion-scheduler/index.md`
- `work-items`: `docs/linear-legion-scheduler/work-items/`

## Notes

- `docs/linear-legion-scheduler/**` 是 scheduler proposal artifact，不改变 README / wiki / skills 的当前 LegionMind 真源边界。
- 设计中保留的实现期选择包括 Linear Agent Sessions API 是否首发接入、是否未来迁移 Temporal、以及 worker runtime 抽象的具体 backend。
