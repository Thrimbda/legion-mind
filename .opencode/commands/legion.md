---
description: Legion Autopilot（Design→Implement→Test→Review→Report，不阻塞提问）
agent: legion
---

目标：用 **最少的人类打断** 完成一次端到端交付（产出 `.legion/` + 可直接作为 PR 的 `docs/pr-body.md`）。

## 执行要求

1) 加载技能：
- `skill({ name: "legionmind" })`

2) 初始化 / 恢复任务：
- 若已有 `.legion/`：`legion_get_status` → 恢复 active task
- 否则：`legion_create_task` 创建新任务（无工具则按 REF_SCHEMAS 手动创建）

3) 生成 `docs/task-brief.md`（问题定义/验收/假设/风险/验证）

4) 风险/规模分级（Low/Medium/High + Epic）：
- 支持标签：`rfc:heavy` / `epic` / `risk:high` / `plan-only` / `continue`

4) 风险分级（Low/Medium/High）：
- Low：design-lite 即可
- Medium/High：生成 RFC + `review-rfc` 收敛

5) 实现：
- 调用 `engineer`

6) 验证与评审：
- `run-tests` → `docs/test-report.md`
- `review-code` → `docs/review-code.md`
- Medium/High 或安全相关：`review-security` → `docs/review-security.md`

7) 报告：
- `report-walkthrough` → `docs/report-walkthrough.md` + `docs/pr-body.md`

## 注意

- **不要等待用户确认设计**：默认走 PR 驱动“延迟批准”（merge 视为批准）
- GitHub Action 场景通常不需要你手动 `git push` / `gh pr create`
- 本地如果需要提交/开 PR，最后运行 `/legion-pr`

完成后输出：
```
✅ Autopilot 完成
task: <task-id>
产物：
- task-brief: <path>
- rfc(可选): <path>
- test-report: <path>
- review-code: <path>
- review-security(可选): <path>
- pr-body: <path>

下一步：将 pr-body 作为 PR 描述进行 Review/合并
```
