# Report Walkthrough：Linear Native Agent RFC amendment

## Profile

- Mode: `rfc-only`
- Scope: 文档/设计修正，无 runtime code。
- Task: `.legion/tasks/amend-linear-native-scheduler-rfc/plan.md`

## Reviewer Summary

本 PR 把外部 review 的 blocking points 纳入 Linear + Legion scheduler 设计：

1. Linear Native Agent layer 被正式建模为 presentation/control plane，而不是 Scheduler DB truth。
2. `Done` 只代表 `run_terminal_success`；非成功终态默认不解锁 downstream。
3. `git-worktree-pr` lifecycle completion 被纳入 success gate；PR merged 但 cleanup/main refresh 缺失会进入 `lifecycle_blocked`。
4. AgentSession / activity / externalUrls / stop 等 side effects 统一走 `native_outbox`。
5. Claim 前必须重新校验 snapshot，避免基于旧 ready 结果启动 worker。
6. Native agent 要求切回现有 8 个 WI，不新增 WI-09。

## Changed Artifacts

- `docs/linear-legion-scheduler/rfc.md`
- `docs/linear-legion-scheduler/index.md`
- `docs/linear-legion-scheduler/work-items/WI-01..WI-08`
- `.legion/tasks/amend-linear-native-scheduler-rfc/docs/research.md`
- `.legion/tasks/amend-linear-native-scheduler-rfc/docs/rfc.md`
- `.legion/tasks/amend-linear-native-scheduler-rfc/docs/review-rfc.md`
- `.legion/tasks/amend-linear-native-scheduler-rfc/docs/test-report.md`
- `.legion/tasks/amend-linear-native-scheduler-rfc/docs/review-change.md`

## Evidence Map

| Claim | Evidence |
|---|---|
| Native layer is control plane, not truth plane | `docs/linear-legion-scheduler/rfc.md` §4.2, §6.4 |
| Agent API behavior was checked against current docs | `docs/research.md` |
| Terminal success/non-success is split | `docs/linear-legion-scheduler/rfc.md` §10.2 |
| Lifecycle gap cannot unlock downstream | `docs/linear-legion-scheduler/rfc.md` §9.5 / §10.2, `docs/review-rfc.md` |
| Claim revalidation is required | `docs/linear-legion-scheduler/rfc.md` §8.4, WI-02 |
| All 8 WI absorbed relevant native requirements | `docs/linear-legion-scheduler/work-items/` |
| Verification passed | `docs/test-report.md` |
| Readiness review passed | `docs/review-change.md` |

## Review Notes

- `review-rfc` first pass failed on lifecycle completion semantics; fixed by adding `lifecycle_blocked` and requiring cleanup/main refresh for success.
- `review-change` first pass failed on WI-06 dependency inconsistency; fixed by aligning WI-06 with RFC/index dependency on WI-05.
- Security lens was applied in `review-change` because the design touches auth, permissions, sessions, webhooks and control-plane behavior.

## Reviewer Checklist

- Confirm `run_terminal_success` cannot be reached before PR merged + evidence PASS + cleanup + main refresh.
- Confirm `run_terminal_non_success` does not unlock downstream by default.
- Confirm Linear AgentSession state cannot replace Scheduler DB truth.
- Confirm native side effects are outbox-driven and idempotent.
- Confirm WI-06 depends on WI-05 before parallel lock release semantics are implemented.

## Final State

Ready for PR review.
