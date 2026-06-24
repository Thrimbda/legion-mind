# Tasks: Linear Scheduler WI-03

## Contract / Envelope

- [x] 加载 `legion-workflow` 并判断本请求由 Legion 接管 | 验收: 无 bypass，Linear `0XC-57` 明确要求执行 Legion workflow
- [x] 加载 `brainstorm` / `legion-docs` 并收敛 task contract | 验收: `plan.md` / `tasks.md` 物化在 worktree
- [x] 加载 `git-worktree-pr` 并创建 `.worktrees/linear-legion-scheduler-wi-03/` | 验收: 后续写入均在 worktree 内完成
- [x] 确认执行模式为 approved-design continuation | 验收: RFC / WI docs 已合并，WI-02 blocker 已 Done，本任务为 medium risk implementation continuation

## Engineer

- [x] 新增 Linear project snapshot client / adapter | 验收: 支持 project issue pagination，输出 normalized issue snapshot DTO
- [x] 实现 dependency graph builder 与 cycle detection | 验收: `blocker -> blocked` 方向、incoming blockers、cycle path 测试覆盖
- [x] 实现 eligibility parser 与 skipped reason taxonomy | 验收: 必需 skipped reasons 全部有 typed reason 与 fixture coverage
- [x] 实现 `isBlockerSatisfied()` terminal gate | 验收: manual done、run terminal success / non-success、inconsistent gate 测试覆盖
- [x] 实现 ready candidate sorting 与 native action preview | 验收: ready item 包含 priority、locks、snapshotHash、linearUpdatedAt、nativePreview
- [x] 实现 dry-run scanner CLI / service endpoint | 验收: 对 mock project 输出 `project` / `observedAt` / `ready` / `skipped` / `cycles`
- [x] 写入 `work_item_snapshots` | 验收: scanner persist snapshot，后续 diff / debug 可读取
- [x] 更新 WI-03 docs / scheduler index | 验收: reviewer 能从 docs 找到 WI-03 delivery artifact 与运行命令

## Verify

- [x] 运行 scheduler unit tests | 验收: graph、cycle、skip reason、terminal gate PASS
- [x] 运行 mock Linear integration tests | 验收: fixture project -> expected ready/skipped/cycles report PASS
- [x] 运行 dry-run / health smoke | 验收: CLI 对 fixture 或 test project 输出可核对 report，且无 Linear write side effect
- [x] 运行 repo regression / packaging smoke | 验收: root `npm run test:regression`、`npm run pack:dry-run` 或可信 blocker 记录
- [x] 写入 `.legion/tasks/linear-legion-scheduler-wi-03/docs/test-report.md` | 验收: 命令、结果、覆盖范围、跳过项完整

## Review / Close

- [x] 执行 `review-change` 并写入 readiness 结论 | 验收: `docs/review-change.md` PASS 或明确 blocker
- [x] 生成 reviewer walkthrough 与 PR body | 验收: `docs/report-walkthrough.md` / `docs/pr-body.md` 存在
- [x] 执行 `legion-wiki` writeback | 验收: wiki task summary / index / patterns / log 更新
- [ ] 完成 git-worktree-pr lifecycle | 验收: commit、fetch+rebase、push、PR、checks/review、auto-merge、cleanup、main refresh 到终态

## 当前状态

- 当前阶段: Git / PR lifecycle
- 当前 owner: OpenAI / Legion agent
- Blocker: 无；Linear blocker WI-02 已 Done
