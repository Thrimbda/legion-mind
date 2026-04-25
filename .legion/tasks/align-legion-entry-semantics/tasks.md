# Align Legion entry semantics - 任务清单

## 快速恢复

**当前阶段**: 阶段 3 - 验证与交付
**当前检查项**: 无（已完成）
**进度**: 8/8 任务完成

---

## 阶段 1: 设计收敛 ✅ COMPLETE

- [x] 起草入口语义收敛 RFC | 验收: 明确定义 active task、restore、init/wiki skeleton、命名关系
- [x] 完成 RFC 对抗审查并吸收结论 | 验收: review-rfc 无 blocking 问题

---

## 阶段 2: 文档与实现收口 ✅ COMPLETE

- [x] 更新 README / usage / AGENTS / workflow / brainstorm 文案 | 验收: 入口叙事一致
- [x] 按需调整 `init` 或相关 references | 验收: init 行为与文档一致
- [x] 收敛 playbook / wiki 定义 | 验收: 至少在 README/usage 中有稳定一句话定义
- [x] 把 CLI `status.currentTask` 改成无歧义字段名 | 验收: 不再与 active task 语义混淆

---

## 阶段 3: 验证与交付 ✅ COMPLETE

- [x] 运行针对性验证 | 验收: 核对 CLI 行为与文档契约
- [x] 完成代码/文档审查 | 验收: review-code 无 blocking 问题
- [x] 生成 walkthrough / PR body | 验收: reviewer 可直接理解偏差与修正

---

## 发现的新任务

- (暂无)

---

*最后更新: 2026-04-23 02:30*
