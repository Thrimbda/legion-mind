# Report Walkthrough

## Profile

rfc-only

## Reviewer Summary

- 本 PR 仅交付 Linear + Legion 自动调度器的设计文档和 8 个后续实现 WI，不包含 scheduler 运行时代码。
- 总体 RFC 已覆盖架构、状态机、数据模型、ready 算法、Legion 嵌入、PR lifecycle、并发锁、失败恢复、安全、可观测性和 rollout / rollback。
- `review-rfc` 第一轮 FAIL，发现 3 个 blocking gaps；已迭代补齐 `isBlockerSatisfied()`、MVP `contract:stable` 规则、scheduler-side Legion evidence verifier 和 transactional outbox。
- `review-rfc` 第二轮 PASS，blocking findings 为 None。

## Scope

In scope:

- `.legion/tasks/linear-legion-scheduler-rfc/**`
- `docs/linear-legion-scheduler/rfc.md`
- `docs/linear-legion-scheduler/index.md`
- `docs/linear-legion-scheduler/work-items/*.md`

Out of scope:

- 不实现 scheduler 服务、worker、数据库 migration、Linear webhook server 或 GitHub integration 代码。
- 不创建真实 Linear labels / OAuth app / webhooks。
- 不修改 Legion workflow 阶段规则或 `git-worktree-pr` envelope。

## Evidence Map

| Claim | Evidence | Status |
|---|---|---|
| 任务 contract 已稳定 | `.legion/tasks/linear-legion-scheduler-rfc/plan.md` | PASS |
| 现状与约束已摸底 | `.legion/tasks/linear-legion-scheduler-rfc/docs/research.md` | PASS |
| 总体 RFC 已完成 | `docs/linear-legion-scheduler/rfc.md` | PASS |
| Legion review entry 已建立 | `.legion/tasks/linear-legion-scheduler-rfc/docs/rfc.md` | PASS |
| RFC 对抗审查已通过 | `.legion/tasks/linear-legion-scheduler-rfc/docs/review-rfc.md` | PASS |
| WI 合并为不超过 10 个 | `docs/linear-legion-scheduler/work-items/` | PASS, 8 个 |
| Reviewer 入口存在 | `docs/linear-legion-scheduler/index.md` | PASS |

## Delivery Path

```text
legion-workflow
  -> brainstorm contract
  -> git-worktree-pr envelope
  -> spec-rfc design artifacts
  -> review-rfc iteration 1 FAIL
  -> RFC / WI edits
  -> review-rfc iteration 2 PASS
  -> report-walkthrough
  -> legion-wiki
  -> PR lifecycle
```

## What Changed / What Was Decided

- 采用四层边界：Linear 管 WI 和依赖，Scheduler DB 管 run / lock / event / idempotency，Legion 管单 WI 执行协议，GitHub PR 管交付终态。
- Scheduler 不直接改代码，不替代 Legion 阶段链；worker 第一动作必须进入 `legion-workflow`。
- MVP implementation-ready 必须要求 `contract:stable`，不把 brainstorm-only 和 implementation auto-run 混用。
- Downstream unlock 使用 `isBlockerSatisfied()`，不只看 Linear Done，也不把 PR open 当 Done。
- Scheduler 需要 evidence verifier，拒绝“只有 PR URL、缺 Legion 证据”的结果。
- 后续实现合并为 8 个 WI，按规范、core state、Linear graph、Legion runner、delivery tracking、parallel dispatch、reliability、operations/security 推进。

## Verification / Review Status

- `review-rfc` 第一轮：FAIL，3 个 blocking findings。
- 已按 blocking findings 更新 RFC 与 WI。
- `review-rfc` 第二轮：PASS，blocking findings 为 None。
- 本次为 rfc-only profile，无生产代码变更，无 test-report / review-change 要求。

## Risks and Limits

- 这是设计交付，不代表 scheduler 已可运行。
- RFC 仍保留若干实现期决策，例如 Agent Sessions API 是否首发接入、是否未来迁移 Temporal。
- 根 `docs/linear-legion-scheduler/` 是 scheduler proposal 文档，不改变 README / wiki 当前真源边界。
- PR body 只是 PR 创建输入，不代表 checks、review、merge、worktree cleanup 或主工作区 refresh 已完成。

## Reviewer Checklist

- [ ] 同意 Linear / Scheduler DB / Legion / GitHub 四层真源边界。
- [ ] 同意 MVP implementation-ready 必须 `contract:stable`。
- [ ] 同意 downstream unlock 以 `isBlockerSatisfied()` 为准。
- [ ] 同意 scheduler-side Legion evidence verifier 是防绕过 workflow 的必要 gate。
- [ ] 同意后续实现拆成 8 个 WI。
- [ ] 确认当前 PR 仅为设计批准，不代表实现已完成。

## Render Handoff

- HTML artifact: `.legion/tasks/linear-legion-scheduler-rfc/docs/report-walkthrough.html`
- Render state: blocked until PR exists and a preview host or artifact workflow is configured.
- Explicit blocker: 当前阶段尚未创建 PR，因此没有 PR-backed rendered URL。PR 创建后可交给 `pr-html-render` 处理 rendered preview，或继续以 artifact path 作为 fallback。

## Final State / Next Stage

- Design review state: PASS。
- Current stage: ready for `legion-wiki` writeback, then PR lifecycle。
- Merge of the design PR should be treated as design approval only. Implementation must start from the 8 WI and re-enter Legion workflow per WI。
