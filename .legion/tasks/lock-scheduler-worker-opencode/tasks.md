# Lock Scheduler Worker Runtime to OpenCode - 任务清单

## 快速恢复

**当前阶段**: Phase 4  
**当前检查项**: 提交、rebase、push、创建 PR 并跟进 lifecycle  
**进度**: 10/11 任务完成

---

## 阶段 1: Contract / Envelope ✅ COMPLETE
- [x] 加载 `legion-workflow` 并确认本请求进入 Legion 管理流程 | 验收: 修改前先过入口门
- [x] 加载 `brainstorm`、`legion-docs`、`git-worktree-pr` 并创建 worktree | 验收: `.worktrees/lock-scheduler-worker-opencode/` 已创建

## 阶段 2: Design Update ✅ COMPLETE
- [x] 更新 `docs/linear-legion-scheduler/rfc.md` | 验收: worker runtime 固定为 OpenCode，移除多 runtime MVP 表述
- [x] 更新 `docs/linear-legion-scheduler/work-items/WI-04-legion-worker-runner.md` | 验收: WI-04 scope / non-goals / 验证同步 OpenCode-only
- [x] 更新 wiki 相关结论 | 验收: task summary / patterns 记录 OpenCode-only 决策

## 阶段 3: Review / Verification ✅ COMPLETE
- [x] 执行 `review-rfc` | 验收: review 结论 PASS 或 blocking 已修复
- [x] 处理 review non-blocking suggestions | 验收: 架构图和 evidence verifier 清单已同步
- [x] 执行文档验证 | 验收: `git diff --check` 通过，搜索不到旧 runtime 枚举误导

## 阶段 4: Closing 🟡 IN PROGRESS
- [x] 生成 walkthrough / PR body | 验收: reviewer 能看懂变更和证据
- [x] 执行 `legion-wiki` writeback | 验收: wiki log / summary 更新
- [x] 生成 HTML walkthrough | 验收: HTML artifact 自包含且基础质量检查通过
- [ ] 提交、rebase、push、创建 PR 并跟进 lifecycle | 验收: PR merged 或记录 blocked handoff ← CURRENT
