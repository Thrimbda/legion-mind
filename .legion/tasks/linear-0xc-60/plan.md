# Linear WI-05: PR Tracking and Linear Delivery Writeback

## 目标

实现 Linear + Legion scheduler 的 PR delivery tracking 层：当 OpenCode worker 产出 PR 后，scheduler 能持久化 PR URL、查询 GitHub PR checks / review / merge / closed 状态，并把运行状态、PR 链接、阻塞原因和最终摘要幂等写回 Linear native layer 与 coarse Linear state / labels。

## 问题陈述

WI-04 已经能启动受 Legion hard gate 约束的 OpenCode worker，并在 worker 结束时解析 PR URL 与 Legion evidence；但 scheduler 仍不知道 PR 是否已进入 review、checks 是否失败、PR 是否合并或关闭，也不能把 delivery 进展原生展示在 Linear 上。若把“worker 返回 PR URL”或“PR merged”直接当作 Done，会绕过 `git-worktree-pr` lifecycle、Legion evidence verifier 和 downstream unlock 语义，导致下游 WI 被错误释放。

本任务补齐 PR terminal observation 与 Linear delivery writeback：`done` 只能表示 `run_terminal_success`，且必须满足 PR merged、required checks / review resolved、Legion evidence PASS、`git-worktree-pr` cleanup 与 main refresh lifecycle evidence complete，以及 final Linear writeback completed or idempotently queued。

## 验收标准

- [ ] Run 能从 worker result 或显式 tracker input 关联并持久化 PR URL。
- [ ] Scheduler 能查询 / 接收可测试的 GitHub PR checks、review、merge、closed 状态，并映射为 run delivery decision。
- [ ] PR open / draft 时 run 进入 `in_review`，Linear 显示 In Review / equivalent，且 external URL 包含 PR URL。
- [ ] Checks failing 或 review changes requested 时 run 标记 `blocked`，failure type / reason 写明 next owner 与下一步。
- [ ] PR merged、evidence verifier PASS、`git-worktree-pr` lifecycle evidence complete、final writeback queued/sent 后，run 才标记 `done`，delivery/evidence gate `passed`，释放 locks 并触发 reconcile。
- [ ] PR merged 但 Legion evidence 缺失时进入 `blocked` / `legion_evidence_missing`，不会释放 downstream。
- [ ] PR merged 但 cleanup / main refresh lifecycle evidence 缺失时进入 `blocked` / `lifecycle_blocked`，不会释放 downstream。
- [ ] Closed-unmerged / cancelled / abandoned / superseded / rejected 被记录为 terminal non-success，不默认释放 downstream。
- [ ] Linear native writeback 使用 stable idempotency key，不因 repeated reconcile 重复发送同一 activity/comment/external URL update。
- [ ] Final summary 至少包含 PR URL、Legion task path、Result、checks / verification summary、`git-worktree-pr` lifecycle summary、downstream reconcile triggered or not、terminal kind。

## 范围

- 在 `scheduler/` 中新增或扩展 PR delivery tracker、GitHub PR client adapter boundary、run delivery decision mapping 与 DB transition API。
- 持久化 PR URL、delivery gate status、evidence status、failure type / reason，并复用 WI-04 evidence verifier 的安全边界。
- 扩展 native outbox / Linear writeback payload，支持 PR created / in review、blocked、terminal success、terminal non-success 与 final summary 的幂等 side effects。
- 扩展 CLI / README / delivery docs，使本地可以用 fixture 或 fake GitHub client 验证 PR state -> run transition。
- 补充 unit / integration tests，覆盖 PR state mapping、terminal success / non-success gate、native writeback dedupe、merged-but-evidence-missing 与 merged-but-lifecycle-incomplete 负例。

## 非目标

- 不实现 worker 自己修复 failing checks 或 review comments。
- 不绕过 GitHub branch protection、required checks 或 human review。
- 不实现 auto-merge policy 的完整决策；本任务只记录、观察和按状态推进。
- 不实现 parallel dispatch、resource lock scheduling 扩展或 webhook retry / stale recovery；这些属于 WI-06 / WI-07。
- 不把 Linear AgentSession、comments、labels 或 status 当作 scheduler machine truth。

## 假设 / 约束 / 风险

- **假设**: Linear issue `0XC-60` 已带 `contract:stable`、`risk:high`、`repo:legion-mind`、`area:scheduler`，且 blocker WI-04 (`0XC-58`) 已合并到 `origin/master`。
- **假设**: `docs/linear-legion-scheduler/rfc.md`、`docs/linear-legion-scheduler/work-items/WI-05-delivery-pr-writeback.md` 与 `.legion/tasks/amend-linear-native-scheduler-rfc/docs/review-rfc.md` PASS 是 approved design source。
- **约束**: 本实现必须在 `.worktrees/linear-0xc-60/` 内完成，并通过 `git-worktree-pr` PR lifecycle 收口。
- **约束**: Scheduler DB 仍是 run / attempt / delivery gate / evidence / downstream unlock 的 machine truth；Linear native objects 只做 presentation/control plane。
- **约束**: GitHub PR state 必须来自 adapter / API / fixture，不信任 worker self-attestation；Legion evidence 与 lifecycle evidence 仍按 WI-04 verifier 验证。
- **风险**: PR open、closed-unmerged 或 merged-but-lifecycle-incomplete 被误判为 Done。缓解：集中 terminal gate 和负例测试。
- **风险**: Linear spam。缓解：native outbox idempotency key 覆盖 activity/comment/external URL/final summary。
- **风险**: GitHub API 权限不足或 rate limit。缓解：进入 `pr_blocked` / `security_blocked`，写明 token scope / next owner，不释放 downstream。

## 设计摘要

- 将 PR delivery tracking 建模为 scheduler-side decision layer：输入为 persisted run / attempt、PR URL、GitHub PR snapshot、Legion evidence verifier result 与 lifecycle evidence；输出为合法 run transition、delivery/evidence gate status、failure taxonomy、scheduler event 与 native outbox rows。
- GitHub client 使用可替换 adapter boundary，测试以 fake snapshots 驱动，不把真实 GitHub 网络调用作为 unit test 前提。
- Linear writeback 继续走 DB-backed `native_outbox`，用 deterministic idempotency keys 表示 `pr_created`、`in_review_waiting`、`blocked_*`、`final_success`、`final_non_success` 等事件；comments 只用于 final summary 或兼容降级。
- `run_terminal_success` 只在 PR merged + checks/review resolved + evidence PASS + lifecycle complete + final writeback queued/sent 时成立；任一缺口都转为 blocked / non-success taxonomy。
- Terminal success 后触发 lock release 与 downstream reconcile；terminal non-success 只释放 active run/locks 语义，不默认 satisfy blocker。

## 阶段拆分

1. **Contract / Envelope**: 使用 `legion-workflow` 从 Linear `0XC-60` 恢复/物化 task contract，加载 `brainstorm` / `legion-docs` / `git-worktree-pr`，在 `.worktrees/linear-0xc-60/` 内工作。
2. **Approved Design Restoration**: 确认风险 high，但已有 scheduler RFC / WI-05 doc 与 review-rfc PASS；按 approved-design continuation 进入实现链。
3. **Engineer**: 实现 PR URL persistence、GitHub PR snapshot adapter、delivery decision mapping、Linear native writeback outbox/final summary 与 CLI/docs 接入。
4. **Verify**: 运行 scheduler unit / integration tests、fixture PR transition tests、root regression / packaging smoke，并写入 `docs/test-report.md`。
5. **Review**: 执行 `review-change`，重点检查 terminal gate、evidence/lifecycle trust boundary、idempotency、Linear spam 与 downstream unlock。
6. **Close**: 生成 walkthrough / PR body，执行 `legion-wiki` writeback，commit、fetch+rebase、push、PR、checks/review/auto-merge、cleanup、主工作区刷新，并写回 Linear final status。

## 设计来源

- Linear issue: `0XC-60` — https://linear.app/0xc1/issue/0XC-60/wi-05-track-pr-delivery-and-write-back-linear-status
- `docs/linear-legion-scheduler/rfc.md`
- `docs/linear-legion-scheduler/work-items/WI-05-delivery-pr-writeback.md`
- `docs/linear-legion-scheduler/worker-runner.md`
- `.legion/tasks/amend-linear-native-scheduler-rfc/docs/review-rfc.md`（PASS）
- `.legion/tasks/linear-0xc-58/plan.md` / WI-04 delivery evidence

---
*Created: 2026-06-25*
