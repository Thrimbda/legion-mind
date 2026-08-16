# 评估 Legion 迁移至 Pi 控制平面架构

## 目标

对 Legion 从 OpenCode 腾挪到 Pi、并以控制平面为终态组成个人 harness 的设想，给出基于一手证据的合理性、可行性、合适性结论，产出分阶段迁移路线图与后续 Legion 任务拆分。

## 问题陈述

用户提出的迁移提案引用大量 Pi 生态事实 claims（包名、能力、API 表面），未经一手核实；本仓库与 OpenCode 存在四个真实耦合点（skills 安装面、scheduler worker runner、GitHub Actions 入口、lgmind CLI），且仓库已有明确决策：runtime 扩展必须独立过设计门。控制平面终态与现有 scheduler/ 职责重叠。缺乏核实证据与决策框架前，任何迁移动作都是盲动。

## 验收标准

- [ ] 提案关键事实 claims 逐一核实（Pi 核心能力、SDK/RPC、技能加载、Pi Web、pi-subagents、pi-goal、pi-mcp-adapter、browser/computer-use 扩展），产出 claim 到一手证据对照表，出入显式记录
- [ ] 隔离环境冒烟证据：repo-local .cache 内安装 Pi，验证 Legion skill 加载、print/JSON 非交互输出结构、SDK 或 JSONL RPC 驱动 session、一种 subagent 机制真实派生；命令与输出留档
- [ ] 耦合清单：本仓库每个 OpenCode 耦合点（skills 安装面、scheduler worker runner、GitHub Actions 入口、lgmind CLI）映射到 Pi 等价物或标记为 gap
- [ ] 三性结论：合理性对照 Legion 北极星与个人 harness 定位；可行性按 smoke-proven/doc-level/unknown 分级；合适性覆盖机器 fleet、已有 scheduler 资产、OpenCode 冻结线处置
- [ ] 路线图：分阶段、每阶段对应独立 Legion 任务的拆分（scope/依赖/退出条件），明确与冻结 OpenCode 线和现有 scheduler/ 的关系
- [ ] Legion 证据链完整：plan/log/tasks/rfc、review-rfc PASS、walkthrough、wiki writeback、PR lifecycle 闭环

## 假设 / 约束 / 风险

- **假设**: OpenCode 版本线冻结，本任务不触碰其安装面与配置
- **假设**: 个人 harness 定位：单用户、可信环境，不考虑多租户与产品化
- **假设**: 不做向前/向后兼容性设计，只评估目标达成的合理/可行/合适
- **假设**: 冒烟依赖可经 shell.nix 或下载 bin 在隔离目录解决
- **约束**: 所有冒烟与临时产物隔离在 repo 内 .cache/（含 HOME 重定向），不动全局环境与冻结的 OpenCode 版本
- **约束**: 不修改 skills/、scripts/、scheduler/、.opencode/ 等任何生产资产
- **约束**: 调研结论必须标注核实日期与版本，应对 Pi 生态快速漂移
- **风险**: 提案 claims 失真或过时，必须一手核实并记录出入
- **风险**: 控制平面终态与现有 scheduler/ 职责重叠，路线图必须明确二者关系
- **风险**: 本机冒烟环境与目标部署节点（Mac mini/NixOS/云服务器）存在差异，需标注环境边界
- **风险**: Legion skills 隐含 OpenCode 假设（工具名、AGENTS.md 加载方式）在 Pi 下可能不成立，冒烟必须覆盖

## 要点

- 三层评估框架：runtime 层可行性（Pi 能否承载 Legion 所需）、编排层合理性（控制平面拓扑是否符合 Legion 北极星）、个人适配性（fleet、scheduler 资产、OpenCode 冻结线）
- 证据分级：smoke-proven 高于 doc-level 高于 unknown，结论按级标注
- OpenCode 线冻结不动；无兼容性约束，只评估目标达成
- 本任务零生产代码变更；冒烟严格隔离 repo-local .cache

## 范围

- 桌面调研：Pi 官方文档与关键扩展仓库一手核实
- repo-local 隔离冒烟：Pi 安装、skill 加载、print/JSON、SDK/RPC、subagent 派生
- 耦合清单与 gap 分析
- 评估报告（docs/rfc.md）与分阶段路线图、后续 Legion 任务拆分
- Legion 证据链与文档 PR 交付

## 非目标

- 不修改任何生产代码与生产资产（`skills/`、`scripts/`、`scheduler/`、`.opencode/`、OpenCode/OpenClaw 安装面一律不动）。
- 不实施任何迁移阶段（Pi 安装面、worker runner 替换、控制平面实现均属后续独立 Legion 任务，各自过设计门）。
- 不做向前/向后兼容性设计（用户明确豁免）。
- 不做多租户、产品化、公开发布设计（个人 harness 定位）。
- 不评估 oh-my-pi / my-pi 作为基础底座，仅作参考样本。

## 设计索引 (Design Index)

> **Design Source of Truth**: 本任务的设计真源即交付物 .legion/tasks/evaluate-pi-control-plane/docs/rfc.md（评估报告与迁移路线图）

**摘要**:
- 先核实提案事实，再隔离冒烟，再做耦合与 gap 分析，最后形成三性结论与路线图
- 路线图按后续独立 Legion 任务拆分，每个任务各自过设计门
- OpenCode 线保持冻结；路线图回答 scheduler/ 与控制平面的关系

## 阶段概览

1. **Phase 1 - 契约物化与 worktree 准备** - 物化 .legion/tasks/evaluate-pi-control-plane 契约文档并在 .worktrees 中打开交付 worktree
2. **Phase 2 - 桌面调研：提案 claims 一手核实** - 核实 Pi 核心能力（SDK/RPC/print-JSON/skills 加载/session 树）的一手文档证据
3. **Phase 3 - 隔离环境冒烟** - 在 repo-local .cache 隔离 HOME 中安装 Pi 并验证 Legion skill 加载
4. **Phase 4 - 耦合与 gap 分析、三性结论** - 盘点本仓库 OpenCode 耦合点并映射 Pi 等价物或 gap
5. **Phase 5 - spec-rfc 评估报告与路线图、review-rfc 门禁** - 产出 docs/rfc.md：评估结论加分阶段路线图加后续 Legion 任务拆分
6. **Phase 6 - walkthrough、PR lifecycle、wiki writeback** - report-walkthrough 交付摘要与 PR 创建跟进至终态

---

*创建于: 2026-08-16 | 最后更新: 2026-08-16*
