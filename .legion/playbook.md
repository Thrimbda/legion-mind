# LegionMind Playbook

## [Convention] Benchmark Outputs Stay In-Repo

- Date: 2026-03-05
- Source Task: `harbor-benchmark`
- Rule: benchmark 输出目录必须位于仓库根目录内；所有写入路径统一走 `resolve + isWithin` 校验。
- Why: 防止 `--run-id` / `--write` / `--run` 参数触发路径穿越与越界写入。

## [Convention] Deterministic Benchmark Profile First

- Date: 2026-03-05
- Source Task: `harbor-benchmark`
- Rule: benchmark 先落盘固定 profile（`profileId + sampleSetId + datasetVersion + weight`），再实现执行脚本。
- Why: 避免“同命令不同结果”，保证 A/B 对比可复现。

## [Pitfall] Missing Summary Must Count as Error

- Date: 2026-03-05
- Source Task: `harbor-benchmark`
- Symptom: 只遍历现有 `summary.json` 会静默缩小分母，导致总分虚高。
- Fix: 评分时按 `run-meta` 期望数据集对账；缺失 summary 记 `status=error`、`score=0`，并计入分母。

## [Convention] Plan Owns Task Contract

- Date: 2026-03-12
- Source Task: `task-brief-plan`
- Rule: `plan.md` 是唯一的人类可读任务契约，固定问题定义、验收、假设、约束、风险、目标、要点、范围、设计索引、阶段概览；`rfc.md` 只承载详细设计。
- Why: 删除双真源后，初始化、续跑、评审都只需从 `plan.md` 起步，同时保持 `plan.md` 摘要级、`rfc.md` 细节级的清晰边界。

## [Convention] Task Docs Follow Working Language

- Date: 2026-03-12
- Source Task: `task-brief-plan`
- Rule: LegionMind 任务文档默认使用当前用户与 agent 的工作语言；只有仓库已有明确文档语言约定时才覆盖这一默认值。
- Why: 模板里偶尔出现英文标题不代表英文是默认语言；跟随真实工作语言能减少理解成本和 Review 噪音。

## [Convention] Legion Defaults To Bundled Workflow CLI

- Date: 2026-04-08
- Source Task: `legionmind-skill-mcp-scripts`
- Rule: Legion 的默认执行面是 `node --experimental-strip-types "${OPENCODE_HOME:-$HOME/.opencode}/skills/legion-workflow/scripts/legion.ts"`，仓库级验证入口固定为 `scripts/legion-workflow/smoke.ts`；历史 MCP 配置只作为兼容信息，不再作为默认路径。
- Why: 单一 CLI 入口能把 schema 校验、ledger 审计、smoke harness 和命令文档收敛到同一条主路径，避免再次分叉。

## [Convention] AGENTS Stays Minimal, Repo Rules Live In Skills

- Date: 2026-04-14
- Source Task: `agentsmd-skill-legion-workflow`
- Rule: 根部 `AGENTS.md` 只保留最小入口 shim；更完整的仓库级入口规则应落到 repo-specific skill（当前为 `skills/agent-entry/SKILL.md`），并由 `legion-workflow` 显式纳入。
- Why: 这样既保留运行时入口钩子，又避免 AGENTS、workflow skill 与 repo 规则长期三处漂移。

## [Convention] Legion Orchestrator Skill Permission Uses Wildcard

- Date: 2026-04-15
- Source Task: `agentsmd-skill-legion-workflow`
- Rule: `.opencode/agents/legion.md` 的 `permission.skill` 默认使用 `"*": allow`，不要为 repo-specific entry overlays 维护静态 allowlist。
- Why: workflow / repo skill 仍会继续演进；若每次都手工补白名单，最容易在新增入口 skill 时出现“文档要求存在，但运行时无权限”的断链。

## [Convention] OpenCode Commands Are Legacy, Do Not Extend

- Date: 2026-04-15
- Source Task: `agentsmd-skill-legion-workflow`
- Rule: `.opencode/commands/**` 视为 legacy；除非用户显式要求做退场/删除工作，否则不要再为 commands 增补新 workflow 接线。
- Why: 用户已明确 commands 未来不再作为主入口，继续给 commands 补功能只会增加维护噪音。

## [Convention] Wiki Task Summaries Stay Forward-Only

- Date: 2026-04-15
- Source Task: `agentsmd-skill-legion-workflow`
- Rule: `.legion/wiki/tasks/*.md` 只链接当前 schema 下实际存在的 raw sources；若某条 raw source 不存在就省略，不要把 legacy `context.md` 兼容重新写回模板。
- Why: 用户明确要求不要做向后兼容；wiki 层应避免用文档模板重新固化旧命名。
