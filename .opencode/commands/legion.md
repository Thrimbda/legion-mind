---
description: Legion Autopilot（Design→Implement→Test→Review→Report，不阻塞提问）
agent: legion
---

目标：用 **最少的人类打断** 完成一次端到端交付（产出 `.legion/` + 可直接作为 PR 的 `.legion/tasks/<task-id>/docs/pr-body.md`）。

## 执行要求

1) 加载技能：
- `skill({ name: "legionmind" })`

2) 初始化 / 恢复任务：
- 若已有 `.legion/`：运行 `node --experimental-strip-types "${OPENCODE_HOME:-$HOME/.opencode}/skills/legionmind/scripts/legion.ts" status --format json` → 恢复 active task
- 否则：优先运行 `... legion.ts task create --json '{...}'` 或 `propose + proposal approve`；仅 orchestrator 可在 break-glass 模式下按 REF_SCHEMAS 手动创建，并注明无 ledger 审计

3) 先生成 `plan.md`（唯一任务契约：问题定义/验收/假设/约束/风险 + 短目标/要点/允许 Scope/Design Index/Phase Map）

5) 风险/规模分级（Low/Medium/High + Epic）：
- 支持标签：`rfc:heavy` / `epic` / `risk:high` / `plan-only` / `continue`

6) 风险分级（Low/Medium/High）：
- Low：design-lite 即可
- Medium/High：生成 RFC + `review-rfc` 收敛

7) 实现：
- 调用 `engineer`

8) 验证与评审：
- `run-tests` → `<taskRoot>/docs/test-report.md`
- `review-code` → `<taskRoot>/docs/review-code.md`
- Medium/High 或安全相关：`review-security` → `<taskRoot>/docs/review-security.md`

9) 报告：
- `report-walkthrough` → `<taskRoot>/docs/report-walkthrough.md` + `<taskRoot>/docs/pr-body.md`

## 注意

- **不要等待用户确认设计**：默认走 PR 驱动“延迟批准”（merge 视为批准）
- `plan.md` 是唯一任务契约与人类可读 Scope 真源；保持摘要级，不要把它写成 mini-RFC
- GitHub Action 场景通常不需要你手动 `git push` / `gh pr create`
- 根目录 `docs/` 仅放长期文档；任务过程产物统一落盘到 `<taskRoot>/docs/`
- 所有 LegionMind 任务文档默认使用当前用户与 agent 的工作语言；只有仓库已有明确文档语言约定时才覆盖这一默认值，不要默认写英文
- 本地如果需要提交/开 PR，最后运行 `/legion-pr`

完成后输出：
```
✅ Autopilot 完成
task: <task-id>
产物：
- plan: <path>
- rfc(可选): <path>
- test-report: <path>
- review-code: <path>
- review-security(可选): <path>
- pr-body: <path>

下一步：将 `<taskRoot>/docs/pr-body.md` 作为 PR 描述进行 Review/合并
```
