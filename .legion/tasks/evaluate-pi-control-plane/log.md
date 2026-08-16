# 评估 Legion 迁移至 Pi 控制平面架构 - 日志

## 会话进展 (2026-08-16)

### ✅ 已完成

- 契约经用户确认并物化（plan/log/tasks 非骨架，含非目标节）
- git-worktree-pr envelope 已打开：worktree .worktrees/evaluate-pi-control-plane，分支 legion/evaluate-pi-control-plane，base origin/master 4bc7959
- Phase 2 桌面调研：四路并行核实完成，发现多处提案失真并已记录
- Phase 3 隔离冒烟全部 PASS：skill 三路径加载+渐进披露、print/JSON 事件流、SDK、RPC、pi-subagents scout 派生
- research.md 落盘：耦合盘点、四路核实结论、七项冒烟证据
- rfc.md 落盘：GO 决策 + 三性结论 + M1-M6 路线图 + 回滚方案
- review-rfc 独立评审 PASS（3 major/4 minor，无 blocker），7 条 findings 全部处置并回写 rfc.md/research.md

(暂无)
### 🟡 进行中

- 初始化任务日志。
- Phase 2 桌面调研：提案 claims 一手核实
- Phase 4 耦合与 gap 分析、三性结论
- review-rfc 门禁
- Phase 6 walkthrough、PR lifecycle、wiki writeback
### ⚠️ 阻塞/待定

- 约束: 冒烟未覆盖 pi-web/pi-goal/pi-mcp-adapter/browser/computer-use/fleet，这些保持 doc-level 证据并在 RFC 中分级标注

(暂无)
(暂无)
---

## 关键文件

- **`.legion/tasks/evaluate-pi-control-plane/docs/review-rfc.md`** [completed]
  - 作用: 独立 RFC 评审报告
  - 备注: Verdict PASS，3 major/4 minor 已全部处置
---

## 关键决策

| 决策 | 原因 | 替代方案 | 日期 |
|------|------|----------|------|
| 采纳评审意见修正：M3 退出改为本地调用入口验收并给出 M3a/M3b 拆分指引；审批闸证据链补齐（ctx.ui 已核实补入 research）；subagent 拓扑所有权与 backend 切换判据显式化；冒烟结论收窄到已覆盖范围；M5 明确 Actions workflow 停用处置；24h 指标归入 M4 强制退出 | 评审 F1-F7 均为实质性一致性问题，设计-only 交付物的可验收性依赖这些修正 | 仅记录不修正（拒绝：major findings 会穿透到 M3/M4 设计门） | 2026-08-16 |
---

## 快速交接

**下次继续从这里开始：**

1. (none)

**注意事项：**

(暂无)

(暂无)
(暂无)
(暂无)
---

*最后更新: 2026-08-16 11:39 by Legion CLI*
