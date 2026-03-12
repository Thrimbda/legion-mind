---
description: Legion RFC Heavy（大任务设计阶段）：调研→重 RFC→对抗审查→生成 RFC-only Draft PR 描述（不写生产代码）
agent: legion
---

用于 **Epic/High-risk** 任务的“重 RFC”流程。目标是在尽量少打扰人的前提下先把设计收敛好，再进入实现。

## 执行要求

1) 加载技能：
- `skill({ name: "legionmind" })`

2) 初始化 / 恢复任务：
- 若已有 `.legion/`：`legion_get_status` → 恢复 active task
- 否则：创建新 task（按 REF_SCHEMAS）

3) 设置档位与阶段（写入 plan + context 决策表）：
- `rfcProfile=heavy`
- `stage=design-only`

4) 先生成/更新 `<taskRoot>/plan.md`（唯一任务契约 + 执行索引），确保其覆盖问题定义、验收、假设/约束/风险、目标、要点、范围、设计索引、阶段概览，且保持摘要级

5) 设计产物（不写生产代码）：
- `spec-rfc`：写 `<taskRoot>/docs/research.md` + `<taskRoot>/docs/rfc.md`（heavy）
- `review-rfc`：写 `<taskRoot>/docs/review-rfc.md`

补充约束：
- `plan.md` 负责问题定义、验收、假设、约束、风险、目标、要点、范围与设计索引
- `plan.md` 不能替代 RFC；详细设计仍放在 `rfc.md`
- 设计产物默认使用当前用户与 agent 的工作语言；只有仓库已有明确文档语言约定时才覆盖这一默认值，不要默认写英文

6) 生成 RFC-only Draft PR 描述：
- `report-walkthrough`：`mode=rfc-only`
  - `<taskRoot>/docs/report-walkthrough.md`
  - `<taskRoot>/docs/pr-body.md`

7) 输出产物路径，并提示下一步：
- 在 GitHub 上创建 Draft PR（仅 docs）
- Merge 视为设计批准；merge 后评论 `continue` 进入实现阶段（按 Milestones 分步交付）
