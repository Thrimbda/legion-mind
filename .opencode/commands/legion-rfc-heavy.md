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

3) 设置档位与阶段（写入 task-brief + context 决策表）：
- `rfcProfile=heavy`
- `stage=design-only`

4) 生成/更新 `docs/task-brief.md`

5) 设计产物（不写生产代码）：
- `spec-rfc`：写 `docs/research.md` + `docs/rfc.md`（heavy）
- `review-rfc`：写 `docs/review-rfc.md`

6) 生成 RFC-only Draft PR 描述：
- `report-walkthrough`：`mode=rfc-only`
  - `docs/report-walkthrough.md`
  - `docs/pr-body.md`

7) 输出产物路径，并提示下一步：
- 在 GitHub 上创建 Draft PR（仅 docs）
- Merge 视为设计批准；merge 后评论 `continue` 进入实现阶段（按 Milestones 分步交付）
