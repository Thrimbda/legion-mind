# Walkthrough: evaluate-pi-control-plane

> **Mode**: `rfc-only`（design-only 交付，无生产代码变更）
> **任务**: 评估 Legion 从 OpenCode 迁移到 Pi、以控制平面为终态组成个人 harness
> **分支**: `legion/evaluate-pi-control-plane`（worktree `.worktrees/evaluate-pi-control-plane`，base `4bc7959`）
> **日期**: 2026-08-16
> **读者**: 用户本人（技术 leader），目标是在 PR 中快速判断 GO 决策与 M1-M6 路线图是否可接受
> **主 artifact**: `docs/report-walkthrough.html`（本文件为 compact source / fallback）

---

## 1. Reviewer Summary

- **决策**: **GO，分六阶段 M1-M6**。先建 Pi runtime parity（M1 交互、M2 worker），再建控制平面（M3 内核、M4 subagent、M5 操作面、M6 fleet）。每阶段是独立 Legion 任务、各自过设计门。
- **证据底座**: 四路一手核实（2026-08-16，pi.dev 官方文档 / 各扩展 GitHub 仓库 / npm registry）+ 七项隔离冒烟 S1-S7 全部 PASS（repo-local `.cache/pi-smoke/`，HOME/XDG/npm prefix 全重定向）。
- **评审状态**: review-rfc 独立评审 Verdict **PASS**（无 blocker；3 major / 4 minor 已全部处置，处置 commit `4cbbaaa`）。
- **变更面**: 仅 `.legion/tasks/evaluate-pi-control-plane/` 下文档（+584 行），零生产代码，OpenCode 安装面与 `scheduler/` 未触碰。
- **退路**: OpenCode 线全程冻结可用；M3 前无新持久状态；路线图全程无不可逆步骤。

## 2. Scope

**In scope**: 提案 claims 一手核实与出入记录；repo-local 隔离冒烟；OpenCode 耦合点映射（契约要求四类，超额识别出 C5）；三性结论（合理性 / 可行性分级 / 合适性）；目标架构职责边界；M1-M6 路线图与回滚方案。

**Out of scope（契约非目标）**: 不实施任何迁移阶段；不修改 `skills/`、`scripts/`、`scheduler/`、`.opencode/` 等生产资产；不做兼容性设计（用户豁免）；不做多租户 / 产品化；不评估 oh-my-pi / my-pi 作底座。

## 3. Evidence Map

| Artifact | 证明什么 | 健康度 |
|---|---|---|
| `plan.md` | 契约：6 条 acceptance、假设约束风险、非目标 | 5 条满足，1 条（证据链闭环）进行中，本 walkthrough 即其组成 |
| `docs/research.md` | §4 提案 claims 逐条核实（含失真修正）；§5 七项冒烟命令与关键输出摘录；§2 耦合清单 C1-C5 | 核实日期 2026-08-16 标注齐全；冒烟日志在 `.cache/pi-smoke/logs/`（gitignored），关键输出已摘录可复核 |
| `docs/rfc.md` | GO 决策、三性结论、目标架构、5 个 alternatives、M1-M6 路线图、回滚方案 | 结论按 smoke-proven / doc-level / unknown 分级，未把未验证 claim 写成事实 |
| `docs/review-rfc.md` | 独立对抗评审：Verdict PASS，F1-F7（3 major / 4 minor） | 全部处置并回写 rfc.md / research.md，处置 commit `4cbbaaa` 在链 |
| git 历史 | 交付路径可追溯 | `c3cd01f` 契约 → `5d40279` research+RFC → `4cbbaaa` 评审处置；工作树干净 |

**冒烟覆盖面边界（诚实声明）**: 冒烟环境为 Linux headless、Node v24.18.0、deepseek/zai provider（kimi 凭证未就绪）。pi-web 实机、pi-goal、pi-mcp-adapter、browser/computer-use、fleet、沙箱方案、审批闸实现保持 doc-level，已在 RFC 分级并绑定到对应阶段 PoC / 设计门。

## 4. Delivery Path

| Phase | 内容 | 状态 |
|---|---|---|
| 1 | 契约物化 + worktree 准备 | 完成（commit `c3cd01f`） |
| 2 | 四路桌面调研：提案 claims 一手核实 | 完成（research.md §4） |
| 3 | 隔离冒烟 S1-S7 | 完成，全部 PASS（research.md §5） |
| 4 | 耦合与 gap 分析、三性结论 | 完成（research.md §2、rfc.md §5） |
| 5 | RFC + review-rfc 门禁 | 完成（PASS，处置 commit `4cbbaaa`） |
| 6 | walkthrough、PR lifecycle、wiki writeback | 进行中：本 walkthrough 交付中；PR 与 wiki 写回待办 |

## 5. Render Handoff

- 主 reviewer artifact：`docs/report-walkthrough.html`，standalone（无外部资源），直接浏览器打开即可读，打印友好。
- 需要在线预览 URL 或 artifact 托管时，经 `pr-html-render` skill 获取 rendered preview；本 walkthrough 不含渲染执行。
- PR 创建输入：`docs/pr-body.md`。

## 6. Changed / Decided

**Changed（仅文档，+584 行）**: `plan.md`、`log.md`、`tasks.md`、`docs/research.md`、`docs/rfc.md`、`docs/review-rfc.md`（全部位于 `.legion/tasks/evaluate-pi-control-plane/`）。

**Decided（关键决策，详见 rfc.md）**:

1. GO 分六阶段；rollout 顺序 M1 → (M2 ∥ M3) → M4/M5 → M6。
2. 职责边界：Pi 拥有 session / 模型 / 工具循环 / compaction / runtime-local extension；Legion 拥有 goal / run 任务图 / 权限审批 / 证据账本 / 租约 / 长期记忆 / attention queue。
3. 提案失真修正：LSP 选型为 `pi-lens@4.0.0`（非 `@narumitw/pi-lsp`）；skills 目录需显式配置 `settings.json`；内置工具默认激活 4/7；pi-web 无认证且内部 route 不稳定（不作控制平面 backend）；`pi-goal-list-loop-audit` AGPL 不纳入；pi-subagents 配置两层混写已修正。
4. pi-goal 不进 managed profile（goal 判定属 Legion）；subagent 第一版 backend 为 pi-subagents，切换 SDK child sessions 的判据列入 M4 设计门。
5. OpenCode 冻结线为全程退路；M5 切换 GitHub Actions 入口时保留 `opencode.yml` 文件但停用触发并标注冻结，回滚 = 恢复触发条件。
6. pin 清单（2026-08-16 快照）：`@earendil-works/pi-coding-agent@0.84.2`、`pi-subagents@0.50.0`、`pi-mcp-adapter@2.26.0`、`pi-lens@4.0.0`、`@jmfederico/pi-web@1.202608.1`。

**路线图速览**:

| 阶段 | 建议 taskId | 依赖 | 退出条件（压缩） |
|---|---|---|---|
| M1 | `adopt-pi-interactive-runtime` | 无 | pi 启动即触发 legion-workflow 入口门；真实小任务跑通全阶段链 |
| M2 | `add-pi-worker-runner` | M1 | fixture WI 端到端证据链被 scheduler verifier 接受；OpenCode 路径冻结原样 |
| M3 | `build-legion-control-core`（可拆 M3a/M3b） | M1（可与 M2 并行） | 本地调用入口提交 goal 跑完全程：证据通过、审批可中断、重启 durable resume |
| M4 | `build-subagent-backend` | M3 | scout→worker→fresh reviewer 闭环；24h 无人值守完成 ≥1 真实 goal（强制） |
| M5 | `build-operator-plane` | M3 | 断网续跑可视；审批经 API 完成；`/oc` 等价入口在 Pi 上工作 |
| M6 | `build-fleet-computer-use` | M3, M4 | 三类 worker 各完成真实验收任务；桌面/browser 租约冲突正确串行化 |

## 7. Verification / Review Status

- **冒烟验证（本任务的测试等价物）**: S1 安装版本、S2 print/JSON 事件流（含 usage/cost、`agent_settled`）、S3 skill 三路径发现、S4 skill 渐进披露闭环 + AGENTS.md 遵从、S5 RPC 驱动、S6 SDK 驱动、S7 pi-subagents scout 派生，全部 PASS（research.md §5 留档）。
- **独立评审**: review-rfc Verdict PASS。F1（M3 验收入口）→ 改为本地调用入口；F2（审批闸 API 证据）→ `ctx.ui` 表面补核实并回写 research §4.1；F3（subagent 所有权张力）→ 切换判据显式化；F4（冒烟结论收窄）；F5（M3a/M3b 拆分指引）；F6（Actions workflow 停用处置）；F7（24h 指标归入 M4 强制退出）。处置 commit `4cbbaaa`。
- **契约 acceptance 对照**: claims 核实（满足）、隔离冒烟（满足）、耦合清单（满足，超额 C5）、三性结论（满足）、路线图（满足，经评审修正）、Legion 证据链（进行中，剩 PR 闭环与 wiki 写回）。

## 8. Risks / Open Questions

- **上游漂移**: Pi 三个月 0.74→0.84，pi-subagents 5 天 5 个 minor；对策为 pin 版本 + CHANGELOG 复核（rfc §4 硬约束）。
- **扩展共存 fail-closed**: 重名工具启动期冲突；M4 启动矩阵测试覆盖。
- **审批机制 doc-level**: `tool_call` `{block:true}` + RPC UI 桥已核实存在，工程量待 M3 设计门（Open Question）。
- **browser/desktop 安全面**: 复用真实登录态与输入注入，需专用 profile / OS 用户 + 容器边界（M6）。
- **环境边界**: macOS 与 Wayland 节点未验证（M6 PoC，Wayland 当前 semantic-only，X11 fallback）。
- **Open Questions（不阻塞 GO，阻塞对应阶段）**: M3 `AgentSessionRuntime` session replacement 细节；M5 pi-web 实机契合度；M6 macOS/Wayland 能力矩阵。

## 9. Reviewer Checklist

- [ ] GO 决策是否可接受（对照 rfc.md §5 三性结论与证据分级）
- [ ] 提案失真修正（LSP 选型 / skills 配置 / 工具默认 / pi-web / AGPL / 配置分层）是否改变你对原提案的判断
- [ ] M1-M6 阶段拆分、依赖与退出条件可否直接作为后续独立 Legion 任务的契约种子
- [ ] M3 颗粒度与 M3a/M3b 拆分指引是否接受
- [ ] subagent backend 切换判据（pi-subagents → SDK child sessions）是否接受
- [ ] 24h 无人值守指标归入 M4 强制退出条件是否接受
- [ ] 回滚方案（OpenCode 冻结线全程退路、M3 前无新持久状态）是否足够
- [ ] 冒烟覆盖面边界（Linux headless、deepseek/zai provider）是否接受，未覆盖面交由对应阶段 PoC

## 10. Final State / Next Stage

- 任务进度 11/13；本 walkthrough 三份产物（html / md / pr-body）交付后，剩 PR lifecycle 至终态与 legion-wiki 收口写回。
- PR 创建输入就绪：`docs/pr-body.md`。
- 合并后下一步：按路线图立项 M1 `adopt-pi-interactive-runtime`（独立 Legion 任务，过设计门）。
