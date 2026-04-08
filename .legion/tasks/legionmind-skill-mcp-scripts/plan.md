# 将 legionmind skill 从 MCP 改写为 scripts

## 目标

把仓库内 legionmind skill 中依赖 MCP 的能力改写为脚本驱动实现，并产出符合 skill-creator 规范的完整 skill 文档与 PR 材料。交付后的 skill 应在没有 legionmind MCP server 的前提下，仍可通过 bundled scripts 完成 `.legion/` 生命周期管理与文档落盘。

## 问题陈述

当前 `skills/legionmind` 及其关联命令把 LegionMind 的核心工作流建立在 `legion_*` MCP 工具之上，导致 skill 的触发说明、引用文档、安装校验与指挥命令都默认依赖外部 MCP server。这个模型与 skill-creator 强调的“SKILL.md 保持精简、把确定性工作沉淀为 scripts、把详细说明放在 references”不一致，也让 skill 的可移植性和自包含性变差。需要在保留 `.legion/` 三文件契约、审批/审计、Review 语法、dashboard/ledger 等核心能力的前提下，把 skill 改写为 scripts-first 方案，并同步清理仓库内相关 MCP 叙述。

## 验收标准

- [ ] `skills/legionmind/scripts/` 下提供可执行的 LegionMind CLI，能在文件系统上完成初始化、任务提案/审批、状态读取、plan/context/tasks 更新、review 响应、dashboard/ledger 查询等核心操作。
- [ ] `skills/legionmind/SKILL.md` 与 references 不再要求使用 LegionMind MCP 工具；说明结构符合 skill-creator 规范（frontmatter 精简、正文命令式、细节下沉到 references/scripts）。
- [ ] `.opencode/agents/legion.md` 与相关命令文档不再把 `legion_*` MCP 工具当成默认路径，而是引用 bundled scripts 或明确的文件系统 fallback。
- [ ] 安装/校验脚本与仓库说明不再把 `mcp.legionmind` 作为 LegionMind 的默认依赖；如保留兼容措辞，也必须降级为历史兼容而非主路径。
- [ ] 任务目录补齐 `research.md`、`rfc.md`、`review-rfc.md`、`test-report.md`、`review-code.md`、`review-security.md`（如适用）、`report-walkthrough.md`、`pr-body.md`。

## 假设 / 约束 / 风险

- **假设**: 用户提到的 `~/Work/agents/mcp-servers/` 目录在本机不存在；本次以 `/Users/c1/Work/mcp-servers/mcp-servers/legionmind-mcp` 作为主要参考源，并在需要时用 `/Users/c1/Work/No-Trade-No-Life-agents/mcp-servers/legionmind-mcp` 交叉核对。
- **约束**: `plan.md` 仍是唯一人类可读任务契约与 Scope 真源；所有任务过程产物继续落在 `.legion/tasks/<task-id>/docs/`；根目录 `docs/` 仅在长期说明确有必要时才改动。
- **风险（Medium）**: 这是一次 public workflow 级别的替换，涉及 skill 文案、命令入口与本地文件写入行为；如果脚本的参数协议、路径校验或 markdown 更新逻辑不稳，可能导致 `.legion/` 内容损坏或新旧流程混用。因此本次采用 RFC + review-rfc，并补做 smoke test 与 security review。

## 要点

- **scripts-first**: 用 bundled scripts 取代 MCP 作为 LegionMind skill 的默认执行面。
- **skill-creator 对齐**: 保持 SKILL.md 精简，把操作步骤与参数参考下沉到 references，把确定性动作固化到 scripts。
- **能力连续性**: 保留 `.legion/` 三文件、proposal approval、review 语法、ledger/dashboard 等核心行为，不让使用体验因迁移而退化。
- **仓库内一致性**: 同步清理命令文档、agent 提示与安装校验中的 MCP 预设，避免新旧工作流并存。

## 范围

- skills/legionmind/**
- .opencode/agents/legion.md
- .opencode/commands/legion.md
- .opencode/commands/legion-impl.md
- .opencode/commands/legion-rfc-heavy.md
- .opencode/commands/legion-pr.md
- .opencode/commands/evolve.md
- scripts/**
- package.json
- README.md
- scripts/setup-opencode.ts
- .legion/playbook.md

## 设计索引 (Design Index)

> **Design Source of Truth**: `.legion/tasks/legionmind-skill-mcp-scripts/docs/rfc.md`

**摘要**:
- 核心流程: 引入 `skills/legionmind/scripts/legion.ts`（及必要辅助文件）作为 scripts-first CLI，用子命令覆盖现有 LegionMind MCP server 的主要能力，并在模板层直接生成符合当前 schema 的 `.legion` 文件。
- 验证策略: 对脚本做临时目录 smoke test，确认 init / propose+approve / update / query / review / dashboard 等关键路径可跑通；同时检查仓库内 `legion_*` MCP 叙述已被 scripts 工作流替换。

## 阶段概览

1. **阶段 1 - 调研与设计** - 盘点 MCP 依赖、补齐 research/plan/RFC，并收敛 scripts-first 方案。
2. **阶段 2 - 实现改造** - 实现 LegionMind CLI scripts，改写 skill 文档、命令文档与安装校验。
3. **阶段 3 - 验证与交付** - 运行 smoke test / review，生成 walkthrough 与 PR body。

---

*创建于: 2026-04-08 | 最后更新: 2026-04-08*
