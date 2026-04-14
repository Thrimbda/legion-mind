# Legion CLI 参考

> **默认入口**: `node --experimental-strip-types "${OPENCODE_HOME:-$HOME/.opencode}/skills/legion-workflow/scripts/legion.ts" <command> ...`

---

## 1. 初始化与任务生命周期

| 命令 | 描述 | 关键参数 |
| :--- | :--- | :--- |
| **`init --cwd <dir>`** | 初始化 `.legion/` 目录结构 | `--cwd` |
| **`propose --json '{...}'`** | 提交任务提案 | `name`, `goal`, `rationale`, `scope`, `phases`；可选：`problem`, `acceptance`, `assumptions`, `constraints`, `risks`, `designIndex`, `designSummary` |
| **`proposal approve --proposal-id <id>`** | 批准提案并创建任务文件 | `proposalId` |
| **`proposal reject --proposal-id <id> [--reason ...]`** | 拒绝提案 | `proposalId`, `reason` |
| **`task create --json '{...}'`** | 直接创建任务（受策略保护） | `name`, `goal`, `phases`；可选：`rationale`, `problem`, `acceptance`, `assumptions`, `constraints`, `risks`, `points`, `scope`, `designIndex`, `designSummary` |
| **`task archive --task-id <id>`** | 归档已完成的任务 | `taskId` |

## 2. 日志与状态查询

| 命令 | 描述 | 关键参数 |
| :--- | :--- | :--- |
| **`status [--task-id <id>]`** | 获取当前任务摘要 | `taskId` (可选) |
| **`log read [--task-id <id>] [--section ...] [--include-reviews true|false]`** | 读取日志内容 | `taskId`, `section`, `includeReviews` |
| **`task list`** | 列出所有任务及状态 | - |
| **`review list [--task-id <id>] [--status ...] [--type ...]`** | 列出 Review 块 | `status`, `type` |
| **`ledger query [--task-id <id>] [--action ...] [--limit N]`** | 查询审计日志 | `taskId`, `action`, `limit` |

## 3. 更新（状态变更）

### `tasks update --json '{...}'`
更新结构化任务清单。
- **`completeTask`**: `{ phase, taskDescription }` - 标记为完成。
- **`setCurrentTask`**: `{ phase, taskDescription }` - 标记为 `← CURRENT`。
- **`addTask`**: `{ phase, description, acceptance }` - 追加到阶段末尾。
- **`addDiscoveredTask`**: `{ description, source }` - 添加到“发现的新任务”区域。
- **说明**: phase 状态由 CLI 自动推导，`updatePhaseStatus` 不再对外暴露。

### `log update --json '{...}'`
更新叙述性日志。
- **`progress`**: `{ completed: [], inProgress: [], blocked: [] }` - 更新状态区域。
- **`addDecision`**: `{ decision, reason, alternatives }` - 追加到决策表。
- **`addFile`**: `{ path, purpose, status, notes }` - 更新关键文件列表。
- **`addConstraint`**: `string` - 追加约束/阻塞说明。
- **`handoff`**: `{ nextSteps: [], notes: [] }` - 更新交接区域。

### `plan update --json '{...}'`
更新不可变计划（仅限少量修改）。
- **参数**: `goal`, `points`, `scope`, `phases`。
- **注意**: `plan.md` 仍保持摘要级；详细设计继续放 RFC。

### `review respond`
回复 Review 块。
- **参数**: `file`, `reviewId` (或行号), `response`, `status` (resolved/wontfix/need-info)。

## 4. 仪表盘

| 命令 | 描述 | 关键参数 |
| :--- | :--- | :--- |
| **`dashboard generate --format <markdown|html>`** | 生成 HTML/MD 报告 | `format`, `outputPath`, `includeSections` |

---

## 5. 输出与错误

- 成功输出：`{ "success": true, "data": ... }`
- 失败输出：`{ "success": false, "error": { "code", "message", "hint?" } }`
- `hint` 仅在存在明确下一步时返回。

---

## 错误码

- **`NOT_INITIALIZED`**: 请先运行 `init`。
- **`NO_ACTIVE_TASK`**: 请指定 `taskId` 或切换到活跃任务。
- **`TASK_ALREADY_EXISTS`**: 任务名称/ID 重复。
- **`PROPOSAL_NOT_FOUND`**: 提案不存在。
- **`SCHEMA_INVALID`**: payload 缺字段、字段类型错误或含未知字段。
- **`OUT_OF_SCOPE`**: 路径越界或试图写出 repo/.legion 边界。
- **`REVIEW_NOT_FOUND`**: reviewId/行号未命中。

---

## 6. 历史映射（非默认）

| 历史名称 | CLI 等价命令 |
| :--- | :--- |
| `legion_init` | `init` |
| `legion_propose_task` | `propose` |
| `legion_approve_proposal` | `proposal approve` |
| `legion_get_status` | `status` |
| `legion_update_log` | `log update` |
| `legion_update_tasks` | `tasks update` |
| `legion_respond_review` | `review respond` |
