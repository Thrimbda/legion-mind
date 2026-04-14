---
description: Legion Autopilot（Design→Implement→Test→Review→Report，不阻塞提问）
agent: legion
---

目标：用 **最少的人类打断** 完成一次端到端交付（产出 `.legion/` + 可直接作为 PR 的 `.legion/tasks/<task-id>/docs/pr-body.md`）。

## 执行要求

1) 加载技能：
- `skill({ name: "legion-workflow" })`
- 若需要新建 task 或重做 task contract：`skill({ name: "brainstorm" })`
- 若需要写 `.legion` 核心文档：`skill({ name: "legion-docs" })`

2) 初始化 / 恢复任务：
- 若已有 `.legion/`：运行 `node --experimental-strip-types "${OPENCODE_HOME:-$HOME/.opencode}/skills/legion-workflow/scripts/legion.ts" status --format json` → 恢复 active task
- 若还没有 `.legion/`：先 `init`，不要立刻生成占位 task
- 恢复顺序固定为：`plan.md` -> `docs/rfc.md`（若存在）-> `log.md` / `tasks.md`

3) 若当前没有 active task，或已有 task 但 contract 不稳定，先执行 brainstorm：
- 一次只问一个问题，收敛目标/验收/Scope/阶段划分
- 在存在真实设计分叉时给 2-3 个方案
- 新 task：用收敛后的 task seed 执行 `task create` 或 `propose + proposal approve`
- 已有 task：用收敛后的 task seed 重写 `plan.md` 与 `tasks.md`
- 不要先落占位文档，再靠实现阶段回填

4) 风险/规模分级（Low/Medium/High + Epic）：
- 支持标签：`rfc:heavy` / `epic` / `risk:high` / `plan-only` / `continue`

5) subagent 派生：
- orchestrator **必须**按 `skills/legion-workflow/references/SUBAGENT_DISPATCH_MATRIX.md` 派生 subagents
- 本命令只定义 default autopilot mode，不再内联另一套 dispatch 顺序

## 注意

- **不要等待用户确认设计**：默认走 PR 驱动“延迟批准”（merge 视为批准）
- `plan.md` 与 `tasks.md` 的第一版必须来自 brainstorm 收敛后的 task contract，而不是 CLI 默认占位文本
- `plan.md` 是唯一任务契约与人类可读 Scope 真源；保持摘要级，不要把它写成 mini-RFC
- subagent 派生顺序如果与 command 文案冲突，以 `SUBAGENT_DISPATCH_MATRIX.md` 为准
- GitHub Action 场景通常不需要你手动 `git push` / `gh pr create`
- 根目录 `docs/` 仅放长期文档；任务过程产物统一落盘到 `<taskRoot>/docs/`
- 所有 Legion 任务文档默认使用当前用户与 agent 的工作语言；只有仓库已有明确文档语言约定时才覆盖这一默认值，不要默认写英文
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
