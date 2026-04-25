# LegionMind 自动推进协议

> **目标**：让人类“只在 PR 上做最终决策”，而不是被频繁打断；同时保证正确性与可追溯性。
>
> 自动推进只减少非阻塞的人类打扰；不减少入口门、阶段顺序、设计门禁、验证证据、报告或 wiki writeback。
> 对修改型开发任务，自动推进也不豁免 `git-worktree-pr` envelope；速度表达不允许跳过 worktree、push 前 rebase、PR auto-merge 尝试、checks/review、cleanup 或主工作区刷新。

---

## 1. 自动推进的默认假设（除非用户明确反对）

1) **默认继续前进**：信息不完整时先做合理假设并记录，不要立刻追问。  
2) **PR 即批准载体**：设计门禁不再强制阻塞对话，改为“先开 PR → 人类评审 → 合并即批准”；PR 创建不是完成。
3) **默认可回滚**：优先选择可回滚、局部、最小侵入的实现路径。  
4) **默认保守**：涉及安全/数据迁移/外部合约变更时自动升级为中/高风险，增加 RFC 与审查。

---

## 2. 什么时候必须追问（仅限阻塞级）

只在以下情况追问用户（否则不要问）：
- 不确定**验收标准**（不知道怎么算完成）
- 存在**不可逆风险**（数据丢失、密钥泄漏、付费/合规风险）
- 需要在多个互斥方案中做“产品决策”（如：是否改变对外行为/兼容性）

其余情况：
- 先选一个默认方案（写明理由与替代方案），并在 PR 说明中标注 **Assumptions**。

---

## 3. 默认的工程化决策（减少问答）

- 分支命名：`legion/<task-id>-<slug>`（slug 可用 2-4 个关键词）
- worktree 路径：`.worktrees/<task-id>/`；默认 base ref：`origin/master`，除非仓库或用户规则覆盖
- push 前：必须在 worktree 内执行 `git fetch origin && git rebase origin/master`
- 提交信息：Conventional Commits（`fix:` / `feat:` / `refactor:` / `test:` / `docs:`）
- 验证：优先跑最快的单测/静态检查；无法确定命令时按 lockfile 探测（npm/pnpm/bun/go/pytest 等）
- 文档：所有产物写入 `.legion/tasks/<id>/docs/`，对话只贴路径 + 一句话摘要

---

## 4. 自动推进的交付物清单（最小且足够）

每个任务结束前，至少产出：
- `.legion/tasks/<task-id>/plan.md`
- `.legion/tasks/<task-id>/docs/pr-body.md`
- `.legion/tasks/<task-id>/docs/test-report.md`（若没跑测试，写清原因与替代验证方式）
- （中高风险）`.legion/tasks/<task-id>/docs/rfc.md` + `.legion/tasks/<task-id>/docs/review-rfc.md`
- 固定 closing writeback：`legion-wiki`
- PR lifecycle 记录：PR state、checks state、review state、cleanup state、main workspace refresh state

---

## 4.5 子代理派生是强制流程，不是提示语

- orchestrator 必须按阶段派生子代理；不要把设计、实现、验证、评审、报告全部内化为单智能体行为。
- 具体派生顺序、触发条件、输出路径只认 `SUBAGENT_DISPATCH_MATRIX.md`。
- 运行时入口包装层只能映射模式（如默认实现模式 / 已批准设计后的续跑模式 / 重型仅设计模式），不能再定义另一套派生真源。
- `git-worktree-pr` 是修改型开发任务的 lifecycle envelope，包裹既有模式，不是第四种模式。
- 新任务主干固定为：`brainstorm` 收敛 → `task create`；CLI 不再提供 proposal/approval、switch/archive、ledger query 这类旧状态模型命令。
- “autopilot / don’t ask me” 不等于跳过 `legion-workflow` 入口判断、`git-worktree-pr` envelope、contract 稳定性检查、design-lite/RFC、verification、review、report 或 `legion-wiki`；它只表示在非阻塞处继续推进并记录假设。

---

## 4.6 PR 跟进是自动推进的一部分

- PR 创建后必须立即尝试启用 auto-merge；若仓库策略、权限或平台状态暂时不允许，记录阻塞原因并持续跟进，直到启用或确认无法启用。
- 开 PR 后继续跟进 checks、review comments、merge/close/confirmed abandoned 终态、worktree cleanup 和主工作区 refresh。
- 跟进 required checks 时优先使用 `gh pr checks <pr-url-or-number> --watch --required`，避免无界手动轮询。
- checks/review 失败且修复在 scope 内时继续处理；超出 scope、缺权限或受分支保护阻塞时记录 blocker。
- blocked handoff 可以结束当前运行，但不等同成功完成；仍需 checks/review/merge/cleanup/main refresh 时不得宣告 done。
- auto-merge 只能在仓库策略允许且 checks/review 已满足时生效；不得绕过审批、checks 或 branch protection。

---

## 5. 与上下文成本目标的关系

- 把长内容写文件（持久化），对话只给索引
- 子代理回传必须是“最小 handoff 包”
- 避免重复阅读：优先读 `.legion/` 再读代码


---

## 6. 重型 RFC（大任务）在自动推进中的默认行为

当任务被判断为 **Epic/High-risk**（或用户显式写 `rfc:heavy`）时：

- **默认先做设计产物**：生成 `plan + research + rfc + review-rfc + pr-body`
- **推荐开 Draft PR（仅文档）**：用于设计审阅（合并视为设计批准）
- Draft PR 必须标注为设计评审载体；创建 draft 不等于交付完成。
- **不强制对话中批准**：避免打断；批准在 PR 上完成
- **继续实现的触发**：设计 PR 合并后，orchestrator 进入已批准设计后的续跑模式，并按里程碑分步交付实现产物。

用户也可以强制只产出设计（不写代码）：
- `plan-only` / `rfc-only`

> 这样重型模式仍然符合“少打扰人类”的目标：人类只需要在 PR 评审/合并时一次性介入。
