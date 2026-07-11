# 实现交付审查

> 本 PR body 只是 PR 创建/更新输入，不代表 checks/review/merge、auto-merge、worktree cleanup 或主工作区 refresh 已完成。

---

## 人类注意力与当前动作
- 聚合注意力等级：`{{aggregatedAttention}}`
- 当前唯一人类动作：{{singleHumanAction}}
- 动作完成前的 lifecycle 边界：{{lifecycleBoundary}}
- 阶段摘要来源：{{attentionEvidence}}

> 本节只聚合各阶段已有的 `会话注意力摘要`，不重新定义注意力等级或 lifecycle 规则。

## 交付摘要
- ...

## 未解决的认知状态

下表必须内联所有仍为 `INCONCLUSIVE`、`DEFERRED`、`RECOMMENDATION` 的关键 claim；如果没有，基于当前 claim 状态表明确写“无”，不能只写“详见报告”。

认知状态概览：{{claimStateSummary}}

| `claim-id` | 主张与状态 | 对验收/风险的影响 | 负责人及状态专属字段 | 当前缓解 | 直接证据 |
|---|---|---|---|---|---|
| `...` | ... | ... | ... | ... | `...` |

状态专属字段必须按已有证据内联：`DEFERRED` 写触发条件、届时方法与停止/回滚条件；`RECOMMENDATION` 写选项、推荐、价值取舍与决定状态；`INCONCLUSIVE` 写证据缺口和真实升级路径。

## 领域验证摘要

仅转录 `verify-change` 已产出并经 `review-change` 审查的结果，不在 PR body 中重新验证。

| `claim-id` | Verifier 精确来源 | 实际方法 | 独立性及理由 | 置信度 | 通俗结论与未证明范围 | 残余不确定性与失效条件 | 原始证据 |
|---|---|---|---|---|---|---|---|
| `...` | ... | ... | ... | ... | ... | ... | `...` |

## 范围
**范围内**
- ...

**范围外**
- ...

## 主要改动
- ...

## 验证与审查
- 验证: `docs/test-report.md`
- 变更审查: `docs/review-change.md`
- 设计一致性（如适用）: `docs/rfc.md` / `docs/review-rfc.md`

## 风险与限制
- ...

## 评审重点
- [ ] 变更是否符合 task contract 与 scope？
- [ ] 验证证据是否足以支撑交付结论？
- [ ] 若存在 RFC，实现在关键边界上是否与已审查设计一致？
- [ ] 风险、限制与 non-goals 是否已经清楚暴露？
- [ ] 当前唯一人类动作与 lifecycle 边界是否和阶段摘要一致？
- [ ] 未解决认知状态是否已内联其影响、负责人、缓解与直接证据？
- [ ] 领域 verifier 的来源、独立性与残余不确定性是否足以让 reviewer 不打开原始文件也能理解证据边界？

## 证据链接
- plan: `...`
- rfc（如适用）: `...`
- review-rfc（如适用）: `...`
- test-report: `...`
- review-change: `...`
- report-walkthrough: `...`
