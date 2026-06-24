# Tasks: Linear WI-04 OpenCode Legion Worker Runner

## Contract / Envelope

- [x] 加载 `legion-workflow` 并判断本请求由 Legion 接管 | 验收: 无 bypass，用户要求完成 Linear `0XC-58`
- [x] 读取 Linear issue、approved RFC / WI docs 与 blocker 状态 | 验收: `0XC-58` contract stable、risk high，blocker `0XC-55` Done
- [x] 加载 `brainstorm` / `legion-docs` 并物化 task contract | 验收: `plan.md` / `tasks.md` / `log.md` 存在于 worktree
- [x] 加载 `git-worktree-pr` 并创建 `.worktrees/linear-0xc-58/` | 验收: 后续写入均在 worktree 内完成
- [x] 确认执行模式为 approved-design continuation | 验收: scheduler RFC / WI docs 已合并且 `review-rfc` PASS，风险 high 由 approved design source 承接

## Engineer

- [x] 实现 Linear identifier -> deterministic Legion taskId mapping | 验收: `ENG-123` -> `linear-eng-123`，retry 复用同一 taskId
- [x] 实现 OpenCode prompt artifact renderer | 验收: 包含 Linear context、native agent context、repo path、base ref、Legion hard gates、result schema、evidence paths
- [x] 实现 native startup adapter / outbox handler | 验收: create/find AgentSession、delegate setup、initial activity / plan / external URL 幂等且不重复 run
- [x] 实现 OpenCode process launcher | 验收: cwd/env contract、timeout、heartbeat、stdout/stderr capture、exit code 与 fake-worker tests 覆盖
- [x] 实现 native stop/admin cancel propagation | 验收: canceling/cancelled transition 后停止后续 tool/code/API side effects
- [x] 实现 worker result parser | 验收: 提取 PR URL、blocked reason、next step、external URLs、Legion evidence paths，malformed result 不成功
- [x] 实现 Scheduler-side Legion evidence verifier | 验收: 拒绝 PR-only、缺 review PASS、PR merged 但缺 cleanup / main refresh lifecycle evidence
- [x] 实现 minimal single-worker execution path | 验收: 指定 WI 可创建 attempt、处理 startup、launch fake/OpenCode worker、更新 attempt/run lifecycle
- [x] 更新 WI-04 docs / scheduler README 或 index | 验收: reviewer 能找到 runner contract、命令和边界

## Verify

- [x] 运行 scheduler unit tests | 验收: taskId mapping、prompt rendering、result parser、evidence verifier、attempt transitions PASS
- [x] 运行 fake OpenCode integration tests | 验收: success / blocked / malformed / nonzero / timeout / cancelled scenarios PASS
- [x] 运行 native startup / stop signal tests | 验收: outbox 幂等、delegate/session/activity/external URL fake adapter、cancel propagation PASS
- [x] 运行 repo regression / packaging smoke | 验收: root regression / pack dry-run 或可信 blocker 记录
- [x] 写入 `.legion/tasks/linear-0xc-58/docs/test-report.md` | 验收: 命令、结果、覆盖范围、跳过项完整

## Review / Close

- [x] 执行 `review-change` 并写入 readiness 结论 | 验收: `docs/review-change.md` PASS 或明确 blocker
- [x] 生成 reviewer walkthrough 与 PR body | 验收: `docs/report-walkthrough.md` / `docs/pr-body.md` 存在
- [x] 执行 `legion-wiki` writeback | 验收: wiki task summary / index / decisions / maintenance 按需更新
- [ ] 完成 git-worktree-pr lifecycle | 验收: commit、fetch+rebase、push、PR、checks/review、auto-merge、cleanup、main refresh 到终态

## 当前状态

- 当前阶段: Git / PR lifecycle
- 当前 owner: OpenAI / Legion agent
- Blocker: 无；Linear blocker WI-02 已 Done
