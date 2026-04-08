# 现状调研：LegionMind skill 的 MCP → scripts 迁移

## 结论摘要

- 当前仓库把 LegionMind 的默认执行面绑定在 `legion_*` MCP 工具上，影响 skill 文案、参考文档、命令提示与安装校验。
- `skill-creator` 明确建议把确定性动作做成 `scripts/`，保持 `SKILL.md` 精简，并避免多余文档；这与当前 LegionMind skill 的组织方式存在偏差。
- 可参考的 `legionmind-mcp` 源码不在用户提到的 `~/Work/agents/mcp-servers/` 下；本机实际可用源位于 `/Users/c1/Work/mcp-servers/mcp-servers/legionmind-mcp`。
- 参考实现覆盖了大部分 `.legion/` 生命周期能力，但仍有文档/代码不一致之处（例如 `update_context` / `update_tasks` 的部分参数未完整落地），迁移时应顺手补齐。

## 证据

### 1) skill 正文与 references 直接绑定 MCP

- `skills/legionmind/SKILL.md:34-38` 把 `tasks.md` 描述为“必须通过 MCP 工具更新以保持格式”。
- `skills/legionmind/SKILL.md:68-76` 明确要求“优先使用 MCP 工具”，并列出 `legion_init`、`legion_get_status`、`legion_update_tasks` 等接口。
- `skills/legionmind/references/REF_TOOLS.md:1-66` 整份文档都是 “LegionMind MCP 工具参考”。
- `skills/legionmind/references/REF_SCHEMAS.md:94,202,241` 仍保留“为了兼容 MCP”“通过 MCP 高频更新”“由 MCP 自动生成”等措辞。
- `skills/legionmind/references/REF_BEST_PRACTICES.md:55-71` 使用 `legion_list_reviews`、`legion_read_context`、`legion_update_tasks`、`legion_update_context` 作为默认工作流指令。

### 2) 仓库命令与 agent 文档沿用 `legion_*` 工具心智模型

- `.opencode/commands/legion.md:13-16` 要求 `.legion/` 存在时调用 `legion_get_status`，不存在时调用 `legion_create_task`。
- `.opencode/commands/legion-impl.md:6-9` 规定实现阶段先用 `legion_get_status` 恢复任务。
- `.opencode/commands/legion-rfc-heavy.md:13-15`、`.opencode/commands/legion-pr.md:8-11`、`.opencode/commands/evolve.md:10-26` 也都默认存在 `legion_*` 工具。
- `.opencode/agents/legion.md:83-90` 把“优先用 LegionMind 工具”写进 orchestrator 基础流程。

### 3) 安装校验仍把 `mcp.legionmind` 当作可选依赖进行提示

- `scripts/setup-opencode.ts:568-622` 解析 `opencode.json` 的 `mcp.legionmind` 配置，并在 verify 阶段输出 `W_MCP_OPTIONAL` / `OK_VERIFY`。

### 4) skill-creator 对 skill 结构的硬性偏好

来源：`/Users/c1/Work/agents/.claude/skills/skill-creator/SKILL.md`

- `49-62`：skill 只要求 `SKILL.md`，可选资源分为 `scripts/`、`references/`、`assets/`。
- `73-91`：当需要确定性可靠性或会重复写同样代码时，应优先提供 scripts；详细说明放 references，避免与 `SKILL.md` 重复。
- `102-113`：不要在 skill 里新增 README、INSTALLATION_GUIDE、CHANGELOG 等额外文档。
- `118-125`：SKILL.md 应保持精简，使用 progressive disclosure，把细节拆到 references。
- `292-297`：先实现可复用资源；新增 scripts 必须真实运行验证。
- `300-318`：SKILL.md frontmatter 只保留 `name` 与 `description`；正文使用命令式说明。

### 5) 可参考的 mcp server 实现与当前机器上的路径偏差

- `~/Work/agents/scripts/setup-codex.ts:23,112-124,179-194,226-244,276-294` 引用了 `mcp-servers/legionmind-mcp`，但当前 `/Users/c1/Work/agents/mcp-servers/` 目录不存在（本次通过 `ls` 验证）。
- 本机实际存在的候选实现路径：
  - `/Users/c1/Work/mcp-servers/mcp-servers/legionmind-mcp`
  - `/Users/c1/Work/No-Trade-No-Life-agents/mcp-servers/legionmind-mcp`
- 本次以 `/Users/c1/Work/mcp-servers/mcp-servers/legionmind-mcp` 为主参考源，因为它包含 `dist/` 与 `src/`，更接近当前可执行版本。

### 6) 参考 mcp server 的能力边界

来源：`/Users/c1/Work/mcp-servers/mcp-servers/legionmind-mcp/src/service.ts`

- `304-343`：`createTask` 在默认 `agent-with-approval` 策略下会强制返回 `APPROVAL_REQUIRED`，说明 task 创建本质上已偏向“proposal + approve”流程。
- `441-455`、`2018-2149`：创建任务时会生成 `plan.md` / `context.md` / `tasks.md`，但 `plan.md` 模板仍然只有 `目标/要点/范围/阶段概览`，不符合本仓库当前 schema 对问题陈述、验收标准、风险、设计索引的要求。
- `1039-1155`：`updateContext` 只实现了 progress / addDecision / handoff，未覆盖类型声明中的 `addFile`、`addConstraint`。
- `1158-1275`：`updateTasks` 实现了 complete/current/discovered task，但未实现类型声明中的 `addTask`、`updatePhaseStatus`。
- `1715-2017`、`2151-2535`：ledger、dashboard、review parsing、task progress 计算等 helper 逻辑可直接迁移为 scripts-first CLI 的基础能力。

## 迁移含义

1. **不能只改 SKILL.md**：如果不同时改写 commands / agent / setup 校验，仓库仍会把 MCP 当成默认路径。
2. **scripts 应是完整工作流入口，而不是几个零散 helper**：否则无法替代 `legion_*` 工具的心智模型。
3. **迁移时顺手补齐文档/实现缺口**：尤其是 `plan.md` 模板、`update_context.addFile`、`update_tasks.addTask` 等，避免把 mcp 版的历史缺陷带进 skill scripts。

## 未决 / Unverified

- 用户提到的 `~/Work/agents/mcp-servers/legionmind-mcp` 目录为何缺失：可能是本机路径迁移、未 checkout，或用户口头路径与实际源码仓库不一致。本次先按现有可用源码推进，并在 RFC/PR body 记录此假设。
