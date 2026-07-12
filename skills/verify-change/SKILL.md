---
name: verify-change
description: 当实现已经存在，需要选择、执行并记录可信验证证据且不应继续大规模实现时使用。
---

# verify-change

验证实现、路由关键 claim、聚合证据并写入 `docs/test-report.md`。不得用模型自信、Agent 共识或“已加载专家”填补专业证据。默认中文；命令、输出、路径和机器字段保持原样。

## 硬门

- 必须先有可验证改动，并读取 `plan.md`、设计真源、实际 diff/handoff。
- 完整遵循 `references/REF_COGNITIVE_VERIFICATION.md` 和 `../legion-workflow/references/REF_HUMAN_ATTENTION.md`。
- 关键 claim 缺预注册字段：影响 contract 时退回 `brainstorm`，否则退回 `spec-rfc -> review-rfc`。
- 只允许很小的测试/命令修正；主要实现缺口退回 `engineer`。

## 流程

1. 从验收、风险、设计和 diff 提取真正影响判断的 claim；低风险 routine claim 可生成合理默认值。
2. 核对三轴、领域、能力、方法、证据、`criticality`、`risk-if-wrong`、`blocking-policy`、owner；不得临场降级。
3. routine claim 选择成本最低且证明力足够的直接检查，并主动覆盖反例或失败路径。
4. domain/authority claim 按认知验证协议发现候选；必须同时匹配 `domain-id`、`required-capability`、`required-method`，完整读取必要资源、执行规定方法并留下可重查 provenance。缺失、不匹配、未真实执行或 authority 校验失败只能是 `INCONCLUSIVE`。
5. 按专门协议处理 `DEFERRED` 与 `RECOMMENDATION`；作者总结仅是待验证输入。
6. 逐 claim 记录状态、证据映射、独立性、置信度、残余不确定性和失效条件；再独立聚合阶段 Verdict 与最高 attention。

## 必需证据

`docs/test-report.md` 至少包含：

- 验证范围与方法选择理由；claim 预注册字段、状态、验收/风险映射。
- 命令/工具、关键参数、exit code 或结果标识、repo 内原始输出 locator。
- domain verifier 的匹配、实际读取资源、方法、provenance；不适用时写“不适用”。
- authority 正负校验；`DEFERRED/RECOMMENDATION`；失败、跳过、残余不确定性与失效条件。
- 独立 `## Verdict`，下一有效内容只能是 `PASS` 或 `FAIL`。
- 完整 `## 会话注意力摘要`。

报告结构、五种 claim 状态、三轴、provenance、authority、延后和判断性规则只以认知验证 reference 为准。敏感信息须处理后再持久化。

## Handoff

完整摘要留在证据文件；subagent 只回传五字段投影：`结果 / 变化 / 风险 / 下一步 / 证据`。变化与关键发现合计最多三条，证据最多三个 locator；不复制 contract、长日志或完整报告。投影冲突、风险无法无损收敛、证据缺失，或 `review/decide` 缺唯一人类动作和停止点时不得进入下一阶段。

## 退出

- 实现缺口：Verdict `FAIL`，退回 `engineer`。
- contract/设计/分类缺口：退回对应上游门。
- verifier、authority、权限或运行条件不足：记录 `INCONCLUSIVE`，按预注册策略升级，不伪造结论。
- 关键判断待 owner：`RECOMMENDATION`，按协议停止或继续。
- 证据完成：交给只读 `review-change`。

## 引用

- 认知验证：`references/REF_COGNITIVE_VERIFICATION.md`
- attention：`../legion-workflow/references/REF_HUMAN_ATTENTION.md`
