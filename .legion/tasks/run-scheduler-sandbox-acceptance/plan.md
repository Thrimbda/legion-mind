# 执行 Linear Scheduler Sandbox 完整验收

## 契约

- **Name**: 执行 Linear Scheduler Sandbox 完整验收
- **Task ID**: `run-scheduler-sandbox-acceptance`
- **Goal**: 按已批准计划执行一次 sandbox-first production-like acceptance，产出可审计证据，并给出 `PASS` / `BLOCKED` / `FAIL` 结论。
- **Problem**: Scheduler 已有生产验收准备包，但仍需要按 runbook 实际跑可执行阶段，确认本地基线、fixture dispatch、sandbox secret/live 前置条件和 live read-path 能力。若外部资源或 runtime blocker 缺失，必须明确记录为 `BLOCKED`，不能伪造 production readiness。

## 验收标准

1. 执行 Stage 0 本地基线：scheduler tests、health、fixture scan、fixture dispatch。
2. 检查 Stage 1 sandbox 资源与 `secrets/linear-scheduler.sops.yaml` 是否具备。
3. 若 secret 与 sandbox 前置条件具备，执行 Stage 2 Linear live read-path scan；否则记录 `BLOCKED`。
4. 执行 Stage 3 fixture dispatch / lock baseline。
5. 检查 Stage 4 `SCHEDULER_RUN_ID` / GitHub PR tracking 前置条件；具备则执行，否则记录 `BLOCKED`。
6. Stage 5 OpenCode worker E2E 默认不运行；只有具备人工批准、run/attempt/outbox 前置状态时才执行，否则记录 `BLOCKED` / skipped reason。
7. 使用 `scheduler/docs/templates/acceptance-evidence.md` 的结构写入验收证据。
8. 完成 test-report、review-change、walkthrough、wiki writeback 与 PR lifecycle。

## 范围

- `.legion/tasks/run-scheduler-sandbox-acceptance/**`
- `.legion/wiki/tasks/run-scheduler-sandbox-acceptance.md`
- `.legion/wiki/index.md`, `.legion/wiki/log.md`, `.legion/wiki/maintenance.md` 的必要 writeback
- repo-local 临时 DB / artifacts under `.cache/linear-scheduler/`，不提交

## 非目标

- 不实现 production Linear native writeback adapter。
- 不实现 live `dispatch project`。
- 不实现 packaged webhook server / outbox runner。
- 不使用 production Linear/GitHub resources。
- 不提交真实 secrets 或 plaintext credentials。
- 不把 sandbox acceptance 结论写成 production-ready。

## 假设

- 已批准计划 `.opencode/plans/1782387078380-stellar-orchid.md` 是稳定 contract。
- 如果 `secrets/linear-scheduler.sops.yaml` 缺失或无法解密，live stages 记录为 `BLOCKED`。
- 如果缺少 `SCHEDULER_RUN_ID` / `SCHEDULER_ATTEMPT_ID`，Stage 4 / Stage 5 不能伪造通过。

## 约束

- 所有写操作发生在 `.worktrees/run-scheduler-sandbox-acceptance/`。
- 所有持久化临时产物留在 repo-local `.cache/linear-scheduler/`。
- 所有输出必须脱敏，不打印或提交真实 token。

## 风险

- `scan project` 和 `delivery track` 会写 scheduler DB，不是纯只读。
- `worker dispatch` 会启动 OpenCode，必须有明确 sandbox 批准和前置状态。
- 若 sandbox resources 未准备，完整 live 验收会被 blocker 卡住；这仍是有效验收结果。

## 阶段

1. 创建 worktree 与任务证据目录。
2. 执行 Stage 0 本地基线。
3. 检查 secrets 与 sandbox 前置条件。
4. 执行可用 live/read-path 阶段或记录 blockers。
5. 写入 acceptance evidence 和 test-report。
6. 完成 review、walkthrough、wiki writeback 与 PR lifecycle。
