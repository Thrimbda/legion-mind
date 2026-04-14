---
description: Legion Implementation Phase（实现→验证→Review→报告，不要求显式设计批准）
agent: legion
---

你必须先做：
1) `skill({ name: "legion-workflow" })`
2) 如需写 `.legion` 核心文档：`skill({ name: "legion-docs" })`
3) 运行 `node --experimental-strip-types "${OPENCODE_HOME:-$HOME/.opencode}/skills/legion-workflow/scripts/legion.ts" status --format json` 获取当前任务状态（仅 orchestrator 可在 break-glass 模式下直接读取 `.legion/tasks/<id>/` 三文件，且无 ledger 审计）
4) 恢复顺序固定为：`plan.md` -> `docs/rfc.md`（若存在）-> `log.md` / `tasks.md`

然后执行以下流程：

### 阶段派生
- orchestrator **必须**按 `skills/legion-workflow/references/SUBAGENT_DISPATCH_MATRIX.md` 中 `/legion-impl` 模式派生 subagents
- 本命令只声明当前处于 implementation mode，不再复制 dispatch 顺序

约束：
- 不要阻塞追问“是否批准设计”；采用 PR 驱动延迟批准（merge 即批准）
- 所有阻塞点写进 `.legion/tasks/<id>/tasks.md`，重要过程结论写进 `log.md`，让人类在 PR 一次性处理
- 任务产物默认只写 `<taskRoot>/docs/`，不要默认写根目录 `docs/`
- `plan.md` 是唯一任务契约与允许 Scope 真源；`rfc.md` 是详细设计真源
- 派生顺序、security review 触发条件、回环规则都以 `SUBAGENT_DISPATCH_MATRIX.md` 为准
- 测试报告、review、walkthrough、pr-body 默认使用当前用户与 agent 的工作语言；只有仓库已有明确文档语言约定时才覆盖这一默认值，不要默认写英文

完成后输出产物路径（同 /legion）。
