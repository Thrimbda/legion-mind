# Log: Linear WI-05 PR Tracking and Linear Delivery Writeback

## 2026-06-25

- 入口: 用户要求使用 Legion workflow 完成 Linear issue `0XC-60`，并明确要求提交、合并 PR、妥善管理 Linear 生命周期。
- Linear context: issue `0XC-60` 为 High priority，labels 包含 `repo:legion-mind`、`risk:high`、`contract:stable`、`area:scheduler`、`work-item`；Design Source 指向 scheduler RFC、WI-05 doc、sync PR #33 与 merge commit `796002c`。
- Dependency check: blocker `0XC-58` / WI-04 已在当前 `origin/master` 中合并为 `cc00f7d feat: add opencode worker runner (#38)`。
- Workflow: 已加载 `legion-workflow`、`linear`、`brainstorm`、`legion-docs`、`git-worktree-pr`；无 explicit bypass。
- Linear writeback: 已将 `0XC-60` 移至 `In Progress`，并添加 claimed/started comment，说明将通过 `git-worktree-pr` PR lifecycle 完成。
- Envelope: 先误建 `.worktrees/linear-0xc-60-pr-writeback/`，未产生 tracked changes；随后删除并按 envelope hard gate 从最新 `origin/master` 重建正确 worktree `.worktrees/linear-0xc-60/`，分支 `legion/linear-0xc-60-pr-writeback`。
- Contract: 基于 Linear issue、RFC、WI-05 work item、WI-04 handoff 和 review-rfc PASS 物化 `plan.md` / `tasks.md`；taskId 采用确定性映射 `0XC-60` -> `linear-0xc-60`。
- Design gate: 风险 high；已有 approved design source 为 `docs/linear-legion-scheduler/rfc.md`、`docs/linear-legion-scheduler/work-items/WI-05-delivery-pr-writeback.md` 和 `.legion/tasks/amend-linear-native-scheduler-rfc/docs/review-rfc.md` PASS，因此执行模式判定为 approved-design continuation。
- Engineer: 新增 `scheduler/src/pr-tracker.ts`，提供 `PullRequestSnapshot`、`GitHubPrClient` adapter boundary、fixture/static client、GitHub REST debug client、PR state -> run delivery decision mapping、terminal success/non-success gate 与 Linear native writeback outbox enqueueing。
- Engineer: 扩展 `scheduler/src/sqlite-store.ts`，新增 WI-05 native outbox side effects（comment、issue labels、issue state）与 migration guard，并暴露 `evaluatedSnapshotForRun()` 供 PR tracker 读取 risk / evidence gate 输入。
- Engineer: 修改 `scheduler/src/worker-runner.ts`，worker 返回 `done` 且 Legion evidence PASS 时不再直接标记 run `done`，而是进入 `in_review`、记录 `pr_tracking_required`，等待 GitHub PR tracker 决定 terminal success；同时扩展 native adapter final summary/comment/state/labels payload。
- Engineer: 扩展 `scheduler/src/cli.ts`，新增 `delivery track` debug command，可用 fixture 或 GitHub REST snapshot 推进 run delivery state。
- Engineer: 新增 `scheduler/tests/linear-pr-tracker.test.ts` 与 `scheduler/tests/fixtures/pr-open.json`，覆盖 PR open -> in_review、checks/review blocked、merged success、merged evidence/lifecycle negative、closed-unmerged non-success 与 CLI fixture。
- Engineer: 新增交付文档 `docs/linear-legion-scheduler/delivery-pr-writeback.md`，并更新 scheduler README、index 与 WI-05 状态。
- Engineer check: `npm --prefix scheduler test` PASS（35 tests）。
- Verify: `npm --prefix scheduler test` PASS（35 tests），覆盖 PR tracker / worker runner / scheduler core / scanner。
- Verify: `npm --prefix scheduler run health -- --db :memory:` PASS，DB migrations / WI-05 native outbox side-effect schema 正常。
- Verify: `npm run test:regression` PASS（18 tests）。
- Verify: `npm run pack:dry-run` PASS，root npm package 仍不包含 `scheduler/` prototype。
- Verify: `git diff --check` PASS。
- Verify artifact: 写入 `docs/test-report.md`；真实 GitHub API 与 Linear native adapter smoke 作为生产前残余，不属于本地自动验证。
- Review iteration 1: 发现 terminal success gate 顺序问题：`trackPrDelivery()` 先标记 `done` / release locks，再 enqueue final Linear writeback，不满足“final writeback queued/sent 后才 done”。已退回 Engineer 修复。
- Engineer fix after review: 调整 `scheduler/src/pr-tracker.ts`，success final response/comment/state/labels outbox rows 先 enqueue，再进入 `done`、release locks、记录 downstream reconcile；terminal non-success 也先 enqueue final writeback 再进入终态。
- Verify after review fix: `npm --prefix scheduler test` PASS（35 tests）；`npm --prefix scheduler run health -- --db :memory:` PASS；`npm run test:regression` PASS（18 tests）；`npm run pack:dry-run` PASS；`git diff --check` PASS。
- Review iteration 2: `review-change` PASS；security / trust-boundary lens 覆盖 GitHub adapter、Linear native outbox、worker self-attestation、evidence/lifecycle verifier 与 downstream unlock gate。
- Report: 生成 implementation mode 的 `docs/report-walkthrough.md` 与 `docs/pr-body.md`，引用 test-report / review-change 既有证据。
- Wiki: 执行 `legion-wiki` writeback，新增 `wiki/tasks/linear-0xc-60.md`，更新 `index.md`、`patterns.md`、`maintenance.md` 与 `log.md`。
