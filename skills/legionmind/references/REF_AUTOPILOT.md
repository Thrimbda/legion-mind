# LegionMind Autopilot 协议

> **目标**：让人类“只在 PR 上做最终决策”，而不是被频繁打断；同时保证正确性与可追溯性。

---

## 1. Autopilot 的默认假设（除非用户明确反对）

1) **默认继续前进**：信息不完整时先做合理假设并记录，不要立刻追问。  
2) **PR 即批准载体**：设计门禁不再强制阻塞对话，改为“先开 PR → 人类 review → merge 即批准”。  
3) **默认可回滚**：优先选择可回滚、局部、最小侵入的实现路径。  
4) **默认保守**：涉及安全/数据迁移/外部合约变更时自动升级为中/高风险，增加 RFC 与审查。

---

## 2. 什么时候必须追问（仅限阻塞级）

只在以下情况追问用户（否则不要问）：
- 不确定**验收标准**（不知道怎么算完成）
- 存在**不可逆风险**（数据丢失、密钥泄漏、付费/合规风险）
- 需要在多个互斥方案中做“产品决策”（如：是否改变对外行为/兼容性）

其余情况：
- 先选一个默认方案（写明理由与替代方案），并在 PR body 标注 **Assumptions**。

---

## 3. 默认的工程化决策（减少问答）

- 分支命名：`legion/<task-id>-<slug>`（slug 可用 2-4 个关键词）
- Commit：Conventional Commits（`fix:` / `feat:` / `refactor:` / `test:` / `docs:`）
- 验证：优先跑最快的单测/linters；无法确定命令时按 lockfile 探测（npm/pnpm/bun/go/pytest 等）
- 文档：所有产物写入 `.legion/tasks/<id>/docs/`，对话只贴路径 + 一句话摘要

---

## 4. Autopilot 的交付物清单（最小且足够）

每个任务结束前，至少产出：
- `docs/task-brief.md`
- `docs/pr-body.md`
- `docs/test-report.md`（若没跑测试，写清原因与替代验证方式）
- （中高风险）`docs/rfc.md` + `docs/review-rfc.md`

---

## 5. 与 Token 目标的关系

- 把长内容写文件（持久化），对话只给索引
- Subagent 回传必须是“最小 handoff 包”
- 避免重复阅读：优先读 `.legion/` 再读代码


---

## 6. RFC Heavy（大任务）在 Autopilot 中的默认行为

当任务被判断为 **Epic/High-risk**（或用户显式写 `rfc:heavy`）时：

- **默认先做设计产物**：生成 `task-brief + research + rfc + review-rfc + pr-body`
- **推荐开 Draft PR（仅 docs）**：用于设计审阅（Merge 视为设计批准）
- **不强制对话中批准**：避免打断；批准在 PR 上完成
- **继续实现的触发**：设计 PR merge 后，用户在 issue/PR 评论里写 `continue`（或 `implement`），Agent 进入实现阶段（按 Milestones 分步交付）

用户也可以强制只产出设计（不写代码）：
- `plan-only` / `rfc-only`

> 这样 Heavy 仍然符合“少打扰人类”的目标：人类只需要在 PR review/merge 一次性介入。
