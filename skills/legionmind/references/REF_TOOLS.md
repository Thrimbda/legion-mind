# LegionMind MCP 工具参考

> **范围**: `legionmind-mcp` 提供的所有 MCP 工具接口定义。

---

## 1. 初始化与任务生命周期

| 工具 | 描述 | 关键参数 |
| :--- | :--- | :--- |
| **`legion_init`** | 初始化 `.legion/` 目录结构 | `workingDirectory` (可选) |
| **`legion_propose_task`** | 提交任务提案 | `name`, `goal`, `rationale`, `scope`, `phases` |
| **`legion_approve_proposal`** | 批准提案 -> 创建任务文件 | `proposalId` |
| **`legion_reject_proposal`** | 拒绝提案 | `proposalId`, `reason` |
| **`legion_create_task`** | 直接创建任务 (仅限管理员) | `name`, `goal`, `phases` |
| **`legion_archive_task`** | 归档已完成的任务 | `taskId` |

## 2. 上下文与状态查询

| 工具 | 描述 | 关键参数 |
| :--- | :--- | :--- |
| **`legion_get_status`** | 获取单行摘要与阻塞项 | `taskId` (可选) |
| **`legion_read_context`** | 读取完整的三文件内容 | `taskId` (可选), `includeReviews` (bool) |
| **`legion_list_tasks`** | 列出所有任务及状态 | - |
| **`legion_list_reviews`** | 列出 Review 块 | `status` (open/all), `type` |
| **`legion_query_ledger`** | 查询审计日志 | `taskId`, `action`, `limit` |

## 3. 更新 (状态变更)

### `legion_update_tasks`
更新结构化任务清单。
- **`completeTask`**: `{ phase, taskDescription }` - 标记为完成。
- **`setCurrentTask`**: `{ phase, taskDescription }` - 标记为 `← CURRENT`。
- **`addTask`**: `{ phase, description, acceptance }` - 追加到阶段末尾。
- **`addDiscoveredTask`**: `{ description, source }` - 添加到“发现的新任务”区域。

### `legion_update_context`
更新叙述性日志。
- **`progress`**: `{ completed: [], inProgress: [], blocked: [] }` - 更新状态区域。
- **`addDecision`**: `{ decision, reason, alternatives }` - 追加到决策表。
- **`addFile`**: `{ path, purpose, status }` - 更新关键文件列表。
- **`handoff`**: `{ nextSteps: [], notes: [] }` - 更新交接区域。

### `legion_update_plan`
更新不可变计划（仅限少量修改）。
- **参数**: `goal`, `points`, `scope` (数组)。
- **注意**: 不支持结构化更新“设计索引”或“阶段概览”。如果需要大幅修改这些部分，请直接使用 `edit` 工具。

### `legion_respond_review`
回复 Review 块。
- **参数**: `file`, `reviewId` (或行号), `response`, `status` (resolved/wontfix)。

## 4. 仪表盘

| 工具 | 描述 | 关键参数 |
| :--- | :--- | :--- |
| **`legion_generate_dashboard`** | 生成 HTML/MD 报告 | `format`, `outputPath`, `includeSections` |

---

## 错误码

- **`NOT_INITIALIZED`**: 请先运行 `legion_init`。
- **`NO_ACTIVE_TASK`**: 请指定 `taskId` 或切换到活跃任务。
- **`TASK_ALREADY_EXISTS`**: 任务名称/ID 重复。
- **`PERMISSION_DENIED`**: 策略违规（例如当前处于 human-only 模式）。
