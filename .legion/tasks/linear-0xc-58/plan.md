# Linear WI-04: OpenCode Legion Worker Runner

## 目标

实现 Linear WI 到 Legion task 的确定性映射，并在 `scheduler/` 中提供首版 OpenCode-only worker runner。Scheduler 应能为指定 WI 幂等创建 / 恢复 run attempt、生成唯一 prompt artifact、完成 native agent startup side effects，然后启动一个 OpenCode worker 按 Legion workflow 执行单个 WI。

## 问题陈述

WI-02 已提供 SQLite-backed run / attempt / outbox / event / lock 真源，WI-03 已提供 ready graph scanner；但系统仍缺少把已 claim 的 WI 转成受约束 worker attempt 的安全边界。如果 dispatcher 只把 Linear issue 文本交给 agent，它会绕过 Legion contract、设计门、`git-worktree-pr`、证据校验和 stop/cancel 语义，导致重复 task、不可审计结果或过早解锁 downstream。

本任务交付最小单 worker execution path：确定性 taskId、OpenCode prompt contract、native startup outbox handler、process launcher、heartbeat / timeout、stop/cancel propagation、worker result parser、run attempt lifecycle update 和 Legion evidence verifier。它只支持 OpenCode，不引入多 runtime adapter，也不在 scheduler 内替 worker 写 Legion task docs。

## 验收标准

- [ ] 同一 Linear issue 重试时恢复同一 taskId，不创建重复 Legion task。
- [ ] Scheduler 能为指定 WI 启动一个 OpenCode worker attempt。
- [ ] OpenCode prompt artifact 中包含 Legion hard gates 和 Linear context。
- [ ] OpenCode prompt artifact 中包含 AgentSession id、delegate identity 和 stop signal source。
- [ ] Worker launch 前会幂等 create/find AgentSession、emit initial activity 并设置 external URL。
- [ ] Worker heartbeat / timeout 可被 DB 观察。
- [ ] Native stop/admin cancel 会让 worker 停止后续 tool/code/API side effects，并进入 canceling/cancelled attempt。
- [ ] Worker result parser 能提取 PR URL、blocked reason、evidence paths。
- [ ] Evidence verifier 能拒绝“只有 PR URL、缺 Legion evidence”的结果。
- [ ] Evidence verifier 能拒绝“PR merged 但缺 cleanup / main refresh lifecycle evidence”的结果。
- [ ] Worker 非零退出不会释放 run 为 done。

## 范围

- 在 `scheduler/` 独立 npm project 中新增 worker runner / dispatcher execution layer，复用 WI-02 store、run attempt、native outbox 与 event 边界。
- 实现 Linear identifier 到 Legion taskId 的确定性映射：例如 `ENG-123` -> `linear-eng-123`，本 WI 自身 taskId 为 `linear-0xc-58`。
- 定义并渲染 OpenCode worker prompt artifact，包含 Linear context、native agent context、repo path、base ref、taskId、Legion hard gates、result schema 与 evidence verifier 输出路径。
- 实现 native startup outbox 的幂等执行面：create/find AgentSession、delegate setup、initial activity / plan / external URL 的 adapter 边界与可测试 fake。
- 实现 OpenCode process launcher：timeout、heartbeat、stdout/stderr capture、exit code、repo cwd / env contract、dry-run / fake-worker integration path。
- 实现 stop/cancel signal propagation：native stop 或 admin cancel 进入 canceling，阻止后续 tool/code/API side effects，并将 attempt 终止为 cancelled。
- 实现 worker result parser 与 Scheduler-side Legion evidence verifier，拒绝 PR-only 和 lifecycle evidence 不完整的结果。
- 更新 WI-04 delivery docs / scheduler README 或 design index，维护本 task 的 verification、review、walkthrough 与 wiki evidence。

## 非目标

- 不实现 parallel dispatcher、resource lock scheduling 扩展或 project-wide queue worker；这些属于 WI-06。
- 不实现 PR checks tracking / merge tracking / Linear delivery writeback；这些属于 WI-05。
- 不实现 OpenClaw / Codex / custom runtime adapter，也不抽象多 runtime framework。
- 不在 scheduler 内生成或修改 worker 的 Legion task docs 内容；scheduler 只生成 prompt、启动 worker并验证 evidence。
- 不绕过 GitHub branch protection、人类 review、Legion workflow、`git-worktree-pr` lifecycle 或 Linear native control-plane 边界。

## 假设 / 约束 / 风险

- **假设**: Linear issue `0XC-58` 已带 `contract:stable` / `risk:high` / `repo:legion-mind`，且 blocker WI-02 (`0XC-55`) 已为 Done。
- **假设**: 已合并的 scheduler RFC 与 WI-04 work item 是 approved design source；`.legion/tasks/linear-legion-scheduler-rfc/docs/review-rfc.md` 为 PASS。
- **约束**: 本实现必须在 `.worktrees/linear-0xc-58/` 内完成，并通过 `git-worktree-pr` PR lifecycle 收口。
- **约束**: Worker runtime 首版固定 OpenCode-only；任何多 runtime 扩展必须另开 RFC。
- **约束**: Scheduler DB 仍是 run / attempt / lock / evidence / downstream unlock 的 machine truth；Linear AgentSession 和 activity 只做 presentation/control plane。
- **约束**: OpenCode prompt 必须包含 hard gates：先进入 `legion-workflow`、contract 不稳则 `brainstorm`、修改仓库进入 `git-worktree-pr`、每个 WI 独立 task/worktree/branch/PR、PR created 不是完成、stop/cancel 后停止 side effects。
- **风险**: OpenCode CLI 或 Linear native API 语义漂移。缓解：封装 adapter，使用 fake integration / snapshot tests 锁 prompt 与 launcher contract。
- **风险**: Evidence verifier 过弱会把 PR URL 误判为完成。缓解：用负例测试覆盖 PR-only、缺 review PASS、PR merged 但缺 cleanup / main refresh。
- **风险**: Stop/cancel 竞态可能让 worker 被 kill 后 run 状态不一致。缓解：集中 attempt transition、heartbeat、event log 和 idempotent cancellation。
- **风险**: Native startup side effects 失败后重复创建 run 或重复 launch worker。缓解：outbox 幂等键、adapter fake、attempt lifecycle tests。

## 设计摘要

- 使用 `taskIdFromLinearIdentifier(identifier)` 统一映射并持久化到 run；retry / stale recovery 复用同一 taskId、branch prefix 与 expected evidence path。
- Worker prompt renderer 产出 repo-local artifact，输入来自 run、attempt、Linear snapshot / issue context、native session context、repo mapping 和 base ref；prompt 中硬编码 Legion gates 与 result block schema。
- Dispatcher 不从 webhook handler 直接启动 worker；它先处理 DB-backed native startup outbox，再从 worker dispatch outbox 调用 OpenCode launcher。
- OpenCode launcher 是首版具体实现，不暴露多 runtime interface；测试通过 fake executable / script 覆盖 success、blocked、malformed、timeout、cancel 与 nonzero exit。
- Run attempt lifecycle 只根据 launcher result + parser result + evidence verifier 组合更新：非零退出、malformed result、missing evidence、lifecycle gap 都不得释放 run 为 done。
- Evidence verifier 检查 expected Legion evidence paths 和 PASS markers；PR terminal / checks tracking 的完整状态仍留给 WI-05，但本 WI 必须拒绝“只有 PR URL”与“缺 cleanup / main refresh lifecycle evidence”。

## 阶段拆分

1. **Contract / Envelope**: 进入 `legion-workflow`，基于 Linear `0XC-58`、approved RFC 与 WI-04 doc 物化本 task contract，并创建 `.worktrees/linear-0xc-58/`。
2. **Approved Design Restoration**: 确认风险等级为 high，但已有 scheduler RFC / WI docs 与 `review-rfc` PASS；按 approved-design continuation 进入实现链。
3. **Engineer**: 实现 taskId mapping、prompt renderer、native startup adapter / outbox handler、OpenCode launcher、heartbeat / timeout / cancel、result parser、evidence verifier 与最小 single-worker execution path。
4. **Verify**: 运行 scheduler unit / integration tests、fake OpenCode worker scenarios、root regression / packaging smoke，并写入 `docs/test-report.md`。
5. **Review**: 执行 `review-change`，检查 scope、state machine、side-effect 边界、security / secret handling、OpenCode-only boundary 与 evidence gate。
6. **Close**: 生成 walkthrough / PR body，执行 `legion-wiki` writeback，commit、fetch+rebase、push、PR、checks/review/auto-merge、cleanup、主工作区刷新。

## 设计来源

- Linear issue: `0XC-58` — https://linear.app/0xc1/issue/0XC-58/wi-04-implement-opencode-legion-worker-runner
- `docs/linear-legion-scheduler/rfc.md`
- `docs/linear-legion-scheduler/work-items/WI-04-legion-worker-runner.md`
- `.legion/tasks/linear-legion-scheduler-rfc/docs/review-rfc.md`（PASS）
- `docs/linear-legion-scheduler/scheduler-core-sqlite.md` / `.legion/tasks/linear-legion-scheduler-wi-02/plan.md`
- `docs/linear-legion-scheduler/linear-graph-scanner.md` / `.legion/tasks/linear-legion-scheduler-wi-03/plan.md`

---
*Created: 2026-06-25*
