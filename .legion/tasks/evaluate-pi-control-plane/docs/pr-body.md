# evaluate-pi-control-plane：Legion 迁移 Pi 控制平面评估（GO + M1-M6 路线图）

> **Profile**: `rfc-only` / design-only。本 PR 不含生产代码变更，交付物为评估报告、GO 决策与 M1-M6 路线图。
> **前置证据**: `docs/rfc.md` + `docs/review-rfc.md`（rfc-only mode；无 test-report / review-change）。

## 概要

评估 Legion 从 OpenCode 迁移到 Pi、以控制平面为终态组成个人 harness。四路一手核实（2026-08-16）+ 七项隔离冒烟（S1-S7 全部 PASS）支撑结论：**GO，分六阶段 M1-M6**，每阶段独立 Legion 任务、各自过设计门。OpenCode 线全程冻结作退路。

## 决策

- **GO**：先 runtime parity（M1 交互、M2 worker），再控制平面（M3 内核、M4 subagent、M5 操作面、M6 fleet）；rollout 顺序 M1 → (M2 ∥ M3) → M4/M5 → M6。
- 职责边界：Pi 拥有 session / 模型 / 工具循环 / compaction；Legion 拥有 goal / run 任务图 / 权限审批 / 证据账本 / 租约 / 长期记忆 / attention queue。
- 提案失真已修正：LSP 选型 `pi-lens@4.0.0`（非 `@narumitw/pi-lsp`）；skills 目录需显式配置 `settings.json`；内置工具默认 4/7；pi-web 无认证且内部 route 不稳定（不作控制平面 backend）；`pi-goal-list-loop-audit` AGPL 不纳入；pi-subagents 配置两层混写已修正。

## 证据底座

- `docs/research.md`：提案 claims 逐条核实对照表（含出入记录）；冒烟 S1-S7 命令与关键输出摘录（日志在 `.cache/pi-smoke/logs/`，gitignored）；耦合清单 C1-C5。
- `docs/rfc.md`：GO 决策、三性结论（可行性按 smoke-proven / doc-level / unknown 分级）、目标架构、5 个 alternatives、M1-M6 路线图、回滚方案。
- `docs/review-rfc.md`：独立评审 Verdict **PASS**；3 major / 4 minor 已全部处置（commit `4cbbaaa`）。
- 交付摘要：`docs/report-walkthrough.html`（主 reviewer artifact）、`docs/report-walkthrough.md`。

## 变更清单

仅 `.legion/tasks/evaluate-pi-control-plane/` 下文档（+584 行）：`plan.md`、`log.md`、`tasks.md`、`docs/research.md`、`docs/rfc.md`、`docs/review-rfc.md`，外加本阶段新增 `docs/report-walkthrough.html`、`docs/report-walkthrough.md`、`docs/pr-body.md`。零生产代码；`skills/`、`scripts/`、`scheduler/`、`.opencode/` 与 OpenCode 安装面未触碰。

## 路线图（M1-M6，各为独立 Legion 任务）

| 阶段 | taskId | 依赖 | 退出条件（压缩） |
|---|---|---|---|
| M1 | `adopt-pi-interactive-runtime` | 无 | pi 启动即触发 legion-workflow 入口门；真实小任务跑通全阶段链 |
| M2 | `add-pi-worker-runner` | M1 | fixture WI 端到端证据链被 scheduler verifier 接受；OpenCode 路径冻结 |
| M3 | `build-legion-control-core`（可拆 M3a/M3b） | M1 | 本地调用入口提交 goal 跑完全程：证据通过、审批可中断、重启 durable resume |
| M4 | `build-subagent-backend` | M3 | scout→worker→fresh reviewer 闭环；24h 无人值守完成 ≥1 真实 goal（强制） |
| M5 | `build-operator-plane` | M3 | 断网续跑可视；审批经 API；`/oc` 等价入口在 Pi 上工作 |
| M6 | `build-fleet-computer-use` | M3, M4 | 三类 worker 各完成真实验收；租约冲突正确串行化 |

## 风险与回滚

- 风险：上游漂移（pin 版本 + CHANGELOG 复核）、扩展共存 fail-closed（M4 启动矩阵）、审批机制 doc-level（M3 设计门）、browser/desktop 安全面（M6 专用 profile + 容器边界）、macOS/Wayland 未验证（M6 PoC）。
- 回滚：全程无不可逆步骤；OpenCode 冻结线每个阶段都是可用退路；M3 前无新持久状态，M3 起控制平面 store 为新建独立库可废弃。

## 评审状态

- review-rfc：PASS（无 blocker）。F1-F7 处置：M3 验收改本地调用入口；`ctx.ui` 表面补核实并回写 research；subagent backend 切换判据显式化；冒烟结论收窄到已覆盖面；M3a/M3b 拆分指引；M5 保留 `opencode.yml` 停用触发并标注冻结；24h 指标归入 M4 强制退出。
- 契约 acceptance 6 条：5 条满足，1 条（Legion 证据链闭环）随本 PR 与 wiki 写回收口。

## Reviewer Checklist

- [ ] GO 决策是否可接受（rfc.md §5 三性结论与证据分级）
- [ ] 提案失真修正是否改变对原提案的判断
- [ ] M1-M6 拆分与退出条件可否作后续任务契约种子
- [ ] M3a/M3b 拆分指引、subagent backend 切换判据、24h 指标归 M4，是否接受
- [ ] 回滚方案是否足够；冒烟覆盖面边界（Linux headless、deepseek/zai provider）是否接受

## 后续

合并后立项 M1 `adopt-pi-interactive-runtime`（独立 Legion 任务，过设计门）；OpenCode 线保持冻结直至 M5 入口切换。
