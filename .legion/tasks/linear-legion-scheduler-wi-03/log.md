# Log: Linear Scheduler WI-03

## 2026-06-24

- 入口: 用户要求使用 Legion workflow 完成 Linear issue `0XC-57`。
- Linear context: issue `0XC-57` 为 High priority，labels 包含 `repo:legion-mind`、`risk:medium`、`contract:stable`、`area:scheduler`、`work-item`；Design Source 指向 scheduler RFC 与 WI-03 doc。
- Dependency check: blocker `0XC-55` / WI-02 在 Linear 中为 `Done`。
- Workflow: 已加载 `legion-workflow`、`brainstorm`、`linear`、`legion-docs`、`git-worktree-pr`；无 explicit bypass。
- Envelope: 已从最新 `origin/master` 创建 worktree `.worktrees/linear-legion-scheduler-wi-03/`，分支 `legion/linear-legion-scheduler-wi-03-graph-scanner`。
- Contract: 基于 Linear issue、RFC、WI-03 work item 与 WI-02 handoff 物化 `plan.md` / `tasks.md`；执行模式判定为 approved-design continuation。
- Engineer: 新增 `scheduler/src/scanner.ts`，实现 Linear GraphQL project snapshot fetch、dependency graph、cycle detection、eligibility / skipped reason taxonomy、terminal blocker policy、ready sorting、native action preview 与 dry-run report。
- Engineer: 扩展 `scheduler/src/cli.ts`，新增 `scan project` / `scan fixture`；扩展 `SchedulerStore` 查询接口以支持 active run、latest run、held lock conflict 和 snapshot inspection。
- Engineer: 新增 `scheduler/tests/linear-graph-scanner.test.ts`，覆盖 graph direction、cycle path、manual done / scheduler terminal policy、required skipped reasons、snapshot persistence 与 CLI fixture scan。
- Engineer check: `npm --prefix scheduler test` PASS（16 tests）。
- Verify: `npm --prefix scheduler test` PASS（17 tests，含 mock Linear GraphQL pagination / relation normalization）。
- Verify: `npm --prefix scheduler run health -- --db :memory:` PASS。
- Verify: `npm run test:regression` PASS（18 tests）。
- Verify: `npm run pack:dry-run` PASS，root package file list 未包含 `scheduler/` runtime project。
- Verify: `git diff --check` PASS。
- Verify artifact: 写入 `docs/test-report.md`；真实 Linear `scan project` 因无 repo-local `LINEAR_API_KEY` / 测试 project 未执行，记录为残余上线前 smoke。
- Review: `review-change` PASS；未发现 blocking correctness / scope / maintainability / security finding。Security lens 已覆盖 Linear API token、debug CLI、fixture / DB path 与 native preview side-effect 边界。
- Report: 生成 implementation profile 的 `docs/report-walkthrough.html`、`docs/report-walkthrough.md` 与 `docs/pr-body.md`。HTML preview render 仍待 `pr-html-render` / PR lifecycle 后续处理。
- Render handoff: 已加载 `pr-html-render` 并写入 `docs/render-handoff.md`。Rendered preview 当前 blocked，原因是 PR 尚未创建且仓库 Pages / preview policy 未确认；避免为本 WI 偷渡新增 workflow。
- Wiki: 执行 `legion-wiki` writeback，新增 `wiki/tasks/linear-legion-scheduler-wi-03.md`，更新 `index.md`、`patterns.md`、`maintenance.md` 与 `log.md`。
