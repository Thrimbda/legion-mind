# RFC：将 LegionMind 重构为以 `plan.md` 为唯一任务契约的 plan-only 模型

## Abstract / Motivation

当前 LegionMind 在任务层同时存在 `docs/task-brief.md` 与 `plan.md` 两套人类可读契约，导致初始化、续跑、评审和文档维护都需要在两份文件之间来回切换。用户已明确决定：LegionMind 应放弃 `task-brief.md` 模型，在 LegionMind 层只保留 `plan.md` 作为单一任务契约与执行索引，不为旧模型提供向后兼容。

本 RFC 定义一次中风险、非 Epic 的工作流重构：

- 从核心工作流中移除 `task-brief.md`。
- 将 `plan.md` 升级为唯一任务契约，统一承载问题定义、验收、假设、约束、风险、目标、要点、范围、设计索引与阶段映射。
- 保持 `context.md` 只负责进度、决策、handoff。
- 保持 `tasks.md` 只负责机器可读 checklist。
- 保持 `rfc.md` 仅在 Medium / High 风险任务下作为详细设计文档。
- 允许 `config.json` 继续作为 `plan.md` Scope 的可选 machine-readable mirror，但不再承担独立契约职责。

这次重构的核心目标不是“把两个文件写得更协调”，而是删除双真源结构，降低读取噪音、减少提示词漂移，并让任务恢复顺序收敛为以 `plan.md` 为起点的单入口模型。

## Goals & Non-Goals

### Goals

- 将 `plan.md` 定义为唯一的人类可读任务契约与执行索引。
- 从 LegionMind 核心流程、schema、prompt、commands、usage docs 中移除 `task-brief.md` 依赖。
- 明确 `plan.md` 的最小必备内容：问题定义、验收标准、假设/约束/风险、短目标、关键要点、允许 Scope、设计索引、阶段概览。
- 将 subagent / orchestrator 的首要读取入口从 `taskBriefPath` 改为 `planPath` / `plan.md`。
- 明确 LegionMind 任务文档默认使用当前用户与 agent 的工作语言，而不是英文。
- 将当前任务 `task-brief-plan` 作为 plan-only 模型样例，而不是双文件拆分样例。

### Non-Goals

- 不修改 `.legion` 核心三文件本身的底层 MCP 工具实现。
- 不重构 `context.md` 或 `tasks.md` 的 schema 职责。
- 不在 LegionMind 层为旧 `task-brief.md` 模型设计兼容分支、降级路径或双读逻辑。
- 不要求本 RFC 定义一次性批量迁移所有历史任务目录的脚本实现。
- 不把 `rfc.md` 变成所有任务都必须存在的文件；Low risk 任务仍可无 RFC。

## Definitions

- `plan.md`：任务唯一人类可读契约，兼具 task contract 与 execution index 两种职责。
- `context.md`：任务推进过程中的叙事日志，记录 progress、decisions、handoff。
- `tasks.md`：机器可读的任务清单与当前执行状态。
- `rfc.md`：Medium / High 风险任务的详细设计文档。
- `config.json`：可选的机器可读元数据文件；若存在，只能镜像 `plan.md` 中的 Scope 或其他结构化字段，不能成为并列真源。
- `planPath`：subagent invocation envelope 中指向 `plan.md` 的显式路径字段，用于替换 `taskBriefPath` 作为首要契约入口。
- 工作语言：当前用户与 agent 在该任务中的默认协作语言；若仓库已有明确语言约定，则跟随仓库约定。

## Proposed Design

### 1. 单文件任务契约模型

LegionMind 在任务层采用以下稳定分工：

- `plan.md`：唯一任务契约 + 执行索引。
- `context.md`：进度、决策、交接。
- `tasks.md`：机器可读 checklist。
- `rfc.md`：中高风险任务详细设计。

`task-brief.md` 从核心工作流中移除，不再作为创建、续跑、评审、handoff 的标准输入，也不再出现在推荐读取顺序中。

### 2. `plan.md` 的职责收敛

新的 `plan.md` 必须同时覆盖以下信息层：

- 问题陈述：为什么要做，当前痛点是什么。
- 验收标准：完成定义与关键行为。
- 假设 / 约束 / 风险：默认前提、范围边界、潜在失败模式。
- 短目标：一到两句概括期望结果。
- 关键要点：实现或交付时不能丢失的核心规则。
- Allowed Scope：允许修改的文件、模块或目录范围。
- Design Index：RFC 或其他设计材料入口。
- Phase Map：执行阶段及阶段目标。

其中：

- 问题陈述、验收标准、假设/约束/风险属于稳定契约层。
- 短目标、关键要点、Design Index、Phase Map 属于执行索引层。
- Allowed Scope 同时是安全边界与执行边界。

这意味着 `plan.md` 不再是“薄索引”，而是“单文件任务合同 + 执行索引”的复合文档；但它仍必须保持摘要级密度，不能退化成“小型 RFC”。

硬边界如下：

- `plan.md` 只保留问题、验收、假设/约束/风险、Goal、Key Points、Scope、Design Index、Phase Map 的摘要级信息。
- 凡是替代方案分析、接口字段细节、迁移步骤、验证细节、威胁模型、实现推导，一律外置到 `rfc.md` 或附属文档。
- `Design Index` 只提供链接和 1-2 段摘要，不复制详细设计正文。

禁止直接写入 `plan.md` 的内容示例：

- 多页接口/数据模型字段表。
- 大段 rollout / rollback / migration 步骤清单。
- 完整测试矩阵、review checklist 或威胁模型正文。

### 3. 推荐读取顺序

任务初始化或续跑时，读取顺序固定为：

1. 先读 `plan.md`，恢复问题、验收、范围、阶段和设计入口。
2. 若 `plan.md` 指向 `rfc.md`，再读 `rfc.md` 获取详细设计。
3. 再读 `context.md`，恢复最近进展、决策和 handoff。
4. 最后读 `tasks.md`，恢复机器可读执行状态。

对应地：

- invocation envelope 中应优先传递 `planPath`。
- `taskBriefPath` 不再是标准字段，也不应再被提示词声明为优先输入。
- 旧 `task-brief.md` 仅视为仓库残留物；LegionMind 核心流程必须忽略它，且不得读取、生成、更新或将其作为回退输入。

### 4. Orchestrator / Subagent 行为约定

- Orchestrator 初始化任务时，先创建或更新 `plan.md`，写入完整任务契约。
- Medium / High 风险任务再生成 `rfc.md`，并在 `plan.md` 的 Design Index 中显式引用。
- `context.md` 与 `tasks.md` 的写回规则不变。
- subagent 默认先读 `planPath`，再按需读 `rfcPath`，不再要求 `taskBriefPath`。
- 当前任务 `task-brief-plan` 应在文档、示例和说明中被表述为“plan-only 改造样例”。

### 5. 文档语言规则

LegionMind 任务文档默认使用当前用户与 agent 的工作语言。只有当仓库已存在明确、稳定的文档语言规范时，才统一跟随仓库约定。英文不再因为历史模板、标题或样例而被视为默认值。

该规则适用于：

- `plan.md`
- `context.md`
- `tasks.md`
- `docs/rfc.md`
- `docs/research.md`
- `docs/implementation-plan.md`
- `docs/review-*.md`
- `docs/test-report.md`
- `docs/pr-body.md`

### 6. 端到端流程

新流程如下：

1. 创建任务目录。
2. 生成 `plan.md`，写入完整任务契约与执行索引。
3. 根据风险等级决定是否生成 `rfc.md`。
4. 实现者以 `plan.md` 为首要入口推进设计、实现、验证。
5. `context.md` 持续记录进度与决策；`tasks.md` 持续记录 checklist 状态。
6. 交付、评审、测试、PR 文档均以 `plan.md` 的验收与 Scope 为上游契约，以 `rfc.md` 为详细设计依据。

## Alternatives

### 方案 A：继续保留 `task-brief.md` + `plan.md` 双文件模型，仅调整边界

不选原因：用户已明确拒绝双文件模型，并要求 LegionMind 层不保留旧模型兼容。继续保留双文件会让读取顺序、提示词契约、schema 说明持续存在双真源风险。

### 方案 B：保留 `task-brief.md` 作为历史兼容输入，但新任务主推 `plan.md`

不选原因：这种“软迁移”会迫使 orchestrator、commands、subagent prompts 长期维护两套入口判断，扩大实现和文档复杂度，也会让 reviewer 无法快速判断哪个文件才是真源。

### 方案 C：彻底移除 `config.json`，让 `plan.md` 成为唯一 Scope 表达

不选原因：本次改造聚焦在人类可读契约收敛，不扩展到现有机器可读元数据入口。保留 `config.json` 作为 mirror 可以减少对既有工具链和校验逻辑的连带改动，但它不再拥有独立语义。

## Data Model / Interfaces

### `plan.md` 最小字段模型

新的 `plan.md` 逻辑上必须覆盖以下 section 或同义结构：

- Problem Statement
- Acceptance Criteria
- Assumptions / Constraints / Risks
- Goal
- Key Points
- Scope
- Design Index（有设计材料时必填）
- Phase Map

约束：

- Problem Statement 必须说明当前问题与期望结果，避免只写泛化口号。
- Acceptance Criteria 必须可映射到测试、人工检查或交付产物。
- Assumptions / Constraints / Risks 必须体现默认前提、边界和主要失败风险。
- Scope 必须是允许修改范围的唯一人类可读真源。
- Design Index 只引用设计文档，不复制大段设计内容。
- Phase Map 必须能支持任务续跑，不写成空泛阶段名。

### `config.json` 兼容策略

- `config.json` 可存在，也可不存在。
- 若存在，其 Scope 只能镜像或结构化表达 `plan.md` 中的同一范围。
- `config.json` 不能比 `plan.md` 更宽，也不能比 `plan.md` 更窄后默默生效。
- 一旦 `plan.md` 与 `config.json` 不一致，应视为 drift，需要同次修复。

### Invocation Envelope 接口调整

- 首要契约输入从 `taskBriefPath` 切换为 `planPath`。
- `rfcPath` 保持可选，仅在存在详细设计时提供。
- 与任务文档有关的 agent / command 文档都应将“先读 `planPath`”写成固定规则。

### 最小迁移清单

本次迁移至少必须覆盖以下五类触点，并以“旧字段清零”为验收：

1. envelope / reference：`REF_ENVELOPE.md` 与任何 invocation 示例必须使用 `planPath`。
2. orchestrator prompt：主流程必须以 `plan.md` 为首要输入，不再要求 `task-brief.md`。
3. subagent prompt：所有消费任务契约的 subagent 必须改读 `planPath` / `plan.md`。
4. commands / usage docs：所有创建、续跑、实现、评审、交付命令与用户指南必须改为 plan-only 口径。
5. review / test / report 文档模板：验收、检查项、链接字段必须改为 `plan.md`，不得再把 `taskBriefPath` 或 `docs/task-brief.md` 作为标准字段。

验收规则：

- `taskBriefPath` 不再作为标准字段出现；出现即 FAIL。
- `docs/task-brief.md` 不再作为推荐输入、推荐输出或标准链接字段出现；出现即 FAIL。

## Error Semantics

### 可恢复错误

- 某处 prompt 或 command 仍引用 `taskBriefPath`：可通过更新文案和 envelope 规范恢复。
- 某处使用文档仍把 `task-brief.md` 当作标准输入：可通过文档修复恢复。
- `plan.md` 缺少某些稳定契约字段：可通过补写 `plan.md` 恢复，不需要额外迁移层。

### 不可接受错误

- 任何核心文档仍将 `task-brief.md` 声明为标准必读文件。
- 某个流程要求同时维护 `task-brief.md` 与 `plan.md` 两套真源。
- `config.json` 被定义为可独立覆盖 `plan.md` Scope 的入口。
- `context.md` 或 `tasks.md` 被重新塞入稳定任务契约职责。

### 重试语义

- 文档生成与改写是幂等的文本操作，可安全重试。
- 发现旧模型残留时，应直接改到新模型，而不是加一层兼容说明。
- Medium risk 验证失败时，应先修正 `plan.md` / `rfc.md` 契约，再重跑检查。

## Security Considerations

- Scope 边界：`plan.md` 的 Scope 是唯一人类可读授权边界，能减少越界修改。
- 输入校验：agent 应从显式提供的 `planPath` / `rfcPath` 读取，不自行猜测旧路径。
- 滥用防护：删除双真源后，reviewer 更容易确认任务实际授权范围与验收口径。
- 资源耗尽：首要入口收敛为 `plan.md` 可减少续跑时的重复全量读取和提示词膨胀。
- 文档注入风险：Design Index 只能链接设计文档，不应在 `plan.md` 粘贴大段实现细节，避免契约层被非必要内容污染。

## Backward Compatibility & Rollout

### Backward Compatibility

本设计在 LegionMind 层明确不保留对旧 `task-brief.md` 模型的向后兼容。也就是说：

- 新规范不再要求生成 `task-brief.md`。
- 核心 prompts / commands / usage docs 不再将 `task-brief.md` 作为标准输入。
- 不设计“双读 task-brief 或 plan”的长期分支。

历史任务目录中残留旧文件是仓库事实，但不是 LegionMind 未来契约的一部分；实现和文档不应围绕它继续扩展复杂度。旧 `task-brief.md` 只能被视为残留物，不得被读取、生成、更新、同步或作为回退输入。

### Rollout

1. 先更新 schema、skill、agent prompt、commands、usage docs 的术语和读取顺序。
2. 将 invocation envelope 中的首要路径字段改为 `planPath`。
3. 将当前任务样例和相关文档统一改写为 plan-only 模型。
4. 验证所有被触达文件都不再把 `task-brief.md` 作为核心依赖。

### Rollback

- 若本次改造引发明显工作流混乱，可整体回退本次文档与 prompt 改动。
- 回滚对象是契约文档和提示词，不涉及 `.legion` 三文件底层 schema 迁移。
- 回滚不应以新增兼容层为手段，而应直接恢复上一个明确模型。

## Verification Plan

- 验证 `REF_SCHEMAS.md` 将 `plan.md` 定义为唯一任务契约，并移除 `task-brief.md` 的核心工作流地位。
- 验证 `SKILL.md`、`.opencode/agents/**`、`.opencode/commands/**` 统一使用 `planPath` / `plan.md` 作为首要读取入口。
- 验证 `docs/legionmind-usage.md` 清楚说明 `plan.md`、`context.md`、`tasks.md`、`rfc.md` 的职责，不再教授双文件模型。
- 验证 `config.json` 在文档中只被描述为可选 mirror，而不是第二真源。
- 验证当前任务文档与样例说明被重写为 plan-only 模型示例。
- 验证所有任务文档默认语言规则明确为“当前工作语言优先”，而非英文默认。
- 验证 Medium risk 任务仍通过 `rfc.md` 承载详细设计，而不是把详细设计塞回 `plan.md`。
- 执行固定检索词检查：`taskBriefPath`、`docs/task-brief.md`、`task-brief.md` 在核心 workflow 文档中出现即 FAIL。

## Open Questions

- 是否需要额外增加 lint / review checklist，自动发现新文档中重新出现 `taskBriefPath` 或 `docs/task-brief.md` 的核心契约表述？
- 历史任务目录中的旧 `task-brief.md` 是否需要在后续单独开任务做仓库级清理，还是只在触达时按新模型重写？

## Plan

### 文件变更点

- `skills/legionmind/references/REF_SCHEMAS.md`
  - 删除或降级 `task-brief.md` 的核心工作流地位。
  - 将 `plan.md` 重写为单一任务契约 + 执行索引 schema。
  - 保留 `config.json` 为可选 mirror 的约束。
- `skills/legionmind/SKILL.md`
  - 更新三文件职责描述与推荐读取顺序。
- `.opencode/agents/**`
  - 将 `taskBriefPath` 优先入口替换为 `planPath`。
  - 删除要求先读 `task-brief.md` 的表述。
- `.opencode/commands/**`
  - 将任务初始化、RFC、实现、PR 流程改写为 plan-only 模型。
- `docs/**`
  - 更新用户使用说明、流程示例与长期约定。
- `.legion/tasks/task-brief-plan/docs/rfc.md`
  - 作为本次改造的详细设计依据。

### 验证步骤

1. 全局检查 `task-brief.md`、`taskBriefPath`、`planPath`、`plan.md` 的术语是否符合新契约。
2. 人工抽查 schema、skill、agent、commands、usage docs 是否都把 `plan.md` 视为首要契约入口。
3. 抽查当前任务样例，确认其被解释为 plan-only 模型，而不是双文件边界拆分模型。
4. 复核 `config.json` 相关表述，确认其仅是 mirror。
5. 复核语言规则，确认不再出现“默认英文”的隐式约定。
