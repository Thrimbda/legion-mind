# Harden v1 kernel harness surface - 任务清单

## 快速恢复

**当前阶段**: 阶段 5 - PR lifecycle
**当前检查项**: 提交、rebase、push、创建 PR 并跟进 lifecycle
**进度**: 4/5 任务完成

---

## 阶段 1: Design gate ✅ COMPLETE

- [x] 产出 RFC 并通过 review-rfc | 验收: RFC 覆盖 docs 删除、OpenClaw parity、regression suite 与 README 边界，review-rfc PASS。

---

## 阶段 2: Implementation ✅ COMPLETE

- [x] 实施 docs cleanup、OpenClaw parity、regression suite 与 README 更新 | 验收: 变更只落在 scope 内，OpenCode 既有 setup 行为不回退。

---

## 阶段 3: Verification ✅ COMPLETE

- [x] 运行 setup/regression/CLI 相关验证并记录 test-report | 验收: test-report.md 记录命令、结果与任何明确跳过边界。

---

## 阶段 4: Review and report ✅ COMPLETE

- [x] 完成 review-change、report-walkthrough、PR body 与 wiki writeback | 验收: review-change PASS，walkthrough/pr-body/wiki evidence 完整。

---

## 阶段 5: PR lifecycle 🟡 IN PROGRESS

- [ ] 提交、rebase、push、创建 PR 并跟进 lifecycle | 验收: PR 创建并记录 checks/review/cleanup/main refresh 状态或 blocker。 ← CURRENT


---

## 发现的新任务

(暂无)


---

*最后更新: 2026-04-27 08:20*
