---
name: legionmind
description: |
  基于文件系统的 Claude Code 跨会话上下文管理工具，使用 .legion/ 目录持久化工作状态。

  **核心原则**：
  1. **持久化**：所有状态存盘，Agent 重启/切换不丢失上下文。
  2. **三文件架构**：Plan (索引) + Context (日志) + Tasks (进度)。
  3. **设计门禁**：先设计，后编码。严禁"边想边写"。

  **主动使用策略**：
  当任务涉及 3+ 步骤、多文件修改或跨会话时，**必须主动初始化**本 Skill。
  如果检测到 `.legion/` 目录存在，必须优先读取其状态。
---

# LegionMind

## 1. 核心机制

LegionMind 通过维护 `.legion/` 目录下的三个核心文件来管理长周期任务：

- **`plan.md` (Design Index)**: 
  - 定义"做什么" (Goal) 和"范围" (Scope)。
  - 作为详细设计文档 (RFC) 的索引/入口。
  - **写一次，读多次**。
  - *Schema*: [REF_SCHEMAS.md](./references/REF_SCHEMAS.md#2-planmd)

- **`context.md` (Narrative Log)**:
  - 记录"发生了什么" (Progress) 和"为什么" (Decisions)。
  - 包含 Handoff (交接) 信息，确保上下文连续性。
  - **高频追加**。
  - *Schema*: [REF_SCHEMAS.md](./references/REF_SCHEMAS.md#3-contextmd)

- **`tasks.md` (Status Tracker)**:
  - 结构化的任务清单，机器可读。
  - 必须通过 MCP 工具更新以保持格式。
  - **高频更新**。
  - *Schema*: [REF_SCHEMAS.md](./references/REF_SCHEMAS.md#4-tasksmd)

## 2. 关键规则 (Mandatory)

1.  **设计门禁 (Design Gate)**:
    - 编码前必须有批准的设计。
    - 简单任务可走 Fast Track，但仍需创建任务条目。
    - *Guide*: [GUIDE_DESIGN_GATE.md](./references/GUIDE_DESIGN_GATE.md)

2.  **更新频率**:
    - **每 15-20 分钟** 或 **每完成一个子任务** 必须更新 `context.md` 和 `tasks.md`。
    - 严禁"做完所有事最后补文档"。
    - 推荐策略（二选一）：
      - **集中写回**：子 agent 只输出变更摘要/决策/下一步，由 orchestrator 统一调用 `legion_update_*` 写回。
      - **双写（默认）**：子 agent 先写回 `.legion/`，orchestrator 再做一次汇总校准写回。
    - 目标：将“更新时间”从自觉要求变成流程门禁。

3.  **Review 闭环**:
    - 用户或 Reviewer 可在任意位置插入 `> [REVIEW]` 块。
    - Agent 必须在读取上下文时解析 Review，并逐条响应。
    - `blocking` 类型的 Review 未解决前，不得推进任务。

## 3. 工具使用

所有文件操作建议优先使用 MCP 工具，以确保 Schema 正确性和审计追踪。

- **创建/初始化**: `legion_init`, `legion_propose_task`, `legion_approve_proposal`
- **查询**: `legion_get_status`, `legion_read_context`
- **更新**: `legion_update_tasks`, `legion_update_context`, `legion_respond_review`

*完整工具列表见 [REF_TOOLS.md](./references/REF_TOOLS.md)*

## 4. Meta Feedback

如果发现本 Skill 流程设计有问题，请使用 `legion::meta` 触发反馈模式，将建议写入 `FEEDBACK.md`。

## 5. Playbook（跨任务沉淀，推荐）

- 将可复用模式/策略沉淀到 `.legion/playbook.md`。
- 记录来源任务与日期，便于追溯。
- 当前无专用 MCP 工具：使用 `Write` / `Edit` 追加；并在 `context.md` 的“关键文件”登记。

---
*更多资源：*
- [REF_BEST_PRACTICES.md](./references/REF_BEST_PRACTICES.md)
- [REF_CONTEXT_SYNC.md](./references/REF_CONTEXT_SYNC.md)
- [REF_AUTOPILOT.md](./references/REF_AUTOPILOT.md)
- [REF_RFC_PROFILES.md](./references/REF_RFC_PROFILES.md)
