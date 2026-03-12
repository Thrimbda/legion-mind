# 精简 task-brief 与 plan 的职责边界 - 任务清单

## 快速恢复

**当前阶段**: 阶段 3 - 验证与交付（已完成）
**当前任务**: (none)
**进度**: 6/6 任务完成

---

## 阶段 1: 建模与设计 ✅ COMPLETE

- [x] 确认 plan-only 设计方向并完成风险分级 | 验收: `plan.md` 明确问题定义、验收、假设/约束/风险，并确认 LegionMind 层不再兼容 `task-brief.md`
- [x] 生成 RFC 并完成 review-rfc 收敛 | 验收: `rfc.md` 与 `review-rfc.md` 给出可执行的 plan-only 重构方案

---

## 阶段 2: 实现与同步 ✅ COMPLETE

- [x] 更新 schema、agent prompt 与命令说明 | 验收: 技能、命令与提示词统一改为 `plan.md` / `planPath` 作为标准入口
- [x] 更新长期使用文档与 playbook | 验收: docs 与 playbook 明确 plan-only 职责划分与迁移建议

---

## 阶段 3: 验证与交付 ✅ COMPLETE

- [x] 执行测试与代码评审流程并落盘报告 | 验收: 生成 test-report.md、review-code.md，必要时生成 review-security.md
- [x] 生成 walkthrough 与 PR body | 验收: 生成 report-walkthrough.md 与 pr-body.md，可直接用于 PR

---

## 发现的新任务

(暂无)

---

*最后更新: 2026-03-12 11:26*
