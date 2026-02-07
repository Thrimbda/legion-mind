---
description: Legion Implementation Phase：实现(Code+Test)→验证→Review→报告
agent: legion
---

你必须先做：
1) `skill("legionmind")` 加载指南
2) `legion_get_status` 获取当前任务状态
3) **校验设计门禁**：确认 RFC 已存在且用户已批准（检查 tasks.md 或 plan.md 状态）

然后执行以下流程：

**阶段 A: 工程实现**
调用 `engineer` agent：
```
Task(subagent_type="engineer", prompt="Task Context=... Scope=... RFC=...")
```
- 负责：业务代码、单元测试、(可选) Benchmark
- 要求：严格遵循 Scope 和 RFC

**阶段 B: 验证与审查** (可并行)
```
Task(subagent_type="run-tests", prompt="...")
Task(subagent_type="review-code", prompt="...")
Task(subagent_type="review-security", prompt="...")
```
- 若测试失败或 Review 发现 blocking 问题：**立即停止**，修复后重试。

**阶段 C: 生成报告**
```
Task(subagent_type="report-walkthrough", prompt="...")
```
- 输出：详细报告 + PR Body 建议（位于 Task 目录下）

**阶段 D: 状态同步**
- 更新 tasks.md 勾选完成项
- 更新 context.md 记录最终交付物

完成后必须输出：
```
✅ 实现阶段完成
下一步：运行 /legion-pr 创建 PR
```
