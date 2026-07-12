---
name: review-change
description: 当实现与验证证据已存在，需要只读审查判断就绪度、范围合规或安全阻塞时使用。
---

# review-change

统一只读审查 correctness、maintainability、scope、证据充分性，并在命中安全触发器时展开 security lens。完整结论写 `docs/review-change.md`；默认中文，技术原文保持不变。

## 硬门

- 必须先有实现与 `docs/test-report.md`，并读取 contract、设计、实际 diff 和被引用证据。
- 完整遵循 `../verify-change/references/REF_COGNITIVE_VERIFICATION.md` 与 `../legion-workflow/references/REF_HUMAN_ATTENTION.md`。
- 文档必须含独立 `## Verdict`，下一有效内容只能是 `PASS` 或 `FAIL`。
- 本阶段不修代码、不改变产品状态、不替 verifier 补造 provenance。
- blocker 必须给出定位、原因、影响和最小修复方向。

## 审查流程

1. 检查 diff 是否满足 contract、是否越 scope，以及 correctness、maintainability 阻塞。
2. 重查 claim 预注册字段与状态聚合，确认 verifier 未改写领域、方法、错误代价或阻塞策略。
3. 对 domain verifier 重新打开精确 locator 与实际资源清单，重算可重算 SHA-256/版本；核对执行记录、参数、结果、原始输出 locator 及其与方法步骤和 `claim-id` 的映射。
4. 确认 verifier 真实覆盖 `domain-id`、`required-capability`、`required-method`，记录独立性、反例、置信度、残余不确定性和失效条件。自述、角色名或多数意见无证明力；分歧保持 `INCONCLUSIVE`。
5. 对 authority 重查主体、资质来源、scope、有效期、locator 与完整性/真实性/签名；对 `DEFERRED` 检查触发、owner、方法与缓解；对 `RECOMMENDATION` 检查事实/偏好、选项、取舍与 decision owner。
6. 重新聚合 claim 状态、独立 `## Verdict` 与最高 attention，不继承 test report 的结论。

任何 verifier locator/版本摘要/实际读取清单/执行结果/原始输出 locator/claim 映射缺失或不一致，相关 claim 只能是 `INCONCLUSIVE`，退回 `verify-change` 补证据，不得由 reviewer 代填。

## 安全触发器

auth/permission/identity/session/token、信任或协议边界、secret/signing/crypto/webhook、用户输入进入特权路径、data exposure/privacy/tenant isolation。命中即展开安全视角；不要把一般风格问题伪装成安全问题。

## 输出与 handoff

文档至少包含 blocker、可选建议、scope 结论、验证充分性、verifier/authority/特殊 claim 重查、安全视角是否适用、精确 Verdict 和完整 `## 会话注意力摘要`。

完整摘要只落文件；handoff 使用五字段投影 `结果 / 变化 / 风险 / 下一步 / 证据`。变化与关键发现合计最多三条，证据最多三个 locator。投影冲突、证据缺失、风险无法无损收敛，或 `review/decide` 缺唯一人类动作和停止点时不得继续。

## 退出

- implementation blocker：`FAIL -> engineer`。
- provenance/验证不足：按策略聚合，退回 `verify-change` 或等待决定。
- 设计与实现根本不一致/分类错误：`spec-rfc -> review-rfc`。
- 需人类选项、接受风险、权限或外部权威：`decide` 并停止受影响路径。
- 非阻塞证据限制：至少 `review`，可准备材料但不得越过 merge 门。
- 审查通过：交回 `legion-workflow`。

## 引用

- 认知验证：`../verify-change/references/REF_COGNITIVE_VERIFICATION.md`
- attention：`../legion-workflow/references/REF_HUMAN_ATTENTION.md`
- 后续：`report-walkthrough`
