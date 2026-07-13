# 保留多 Agent 评审循环并修复报告语义 - 任务清单

## 快速恢复

**当前阶段**: 阶段 4 - 交付
**当前检查项**: 完成 PR lifecycle；当前报告无未决 claim，`attention: skim`
**进度**: 8/9 任务完成

---

## 阶段 1: 设计与独立评审 ✅ COMPLETED

- [x] 完成 RFC | 验收: RFC 明确状态一致性、缺 verifier、权限和 Agent 隔离语义
- [x] 独立 review-rfc 至 PASS | 验收: 不同 Agent 审查边界、反例和验证设计并给出 PASS

---

## 阶段 2: 实现 ✅ COMPLETED

- [x] 修复 schema、renderer、scheduler、权限和阶段语义 | 验收: 所有实现均符合已批准 RFC
- [x] 补充回归测试 | 验收: 新增正负例覆盖四项验收

---

## 阶段 3: 验证与验收 ✅ COMPLETED

- [x] 重新运行定向与全量回归 | 验收: 根回归与 scheduler 回归通过
- [x] 独立 review-change | 验收: 不同 Agent 基于证据给出可交付判断

---

## 阶段 4: 交付 🔄 IN PROGRESS

- [x] 生成 walkthrough 与 wiki | 验收: 人类可读报告和当前真源写回完成
- [ ] 完成 PR lifecycle | 验收: 提交、rebase、push、checks、review、终态、cleanup 和主工作区刷新完成 ← CURRENT


---

## 发现的新任务

- [x] 修复空 verifier 占位符产生的 HTML 行尾空格，重新独立验证/审查并重建报告 | 验收: 生成产物无行尾空格，相关回归、`git diff --check` 和新一轮 review-change 均 PASS


---

*最后更新: 2026-07-13 16:24*
