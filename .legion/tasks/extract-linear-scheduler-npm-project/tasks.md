# Task Checklist: Extract Linear Scheduler into an Independent npm Project

## 当前状态

- **阶段**: Wiki writeback complete; ready for PR lifecycle
- **执行模式**: approved-design continuation mode（修正 WI-02 交付形态，不重开 scheduler 业务设计）
- **风险等级**: low-to-medium（主要为目录迁移与发布边界修正；风险集中在路径引用遗漏）
- **Worktree**: `.worktrees/extract-linear-scheduler-npm-project/`
- **Branch**: `legion/extract-linear-scheduler-npm-project`
- **Base ref**: `origin/master`

## Checklist

### 1. Contract / Envelope

- [x] 加载 `legion-workflow`。
- [x] 当前请求无明确既有 task id，进入 `brainstorm` 收敛新 task contract。
- [x] 加载 `git-worktree-pr`，确认修改只在 worktree 内完成。
- [x] 从 `origin/master` 创建 worktree 与 PR branch。
- [x] 物化 `plan.md` / `tasks.md`。

### 2. Engineer

- [x] 创建 `scheduler/` 独立 npm project。
- [x] 迁移 CLI 与 core source 出 root `scripts/`。
- [x] 迁移 scheduler 测试出 root `tests/regression/`。
- [x] 更新 imports、npm scripts 与文档路径。
- [x] 删除旧 scheduler 承载文件，确保 `scripts/` 不再包含 scheduler 项目代码。

### 3. Verify

- [x] 运行 `npm --prefix scheduler test`。
- [x] 运行必要的 root regression / package 边界验证。
- [x] 记录 `docs/test-report.md`。

### 4. Review

- [x] 执行 `review-change`。
- [x] 按 review 结果修复范围内问题。（无 blocking findings）

### 5. Close / PR lifecycle

- [x] 生成 `docs/report-walkthrough.md`。
- [x] 生成 `docs/pr-body.md`。
- [x] 执行 `legion-wiki` writeback。
- [ ] 提交变更。
- [ ] push 前执行 `git fetch origin && git rebase origin/master`。
- [ ] push PR branch 并创建/更新 PR。
- [ ] 尝试启用 squash auto-merge。
- [ ] 跟进 checks / review 至终态。
- [ ] PR merged / closed 后清理 worktree。
- [ ] 主工作区刷新到 `origin/master`。
