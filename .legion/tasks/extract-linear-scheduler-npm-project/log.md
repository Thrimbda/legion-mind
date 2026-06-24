# Log: Extract Linear Scheduler into an Independent npm Project

## 2026-06-24

- 用户指出 scheduler 不应放在 root `scripts/` 下，应单独开文件夹作为独立 npm 项目。
- 按 Legion 入口加载 `legion-workflow`；当前请求没有明确既有 task id，进入 `brainstorm`。
- 确认为修改型开发任务，加载 `git-worktree-pr`；主工作区只做只读检查与 worktree 准备。
- 从 `origin/master` 创建 `.worktrees/extract-linear-scheduler-npm-project/`，分支 `legion/extract-linear-scheduler-npm-project`。
- 物化本任务 contract：目标为把 scheduler 迁移到 root `scheduler/` 独立 npm project，并修正文档与验证入口。
- Engineer 完成：新增 `scheduler/package.json` 与 `scheduler/README.md`，将 CLI / state machine / SQLite store / scheduler tests 迁入 `scheduler/src` 与 `scheduler/tests`。
- 根 `package.json` 已移除 `scheduler:debug` 与 `test:linear-scheduler`，避免 root `lgmind` package 承载 scheduler runtime script。
- 更新 `docs/linear-legion-scheduler/**` 当前交付说明，指向 `scheduler/` 独立项目结构。
- Engineer local check: `npm --prefix scheduler test` PASS（12 tests）。
- Verify 完成：`npm --prefix scheduler test` PASS（12 tests）；`npm --prefix scheduler run health -- --db :memory:` PASS；`npm run test:regression` PASS（18 tests）；`npm run pack:dry-run` PASS 且 root package file list 未包含 `scheduler/`；`git diff --check` PASS。
- Review 完成：`docs/review-change.md` 结论 PASS；无 blocking findings；security lens 未发现本次目录/项目边界迁移新增安全触发点。
- Report walkthrough 完成：生成 `docs/report-walkthrough.md` 与 `docs/pr-body.md`，面向 reviewer 汇总项目边界迁移、验证与 review 证据。
- Legion wiki writeback 完成：新增 `wiki/tasks/extract-linear-scheduler-npm-project.md`，更新 scheduler current truth、patterns、maintenance、WI-02 摘要与 wiki log。
