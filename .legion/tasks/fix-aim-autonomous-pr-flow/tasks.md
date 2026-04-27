# Fix AIM autonomous PR flow - 任务清单

## 快速恢复

**当前阶段**: 阶段 3 - Verification and handoff
**当前检查项**: 无（已完成）
**进度**: 6/6 任务完成

---

## 阶段 1: Contract materialization

- [x] 物化 task contract | 验收: `plan.md` / `tasks.md` 定义目标、范围、约束与验收

---

## 阶段 2: Rule wording implementation

- [x] 更新 `git-worktree-pr` | 验收: commit/push/PR/follow-up 是默认 lifecycle action，非逐项用户授权动作
- [x] 同步入口与 autopilot 文档 | 验收: `AGENTS.md`、OpenCode agent、`REF_AUTOPILOT.md`、README 语义一致

---

## 阶段 3: Verification and handoff

- [x] 运行 targeted verification | 验收: 关键规则断言通过，`git diff --check` 通过
- [x] 完成 review-change | 验收: 无 blocking findings
- [x] 完成 walkthrough / PR body / wiki writeback | 验收: reviewer 可直接理解改动与证据

---

## 发现的新任务

- (暂无)

## 本轮显式约束

- 用户要求按 AIM 开发流程修正；因此本任务应继续走 commit / push / PR lifecycle，不把“未逐项要求 commit/push/PR”当成停止条件。
