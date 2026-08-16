# 评估 Legion 迁移至 Pi 控制平面架构 - 任务清单

## 快速恢复

**当前阶段**: 阶段 2 - Phase 2 - 桌面调研：提案 claims 一手核实
**当前检查项**: 核实 Pi 核心能力（SDK/RPC/print-JSON/skills 加载/session 树）的一手文档证据
**进度**: 1/13 任务完成
---

## 阶段 1: Phase 1 - 契约物化与 worktree 准备 ✅ COMPLETE

- [x] 物化 .legion/tasks/evaluate-pi-control-plane 契约文档并在 .worktrees 中打开交付 worktree | 验收: plan.md/log.md/tasks.md 内容完整非骨架；worktree 基于最新 origin/master
---

## 阶段 2: Phase 2 - 桌面调研：提案 claims 一手核实 ⏳ NOT STARTED

- [ ] 核实 Pi 核心能力（SDK/RPC/print-JSON/skills 加载/session 树）的一手文档证据 | 验收: claim 到证据对照表中每条均有来源 URL 与核实日期 ← CURRENT
- [ ] 核实关键扩展（pi-web、pi-subagents、pi-goal、pi-mcp-adapter、browser/computer-use、LSP）真实状态 | 验收: 每个扩展记录仓库/版本/维护状态/能力边界，提案出入显式标注
---

## 阶段 3: Phase 3 - 隔离环境冒烟 ⏳ NOT STARTED

- [ ] 在 repo-local .cache 隔离 HOME 中安装 Pi 并验证 Legion skill 加载 | 验收: 命令与输出留档；不动全局环境与冻结的 OpenCode 版本
- [ ] 验证 print/JSON 非交互输出可供 worker runner 消费 | 验收: 留档输出结构样本与字段稳定性观察
- [ ] 验证 SDK 或 JSONL RPC 创建并驱动 session | 验收: 留档最小驱动脚本与事件样本
- [ ] 验证一种 subagent 机制真实派生 | 验收: 留档派生命令、子 session 证据与资源边界观察
---

## 阶段 4: Phase 4 - 耦合与 gap 分析、三性结论 ⏳ NOT STARTED

- [ ] 盘点本仓库 OpenCode 耦合点并映射 Pi 等价物或 gap | 验收: 四类耦合点逐一有映射结论
- [ ] 形成合理性/可行性/合适性三性结论 | 验收: 可行性按 smoke-proven/doc-level/unknown 分级；合适性覆盖机器 fleet、scheduler 资产、OpenCode 冻结线
---

## 阶段 5: Phase 5 - spec-rfc 评估报告与路线图、review-rfc 门禁 ⏳ NOT STARTED

- [ ] 产出 docs/rfc.md：评估结论加分阶段路线图加后续 Legion 任务拆分 | 验收: 每阶段任务有 scope/依赖/退出条件；明确与冻结 OpenCode 线和 scheduler/ 的关系
- [ ] review-rfc 评审并处理意见直至 PASS | 验收: docs/review-rfc.md 记录 Verdict PASS
---

## 阶段 6: Phase 6 - walkthrough、PR lifecycle、wiki writeback ⏳ NOT STARTED

- [ ] report-walkthrough 交付摘要与 PR 创建跟进至终态 | 验收: PR merged 或 closed/confirmed abandoned 且记录；worktree 删除；主工作区刷新
- [ ] legion-wiki 收口写回 | 验收: wiki 记录本任务决策与后续任务入口
---

## 发现的新任务

(暂无)
---

*最后更新: 2026-08-16 11:03*
