# RFC 审查（仅设计交付）

> 本 PR 仅包含设计产物（无生产代码变更）。  
> **Merge 视为设计批准**。如需修改，请在 PR 评论里直接留言 blocking。
> 本 PR body 只是 PR 创建/更新输入，不代表 checks/review/merge 或 PR lifecycle 已完成。

---

## 人类注意力与当前动作
- 聚合注意力等级：`{{aggregatedAttention}}`
- 当前唯一人类动作：{{singleHumanAction}}
- 动作完成前的 lifecycle 边界：{{lifecycleBoundary}}
- 阶段摘要来源：{{attentionEvidence}}

> 本节只聚合 RFC 审查已有的 `会话注意力摘要`，不重新定义注意力等级或 lifecycle 规则。

## 未解决的认知状态

如果 RFC 或 RFC 审查已登记仍为 `INCONCLUSIVE`、`DEFERRED`、`RECOMMENDATION` 的关键 claim，必须在此内联 reviewer 理解设计风险所需的信息；如果没有，基于当前证据明确写“无”。

认知状态概览：{{claimStateSummary}}

| `claim-id` | 主张与状态 | 对设计批准/风险的影响 | 负责人及状态专属字段 | 当前缓解 | 直接证据 |
|---|---|---|---|---|---|
| `...` | ... | ... | ... | ... | `...` |

状态专属字段必须按已有证据内联：`DEFERRED` 写触发条件、届时方法与停止/回滚条件；`RECOMMENDATION` 写选项、推荐、价值取舍与决定状态；`INCONCLUSIVE` 写证据缺口和真实升级路径。

## 领域验证设计摘要

若设计阶段已经使用领域 verifier，内联其精确来源、实际方法、独立性及理由与残余不确定性。若尚未执行，明确写“设计已指定 verifier 路径，但本设计交付尚未执行领域验证”，不得伪造来源、独立性或结论。

| `claim-id` | Verifier 来源或预注册路径 | 所需方法 | 当前证据独立性 | 通俗结论与未证明范围 | 残余不确定性 | 原始证据或设计入口 |
|---|---|---|---|---|---|---|
| `...` | ... | ... | ... | ... | ... | `...` |

## 交付内容
- 产出 RFC（见证据链接）
- 明确目标 / 非目标 / 约束 / 里程碑
- 记录备选方案与决策

## 背景与目的
- 大任务/高风险：先收敛设计与迁移/回滚策略，减少后续返工

## 评审重点
- [ ] 问题定义是否准确？验收标准是否可执行？
- [ ] Proposed Design 是否可实现、可测试、可回滚？
- [ ] Alternatives 是否充分？取舍是否合理？
- [ ] Migration/Rollout/Rollback 是否可执行？
- [ ] Milestones 是否拆得足够小且可验收？
- [ ] 你能接受的 Non-goals 是否明确？
- [ ] 当前唯一人类动作与 lifecycle 边界是否和 RFC 审查摘要一致？
- [ ] 未解决认知状态与领域验证限制是否已经内联，而不是只给文件路径？

## 下一步
- 合并后在同一 issue/PR 评论里写 `continue`，Agent 将进入实现阶段（按 Milestones 逐步交付）。
- PR merge 之后仍需按 Legion lifecycle 继续后续任务；本 PR 不代表实现已完成。

## 证据链接
- plan: `...`
- research: `...`
- rfc: `...`
- review-rfc: `...`
