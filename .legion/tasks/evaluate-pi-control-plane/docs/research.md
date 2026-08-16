# Research Notes：Legion 迁移至 Pi 控制平面架构的现状摸底

> 目标：用可追溯证据回答"仓库现在与 OpenCode 怎样耦合 / 提案的事实 claims 哪些为真 / 关键可行性是否已被冒烟证明"。
> 证据核实日期：2026-08-16。桌面调研由四路并行研究员完成（researcher-quick-ferret / witty-quokka / jolly-seal / glowing-falcon），一手来源为 pi.dev 官方文档、各扩展 GitHub 仓库、npm registry。冒烟在 repo-local `.cache/pi-smoke/` 隔离环境完成（HOME/XDG/npm prefix 全重定向，凭证经环境变量注入未落盘）。

---

## 1. Problem Restatement

- 一句话复述：评估"Legion 从 OpenCode 腾挪到 Pi、以控制平面为终态组成个人 harness"是否合理、可行、合适，并产出路线图。
- 影响范围：本仓库全部 runtime 接触面（skills、安装器、scheduler、Actions 入口）+ 用户的三类目标节点（云服务器、Mac mini、NixOS PC）。

## 2. 仓库与 OpenCode 的耦合盘点（四处真实耦合点）

| # | 耦合点 | 位置 | 性质 | Pi 等价物 / gap |
|---|--------|------|------|-----------------|
| C1 | 工作流内核 skills | `skills/**`（18 个 skill，agentskills.io 兼容 markdown） | **runtime 中立**。仅 CLI 调用示例写死 `${OPENCODE_HOME:-$HOME/.opencode}` 路径（`skills/legion-workflow/references/REF_TOOLS.md:3`） | Pi 三条发现路径均冒烟验证可用；路径参数化即可 |
| C2 | 安装/分发层 | `scripts/setup-opencode.ts`、`scripts/setup-openclaw.ts`、`scripts/lib/setup-core.ts`、`bin/lgmind.js` | OpenCode/OpenClaw 双适配器 + 共享 lifecycle core | 新增 `setup-pi` 适配器或直接维护个人 profile；setup-core 可复用 |
| C3 | scheduler worker runner | `scheduler/src/worker-runner.ts`（`opencode -p -f json -q -c` 进程启动 + prompt artifact + `LEGION_WORKER_RESULT` 块解析 + 证据校验器） | 进程契约层耦合；worker 契约（prompt artifact/result block/evidence verifier）本身 runtime 中立 | `pi -p --mode json` 或 `pi --mode rpc`（均冒烟验证）；解析层需适配事件流 |
| C4 | GitHub Actions 入口 | `.github/workflows/opencode.yml`（`/oc` 评论触发 OpenCode action） | CI 入口耦合 | workflow 内直接跑 `pi -p`；或未来控制平面 webhook |
| C5 | repo 级 runtime 配置 | `opencode.json`（permission 规则）、`.opencode/`、根 `AGENTS.md` | AGENTS.md runtime 中立（冒烟验证 Pi 加载并遵从）；`opencode.json` 的 permission 语义是 OpenCode 私有 | Pi 无权限系统（确认无 permission popup）→ 审批必须落在 extension 的 `tool_call` `{block:true}` 或控制平面（doc-level） |

补充：`docs/linear-legion-scheduler/` 与 `scheduler/` 是既有"外部调度器只编排、不替代阶段链"模式（`.legion/wiki/patterns.md`）的实现，其 SQLite durable state（runs/attempts/locks/outbox/events）是控制平面种子的主要可复用资产。

## 3. 历史决策（直接约束本评估）

- `lock-scheduler-worker-opencode`（2026-06）：worker runtime 锁定 OpenCode，且明确"未来支持其他 runtime 必须单独进入设计门"——本任务即该设计门。
- README「通往 v1」第 7 条：扩展 runtime 支持必须按独立设计问题重新进入门禁。
- `.legion/wiki/patterns.md`「CLI 保持薄层」：CLI 不做状态注册表；machine state 属 scheduler 类独立项目——控制平面应走后者路径而非膨胀 CLI。
- `.legion/wiki/patterns.md`「外部调度器只编排」：控制平面同样只编排，不替代 Legion 阶段链。

## 4. 提案 claims 核实结论（四路桌面调研，2026-08-16）

### 4.1 Pi 核心（pi.dev / earendil-works/pi / npm）

- 包：`@earendil-works/pi-coding-agent@0.84.2`（2026-08-14），MIT，周下载约 137 万，迭代极快（日均约 25 commits）。旧 GitHub 仓 `badlogic/pi-mono` 已 301 至 `earendil-works/pi`；旧 npm scope 是 `@mariozechner/*`（已 deprecated）。
- **确认**：TUI、多 provider、steering/follow-up、JSONL 树状 session（fork/branch/compact/clone/resume）、AGENTS.md/SYSTEM.md/prompt template、TS extension（`registerTool/registerCommand/registerProvider/registerMessageRenderer` + `pi.on('tool_call')` 可 `{block:true}`）、SDK（`createAgentSession()` + `AgentSessionRuntime` 管 new/resume/fork/clone）、RPC（`pi --mode rpc`，命令/响应 id 关联 + `agent_settled` + `extension_ui_request/response` 桥）、版本 pin（`pi install npm:pkg@x.y.z`）、无 sandbox、无 subagent/MCP/plan mode/todo/权限弹窗/background bash。
- **失真修正**：(a) 内置工具 7 个可用但**默认只激活 4 个**（read/bash/edit/write），grep/find/ls 需 `--tools`；(b) Claude/Codex skill 目录**不是自动发现**，需显式配置 `settings.json` 的 `skills` 数组；(c) 非交互是 `-p`（文本）与 `--mode json`（事件流）两个独立 mode，无 `-f json` 组合，且 `message_update` 为 delta-only 需调用方拼装；(d) session 管理能力分两层：`AgentSession`（单 session）与 `AgentSessionRuntime`（new/resume/fork/clone），控制平面必须引入后者；(e) catalog 规模官方不公布（"~5300"为第三方估计区间 4.3k–6.4k，keyword 门槛无审核属实）。

### 4.2 Pi Web（jmfederico/pi-web / pi-web.dev）

- `@jmfederico/pi-web@1.202608.1`（2026-08-11），MIT，单一作者高频迭代，约 531 stars。
- **确认**：双服务架构（`pi-web-sessiond` + `pi-web-server`）、多项目/worktree/并发 session、断线续跑（session 活在 sessiond）、`spawn_session` + 五件 tracked subsession 工具（`spawn_subsession/list/check/read/yield_to_subsessions`，完成唤醒父 session）、`ask_user` 持久表单（抗刷新/重启）、fleet（gateway/target，凭证与执行留在 target）、插件窄接口（无 raw Fastify、同进程无 crash isolation）、`PI_CODING_AGENT_DIR`/`PI_CODING_AGENT_SESSION_DIR`、配置键全部属实。
- **失真修正**：(a) fleet 跨版本是**必须同步升级**（双方向都会 break），非"建议固定"；(b) **无任何内建终端用户认证/多租户**（README 明示 trusted users，仅 fleet 可选 bearer token）；(c) "daemon 共享一套模型 runtime"已过时（PR #85 后 per-session 隔离 overlay，daemon 共享 credential store/baseline）；(d) 内部 HTTP route 版本间发生过 breaking（1.202608.1），插件文档明示不要依赖内部 URL——**不可作控制平面稳定 backend**。

### 4.3 pi-subagents / pi-goal / pi-mcp-adapter

- `pi-subagents@0.50.0`（2026-08-15），MIT，约 3150 stars，极度活跃。**提案 16 个配置字段 + authorityPolicy 6 子字段全部逐字属实，无虚构**。内置 6 个 agent（提案漏 `delegate`）。child = **独立 Pi 进程**（非 in-process）。任务预算实为 turn budget + timeout（非 token）。`maxSubagentSpawnsPerRun` 默认 64、`maxSubagentDepth` 默认 2。配置在 `~/.pi/agent/extensions/subagent/config.json`，`.pi/settings.json` 承载另一组 `subagents.*` key（提案混写两层需修正）。
- `@narumitw/pi-goal@0.51.0`（2026-08-11），MIT。`/goal`、`goal_complete/blocked/wait`、settled-boundary 续跑、`automaticTurns` 默认 25、token budget、no-progress 检测均属实；实际 **6 态**（多 `usage_limited`/`budget_limited`）。官方明示"behavioral guardrail, not proof"——完成判定必须外部裁决，与提案一致。
- `pi-goal-list-loop-audit`：存在，**AGPL-3.0-only**（早期 MIT 中途改证，GitHub 页面检测滞后），8 stars 极年轻。detached auditor 自带 bash 且明示非 OS sandbox。**许可证是硬约束，不纳入。**
- `pi-mcp-adapter@2.26.0`（2026-08-14），MIT，约 1241 stars。单 proxy tool 约 200 tokens、lazy/eager/keep-alive、metadata 缓存、读 6 层 `.mcp.json`、从 cursor/claude/codex/**opencode**/vscode 导入、SDK factory，全部属实。
- **关键新知**：Pi 对**跨扩展重名工具启动期 fail-closed**（已有 `wait`→`subagent_wait` 改名先例）；多扩展共存必须做启动矩阵测试。Pi 核心无原生 subagent 工具，与 pi-subagents 不存在工具冲突。

### 4.4 browser / computer-use / LSP / 参考发行版

- `pi-browser-harness@0.11.0`（MIT，16 stars）：CDP 驱动真实 Chrome **复用用户登录态**、`browser_run_script` full Node escape hatch、远程 CDP（`BU_CDP_WS`）属实。"页面搜索"实为 Google SERP 抓取 + reader mode。
- `@injaneity/pi-computer-use@0.5.0`（MIT，1739 stars）：macOS/Windows/Linux 属实；**原生 Wayland 仅 semantic-only、interactive portal 禁用**；X11 能力完整（EWMH + XTEST）。
- `@agent-sh/computer-use-linux@0.4.9`（MIT，401 stars）：Wayland-first，但它是**通用 MCP server 而非 Pi extension**，接入需经 pi-mcp-adapter；仅 Ubuntu 25.10/GNOME 人工验证过，Sway/wlroots 无窗口后端。
- **LSP 选型修正**：提案称"`@narumitw/pi-lsp` 等可 edit 后立即给 diagnostics"——该包官方明示**不会**自动注入（需 agent 主动调用且冷启动）；真正 on-write 自动诊断的是 **`pi-lens@4.0.0`**（42 个 server 定义）。避开无 scope 的 `pi-lsp@0.1.7`（停更）。
- `pi-acp@0.0.33`：可用但 0.0.x，上游在讨论原生 `--mode acp`（中期不稳），列为观察项。
- `oh-my-pi`（25120 stars fork）与 `my-pi`（0.1.x 单人 wrapper）均真实存在；均不作基础底座，与提案一致。
- 沙箱出处属实：官方 containerization 文档三模式（Gondolin microVM / Docker / NVIDIA OpenShell）+ examples/extensions 的 sandbox 示例；**extension 工具与 pi 同进程同权限，沙箱不自动罩住扩展能力**。
- memory/recall 扩展已是红海（pi-memory 注意同名两包、pi-hermes-memory、pi-total-recall），不必自建；但 Legion 的长期记忆仍应由控制平面持有，runtime 层不自动沉淀。

## 5. 隔离冒烟证据（smoke-proven，2026-08-16）

环境：`$PWD/.cache/pi-smoke/`（worktree 内），HOME/XDG/npm prefix 全重定向；Node v24.18.0；provider 凭证从 `~/.local/share/opencode/auth.json` 经环境变量注入（deepseek、zai ready；kimi 未就绪）；全程未触碰全局环境与冻结的 OpenCode 版本。日志：`.cache/pi-smoke/logs/`（gitignored，关键输出已摘录于此）。

| # | 验证项 | 命令/方式 | 结果 | 关键证据 |
|---|--------|-----------|------|----------|
| S1 | 安装与版本 | `npm i -g --ignore-scripts @earendil-works/pi-coding-agent` | PASS | `pi --version` = 0.84.2 |
| S2 | print/JSON 事件流 | `pi -p --mode json --provider deepseek --model deepseek-chat "..."` | PASS | 事件序列 `session(v3)→agent_start→turn_start→message_*(38)→turn_end→agent_end→agent_settled`；`turn_end` 带 usage/cost（input/output/cache/tokens/费用）；session 落盘 `~/.pi/agent/sessions/<encoded-cwd>/`（`logs/print-json.jsonl`） |
| S3 | skill 三路径发现 | user `~/.pi/agent/skills/` + project `.pi/skills/`（`--approve`）+ `~/.agents/skills/` | PASS | 模型逐一列出 `legion-smoke-user/project/agents` 三个 skill 名（`logs/skills-list.txt`、`logs/skills-agentsmd.txt`） |
| S4 | skill 渐进披露闭环 | 触发词 `SMOKE_USER_TRIGGER` | PASS | 模型经 `read` 工具读 SKILL.md 后返回指令 token `USER_SKILL_LOADED`；同时遵从 repo `AGENTS.md` 规则（`logs/skill-trigger.jsonl`） |
| S5 | RPC 驱动 | 自写 driver（`rpc-drive.mjs`）发送 `prompt`/`get_state`/`get_last_assistant_text` | PASS | 命令/响应 id 关联成功；`get_state` 返回 model/sessionFile/messageCount 等 11 字段；`agent_settled` 可作调度边界；`last_text=RPC_OK`（`logs/rpc-events.jsonl`） |
| S6 | SDK 驱动 | `ModelRuntime.create` + `setRuntimeApiKey` + `getModel` + `createAgentSession` + `subscribe` + `prompt` | PASS | 事件订阅正常，`last_text=SDK_OK`（`logs/sdk-events.jsonl`）。注意点：SDK 不自动读 env 凭证，需 `ModelRuntime.setRuntimeApiKey`；`getModel` 严格匹配 catalog id（当前 deepseek 目录为 `deepseek-v4-flash/pro`），CLI 则回退 custom id |
| S7 | subagent 派生 | `pi install npm:pi-subagents`（限制性 config：depth=1、spawns≤2、missions/scheduledRuns 关）→ 父 prompt 派生 scout | PASS | `subagent` 工具调用 2 次（spawn+wait）；child 独立 session 目录 + `subagent-artifacts/` 落盘；child 执行 `find` 得正确文件数并回传父 session（`logs/subagent.jsonl`） |

冒烟未覆盖（保持 doc-level）：pi-web 实机部署、pi-goal、pi-mcp-adapter、browser/computer-use 扩展、fleet、沙箱方案、extension `tool_call` block + UI 桥的审批实现。

## 6. Risks & Pitfalls

- **上游漂移**：Pi 三个月 0.74→0.84，SDK 表面仍在变（ModelRuntime 迁移刚发生）；pi-subagents 5 天 5 个 minor。一切接入必须 pin 版本 + CHANGELOG 复核。
- **扩展共存**：重名工具启动期 fail-closed；目标扩展集合需启动矩阵测试。
- **审批缺位**：Pi 无权限系统；`opencode.json` 的 permission 语义没有直接等价物，必须由控制平面/extension 重建（`tool_call` `{block:true}` + `extension_ui` 桥是 doc-level 机制）。
- **安全面**：browser/desktop 扩展默认复用真实登录态与真实输入注入，与无人值守不兼容，需专用 profile/OS 用户 + 容器边界。
- **许可证**：`pi-goal-list-loop-audit` AGPL-3.0-only，禁止纳入分发路径。
- **命名陷阱**：`pi-lsp`/`oh-my-pi`/`pi-memory` 均有同名无关包；安装必须带 scope 核对作者。
- **环境边界**：本机冒烟为 Linux headless；Mac mini/Wayland 节点能力未验证。

## 7. Unknowns（不阻塞本决策，但阻塞后续实施任务）

- [ ] pi-web 实机体验与 Legion 操作流契合度 → 由路线图 M5 任务的实机验收回答
- [ ] extension `tool_call` block + `extension_ui` 桥实现审批闸的具体工程量 → M3 设计门回答
- [ ] Pi 在 Mac mini（macOS）与 NixOS Wayland 节点的实际表现 → M6 PoC 回答
- [ ] `AgentSessionRuntime` 的 session replacement API 细节 → M3 设计门回答

## 8. References

- 契约：`.legion/tasks/evaluate-pi-control-plane/plan.md`
- 一手来源：pi.dev docs（usage/sdk/rpc/skills/security/packages/containerization）、github.com/earendil-works/pi、github.com/jmfederico/pi-web + pi-web.dev、github.com/nicobailon/pi-subagents + pi-mcp-adapter、github.com/narumiruna/pi-extensions、github.com/amankumarsingh77/pi-browser-harness、github.com/injaneity/pi-computer-use、github.com/agent-sh/computer-use-linux、github.com/apmantza/pi-lens、npm registry（均为 2026-08-16 当日抓取）
- 冒烟日志：`.cache/pi-smoke/logs/{print-json.jsonl, skills-list.txt, skills-agentsmd.txt, skill-trigger.jsonl, rpc-events.jsonl, sdk-events.jsonl, subagent.jsonl}`；driver：`.cache/pi-smoke/{rpc-drive.mjs, sdk-drive.mjs}`
- 仓库决策：`.legion/tasks/lock-scheduler-worker-opencode/plan.md`、`.legion/wiki/patterns.md`、`README.md`、`docs/linear-legion-scheduler/worker-runner.md`
