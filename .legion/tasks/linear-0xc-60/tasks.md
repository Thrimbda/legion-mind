# Tasks: Linear WI-05 PR Tracking and Linear Delivery Writeback

## Contract / Envelope

- [x] 加载 `legion-workflow` 并判断本请求由 Legion 接管 | 验收: 无 bypass，用户要求完成 Linear `0XC-60`
- [x] 读取 Linear issue、approved RFC / WI docs 与 blocker 状态 | 验收: `0XC-60` contract stable、risk high，blocker `0XC-58` 已在 `origin/master` 合并
- [x] 加载 `brainstorm` / `legion-docs` 并物化 task contract | 验收: `plan.md` / `tasks.md` / `log.md` 存在于 worktree
- [x] 加载 `git-worktree-pr` 并创建 `.worktrees/linear-0xc-60/` | 验收: 后续写入均在 worktree 内完成
- [x] 确认执行模式为 approved-design continuation | 验收: scheduler RFC / WI-05 docs 已合并且 `review-rfc` PASS，风险 high 由 approved design source 承接

## Engineer

- [x] 实现 PR URL association / persistence | 验收: worker result 或 tracker input 可更新 run `pr_url` 并记录 event
- [x] 实现 GitHub PR client adapter / snapshot model | 验收: checks、review、merge、closed、draft/open 状态可用 fake adapter 测试
- [x] 实现 PR state -> run delivery decision mapping | 验收: open -> `in_review`，checks failing / review changes -> `blocked`，closed-unmerged -> terminal non-success，merged 需 evidence/lifecycle gate
- [x] 实现 terminal success / non-success gate | 验收: `done` 仅在 PR merged + evidence PASS + lifecycle complete + final writeback queued/sent 后成立
- [x] 实现 Linear native delivery writeback outbox | 验收: PR created、waiting review、blocked、final success/non-success 的 activity/external URL/comment/final summary 幂等
- [x] 扩展 CLI / docs | 验收: reviewer 能用 fixture / debug command 理解和验证 PR tracker flow

## Verify

- [x] 运行 scheduler unit tests | 验收: PR state mapping、terminal gate、dedupe key、negative cases PASS
- [x] 运行 integration / fixture PR transition tests | 验收: In Review -> Done / Blocked / terminal non-success scenarios PASS
- [x] 运行 repo regression / packaging smoke | 验收: root regression / pack dry-run 或可信 blocker 记录
- [x] 写入 `.legion/tasks/linear-0xc-60/docs/test-report.md` | 验收: 命令、结果、覆盖范围、跳过项完整

## Review / Close

- [x] 执行 `review-change` 并写入 readiness 结论 | 验收: `docs/review-change.md` PASS 或明确 blocker
- [x] 生成 reviewer walkthrough 与 PR body | 验收: `docs/report-walkthrough.md` / `docs/pr-body.md` 存在
- [x] 执行 `legion-wiki` writeback | 验收: wiki task summary / index / decisions / maintenance 按需更新
- [ ] 完成 git-worktree-pr lifecycle | 验收: commit、fetch+rebase、push、PR、checks/review、auto-merge、cleanup、main refresh 到终态
- [ ] 写回 Linear final status | 验收: Linear `0XC-60` 有 PR URL、final summary、terminal kind 与 lifecycle summary

## 当前状态

- 当前阶段: Git / PR lifecycle
- 当前 owner: OpenAI / Legion agent
- Blocker: 无；WI-04 已合并到当前 `origin/master`
