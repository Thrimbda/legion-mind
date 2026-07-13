# 发布 `lgmind` 0.4.0 任务状态

## 状态

- 当前阶段：Git / PR lifecycle ← CURRENT
- 模式：approved-design continuation
- 风险：实现低风险；公开发布中高风险
- 分支：`codex/release-lgmind-0-4-0`
- Worktree：`.worktrees/release-lgmind-0-4-0/`
- Base：`origin/master`
- 总体进度：IN PROGRESS

## 阶段检查表

### Contract 与准备 — COMPLETE

- [x] 从最新 `origin/master` 创建隔离 worktree。
- [x] 物化 `plan.md`、`log.md` 与 `tasks.md`。
- [x] 记录用户对合并后公开发布 `0.4.0` 的明确授权与风险边界。

### Engineer — COMPLETE

- [x] 把根 `package.json` 版本更新为 `0.4.0`。
- [x] 新增中文发布说明，不夹带功能语义改动。
- [x] 确认 runtime build 不产生未预期漂移。

### Verify change — COMPLETE

- [x] 运行 `npm run audit:context`。
- [x] 运行 `npm run test:regression`。
- [x] 运行 `npm run pack:dry-run` 并断言版本与关键资产。
- [x] 确认 npm registry 尚不存在 `lgmind@0.4.0`。
- [x] 记录 claim、原始证据与阶段 attention。
- [x] 重验提交后 `origin/master...HEAD` + working diff 基线与 OpenCode 越界清理结果。

### Review change — COMPLETE

- [x] 独立审查版本改动、包内容、供应链边界与发布就绪度。
- [x] 处理所有 blocking review。
- [x] 独立复核 wiki writeback 后的产品 diff 过滤边界修订。
- [x] 越界清理后重新派生独立 reviewer，并恢复有效 PASS 证据。

### Walkthrough 与 wiki — COMPLETE

- [x] 生成 `report-data.json`、Markdown、HTML 与 PR body。
- [x] 写回 `.legion/wiki/**` 当前发布状态。

### Git / PR lifecycle — IN PROGRESS

- [x] 提交 scope 内版本准备变更，并准备提交验证修订与越界恢复证据。
- [ ] push 前 fetch/rebase 最新 `origin/master`。
- [ ] 推送分支并创建 squash PR。
- [ ] 跟进 checks/review，确认 merge 前发布门。
- [ ] squash merge 版本准备 PR。

### 公开发布与收口 — NOT STARTED

- [ ] 锁定合并后的 `master` SHA，并再次确认 `0.4.0` 未发布。
- [ ] 从该 `master` 触发 `Publish npm package` workflow。
- [ ] 确认 workflow checkout SHA 与发布步骤成功。
- [ ] 验证 registry 固定版本与 `latest` 均为 `0.4.0`。
- [ ] 在干净目录完成固定版本 npx、安装、strict verify 与关键资产检查。
- [ ] 回写发布结果并完成收口 PR。
- [ ] 清理 worktree并刷新主工作区。
