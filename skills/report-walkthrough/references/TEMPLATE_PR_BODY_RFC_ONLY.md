# RFC Review（仅设计交付）

> 本 PR 仅包含设计产物（无生产代码变更）。  
> **Merge 视为设计批准**。如需修改，请在 PR 评论里直接留言 blocking。
> 本 PR body 只是 PR 创建/更新输入，不代表 checks/review/merge 或 PR lifecycle 已完成。

---

## 交付内容
- 产出 RFC（见证据链接）
- 明确 Goals / Non-goals / Constraints / Milestones
- 记录 Alternatives & Decision

## 背景与目的
- 大任务/高风险：先收敛设计与迁移/回滚策略，减少后续返工

## 评审重点
- [ ] 问题定义是否准确？验收标准是否可执行？
- [ ] Proposed Design 是否可实现、可测试、可回滚？
- [ ] Alternatives 是否充分？取舍是否合理？
- [ ] Migration/Rollout/Rollback 是否可执行？
- [ ] Milestones 是否拆得足够小且可验收？
- [ ] 你能接受的 Non-goals 是否明确？

## 下一步
- 合并后在同一 issue/PR 评论里写 `continue`，Agent 将进入实现阶段（按 Milestones 逐步交付）。
- PR merge 之后仍需按 Legion lifecycle 继续后续任务；本 PR 不代表实现已完成。

## 证据链接
- plan: `...`
- research: `...`
- rfc: `...`
- review-rfc: `...`
