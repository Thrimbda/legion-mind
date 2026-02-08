---
description: Legion Implementation Phase（实现→验证→Review→报告，不要求显式设计批准）
agent: legion
---

你必须先做：
1) `skill({ name: "legionmind" })`
2) `legion_get_status` 获取当前任务状态（无工具则读取 `.legion/tasks/<id>/` 三文件）

然后执行以下流程：

### 阶段 A: 工程实现
调用 `engineer` agent（必须传 scope + task-brief/RFC 摘要）。

### 阶段 B: 验证与审查
依次执行：
- `run-tests`
- `review-code`
- （需要时）`review-security`

若测试失败或 review 有 blocking：回到实现阶段修复后重试。

### 阶段 C: 生成报告
- `report-walkthrough`

约束：
- 不要阻塞追问“是否批准设计”；采用 PR 驱动延迟批准（merge 即批准）
- 所有阻塞点写进 `.legion/tasks/<id>/tasks.md`，让人类在 PR 一次性处理

完成后输出产物路径（同 /legion）。
