# RFC: Legion 迁移至 Pi 控制平面架构的评估、决策与路线图

> **Profile**: RFC Heavy（设计-only 交付，不含实现）
> **Status**: Draft
> **Owners**: user / legion orchestrator
> **Created**: 2026-08-16
> **Last Updated**: 2026-08-16
> **证据底座**: `docs/research.md`（四路一手核实 + 七项隔离冒烟，均标注 2026-08-16）

---

## Executive Summary

- **Problem**: Legion 当前 runtime 支持面只有 OpenCode/OpenClaw，且 scheduler worker 被显式锁定 OpenCode；用户提出迁移到 Pi 并以控制平面为终态组成个人 harness，但提案引用大量未核实生态 claims。
- **Decision**: **GO，分六阶段（M1–M6）**。先建立 Pi runtime parity（M1 交互、M2 worker），再建控制平面（M3 内核、M4 subagent、M5 操作面、M6 fleet）。每阶段是独立 Legion 任务、各自过设计门。
- **Why now**: 提案核心方向经核实成立；Pi 的薄内核哲学与 Legion 分工天然互补；OpenCode 线已冻结，正是低风险切换窗口。
- **Impact**: 本仓库四处 OpenCode 耦合点逐一获得 Pi 等价路径；`scheduler/` 从 Linear 调度器泛化升级为控制平面种子资产。
- **Risks**: 上游漂移快（pin 版本）、扩展共存 fail-closed（启动矩阵）、审批机制需自建（`tool_call` block + UI 桥）、browser/desktop 扩展安全面（专用 profile + 容器边界）。
- **Rollout**: M1 → (M2 ∥ M3) → M4/M5 → M6。
- **Rollback**: 全程无不可逆步骤；OpenCode 冻结线在每个阶段都是可用退路；M3 起的新 store 无数据迁移负担。

---

## 1. Background / Motivation

- 现状：Legion 是可运行工作流内核（v1 前硬化中），runtime 支持面 OpenCode/OpenClaw；`scheduler/`（Linear + Legion）worker 经 `lock-scheduler-worker-opencode` 显式锁定 OpenCode，并规定"未来支持其他 runtime 必须单独进入设计门"。本 RFC 即该设计门的产物。
- 痛点：OpenCode 是"已组装好的 agent 产品"，自带 plan mode/permission/subagent 等工作流语义，与 Legion 内核存在语义竞争；用户的战略目标是**自有 harness**（个人控制平面），需要一个不自带编排观点的 runtime。
- 提案核实结论：方向成立，但细节有多处失真（见 `docs/research.md` §4：LSP 选型安错包、skills 目录需显式配置、内置工具默认 4/7、pi-web 无认证且内部 route 不稳定、glla AGPL、配置两层混写等）。这些失真不改变 GO 结论，但改变了选型与落地顺序。

## 2. Goals

- G1 给出**合理性 / 可行性 / 合适性**三性结论，可行性按 smoke-proven / doc-level / unknown 分级。
- G2 给出目标架构：Legion 控制平面 + Pi 作为 CodingRuntimeAdapter 的职责边界。
- G3 给出分阶段路线图：每阶段映射为后续独立 Legion 任务（scope / 依赖 / 退出条件），明确与冻结 OpenCode 线和现有 `scheduler/` 的关系。

## 3. Non-goals

- 不实现任何迁移阶段（均属后续任务，各自过设计门）。
- 不做向前/向后兼容性设计（用户明确豁免）；不做多租户/产品化设计（个人 harness）。
- 不评估 oh-my-pi / my-pi 作为基础底座；不纳入 `pi-goal-list-loop-audit`（AGPL）。
- 不设计 Legion 长期记忆的 runtime 层自动沉淀（记忆属控制平面，runtime 只接收当次任务相关事实）。

## 4. Constraints（硬约束）

- OpenCode 版本线冻结：任何阶段不得改动其安装面、配置与 `scheduler/` 内 OpenCode worker 路径。
- 个人 harness：单用户、可信环境；安全边界面向"防 agent 失控"而非"防恶意租户"。
- 接入物全部 pin 版本；每个扩展集合上线前做启动矩阵测试（重名工具 fail-closed）。
- 许可证红线：AGPL 组件不进入分发路径。

## 5. 三性评估（核心结论）

### 5.1 合理性：成立

- **对齐北极星**。控制平面把"人的注意力"做成一等资源（attention queue + 分级打扰策略），直接服务"尽量少打扰人"；Pi session 树 + subagent 隔离 + fleet 服务"尽量多产生有效工作"；事件流自带 usage/cost（冒烟 S2 实测 `turn_end` 带 token 与费用）服务"可靠性与可验证性"的度量基础。
- **哲学互补**。Pi 上游刻意不内置 subagent/goal/permission/todo/sandbox（research §4.1 确认），Legion 恰好已有自己的工作流内核——不存在 OpenCode 那样的双编排语义竞争。提案"Pi 拥有 session/模型/工具循环，Legion 拥有 goal/任务图/权限/证据"的分层与仓库已验证的"外部调度器只编排，不替代阶段链"模式（`.legion/wiki/patterns.md`）同构。
- **演化匹配**。README 要求系统"随模型变强一起向上演化"：runtime adapter 把模型/provider 演进隔离在薄层之后，符合该约束。

### 5.2 可行性：成立（分级）

- **smoke-proven**（2026-08-16，隔离环境，research §5）：Pi 安装与版本；skills 三条发现路径 + 渐进披露闭环（触发→read→遵从）+ AGENTS.md 生效；`-p --mode json` 事件流（含 usage/cost、`agent_settled`）；RPC（id 关联、`get_state` 11 字段）；SDK（`ModelRuntime`+`createAgentSession`+`subscribe`）；`pi-subagents` scout 派生（独立进程、artifact 落盘、结果回传）。**结论：M1/M2 在已冒烟覆盖的范围内（Linux headless、deepseek/zai provider、单 provider 单 session）没有未知技术风险**；macOS/Wayland 节点、其他 provider、多扩展共存属 doc-level/unknown，已在对应阶段设置 PoC。
- **doc-level**（一手文档确认，未实机）：pi-web 全部能力（subsession/ask_user/fleet/窄插件接口/无认证）；pi-goal；pi-mcp-adapter；browser/computer-use 扩展；Gondolin/Docker/OpenShell 沙箱；extension `tool_call` `{block:true}` + `extension_ui` 桥的审批机制。
- **unknown / 风险项**：extension API 跨版本稳定性；多扩展共存启动矩阵；Wayland computer-use 成熟度（当前 semantic-only）；macOS 节点表现；`AgentSessionRuntime` session replacement 细节。均已在路线图对应阶段设置 PoC/设计门回答，不阻塞 GO。

### 5.3 合适性：成立

- **豁免兼容性使最大成本项消失**：不需要双 runtime 并存维护、不需要公开 API 稳定承诺，迁移路线可以取最短路径。
- **fleet 匹配硬件**：云服务器（headless coding + gateway）、Mac mini（desktop worker）、NixOS PC（大算力 + Linux GUI）与 pi-web fleet / 控制平面 worker 拓扑一一对应。
- **既有资产是种子而非包袱**：`scheduler/` 的 SQLite durable state（runs/attempts/locks/outbox/events）、证据校验器、"只编排"模式，是控制平面内核（M3）的直接设计种子与部分代码来源。
- **退路清晰**：OpenCode 线冻结可用，任何阶段失败回退无不可逆损失。

## 6. Proposed Design（目标架构，端到端）

### 6.1 职责边界（裁决性分层）

```text
GitHub / Web / TUI / CLI（操作面，M5）
        │
Legion Control Plane（本仓库演化方向）
  Goal 状态机 / Run 任务图 / Policy & Approval
  Resource Lease / Evidence Ledger / Attention Queue
  Event Log（versioned events）/ 长期记忆
        │ RuntimeAdapter（进程内 SDK 或 RPC）
Pi Worker（session/模型/工具循环/compaction）
  runtime-local extension（LSP、审批桥、MCP 代理）
        │
隔离 worktree / browser profile / desktop seat（M4/M6）

pi-web = operator/debug console（非 backend，M5）
```

- **Pi 拥有**：单 session 生命周期、模型与 provider、prompt/tool loop、transcript、compaction、runtime-local extension。
- **Legion 拥有**：goal 与验收、durable run/task graph、subagent 拓扑与预算、资源租约、权限决策、证据账本、长期记忆、watchdog、attention queue、对外 versioned API。
- **明确放弃**：pi-goal 不进入 managed profile（goal 判定属 Legion）；pi-web 内部 HTTP route 不作依赖（research §4.2：版本间已发生 breaking）；不实现 runtime 层自动记忆沉淀。

### 6.2 关键机制（含证据等级）

- **SessionActor**：每活跃 session 一个串行 actor（prompt/steer/follow-up 队列 + abort + 事件订阅 + 租约 + persisted session id）。并发只经 child session/run，不并发调用同一 `prompt()`。机制：SDK `AgentSession` + `AgentSessionRuntime`（doc-level 分层，research §4.1）。
- **调度边界**：`agent_settled` 作为"彻底空闲"信号（smoke S2/S5 实测事件），优于 `agent_end`。
- **事件规范化**：Pi 事件 → Legion versioned events（`session.started/tool.completed/goal.state_changed/approval.requested/...`），Pi 原始事件不出 adapter。注意 `message_update` 为 delta-only 需拼装（research §4.1）。
- **审批闸**：extension `pi.on('tool_call')` 返回 `{block:true}`，交互面经 `ctx.ui.confirm` 或 RPC `extension_ui_request/response` 桥（两者均 doc-level 已核实，research §4.1）接入 Legion approval queue；M3 设计门细化工程量。
- **证据闭环**：沿用 scheduler 证据校验器思路——完成判定 = executor settled + 验收命令 + fresh verifier + claims↔evidence 绑定，拒绝"assistant 自称完成"。pi-goal 官方亦自认 guardrail 非证明（research §4.3）。
- **资源租约**：`repo:<worktree>` 单 writer、`browser:<profile>` mutation 串行、`desktop:<seat>` 独占、credential 按任务注入。设计种子：scheduler WI-06 locks。
- **subagent 拓扑与预算的所有权划分**：Legion 拥有拓扑**决策**、预算**授予**与 durable 记录（谁、何时、为何、消耗多少、结果如何）；第一版执行委派给 pi-subagents（runtime 侧 extension）。代价：child 内部事件对 Legion 不完全可见，预算强制粒度受 extension 配置面限制。**切换判据**（M4 设计门落实）：当 fresh-reviewer 证据链要求 child 内部 tool 级事件可见、或预算需要 token 级强制、或租约需注入 child 启动路径时，backend 切换为 SDK child sessions（`AgentSessionRuntime` 直接派生）。pi-subagents 与 SDK backend 共用同一 `SubagentBackend` 接口，切换不改 goal/run 层。

## 7. Alternatives Considered

### Option A: 停留 OpenCode 冻结线
- Pros: 零迁移成本；现有资产全部可用。
- Cons: 与用户"自有 harness"战略冲突；冻结版本腐烂；OpenCode 自带编排语义与 Legion 内核长期竞争。
- Why not: 只解决"不动"，不解决目标。

### Option B: 立即全量采纳提案（big-bang 控制平面）
- Pros: 一步到终态。
- Cons: 提案多处失真已在核实中暴露（LSP 选型错误等）；无 runtime parity 先建控制平面，把可冒烟验证的小风险放大成全系统风险。
- Why not: 违反本仓库"先契约、再设计门、分阶段证据"的基本工作方式。

### Option C: 分阶段（runtime parity → worker → 控制平面）**【选择】**
- 原因：(1) M1/M2 已被冒烟证明无未知风险，可先锁定收益；(2) 控制平面建立在已验证的 runtime 基础上，unknowns 被各阶段 PoC 逐个消化；(3) 每阶段独立 Legion 任务过设计门，符合仓库既有决策（runtime 扩展独立入门）；(4) 全程可回滚。
- 放弃的东西：一次性到终态的速度；短期内维持 OpenCode（冻结）与 Pi 两个交互入口。

### Option D: 以 oh-my-pi fork 为基础
- Why not: fork 治理与跟随上游风险；控制平面需要的是可替换 adapter 而非更大的绑定（与提案结论一致）。

### Option E: 以 pi-web 内部 API 为控制平面 backend
- Why not: 内部 route 无稳定契约且已发生 breaking（research §4.2）；插件窄接口明示不可依赖；定位冲突（trusted-user console）。

## 8. Migration / Rollout / Rollback

### 8.1 Migration Plan
- 无数据迁移。M1–M2 纯增量；M3 起新建控制平面 store（SQLite 起步，设计种子 scheduler WI-02；多机后再议 Postgres）。
- 双写/切换：不需要——OpenCode 线冻结即快照，新线在 Pi profile 独立建设。

### 8.2 Rollout Plan（路线图 = 后续独立 Legion 任务）

| 阶段 | 任务（建议 taskId） | Scope | 依赖 | 退出条件 |
|------|--------------------|-------|------|----------|
| M1 | `adopt-pi-interactive-runtime` | 个人 Pi profile：pin `pi@版本` + `pi-lens`；Legion skills 安装面（`~/.pi/agent/skills` 或共享 `~/.agents/skills`）；`REF_TOOLS.md` 等 CLI 路径参数化（去 `OPENCODE_HOME` 假设）；settings 模板；不装 pi-goal/pi-subagents | 无 | 任一 Legion-managed repo 中 `pi` 启动即触发 `legion-workflow` 入口门；日常回路（brainstorm→…→wiki）跑通一个真实小任务 |
| M2 | `add-pi-worker-runner` | `scheduler/` worker runner 增加 Pi 启动路径（prompt artifact 复用；`-p --mode json` 或 `--mode rpc`；delta-only 事件流拼装；result block 与证据校验器不变）；设计门裁决进程 vs SDK | M1 | fixture WI 端到端产出完整 Legion 证据链并被 scheduler evidence verifier 接受；OpenCode 路径保持冻结原样 |
| M3 | `build-legion-control-core` | Goal/Run 状态机 + SQLite store；SessionActor（Pi SDK）；Pi→Legion 事件规范化；审批闸（tool_call block + UI 桥）；evidence ledger；attention queue。**颗粒度指引**：若设计门判定单阶段过大，按 M3a（状态机 + store + SessionActor + 事件规范化）/ M3b（审批闸 + evidence ledger + attention queue）拆成两个任务 | M1（可与 M2 并行） | 经**本地调用入口**（CLI/进程内 driver；versioned HTTP API 属 M5）提交 goal 并跑完全程：证据校验通过、审批可中断、进程重启后 durable resume |
| M4 | `build-subagent-backend` | 资源租约模型落地；pi-subagents 作第一版 backend（pin 版本 + 启动矩阵 + 限制性 config）；fresh-reviewer 协议；budget/no-progress watchdog；supervisor 通信入 event log | M3 | 一个 goal 经 scout→worker→fresh reviewer 闭环，reviewer 无写权限且结论绑定证据；watchdog 能终止空转 |
| M5 | `build-operator-plane` | pi-web 部署（loopback + Tailscale/反代认证，operator console）；Legion 自有 HTTP/SSE versioned API；最小 Web/TUI 读自有 API；GitHub Actions 入口从 OpenCode action 切到 Pi（切换后 `.github/workflows/opencode.yml` 保留文件但停用触发条件并标注冻结，回滚=恢复触发条件；是否删除文件留待 M5 设计门） | M3 | 断网重连后续跑可视；审批经 API 完成；`/oc` 等价入口在 Pi 上工作 |
| M6 | `build-fleet-computer-use` | Mac mini desktop worker（pi-computer-use，专用 automation OS 用户）；browser worker（pi-browser-harness，专用 Chrome profile，mutation 串行 + 高危动作审批）；NixOS 节点；outbound worker registration；容器/OpenShell 边界；Wayland PoC（X11 fallback） | M3, M4 | 三类 worker 各完成一个真实验收任务；桌面/browser 租约冲突被正确串行化 |

- 每阶段独立 task、独立设计门（仓库既有规则：runtime 扩展重新入门）；M2 与 M3 可并行，M4/M5 可并行。
- 验收指标：每阶段退出条件即验收。"无人值守连续运行 24h 无人工干预完成 ≥1 个真实 goal"定义为 **M4 的强制退出条件之一**（subagent 闭环具备后才可考），M4 之后作为持续稳定性信号保留；M3 不作强制。

### 8.3 Rollback Plan（可执行）

- 回滚触发器：任一阶段验收失败、上游 breaking 导致不可用、安全面评估不通过。
- 回滚步骤：停止该阶段任务并记录 blocker；退回上一稳定阶段；OpenCode 冻结线全程保持可用，交互与调度在任何时刻都有可用退路。
- 数据一致性：M3 前无新持久状态；M3 起控制平面 store 为新建独立库，废弃不影响 `.legion/**` 与 scheduler DB。

## 9. Observability（目标系统）

- Logs：Legion event log 为 machine truth（run/goal/session/approval/lease 关联 id）；Pi transcript（JSONL）为 raw 层，事件规范化时保留指针。
- Metrics：goal 完成率、平均 run 时长、token/费用（Pi `turn_end` 自带 usage/cost，smoke S2 已验证可得）、审批等待时长、watchdog 触发次数。
- Alerts：no-progress watchdog、租约死锁检测、审批超时升级。
- Debug playbook：pi-web operator console（M5）+ session JSONL + event log 三层排障。

## 10. Security & Privacy

- Threat model：防 agent 失控（误删/误发/凭证泄露/prompt injection 经 browser-desktop 放大），非防恶意租户。
- 权限边界：控制平面审批分级（读/测自动；worktree 写自动；外发 POST/PR 预授权；force-push/删资源/工作区外写/支付/取 credential 必须确认）；Pi 无内建权限系统，审批由 M3 审批闸重建。
- Secrets：按任务注入短期 credential；worker 不继承个人 SSH agent/浏览器 profile/云凭证；冒烟已示范 env 注入不落盘模式。
- 隔离：worktree 单 writer；browser 专用 profile + 独立 OS 用户；desktop 专用 automation 用户；无人值守面进容器/OpenShell（extension 与 pi 同进程同权限，沙箱不罩扩展能力——research §4.4）。
- 许可证红线：AGPL（pi-goal-list-loop-audit）不进分发路径。

## 11. Testing Strategy

- 本任务（评估）：已完成——四路一手核实 + 七项隔离冒烟（research §5）。
- M1：真实小任务端到端走 Legion 全阶段链。
- M2：scheduler fixture WI + 证据校验器 negative cases（缺证据必须 block）。
- M3：审批中断/恢复、进程重启 durable resume、事件规范化 golden tests。
- M4：扩展启动矩阵（重名 fail-closed）、租约冲突串行化、watchdog 空转终止。
- M5/M6：实机验收（fleet 同步升级约束、Wayland/X11 能力矩阵）。

## 12. Milestones

即 §8.2 的 M1–M6；每个 Milestone 是独立 Legion 任务，交付时自带 contract/设计门/验证证据。

## 13. Open Questions（不阻塞 GO，阻塞对应阶段）

- [ ] M3：`AgentSessionRuntime` session replacement API 细节与审批闸工程量（设计门回答）。
- [ ] M5：pi-web 实机与 Legion 操作流契合度（实机验收回答）。
- [ ] M6：macOS 与 Wayland 节点实际能力矩阵（PoC 回答）。

## 14. Implementation Notes

- 与 `scheduler/` 的关系：控制平面是 scheduler 的泛化升级——复用其 durable state 语义、证据校验器、"只编排"模式；Linear 扫描器未来成为控制平面的一个 goal source，而非被替换。
- 与 OpenCode 冻结线的关系：只读快照，任何阶段不改动；M5 完成前它仍是 GitHub Actions 入口的承载。
- 关键实现顺序建议：M1 先行锁定交互收益；M2/M3 并行；M4/M5 并行；M6 最后。
- pin 清单（2026-08-16 快照，实施时复核）：`@earendil-works/pi-coding-agent@0.84.2`、`pi-subagents@0.50.0`、`pi-mcp-adapter@2.26.0`、`pi-lens@4.0.0`、`@jmfederico/pi-web@1.202608.1`。

## 15. References

- Plan: `.legion/tasks/evaluate-pi-control-plane/plan.md`
- Research: `.legion/tasks/evaluate-pi-control-plane/docs/research.md`（claims 核实表 + 冒烟证据 + 一手来源清单，2026-08-16）
- 冒烟日志: `.cache/pi-smoke/logs/`（gitignored，关键输出摘录于 research §5）
- 历史决策: `.legion/tasks/lock-scheduler-worker-opencode/plan.md`、`.legion/wiki/patterns.md`、`README.md`、`docs/linear-legion-scheduler/worker-runner.md`
