# Harden strict verify integrity - 任务清单

## 快速恢复

**当前阶段**: (none)
**当前检查项**: (none)
**进度**: 7/7 任务完成
---

## 阶段 1: Design ✅ COMPLETE

- [x] 生成 strict verify 修复 RFC | 验收: RFC 明确完整性模型、兼容性与验证矩阵
- [x] 完成 RFC 对抗审查 | 验收: review-rfc 无 blocking 问题
---

## 阶段 2: Implementation ✅ COMPLETE

- [x] 实现 strict verify 完整性检测 | 验收: presence-only false positive 被消除
- [x] 补齐错误提示与兼容路径 | 验收: 用户能按提示 install --force 或修复资产
---

## 阶段 3: Validation ✅ COMPLETE

- [x] 运行正向与负向验证 | 验收: test-report 记录命令、退出码与结论
- [x] 完成只读变更审查 | 验收: review-change PASS 且无 blocking
- [x] 生成 walkthrough、PR body 与 wiki 收口 | 验收: 交付物路径齐全并记录 durable pattern
---

## 发现的新任务

(暂无)
---

*最后更新: 2026-04-25 02:29*
