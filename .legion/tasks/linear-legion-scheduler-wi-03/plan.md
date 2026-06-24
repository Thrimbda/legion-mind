# Linear Scheduler WI-03: Linear Graph Scanner and Skipped Reason Report

## 目标

完成 Linear + Legion scheduler 的 dry-run graph scanner：从指定 Linear project 拉取 issue snapshot，归一化 blocker relation，构建依赖图，检测 cycle，基于 WI-01 / WI-02 的 contract、terminal gate、active run、resource lock 与 project policy 计算 ready list 和 skipped reason report，并把可调试 snapshot 写入 `work_item_snapshots`。

## 问题陈述

WI-02 已经提供 SQLite-backed scheduler core、snapshot / run / lock / event / outbox 真源，但系统还不能回答调度器最基础的问题：“哪些 Linear WI 现在可以跑，哪些不能跑，为什么？” 如果 scanner 只输出 ready list，或者只看 Linear `Done` / label，而不解释 skip reason 与 scheduler terminal policy，下游自动 claim 会变得不可审计并可能提前解锁 blocked work。

本任务交付第一层 Linear project reconcile 能力：把 Linear project 转成可解释的 ready graph。它不 claim run、不启动 worker、不写回 Linear；只提供 dry-run scanner / service 入口、snapshot persistence、fixture-backed eligibility / graph / terminal policy tests，以及 reviewer 可核对的 report output。

## 验收标准

- [ ] 能通过官方 Linear GraphQL API / SDK 形态拉取指定 Linear project 的 issue snapshot，并处理分页 / rate-limit 失败边界。
- [ ] 能从 Linear blocker relations 归一化出 `blocker -> blocked` DAG。
- [ ] 能检测 dependency cycle，并在 report 中给出 cycle path。
- [ ] `isBlockerSatisfied()` 只按 scheduler terminal policy 解锁 downstream，覆盖 manual done、scheduler-run terminal success、terminal non-success、inconsistent terminal state。
- [ ] 能输出 ready list 与 skipped reason report，覆盖 missing `agent:ready`、missing `contract:stable`、unresolved blocker、cycle、`agent:needs-human`、missing repo mapping、active run exists、resource conflict、project paused、stale snapshot after revalidation。
- [ ] Dry-run ready item 包含 priority、locks、snapshotHash、linearUpdatedAt、nativePreview。
- [ ] Scanner 不修改 Linear；native action 只做 preview，不 create/find session、不 set delegate、不发 activity。
- [ ] Scanner 写入 `work_item_snapshots`，供后续 diff / debug 使用。

## 范围

- `scheduler/` 独立 npm project 内新增 Linear client / snapshot DTO / graph builder / cycle detector / eligibility parser / dry-run scanner / CLI 或 service endpoint。
- 复用 WI-02 SQLite `SchedulerStore`、`work_item_snapshots`、runs、locks、events 等模型；必要时只做与 scanner 接入相关的小幅 repository 扩展。
- 新增 mock Linear project snapshot integration tests 与 unit tests，覆盖 graph、cycle、skip reason、terminal blocker policy。
- 更新 `docs/linear-legion-scheduler/**` 的 WI-03 delivery artifact / index / work item 状态。
- 维护 `.legion/tasks/linear-legion-scheduler-wi-03/**` 阶段证据与 `.legion/wiki/**` writeback。

## 非目标

- 不 claim run，不创建 `runs` 或 `run_attempts` 作为调度动作。
- 不启动 OpenCode worker，不接入 WI-04 runner。
- 不写回 Linear labels、comments、state、delegate、AgentSession 或 AgentActivities。
- 不实现 webhook server、PR tracker、parallel dispatcher、admin full CLI 或 GitHub integration。
- 不把 Linear native AgentSession state 当作 scheduler terminal truth。

## 假设 / 约束 / 风险

- **假设**: Linear issue `0XC-57` 已带 `contract:stable` / `risk:medium`，且 blocker WI-02 (`0XC-55`) 已完成；本任务使用已合并 RFC / WI 文档作为 approved design source。
- **约束**: 修改必须在 `.worktrees/linear-legion-scheduler-wi-03/` 内完成，并通过 `git-worktree-pr` PR lifecycle 收口。
- **约束**: 首版 worker runtime 仍是 OpenCode-only，但本 WI 不启动 worker，只输出 native action preview。
- **约束**: Scheduler DB 是 active run、snapshot、lock、terminal gate 的 machine truth；Linear status / native objects 只作为输入或 presentation/control-plane preview。
- **约束**: Dry-run scanner 不能产生 Linear side effect；如需写 report artifact，只写 repo-local / stdout / DB snapshot。
- **风险**: Linear API shape / SDK preview 可能漂移。缓解：把 Linear client 封装在 adapter，fixture tests 锁定 scanner DTO；实现前用 current docs 校验 SDK / GraphQL 用法。
- **风险**: Blocker relation 方向误读会提前或永久阻塞 WI。缓解：单测固定 `blocker -> blocked`、incoming blockers 与 cycle path。
- **风险**: Skipped reason taxonomy 不稳定会让后续 admin/debug 难以复用。缓解：用 typed reason enum 与 fixture-backed report contract。
- **风险**: Scanner 与 WI-02 claim revalidation 边界混淆。缓解：scanner 只产出 candidate + snapshot hash；claim 仍需后续事务 revalidation。

## 设计摘要

- 在 `scheduler/` 内新增 scanner 层，输入为 Linear project snapshot DTO，输出为 deterministic dry-run report：`project`、`observedAt`、`ready[]`、`skipped[]`、`cycles[]`。
- Linear client 负责 project issues / labels / states / priorities / assignee / relations 的分页读取；核心 scanner 只依赖 normalized DTO，便于 mock integration tests。
- Dependency graph 使用 `blocker -> blocked` edge，ready 判断对每个 issue 汇总 label / contract / human gate / blocker / cycle / repo mapping / active run / lock / project paused / stale snapshot 等 skip checks。
- `isBlockerSatisfied()` 读取 SchedulerStore 中 blocker run / delivery / evidence 状态；仅 `done` 且 delivery/evidence gate passed，或符合 policy 的 manual Linear Done，才满足 blocker。
- Ready candidate sorting 先按 Linear priority，再按 updated / created age 和 deterministic identifier tie-breaker，避免 dry-run report 抖动。
- Native preview 只描述将来 claim 会 create/find AgentSession、设置 delegate、发送 initial thought / externalUrls；本 WI 不执行这些 side effects。

## 阶段拆分

1. **Contract / Envelope**: 进入 `legion-workflow`，基于 Linear `0XC-57` 与 WI docs 物化本 task contract，并创建 `.worktrees/linear-legion-scheduler-wi-03/`。
2. **Engineer**: 实现 Linear snapshot adapter、graph / cycle / eligibility / terminal policy / skipped reason report、dry-run CLI / service endpoint、snapshot persistence 与 docs 更新。
3. **Verify**: 运行 scheduler unit / integration tests、root regression / pack smoke、必要 dry-run fixture，并写入 `docs/test-report.md`。
4. **Review**: 执行 `review-change`，检查 scope、terminal gate、side-effect 边界、安全、文档一致性。
5. **Close**: 生成 walkthrough / PR body，执行 `legion-wiki` writeback，commit、fetch+rebase、push、PR、checks/review/auto-merge、cleanup、主工作区刷新。

## 设计来源

- Linear issue: `0XC-57` — https://linear.app/0xc1/issue/0XC-57/wi-03-implement-linear-graph-scanner-and-skipped-reason-report
- `docs/linear-legion-scheduler/rfc.md`
- `docs/linear-legion-scheduler/work-items/WI-03-linear-graph-scanner.md`
- `.legion/tasks/linear-legion-scheduler-rfc/docs/review-rfc.md`（PASS）
- `.legion/tasks/linear-legion-scheduler-wi-01/docs/report-walkthrough.md`
- `.legion/tasks/linear-legion-scheduler-wi-02/plan.md`

---
*Created: 2026-06-24*
