# Linear Scheduler WI-01 - 任务清单

## 快速恢复

**当前阶段**: Phase 5<br>
**当前检查项**: 提交、rebase、push、创建/更新 PR 并跟进 PR lifecycle<br>
**进度**: 9/10

---

## Phase 1: Contract / Envelope ✅ COMPLETE
- [x] 加载 `legion-workflow` 并确认本请求进入 Legion 管理流程 | 验收: 入口前未实现或派生子代理
- [x] 加载 `brainstorm` / `legion-docs` 并稳定 task contract | 验收: `plan.md` 覆盖目标、验收、范围、风险、non-goals
- [x] 加载 `git-worktree-pr` 并创建 `.worktrees/linear-legion-scheduler-wi-01/` | 验收: 后续写入均在 worktree 内完成

## Phase 2: Engineer ✅ COMPLETE
- [x] 加载 `engineer` 并写入 WI-01 policy 文档 | 验收: policy 覆盖模板、taxonomy、state mapping、ready/skipped、blocker、native agent、术语和示例
- [x] 更新 `docs/linear-legion-scheduler/index.md` 与 WI-01 work item | 验收: reviewer 能从 index 与 WI-01 找到交付成果

## Phase 3: Verify ✅ COMPLETE
- [x] 加载 `verify-change` 并运行文档验证 | 验收: `docs/test-report.md` 记录命令与 acceptance checklist

## Phase 4: Review ✅ COMPLETE
- [x] 加载 `review-change` 并执行 readiness review | 验收: `docs/review-change.md` 给出 PASS / FAIL 结论
- [x] 若 review FAIL，回到 engineer 修复 | 验收: review PASS，无需回退且 blocking findings 归零

## Phase 5: Closing 🟡 IN PROGRESS
- [x] 加载 `report-walkthrough` 并生成 reviewer handoff | 验收: `docs/report-walkthrough.md` 与 `docs/pr-body.md` 可用于 PR
- [x] 加载 `legion-wiki` 并写入任务摘要 / 可复用模式 | 验收: `.legion/wiki/**` 有来源明确的 writeback
- [ ] 提交、rebase、push、创建/更新 PR 并跟进 PR lifecycle | 验收: 符合 `git-worktree-pr` 完成条件或记录 blocked handoff

---
*Created: 2026-06-24*
