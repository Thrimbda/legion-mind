---
description: Legion Design Phase：初始化→调查→设计(RFC)→Review→门禁
agent: legion
---

执行要求（你必须先加载 skills，然后再工作）：

1) 调用 `skill("legionmind")` 加载指南
2) 使用 `legion_create_task` 创建任务（或恢复现有任务）
3) **确定 Scope 与 Path**：
   - 分析项目结构，确定改动范围 (Scope)
   - 确定设计文档输出路径 (Target Path, 默认 `.legion/tasks/<id>/docs/rfc.md`)
4) **设计循环**：
   - 调用 `spec-rfc` 生成/更新 RFC
   - 调用 `review-rfc` 进行对抗审查
   - 若审查不通过，重复上述步骤直到收敛
5) **设计门禁**：
   - 将 RFC 链接更新到 `plan.md`
   - 请求用户确认设计
6) **停止**：等待用户确认后再进入实现阶段

完成后必须输出：
```
✅ 设计阶段完成
RFC: <path>
下一步：用户确认设计后运行 /legion-impl
```
