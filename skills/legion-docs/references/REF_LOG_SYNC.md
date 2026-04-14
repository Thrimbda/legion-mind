# Legion 日志同步协议 (Log Sync Protocol)

> **目标**：在多 Agent（orchestrator + subagents）协作中，把“最重要的信息”同步到同一套持久化载体里，同时避免：
> 1) 上下文污染（把大量细节塞进对话）
> 2) 重复劳动（不同 Agent 反复做同样的调研/阅读/推理）
> 3) 责任漂移（谁该做的事被重复做，或没人做）

---

## 1. 载体分工（信息应该放哪）

把信息写进文件，而不是长篇对话里。对话只保留“结论 + 下一步”。

### 任务级核心载体（推荐）
- `.legion/tasks/<task-id>/docs/research.md`：现状摸底与证据索引（RFC Heavy 推荐/强制）
- `.legion/tasks/<task-id>/docs/rfc.md`：设计方案 + 取舍（中高风险时必备）
- `plan.md`：唯一任务契约 + 执行索引（问题/验收/假设/约束/风险/目标/要点/范围/设计索引/阶段概览）
- `log.md`：过程日志 + 决策表 + 交接（append-only）
- `tasks.md`：结构化进度（机器可读）

文档语言默认跟随当前用户与 agent 的工作语言；若仓库已有明确文档语言约定，则遵循仓库约定。

> 经验法则：  
> **“可复用/可追溯”写文件；“临时推理/分支探索”留在脑内，不要污染上下文。**

---

## 2. Subagent → Orchestrator 的最小回传格式（强制）

每个 subagent 的输出必须以一个固定的“回传包”结尾（<= 200 行，越短越好）：

```text
[Handoff]
summary:
  - ...
decisions:
  - decision: ...
    reason: ...
risks:
  - ...
files_touched:
  - path: ...
commands:
  - ...
next:
  - ...
open_questions:
  - ...
```

规则：
- `summary` ≤ 5 条；每条 ≤ 1 行
- `decisions` ≤ 3 条；如果无决策，写 `- (none)`
- `open_questions` 只有“阻塞级”才允许出现；否则写 `- (none)`
- **禁止**把大段 diff/代码粘贴到回传包里：改为列 `files_touched` + 关键定位（行号/函数名）

---

## 3. Orchestrator 的归档策略（避免重复调研）

Orchestrator 在每个阶段结束时必须做一次“归档”：
1. 将 subagent 的 `summary/decisions/risks/next` 写入 `log.md`
2. 将可验证的 next steps 写入 `tasks.md`
3. 将关键产物路径登记到 `plan.md`（Design Index）

补充约束：
- `plan.md` 承载稳定问题契约，但只保留摘要级信息；详细设计、迁移步骤、验证细节继续放到 `rfc.md` 或其他 docs。
- 不要再创建或维护 `task-brief.md`；LegionMind 核心流程不为旧模型提供双读或回退路径。

> 这样下一次会话（或另一个 Agent）只要读 `.legion/`，就能继续，不需要重新 grep/重新读一堆文件。

---

## 4. 防污染约束（Token 省钱）

- 只读你需要的文件片段：优先 `rg`/`grep` 定位，再 `read` 小片段
- 报告/设计/审查写到 `.legion/tasks/<id>/docs/`，对话只发链接与 5 行摘要
- **不要重复**：对话里写过的关键事实，也要写到 `plan.md`（稳定契约）或 `log.md`（过程/决策），否则会被压缩丢失

---

## 5. “谁负责什么”的边界（减少重复）

- `spec-rfc`：只产出 RFC，不做实现
- `review-*`：只产出 review 报告，不改代码、不改 RFC
- `engineer`：实现 + 测试 + 最小化自检，不做“重新定义问题”
- `legion`（orchestrator）：唯一负责把信息写回 `.legion/` 并确保门禁/闭环
