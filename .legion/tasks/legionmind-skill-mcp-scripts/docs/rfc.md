# RFC：将 LegionMind skill 从 MCP 改写为 scripts-first CLI

> 状态：Draft（review-rfc 修订中）
> 任务：`legionmind-skill-mcp-scripts`
> 风险：Medium
> 设计真源：`/Users/c1/Work/legion-mind/.legion/tasks/legionmind-skill-mcp-scripts/docs/rfc.md`
> 参考：`plan.md`、`docs/research.md`、`docs/review-rfc.md`

## Executive Summary

1. 本次迁移的目标不是“给 MCP 文案换皮”，而是把 LegionMind 的默认执行面改为 **bundled scripts**，让 skill 在没有外部 `legionmind-mcp` 的前提下也能完整驱动 `.legion/` 工作流。
2. 默认入口统一为 `skills/legionmind/scripts/legion.ts`，采用“单一主入口 + 子命令 + 共享服务层”覆盖当前 `legion_*` 能力。
3. `.legion/` schema 保持不变；兼容层只保留为历史映射说明，不再把 `mcp.legionmind` 作为 READY 或默认路径前提。
4. 实施拆成 3 个里程碑：M1 CLI parity + smoke harness；M2 skill/references scripts-first；M3 commands/setup/README 切默认入口并完成回归扫描。
5. 默认原则是 **CLI 优先**；只有 CLI 暂时不可用且 orchestrator 明确持有 schema 时，才允许应急直接落盘 `plan/context/tasks`，并必须留痕。
6. 只有当 M1、M2、M3 全部通过后，仓库文案才彻底把默认入口切到 CLI；否则优先回滚默认入口文案，而不是删掉脚本实现。

## 摘要 / 背景动机

当前仓库把 LegionMind 的默认执行面绑定在 `legion_*` MCP 工具上，导致 skill 文案、命令文档、安装校验与 agent 指令都假设外部 MCP server 可用；这与 skill-creator 要求的“SKILL.md 精简、确定性动作下沉到 scripts、详细说明放 references”不一致，也削弱了 skill 的自包含性与可移植性。

本 RFC 决定把 LegionMind 改为 **scripts-first** 架构：以 `skills/legionmind/scripts/legion.ts` 作为单一主入口，通过子命令覆盖 `.legion/` 生命周期管理、查询、更新、review、dashboard、ledger 等能力；MCP 相关表述降级为历史兼容/外部实现说明，不再是仓库默认路径。

## 目标与非目标

### 目标

1. 定义单一 CLI 入口 + 子命令的推荐形态，完整覆盖 init / propose / approve / query / update / review / dashboard / ledger。
2. 保留 `.legion/` 三文件契约、proposal 审批流、Review 语法、dashboard/ledger 审计能力。
3. 按 skill-creator 规范重写 `skills/legionmind/SKILL.md` 与 references：frontmatter 精简、正文命令式、细节下沉到 `references/` 与 `scripts/`。
4. 同步改写 `.opencode/agents/legion.md`、命令文档、`scripts/setup-opencode.ts`、`README.md`、`.legion/playbook.md` 中的默认路径与验证口径。
5. 补齐参考 MCP 实现与当前 schema 的缺口，至少覆盖 `update_context.addFile`、`update_context.addConstraint`、`update_tasks.addTask` 等现有契约。
6. 给出可执行验证方案，至少包含 smoke test、回归扫描、错误码与排障入口。

### 非目标

1. 不在本次引入新的远程服务、数据库或守护进程。
2. 不重做 `.legion/` 核心 schema；仅在 scripts 侧补齐既有 schema 的落地实现。
3. 不承诺发布一个面向仓库外部用户的稳定公共 CLI API；本次只保证仓库内默认工作流可用。
4. 不扩展出 README/INSTALLATION_GUIDE/CHANGELOG 类 skill 内额外文档。

## 术语定义

- **scripts-first**：仓库内默认通过本地脚本完成 LegionMind 操作；文档、命令和验证均以脚本为主路径。
- **Legion CLI**：`skills/legionmind/scripts/legion.ts` 暴露的命令行入口。
- **schema 缺口**：`REF_SCHEMAS.md` / `REF_TOOLS.md` 已声明，但参考 mcp server 未完整实现的参数或行为。
- **兼容层**：为了降低迁移成本而保留的历史措辞或包装器；不再作为默认执行面。

## MCP → CLI parity matrix

| 现有工具 / 参数 | CLI 命令 / 参数 | 处理策略 |
| --- | --- | --- |
| `legion_init(workingDirectory)` | `legion.ts init --cwd <dir>` | 等价；`workingDirectory` 收敛为 `--cwd` |
| `legion_create_task(name, goal, points, scope, phases)` | `legion.ts task create --json '{...}'` | 保留但默认受限；主流程推荐 `propose + proposal approve` |
| `legion_propose_task(...)` | `legion.ts propose --json '{...}'` | 等价 |
| `legion_list_proposals(status)` | `legion.ts proposal list --status <pending|approved|rejected|all>` | 等价；默认 `pending` |
| `legion_approve_proposal(proposalId)` | `legion.ts proposal approve --proposal-id <id>` | 等价 |
| `legion_reject_proposal(proposalId, reason)` | `legion.ts proposal reject --proposal-id <id> [--reason ...]` | 等价 |
| `legion_get_status(taskId)` | `legion.ts status [--task-id <id>] --format json` | 等价 |
| `legion_list_tasks()` | `legion.ts task list --format json` | 等价 |
| `legion_read_context(taskId, section, includeReviews)` | `legion.ts context read [--task-id <id>] [--section ...] [--include-reviews true|false]` | 等价；保留 `section/includeReviews` |
| `legion_list_reviews(taskId, status, type)` | `legion.ts review list [--task-id <id>] [--status ...] [--type ...]` | 等价 |
| `legion_respond_review(file, reviewId, response, status)` | `legion.ts review respond --file <file> --review-id <id> --response <text> --status <resolved|wontfix|need-info>` | 等价 |
| `legion_update_plan(goal, points, scope, phases)` | `legion.ts plan update --json '{...}'` | 兼容保留；`phases` 仅允许摘要级更新 |
| `legion_update_context(progress, addFile, addDecision, addConstraint, handoff)` | `legion.ts context update --json '{...}'` | 等价；必须补齐 `addFile/addConstraint` |
| `legion_update_tasks(completeTask, setCurrentTask, addTask, addDiscoveredTask, updatePhaseStatus)` | `legion.ts tasks update --json '{...}'` | 等价；`updatePhaseStatus` 降级为内部自动推导，不再暴露写接口 |
| `legion_switch_task(taskId)` | `legion.ts task switch --task-id <id>` | 等价 |
| `legion_archive_task(taskId)` | `legion.ts task archive --task-id <id>` | 等价 |
| `legion_generate_dashboard(format, taskId, includeSections, outputPath)` | `legion.ts dashboard generate --format <markdown|html> [--task-id <id>] [--sections ...] [--output ...]` | 等价 |
| `legion_query_ledger(taskId, action, since, until, limit)` | `legion.ts ledger query [--task-id <id>] [--action ...] [--since ...] [--until ...] [--limit N]` | 等价；保留时间过滤 |

**废弃 / 降级说明**

1. 不再暴露“默认通过 MCP 调用”的仓库内路径；`legion_*` 仅作为历史映射名出现在 references。
2. `updatePhaseStatus` 从外显写接口降级为脚本内部自动推导，避免与 checklist 真实状态漂移。
3. `task create` 继续受策略保护；默认仍应使用 proposal approval 流，而不是跳过审批直接建 task。

## 方案设计

### 1. 总体架构

采用“一个主入口脚本 + 多个子命令 + 共享文件系统服务层”的结构：

1. `skills/legionmind/scripts/legion.ts`
   - 解析命令行参数。
   - 统一错误码、JSON/文本输出、`--cwd` 处理。
   - 分发到具体子命令。
2. `skills/legionmind/scripts/lib/*`
   - 承载任务目录解析、Markdown 读写、review 解析、ledger/dashboard 生成、schema 校验、task id 规范化、path guard 等共享逻辑。
3. `skills/legionmind/references/*`
   - 保留 schema、workflow、best practices、CLI 参考。
   - 删除“必须优先使用 MCP”措辞，替换为“默认运行 bundled scripts”。
4. `.opencode/agents/*.md` 与 `.opencode/commands/*.md`
   - 从“调用 `legion_*` 工具”改为“调用 Legion CLI；必要时按 schema fallback”。
5. `scripts/setup-opencode.ts` / `package.json` / `README.md`
   - 暴露安装后的脚本入口与 verify 逻辑；不再把 `mcp.legionmind` 当默认依赖。

### 2. CLI 形态

推荐命令面：

```text
node --experimental-strip-types skills/legionmind/scripts/legion.ts <command> [options]
```

如需更短入口，可在 `package.json` 增加 alias，但 **单一主入口 + 子命令** 是唯一推荐形态，避免把能力拆成孤立脚本。

#### 2.1 子命令集合

- `init`
- `propose`
- `proposal list|approve|reject`
- `task create|list|switch|archive`
- `status`
- `context read|update`
- `tasks read|update`
- `plan update`
- `review list|respond`
- `dashboard generate`
- `ledger query`

#### 2.2 参数约定

1. 默认以 `--cwd <repoRoot>` 决定 `.legion/` 根路径；未传时取当前工作目录。
2. 结构化输入优先使用 `--json '<payload>'`；为少数字段型命令保留显式 flags（如 `--proposal-id`、`--review-id`）。
3. 面向 agent 的输出优先支持 `--format json`；面向人类默认输出简洁摘要。
4. 所有修改类命令必须具备幂等保护：重复执行不能写坏格式，必要时返回 `NO_CHANGES`。

### 3. 修改类 payload 固定字段表

为避免 `--json` 漂移，修改类命令只接受下表中的顶层字段；**未知字段一律报 `SCHEMA_INVALID`**。

| 命令 | 必填 | 可选 | 说明 |
| --- | --- | --- | --- |
| `task create` | `name`, `goal` | `points`, `scope`, `phases` | `phases` 为 `{ name, tasks[] }[]` |
| `propose` | `name`, `goal`, `rationale` | `points`, `scope`, `phases` | 与当前 proposal schema 对齐 |
| `plan update` | 无 | `taskId`, `goal`, `points`, `scope`, `phases` | `phases` 仅用于阶段摘要更新 |
| `context update` | 无 | `taskId`, `progress`, `addFile`, `addDecision`, `addConstraint`, `handoff` | `progress` 仅允许 `completed/inProgress/blocked` |
| `tasks update` | 无 | `taskId`, `completeTask`, `setCurrentTask`, `addTask`, `addDiscoveredTask` | `updatePhaseStatus` 不对外暴露 |
| `review respond` | `file`, `reviewId`, `response`, `status` | `taskId` | `status` 限 `resolved/wontfix/need-info` |

### 4. CLI 与直接落盘的边界

- **默认**：所有写操作都走 CLI，以保证 schema 校验、ledger 审计、错误码统一。
- **允许 fallback 的唯一场景**：CLI 暂时不可用，但 orchestrator 已经持有明确 schema，且只需应急更新 `plan.md` / `context.md` / `tasks.md`。
- **fallback 禁止项**：proposal 审批、review 响应、ledger/dashboard 生成、任何需要自动解析和幂等修复的操作。
- **留痕要求**：凡使用 fallback，必须在 `context.md` 记录原因，并在 PR body 标注为暂时兼容措施。

## SKILL.md 与 references 收敛规则

### SKILL.md MUST

1. frontmatter 只保留 `name` 与 `description`。
2. 正文使用命令式说明，只保留触发条件、核心规则、读取顺序、设计门禁、何时运行脚本。
3. 所有命令示例都引用 `skills/legionmind/scripts/legion.ts` 或对应 references，不再引用 `legion_*` MCP 工具。
4. 详细 schema、参数表、错误码、示例 payload 统一放在 `references/`。
5. 明确说明 orchestrator 负责统一写回 `.legion`，subagent 不直接改三文件。

### SKILL.md MUST NOT

1. 不在 `SKILL.md` 内复制长篇 schema、payload 表、迁移细节或测试矩阵。
2. 不新增 README / INSTALLATION_GUIDE / CHANGELOG 等 skill 内额外文档。
3. 不把 commands/agent 的逐条执行细节重新粘回 `SKILL.md`。
4. 不把 MCP 表述继续写成默认路径。
5. 不把临时排障笔记或一次性实现细节沉淀进 skill 正文。

### references 调整原则

1. `REF_TOOLS.md` 改为 CLI 参考，列出命令、关键参数、错误码、输出结构。
2. `REF_SCHEMAS.md` 保持 schema 真源，但去掉“兼容 MCP / 由 MCP 自动生成”等默认表述，改为“由 Legion CLI 保证/生成”。
3. `REF_BEST_PRACTICES.md`、`REF_CONTEXT_SYNC.md`、`REF_AUTOPILOT.md` 改成 scripts 工作流示例。
4. 不新增额外说明文档；已有 references 内部消化迁移细节。

## 数据模型与兼容策略

1. `.legion/` 目录结构继续以 `REF_SCHEMAS.md` 为准，不引入新顶层文件。
2. `plan.md` 模板必须对齐当前仓库 schema，至少包含问题陈述、验收标准、假设/约束/风险、设计索引；不能照搬参考 mcp server 的旧模板。
3. `context update` 必须完整支持：
   - `progress.completed / inProgress / blocked`
   - `addFile { path, purpose, status, notes }`
   - `addDecision { decision, reason, alternatives, date }`
   - `addConstraint`
   - `handoff { nextSteps, notes }`
4. `tasks update` 必须完整支持：
   - `completeTask`
   - `setCurrentTask`
   - `addTask`
   - `addDiscoveredTask`
   - phase 状态由脚本自动推导
5. `plan update` 保留 `goal/points/scope/phases` 字段兼容；其中 `phases` 只允许更新阶段摘要，不承载详细任务重排。
6. review block 解析与 ledger/dashboard helper 可沿用参考实现思路，但输出格式以本仓库 schema 为准。
7. 所有 JSON 错误输出采用固定结构：`{ success:false, error:{ code, message, hint? } }`；成功输出统一带 `success:true`。`hint` 为可选字段，仅在错误可恢复且存在明确下一步时返回。

## 错误语义与排障入口

建议至少保留以下错误类型：

- `NOT_INITIALIZED`
- `NO_ACTIVE_TASK`
- `TASK_ALREADY_EXISTS`
- `PROPOSAL_NOT_FOUND`
- `SCHEMA_INVALID`
- `OUT_OF_SCOPE`
- `REVIEW_NOT_FOUND`
- `NO_CHANGES`

重试语义：

1. 查询类可直接重试。
2. 修改类仅在输入相同且上次返回 `NO_CHANGES` / 瞬态 I/O 错误时允许重试。
3. 对 markdown 结构损坏、scope 违规、非法参数等逻辑错误，不应自动重试。

排障顺序：

1. 先看 `scripts/setup-opencode.ts verify`：确认资产已安装、默认入口是否切换正确。
2. 再跑 smoke harness：区分 CLI parity 问题、schema 漂移、夹具假设错误。
3. 最后查 `.legion/ledger.csv`：定位具体失败 action、taskId、paramsSummary。

## 安全考虑

1. **输入校验**：所有路径必须解析到 `repoRoot/.legion` 或 scope 内允许位置，拒绝 `..`、绝对路径注入与软链绕过。
2. **权限边界**：默认只改 `.legion/` 与本 RFC scope 明确允许的仓库文件；命令文档不得引导 agent 越权写入 scope 外路径。
3. **滥用面**：`--json` payload 做字段白名单校验，未知字段报错而不是静默忽略。
4. **资源耗尽**：ledger query、context read 等命令支持 limit/section/filter，避免一次性读取超大文件；dashboard 生成避免全仓扫描。
5. **审计**：所有修改类命令写入 `ledger.csv`，记录时间、taskId、action、结果。

## 备选方案

### 方案 A：继续以 MCP 为默认路径，只补文档

- 优点：代码改动少。
- 缺点：无法解决 skill-creator 规范不匹配、自包含性差、参考路径缺失等根因。
- 不选原因：本任务目标是把默认执行面改成 scripts，不是给 MCP 路径换文案。

### 方案 B：为每个能力提供一个独立脚本

- 优点：实现时拆分简单。
- 缺点：入口分散，参数协议难统一，命令文档和 setup verify 成本高。
- 不选原因：与“单一主入口 + 子命令”的可发现性、可测试性和可组合性目标冲突。

### 方案 C：采用单一主入口脚本 + 子命令（选定）

- 优点：统一错误码、共享解析层、便于 smoke test、便于在 skill 文案中引用。
- 代价：初次实现需要整理命令树与公共 helper。
- 选择原因：最适合替代现有 `legion_*` 工具心智模型，同时保持本地可运行与仓库自包含。

## 里程碑与完成定义（Milestones）

### M1：CLI parity + smoke harness

**范围**：`skills/legionmind/scripts/**`、必要的 `package.json` / 根级验证脚本。

**完成定义（DoD）**：

1. `init / propose / approve / status / context read+update / tasks update / review list+respond / dashboard generate / ledger query` 全部可运行。
2. parity matrix 中标记为“等价”的能力都有对应子命令与参数。
3. smoke harness 能在临时目录完成端到端最小流并返回 0。
4. `addFile`、`addConstraint`、`addTask` 有专项断言。

### M2：skill / references 切 scripts-first

**范围**：`skills/legionmind/SKILL.md`、`skills/legionmind/references/**`。

**完成定义（DoD）**：

1. `SKILL.md` 满足本 RFC 的 MUST / MUST NOT。
2. `REF_TOOLS.md` 已改为 CLI 参考，schema/workflow references 不再把 MCP 写成默认路径。
3. references 中存在必要的 CLI 调用示例、payload 提示与错误码索引。

### M3：commands / setup / README 切默认入口

**范围**：`.opencode/agents/legion.md`、`.opencode/commands/*.md`、`scripts/setup-opencode.ts`、`README.md`、`.legion/playbook.md`（如需要）。

**完成定义（DoD）**：

1. scope 内默认工作流说明均已切换到 CLI 或明确 fallback。
2. verify 不再把 `mcp.legionmind` 作为 READY 前提，只把它视为历史兼容配置。
3. 回归扫描通过，未再出现“默认使用 `legion_*` MCP 工具”的表述。

## 向后兼容、迁移、发布与回滚

### 向后兼容

1. `.legion/` 目录结构与文档 schema 保持兼容，不做数据迁移。
2. 旧文档中出现的 `legion_*` 名称可在 references 中短暂保留“历史映射表”，但默认指令一律改为 CLI。
3. 若 verify 仍探测到 `mcp.legionmind`，应仅提示“检测到历史兼容配置”，不能再作为 READY 前提。

### 迁移步骤

1. 先实现 CLI 与共享 helper，确保脚本可在临时目录生成/更新 `.legion/`。
2. 再重写 `SKILL.md` 与 references，把默认工作流切到 scripts。
3. 同步更新 `.opencode/agents/legion.md`、`legion*.md`、`evolve.md` 的调用说明。
4. 更新 `scripts/setup-opencode.ts`、`package.json`、`README.md`，使安装与 verify 指向 CLI。
5. 最后做仓库回归扫描，确认默认文案中不再依赖 `legion_*` MCP。

### 发布 / 灰度

1. M1/M2 期间允许保留历史映射说明，但 README/setup 不切默认入口。
2. 只有当 M1 smoke harness 与 M2 文档检查都通过后，才进入 M3，切换 README/setup/commands 的默认入口。
3. 若 M3 回归失败，立即回滚默认入口文案，但保留 CLI 代码继续修复，避免出现“文档已切换、默认路径不可用”的半迁移状态。

### 回滚

触发条件（任一满足即触发）：

1. M1 smoke harness 连续失败，且失败原因属于 CLI 本身而非夹具问题。
2. parity matrix 中任一“等价”能力在实现后被证明缺失/掉参。
3. M3 后 verify 或 commands 文案导致默认入口不可用，或回归扫描发现仍有默认 MCP 依赖。
4. 路径校验 / schema 更新 bug 造成 `.legion/` 文件损坏。

回滚步骤：

1. 若仍处于 M1/M2，仅回滚当前代码改动，不切默认入口文案。
2. 若已进入 M3，优先恢复 `README.md`、`.opencode/commands/*.md`、`scripts/setup-opencode.ts` 的默认入口说明，再决定是否回滚 `skills/legionmind` 文案。
3. 保留 CLI 代码与已生成 `.legion/` 数据文件，除非脚本本身存在破坏性写入风险；schema 不变，因此默认不做数据迁移。
4. 通过 `ledger.csv` 确认最后一次失败操作，并把回滚原因写入后续修复 PR / context。

## 验证计划

### 1. Smoke test（必须）

固定入口：

- `node --experimental-strip-types scripts/legionmind/smoke.ts`

`npm run legionmind:smoke` 仅作为上述唯一文件的 alias，不再允许第二个实现位置。

临时目录夹具：

- 自动创建空仓库临时目录（含最小 `README.md`）。
- smoke 脚本在该目录内调用 `skills/legionmind/scripts/legion.ts`。

最小步骤与断言：

1. `init` 创建 `.legion/`。
   - 断言：`.legion/config.json`、`ledger.csv`、`tasks/` 存在。
2. `propose` + `proposal approve` 生成任务三文件与 `docs/`。
   - 断言：`plan.md` 含当前 schema 必需标题，`docs/` 已创建。
3. `context update` 写入 `progress/addFile/addDecision/addConstraint/handoff`。
   - 断言：`context.md` 中能看到 `addFile`、`addConstraint`、决策表、handoff 更新结果。
4. `tasks update` 写入 `completeTask/setCurrentTask/addTask/addDiscoveredTask`。
   - 断言：`tasks.md` 中新增任务、发现的新任务与 CURRENT 标记正确。
5. `review respond` 对样例 Review block 成功回复。
   - 断言：目标文件出现 `[RESPONSE]` 与 `[STATUS:*]`。
6. `dashboard generate` 与 `ledger query` 可产出非空结果。
   - 断言：dashboard 输出文件非空，ledger 至少返回 1 条修改类记录。

返回码约定：

- 全部通过返回 `0`
- parity 缺失 / 断言失败返回 `2`
- CLI 运行异常返回 `3`

### 2. 回归扫描（必须）

固定入口（建议其一）：

- `rg -n "legion_(init|create_task|get_status|read_context|update_context|update_tasks|respond_review)|优先使用 MCP|必须通过 MCP|mcp\.legionmind" <scope...>`
- 或根级脚本 `scripts/legionmind/check-no-default-mcp.ts`

规则：

1. scope 内默认工作流说明不再要求 `legion_*` MCP；若保留历史映射，必须带“历史兼容/非默认”语义。
2. references 的 CLI 命令面与 parity matrix 一致。
3. `README.md`、setup verify、命令文档的默认入口一致。
4. 历史映射表允许在 `skills/legionmind/references/REF_TOOLS.md` 或明确标注“历史兼容”的章节中出现 `legion_*` 名称；其它位置命中则视为失败。
5. 若扫描命中默认 MCP 语义，返回非零并打印命中文件/行号。

### 3. 验收映射

- 目标架构 → 通过 CLI smoke test + 文档引用一致性验证。
- CLI 覆盖 init/propose/approve/query/update/review/dashboard/ledger → 通过 parity matrix + 子命令级 smoke test。
- SKILL.md 符合 skill-creator → 通过 MUST/MUST NOT 人工 review + 无新增多余文档。
- 命令文档与 setup 同步 → 通过回归扫描。
- schema 缺口补齐 → 通过 `addFile/addConstraint/addTask` 专项断言。

## 排障入口（Observability / Troubleshooting）

1. **先看 verify**：若安装资产缺失或默认入口未切换，先修 `scripts/setup-opencode.ts` / README / package alias。
2. **再跑 smoke harness**：区分 CLI parity 问题、schema 漂移、夹具假设错误。
3. **最后查 `ledger.csv`**：定位最后一次失败 action、taskId、paramsSummary，判断是路径、参数还是 markdown 更新逻辑异常。
4. **JSON 错误结构**：所有失败必须输出 `{ success:false, error:{ code, message, hint? } }`，便于脚本与 agent 自动判定。
5. **人工排障顺序**：verify → smoke → ledger → 目标 markdown 文件 diff；不要直接大面积重跑或手工修补全部文案。

## 开放问题

无。

## 落地计划

### 文件改动点

1. `skills/legionmind/scripts/**`
   - 新增 CLI 主入口与共享 helper。
2. `skills/legionmind/SKILL.md`
   - 精简为 skill-creator 风格，切换为 scripts-first。
3. `skills/legionmind/references/**`
   - `REF_TOOLS.md` 改 CLI 参考；其余 references 去 MCP 默认化并对齐 schema。
4. `.opencode/agents/legion.md`
   - 初始化/恢复/更新流程改为调用 CLI 或按 schema fallback。
5. `.opencode/commands/legion.md`
   - `.opencode/commands/legion-impl.md`
   - `.opencode/commands/legion-rfc-heavy.md`
   - `.opencode/commands/legion-pr.md`
   - `.opencode/commands/evolve.md`
   - 统一更新默认工作流与术语。
6. `scripts/setup-opencode.ts`、`package.json`、`README.md`
   - 安装、verify、示例命令、仓库说明切换到 CLI。
7. `.legion/playbook.md`
   - 如旧约定仍强调 MCP 默认路径，则补充 scripts-first 约定。

### 建议实现顺序

1. 先落 CLI 服务层与 smoke harness。
2. 再改 skill/references。
3. 再改 commands/agent/setup/README。
4. 最后做回归扫描与必要修文。
