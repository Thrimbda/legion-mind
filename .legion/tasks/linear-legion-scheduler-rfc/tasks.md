# Linear + Legion Scheduler RFC and Work Items - 任务清单

## 快速恢复

**当前阶段**: Phase 4  
**当前检查项**: 提交、rebase、push、创建/更新 PR 并跟进 PR lifecycle  
**进度**: 9/10 任务完成

---

## 阶段 1: Contract / Envelope ✅ COMPLETE
- [x] 加载 `legion-workflow` 并确认本请求进入 Legion 管理流程 | 验收: 未在入口前进行实现
- [x] 加载 `brainstorm` / `legion-docs` 并稳定 task contract | 验收: `plan.md` 覆盖目标、验收、scope、风险、non-goals
- [x] 加载 `git-worktree-pr` 并从 `origin/master` 创建 `.worktrees/linear-legion-scheduler-rfc/` | 验收: 后续写入均在 worktree 内完成

## 阶段 2: RFC / WI Draft ✅ COMPLETE
- [x] 写入 `.legion/tasks/linear-legion-scheduler-rfc/docs/research.md` | 验收: 现状摸底引用 repo / workflow 证据
- [x] 写入总体 RFC | 验收: 覆盖架构、状态机、数据模型、ready 算法、Legion 嵌入、PR lifecycle、安全、可观测性
- [x] 合并 WI 至不超过 10 个并逐文件写入 `docs/linear-legion-scheduler/work-items/` | 验收: 每个 WI 有目标、范围、依赖、验收、验证、风险
- [x] 写入 `docs/linear-legion-scheduler/index.md` | 验收: reviewer 能从 index 找到 RFC 与全部 WI

## 阶段 3: RFC Review ✅ COMPLETE
- [x] 加载 / 派生 `review-rfc` 对抗审查 | 验收: `docs/review-rfc.md` 有 PASS / FAIL 结论与证据
- [x] 若 review FAIL，迭代 RFC 与 WI 文件直到 PASS | 验收: blocking findings 归零

## 阶段 4: Closing 🟡 IN PROGRESS
- [x] 加载 `report-walkthrough` 并生成 reviewer handoff | 验收: `docs/report-walkthrough.md`、`docs/pr-body.md` 可用于 PR
- [x] 加载 `legion-wiki` 并写入任务摘要 / 可复用模式 | 验收: `.legion/wiki/**` 有来源明确的 writeback
- [x] 运行设计交付验证 | 验收: `git diff --check` 通过，WI 文件数量为 8
- [ ] 提交、rebase、push、创建/更新 PR 并跟进 PR lifecycle | 验收: 符合 `git-worktree-pr` 完成条件或记录 blocked handoff ← CURRENT
