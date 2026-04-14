---
description: Legion RFC Heavy（大任务设计阶段）：调研→重 RFC→对抗审查→生成 RFC-only Draft PR 描述（不写生产代码）
agent: legion
---

用于 **Epic/High-risk** 任务的“重 RFC”流程。目标是在尽量少打扰人的前提下先把设计收敛好，再进入实现。

## 执行要求

1) 加载技能：
- `skill({ name: "legion-workflow" })`
- 若需要新建 task 或重做 task contract：`skill({ name: "brainstorm" })`
- 需要写 `.legion` 核心文档时追加：`skill({ name: "legion-docs" })`

2) 初始化 / 恢复任务：
- 若已有 `.legion/`：运行 `node --experimental-strip-types "${OPENCODE_HOME:-$HOME/.opencode}/skills/legion-workflow/scripts/legion.ts" status --format json` → 恢复 active task
- 若还没有 `.legion/`：先 `init`，不要立刻生成占位 task；CLI 不可用时才按 REF_SCHEMAS 走 break-glass 手工落盘（无 ledger 审计）

3) 若当前没有 active task，或已有 task 但 contract 不稳定，先执行 brainstorm：
- 收敛目标、验收、Scope、风险边界与阶段划分
- 新 task：用收敛后的 task seed 执行 `propose` + `proposal approve` 或 `task create`
- 已有 task：用收敛后的 task seed 重写 `plan.md` 与 `tasks.md`

4) 设置档位与阶段（写入 plan + log 决策表）：
- `rfcProfile=heavy`
- `stage=design-only`

5) 生成/更新 `<taskRoot>/plan.md`（唯一任务契约 + 执行索引），确保其覆盖问题定义、验收、假设/约束/风险、目标、要点、范围、设计索引、阶段概览，且保持摘要级

6) subagent 派生：
- orchestrator **必须**按 `skills/legion-workflow/references/SUBAGENT_DISPATCH_MATRIX.md` 中 `/legion-rfc-heavy` 模式派生 subagents
- 本命令只声明当前处于 heavy design-only mode，不再复制 dispatch 顺序

补充约束：
- `plan.md` 负责问题定义、验收、假设、约束、风险、目标、要点、范围与设计索引
- `plan.md` 不能替代 RFC；详细设计仍放在 `rfc.md`
- subagent 派生顺序与 gate 规则如果和 command 文案冲突，以 `SUBAGENT_DISPATCH_MATRIX.md` 为准
- 设计产物默认使用当前用户与 agent 的工作语言；只有仓库已有明确文档语言约定时才覆盖这一默认值，不要默认写英文

7) 输出产物位置仍然是 `<taskRoot>/docs/`；`report-walkthrough` 使用 `mode=rfc-only`

8) 输出产物路径，并提示下一步：
- 在 GitHub 上创建 Draft PR（仅 docs）
- Merge 视为设计批准；merge 后评论 `continue` 进入实现阶段（按 Milestones 分步交付）
