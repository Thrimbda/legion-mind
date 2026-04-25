# Tighten CLI wording and benchmark doc drift - 任务清单

## 快速恢复

**当前阶段**: (none)
**当前检查项**: (none)
**进度**: 3/3 任务完成
---

## 阶段 1: Phase 1 ✅ COMPLETE

- [x] Align verifier wording with current CLI role | 验收: setup-opencode verify output no longer says CLI is the default path
- [x] Rewrite benchmark doc to match current repo surface | 验收: benchmark docs stop claiming missing scripts/files as current commands
- [x] Validate current-truth consistency after edits | 验收: spot checks and grep confirm wording and docs are aligned
---

## 发现的新任务

- [ ] Investigate one-off `task create` success path that left `tighten-cli-doc-drift` without `plan.md/log.md/tasks.md` before manual repair | 来源: bootstrap observation during `tighten-cli-doc-drift`
---

*最后更新: 2026-04-23 11:09*
