---
description: Legion Implementation Phase（实现→验证→Review→报告，不要求显式设计批准）
agent: legion
---

你必须先做：
1) `skill({ name: "legionmind" })`
2) 运行 `node --experimental-strip-types "${OPENCODE_HOME:-$HOME/.opencode}/skills/legionmind/scripts/legion.ts" status --format json` 获取当前任务状态（仅 orchestrator 可在 break-glass 模式下直接读取 `.legion/tasks/<id>/` 三文件，且无 ledger 审计）
3) 恢复顺序固定为：`plan.md` -> `docs/rfc.md`（若存在）-> `context.md` / `tasks.md`

然后执行以下流程：

### 阶段 A: 工程实现
调用 `engineer` agent（必须传 scope + plan/RFC 摘要）。

### 阶段 B: 验证与审查
依次执行：
- `run-tests`（写 `<taskRoot>/docs/test-report.md`）
- `review-code`（写 `<taskRoot>/docs/review-code.md`）
- （需要时）`review-security`（写 `<taskRoot>/docs/review-security.md`）

若测试失败或 review 有 blocking：回到实现阶段修复后重试。

### 阶段 C: 生成报告
- `report-walkthrough`（写 `<taskRoot>/docs/report-walkthrough.md` + `<taskRoot>/docs/pr-body.md`）

约束：
- 不要阻塞追问“是否批准设计”；采用 PR 驱动延迟批准（merge 即批准）
- 所有阻塞点写进 `.legion/tasks/<id>/tasks.md`，让人类在 PR 一次性处理
- 任务产物默认只写 `<taskRoot>/docs/`，不要默认写根目录 `docs/`
- `plan.md` 是唯一任务契约与允许 Scope 真源；`rfc.md` 是详细设计真源
- 测试报告、review、walkthrough、pr-body 默认使用当前用户与 agent 的工作语言；只有仓库已有明确文档语言约定时才覆盖这一默认值，不要默认写英文

完成后输出产物路径（同 /legion）。
