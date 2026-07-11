# human-attention-verification-routing

## Metadata

- `task-id`: `human-attention-verification-routing`
- `status`: `completed`
- `risk`: `medium`
- `schema-version`: `2026-07-11`
- `historical`: `false`
- `supersedes`: `(none)`
- `superseded-by`: `(none)`

## Outcome Summary

- Legion 的 RFC 审查、变更验证与实现审查现在会产出低噪音的会话注意力摘要，由 orchestrator 在继续阶段链或回滚前投影给人类。
- 注意力使用 `none | skim | review | decide` 分级，并限制最多三个关键发现；`review` 与 `decide` 分别形成合并门和阶段转换门，避免重要审计意见只在 agent 之间流转。
- 每个验证声明按结论性质、验证时机与所需专长三轴分类，再用 `PASS | FAIL | INCONCLUSIVE | DEFERRED | RECOMMENDATION` 表达声明状态；阶段级 `Verdict: PASS | FAIL` 继续作为独立机器门。
- 领域 verifier 或权威核验只有在真实加载能力并保留可复查 provenance 时才可支持结论；缺少能力、权限或可信证据时必须降级为 `INCONCLUSIVE`，不能伪装成专家验证。

## Reusable Decisions

- 人类注意力交接应从 reviewer / verifier 的原始结果中提炼最少必要信息，并在阶段切换前进入会话，而不是只留下文件路径。
- 声明级认知状态与阶段级调度判定必须分离；五状态用于表达知识边界，二值 `Verdict` 用于维持阶段链的确定性。
- 领域或权威验证必须记录可复查的加载来源、输入、执行与声明映射；仅声明“已调用专家”不构成验证证据。

## Related Raw Sources

- `plan`: `.legion/tasks/human-attention-verification-routing/plan.md`
- `log`: `.legion/tasks/human-attention-verification-routing/log.md`
- `tasks`: `.legion/tasks/human-attention-verification-routing/tasks.md`
- `rfc`: `.legion/tasks/human-attention-verification-routing/docs/rfc.md`
- `reviews`: `.legion/tasks/human-attention-verification-routing/docs/review-rfc.md`、`.legion/tasks/human-attention-verification-routing/docs/review-change.md`
- `verification`: `.legion/tasks/human-attention-verification-routing/docs/test-report.md`
- `report`: `.legion/tasks/human-attention-verification-routing/docs/report-walkthrough.md`、`.legion/tasks/human-attention-verification-routing/docs/report-walkthrough.html`

## Notes

- 本页只保留当前可查询结论；字段约束与阶段行为的真源仍在 `skills/**`，逐轮证据回到本任务 raw docs。
- 真实外部领域 verifier、权威 adapter、生产注意力指标与 `DEFERRED` 自动唤醒仍是非阻塞后续，不属于本次协议交付。
