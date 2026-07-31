# Legion 单 PR 生命周期硬约束 - 任务清单

## 快速恢复

**当前阶段**: repo evidence `delivery-ready`
**当前检查项**: 仅剩唯一 PR 的外部 lifecycle；terminal 后不再回写本文件
**进度**: 4/4 repo 任务完成

---

## 阶段 1: 设计 ✅ COMPLETE

- [x] 完成单 PR 生命周期 RFC 与独立审查 | 验收: RFC 覆盖发布/部署失败、状态真源、迁移与反递归语义并获 PASS

---

## 阶段 2: 实现 ✅ COMPLETE

- [x] 修改当前规则、模板、文档和测试 | 验收: 所有当前真源一致表达单 PR 硬约束，legacy/post-terminal 负路径 fail closed

---

## 阶段 3: 验证 ✅ COMPLETE

- [x] 完成独立验证与变更审查 | 验收: 目标回归和全量兼容检查 PASS，review-change PASS

---

## 阶段 4: 交付准备 ✅ COMPLETE

- [x] 生成交付材料并固定 repo evidence | 验收: report/wiki/task 均为 `delivery-ready`，唯一 PR terminal、cleanup 与 refresh 留给外部 lifecycle且不产生第二 PR


---

## 发现的新任务

(暂无)


---

*最后更新: 2026-07-31*
