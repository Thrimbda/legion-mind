# RFC：移除 Legion CLI 对 config.json / ledger.csv 的运行时依赖

## 摘要 / 背景

当前 CLI 仍把 `.legion/config.json` 作为任务注册表，把 `.legion/ledger.csv` 作为审计日志真源；但仓库的实际工作流已经收敛到 `.legion/tasks/<task-id>/plan.md`、`log.md`、`tasks.md` 与 `docs/*.md`。这造成了双真源：任务目录保存真实任务内容，CLI 运行时却依赖额外状态文件决定“当前任务”“任务列表”“最近活动”。

本 RFC 提议把 CLI 收敛为**文件系统驱动的薄工具层**：任务发现来自 `.legion/tasks/*` 目录，读写命令只接受显式 `--task-id`（或 JSON 中的 `taskId`），删除围绕 config/ledger 长出的 proposal/approval、task switch/archive、ledger query 与 failure audit 逻辑，并同步更新 README 与参考文档。

## 问题与目标

### 问题

现状证据：

- `skills/legion-workflow/scripts/lib/cli.ts:181-221` 在 `initLegion/loadConfig/currentTaskId` 中创建并依赖 `config.json`。
- `skills/legion-workflow/scripts/lib/cli.ts:247-317, 384-417, 668-718` 在任务创建、切换、归档、dashboard、ledger 查询中持续读写 `config.json` / `ledger.csv`。
- `skills/legion-workflow/scripts/legion.ts:67-90, 96-103, 178-189` 暴露了 proposal、task switch/archive、ledger query 等命令面。
- `skills/legion-workflow/references/REF_TOOLS.md` 与 README 仍把这些命令描述为可用 CLI 能力。

这带来三个直接问题：

1. **真源漂移**：任务真实状态在任务目录，但 CLI 决策依赖额外注册表。
2. **隐式状态过多**：`currentTask` 让命令在无 `--task-id` 时依赖“活跃任务”，不利于可重放与自动化。
3. **工具层过厚**：proposal/approval/ledger 等历史能力继续扩大维护面，与当前 workflow 主干不一致。

### 目标

1. CLI 运行时不再读写 `.legion/config.json` 与 `.legion/ledger.csv`。
2. 任务发现改为扫描 `.legion/tasks/*` 目录并校验必要文件存在。
3. 所有面向单任务的读取/更新命令改为**显式 task-id**。
4. CLI surface 与 `README.md`、`skills/legion-workflow/references/**`、`skills/legion-docs/references/**` 保持一致。
5. 保持 CLI 作为本地初始化、读取、更新工具，而不是新的状态管理层。

## 非目标

- 不引入新的全局状态文件替代 `config.json`。
- 不在本次设计中重建 proposal / approval 审批流。
- 不补做新的审计账本或事件流系统。
- 不扩展 `.legion/tasks/**` 文档 schema，只复用现有目录与 Markdown 文件。
- 不修改 orchestrator 对 `.legion` 三文件的写回职责划分。

## 术语

- **任务目录**：`.legion/tasks/<task-id>/`
- **有效任务**：目录名通过 `taskId` 校验，且至少存在 `plan.md`、`log.md`、`tasks.md` 的任务目录。
- **显式 task-id**：命令通过 `--task-id <id>` 或 JSON payload 中 `taskId` 指定目标任务，不再读取“当前活跃任务”。

## 为什么要从 CLI 运行时移除 config.json 与 ledger.csv

1. **它们不是当前 workflow 真源**。真实任务内容与推进状态已经由任务目录承载；额外注册表只会复制、滞后、甚至冲突。
2. **隐式 currentTask 破坏可重放性**。自动化链路应由输入完全决定，不能依赖上次 switch 到哪一个任务。
3. **ledger 审计价值低于维护成本**。当前 CLI 已有结构化文档、git 历史与 review/respond 记录；额外 CSV 无法形成可靠主干验证，反而要求每个命令维护审计副作用。
4. **命令面已经超出“薄工具层”定位**。proposal/approval、switch/archive、failure audit 都是旧状态模型的附属能力，保留它们会继续拖住文档和实现收敛。

## 方案设计

### 1. 总体原则

- 约定大于配置：任务存在性由目录结构决定，不再有全局注册表。
- 单任务命令必须显式：避免任何“自动选当前任务”的行为。
- 输出尽量从已有 Markdown 真源推导，不新增并行 schema。

### 2. 命令面收敛

#### 保留的命令

- `init`
- `task create`
- `task list`
- `status --task-id <id>`
- `log read --task-id <id>`
- `log update --json '{"taskId":"..." ...}'`
- `tasks read --task-id <id>`
- `tasks update --json '{"taskId":"..." ...}'`
- `plan update --json '{"taskId":"..." ...}'`
- `review list --task-id <id>`
- `review respond --task-id <id>`（或等价 JSON）
- `dashboard generate --task-id <id>`

#### 删除的命令

- `propose`
- `proposal list`
- `proposal approve`
- `proposal reject`
- `task switch`
- `task archive`
- `ledger query`

#### 改为显式 task-id only 的命令

- `status`
- `log read`
- `log update`
- `tasks read`
- `tasks update`
- `plan update`
- `review list`
- `review respond`
- `dashboard generate`

说明：`task create` 本身已经要求输入 `taskId`，因此不属于“从隐式切显式”的迁移项。

### 3. 文件系统任务发现

`task list` 使用严格发现规则；单任务命令使用“目录存在 + 按需文件校验”规则：

1. `task list` 以 `.legion/tasks/` 为根目录扫描一层子目录。
2. 目录名必须通过现有 `taskId` 校验规则。
3. 对 `task list` 而言，目录内必须存在 `plan.md`、`log.md`、`tasks.md`；缺失则视为损坏任务目录。
4. `plan.md` 首标题作为展示名；`tasks.md` 解析结果作为进度来源。
5. 对单任务命令而言，只校验本命令实际需要的文件：
   - `status` 需要 `plan.md` 与 `tasks.md`
   - `log read/update` 需要 `log.md`
   - `tasks read/update` 需要 `tasks.md`
   - `plan update` 需要 `plan.md`
   - `review list/respond` 需要对应 raw docs
   - `dashboard generate` 需要 `log.md` 与 `tasks.md`
6. 不再维护 `active / paused / archived` 持久状态；CLI 只报告目录存在与文档解析结果。

建议的导出语义：

- `task list`：返回 `taskId`、`name`、`progress`（completed/total）、`path`。
- `status --task-id`：返回同一任务的摘要；若缺 `--task-id`，直接报错。

### 3.5 命令兼容矩阵（最小契约）

#### 保留命令

| 命令 | 必填输入 | 成功返回最小字段 |
|---|---|---|
| `init` | 无 | `cwd`, `legionRoot` |
| `task create --json '{...}'` | `taskId`, `name`, `goal`, `phases` | `taskId`, `path` |
| `task list` | 无 | `tasks[]`，每项含 `taskId`, `name`, `path`, `progress.completed`, `progress.total` |
| `status --task-id <id>` | `--task-id` | `taskId`, `name`, `currentTask`, `progress.completed`, `progress.total` |
| `log read --task-id <id>` | `--task-id` | `content`，可选 `reviews` |
| `log update --json '{...}'` | `taskId` | `taskId` |
| `tasks read --task-id <id>` | `--task-id` | `content` |
| `tasks update --json '{...}'` | `taskId` | `taskId` |
| `plan update --json '{...}'` | `taskId` | `taskId` |
| `review list --task-id <id>` | `--task-id` | `reviews[]` |
| `review respond --json '{...}'` 或 flag 方式 | `taskId`, `reviewId`, `response`, `status` | `taskId`, `file`, `reviewId` |
| `dashboard generate --task-id <id>` | `--task-id` | `taskId`, `format`, `content`，可选 `outputPath` |

#### 删除命令

以下命令统一删除，并统一返回：

- 错误码：`UNSUPPORTED_COMMAND`
- 错误文案：`命令已移除：<command>`
- hint：`改用显式 task-id 的文件系统驱动命令；详情见 REF_TOOLS.md`

适用命令：

- `propose`
- `proposal list`
- `proposal approve`
- `proposal reject`
- `task switch`
- `task archive`
- `ledger query`

#### 明确删除的旧字段

- `task list` 不再返回 `status`, `createdAt`, `updatedAt`
- `status` 不再返回基于 config 派生的 `status`
- 所有命令都不再隐式读取 `currentTask`

### 4. 数据模型 / 接口变化

#### 删除的运行时文件

- `.legion/config.json`
- `.legion/ledger.csv`

#### 保留的目录模型

```text
.legion/
  tasks/
    <task-id>/
      plan.md
      log.md
      tasks.md
      docs/
```

#### CLI 接口约束

- `init` 仅保证 `.legion/tasks/` 存在；不再生成 config/ledger。
- 所有单任务写命令的 JSON payload 中，`taskId` 变为必填。
- 所有单任务读命令的 `--task-id` 变为必填。
- `task list` 不再承诺返回 `active/paused/archived` 状态。

#### 兼容策略

- 已存在的 `config.json` / `ledger.csv` 会被**忽略**，不再读取、不再更新。
- 旧脚本若继续调用已删除命令，应得到明确错误，而不是静默降级。

## 错误语义

- 缺少 `--task-id` / payload `taskId`：返回 `SCHEMA_INVALID`，提示“该命令必须显式提供 taskId”。
- 指定任务目录不存在：返回 `TASK_NOT_FOUND`，提示检查 `.legion/tasks/<task-id>`。
- 任务目录缺少必要文件：返回 `TASK_CORRUPTED`，提示补齐命令所需文件。
- Markdown 解析失败：返回 `SCHEMA_INVALID` 或专用解析错误，属于**可恢复错误**，调用方需先修复任务文件后重试。

重试语义：

- 文件不存在 / 缺参数：无需自动重试，应修正输入。
- 临时 IO 失败：可重试。
- 文档结构损坏：不可自动重试，需人工修复。

## 安全考虑

- 继续复用现有 repo 边界校验与受控路径断言，防止 `taskId` 路径穿越。
- 任务发现只扫描 `.legion/tasks/` 一层目录，不递归任意深度，避免资源耗尽。
- 对损坏任务目录采用显式报错或跳过+告警的保守策略，避免把未知目录当有效任务执行写入。
- 删除 ledger 后，不再依赖“最佳努力审计”掩盖失败；错误直接返回给调用方，减少误导性成功记录。

## 备选方案

### 方案 A：保留 config.json，仅移除 ledger.csv

不选原因：`currentTask` 与任务注册表仍会保留双真源问题，且 `task switch/archive` 命令仍需要继续维护。

### 方案 B：把 config/ledger 改成新的单文件 SQLite/JSONL

不选原因：这只是换一种状态文件形式，未解决“CLI 为什么需要独立运行时数据库”的根问题；超出本任务范围。

## 兼容性、迁移与发布

### 兼容性影响

这是一次**有意的 CLI breaking change**：

- 已删除命令将不可用。
- 依赖隐式 active task 的调用方式将失效。
- `task list` / `status` 返回结构按上文兼容矩阵收敛，旧的 config 派生字段被删除。

### 迁移路径

1. 先修改 CLI 实现，移除 config/ledger 读写。
2. 同步修改 `README.md` 与 `REF_TOOLS.md` 等参考文档。
3. 把调用侧脚本统一改为显式传 `--task-id` 或 JSON `taskId`。
4. 已存在仓库中的 `config.json` / `ledger.csv` 不需要迁移，直接视为废弃历史文件。

### 发布 / 灰度

- 本仓库内先一次性完成实现 + 文档收敛；不做长期双栈兼容。
- 发布说明中明确标记：CLI 不再支持 proposal/approval、switch/archive、ledger query。

### 回滚

- 若收敛后发现仍有关键调用链依赖旧命令，直接回滚本次提交，恢复旧 CLI 与文档。
- 对**旧文件仍存在**的仓库：`git revert` 或回退到旧版本即可，旧 CLI 会继续使用已有 `config.json` / `ledger.csv`。
- 对**被新 CLI `init` 初始化、且仓库中不存在旧文件**的仓库：回退到旧 CLI 后需先补最小 stub 文件，再运行旧命令。

最小恢复步骤：

1. 在 `.legion/` 下创建 `config.json`

```json
{
  "version": "1.0.0",
  "currentTask": null,
  "settings": {
    "autoRemind": true,
    "remindBeforeReset": true,
    "taskCreationPolicy": "direct-create"
  },
  "tasks": [],
  "pendingProposals": []
}
```

2. 在 `.legion/` 下创建 `ledger.csv`

```csv
timestamp,action,task_id,task_name,user,params_summary,result
```

3. 若需要让旧 CLI 识别既有任务，使用旧版 `task create` / `task switch` 重新建立 registry，或手工按旧 schema 补齐 `tasks[]` 与 `currentTask`。

边界声明：本回滚步骤仅覆盖“恢复旧 CLI 可运行”的最小路径，不承诺自动重建历史 ledger 数据。

## 验证计划

1. `init`：执行后仅创建 `.legion/tasks/` 所需目录，不创建 `config.json` / `ledger.csv`。
2. `task create`：在无 config 情况下仍能创建 `.legion/tasks/<task-id>/plan.md|log.md|tasks.md|docs/`。
3. `task list`：仅基于任务目录枚举任务，返回名称与进度摘要。
4. `status`：未传 `--task-id` 时失败；传入现有 `taskId` 时成功返回摘要。
5. `log/tasks/plan/review/dashboard`：所有单任务命令在缺 taskId 时失败，传入 taskId 时成功读写对应目录文件。
6. 已删除命令：`propose`、`proposal *`、`task switch`、`task archive`、`ledger query` 不再出现在帮助与参考文档中，CLI 调用时统一返回 `UNSUPPORTED_COMMAND` 与固定 hint。
7. 文档一致性：`README.md`、`skills/legion-workflow/references/REF_TOOLS.md`、相关 docs 文案与实现一致，不再宣称 config/ledger 运行时依赖。
8. 主干校验：运行仓库现有可执行校验路径，确认未因删除 config/ledger 而破坏安装/验证主路径。

## 风险与回退

- **风险 1：隐藏依赖暴露**。仓库内或外部脚本可能仍依赖 `task switch` / `ledger query`。
  - 缓解：文档明确 breaking change，并在实现阶段用 grep 检查仓库内引用。
- **风险 2：任务枚举遇到脏目录**。
  - 缓解：明确“有效任务目录”判定，遇到损坏目录时返回稳定错误。
- **风险 3：错误码变动影响调用方**。
  - 缓解：新增错误码只保留 `TASK_NOT_FOUND` / `TASK_CORRUPTED` / `UNSUPPORTED_COMMAND` 三个最小增量，其他继续复用既有错误码。

## 未决问题

- `task list` 是否需要保留一个派生 `status` 字段（如 `completed/in_progress`），还是只返回 `progress` 更清晰？建议实现时按最小可用原则处理，以减少兼容面。

## 落地计划

### 预计文件变更点

- `skills/legion-workflow/scripts/lib/cli.ts`
- `skills/legion-workflow/scripts/legion.ts`
- `skills/legion-workflow/references/REF_TOOLS.md`
- `skills/legion-workflow/references/REF_AUTOPILOT.md`（若需要同步命令主干描述）
- `skills/legion-docs/references/REF_BEST_PRACTICES.md`（去掉对 active task / ledger 的陈述）
- `README.md`
- `docs/legionmind-usage.md`（如需同步 CLI 使用叙事）

### 执行步骤

1. 删除 `config.json` / `ledger.csv` 数据结构、初始化、读写与 failure audit。
2. 删除 proposal/approval、task switch/archive、ledger query 的 CLI 实现与命令分支。
3. 为 `task list`、`status`、单任务读写命令引入统一的文件系统任务发现与 taskId 必填校验。
4. 更新帮助文本、README 与参考文档。
5. 运行验证命令并记录结果到后续测试报告。
