# Review Change: Linear WI-05 PR Tracking and Linear Delivery Writeback

## Verdict

PASS

## Review Scope

- Contract: `.legion/tasks/linear-0xc-60/plan.md`
- Verification: `.legion/tasks/linear-0xc-60/docs/test-report.md`
- Design sources: `docs/linear-legion-scheduler/rfc.md`, `docs/linear-legion-scheduler/work-items/WI-05-delivery-pr-writeback.md`
- Implementation: `scheduler/src/pr-tracker.ts`, `scheduler/src/sqlite-store.ts`, `scheduler/src/worker-runner.ts`, `scheduler/src/cli.ts`
- Tests / docs: `scheduler/tests/linear-pr-tracker.test.ts`, `scheduler/tests/linear-worker-runner.test.ts`, `docs/linear-legion-scheduler/delivery-pr-writeback.md`, `scheduler/README.md`

## Blocking Findings

None after review fix.

## Review Finding and Fix

Initial review found one gate-ordering issue: `trackPrDelivery()` originally transitioned a merged PR to `done` and released locks before final Linear native writeback rows were enqueued. This conflicted with the WI-05 contract that `run_terminal_success` requires final writeback to be completed or idempotently queued.

Fix applied before PASS:

- `scheduler/src/pr-tracker.ts` now enqueues success final response/comment/state/labels before `done`, lock release and downstream reconcile event.
- Terminal non-success writeback rows are also queued before the terminal state transition.
- Verification was rerun after this fix.

## Correctness Review

- PR URL persistence is in scope and uses existing `runs.pr_url` plus `pr_snapshot_observed` events.
- Worker self-attestation is no longer terminal: `processOpenCodeWorkerDispatch()` converts worker `done` + evidence PASS into `in_review` and records `pr_tracking_required`.
- PR open / draft / pending review maps to `in_review` and does not satisfy blockers.
- Checks failure and review changes requested map to `blocked` / `pr_blocked` with owner-facing reason.
- Merged PR success requires GitHub snapshot success, evidence verifier PASS and `git-worktree-pr` lifecycle evidence complete.
- Missing Legion evidence and lifecycle gaps remain `blocked` with `legion_evidence_missing` / `lifecycle_blocked` and do not release downstream.
- Closed-unmerged / rejected terminal non-success releases active locks but does not satisfy blockers.
- Downstream unlock still goes through `isBlockerSatisfiedByRun()` requiring `done + delivery_gate_status=passed + evidence_status=passed`.

## Scope Review

The change stays within WI-05:

- Adds PR delivery tracking and writeback outbox.
- Adds fixture / debug GitHub adapter path, not production webhook/retry or parallel dispatch.
- Does not implement worker repair of failing checks.
- Does not bypass GitHub branch protection or human review.
- Does not treat Linear native layer as machine truth.

## Security / Trust-Boundary Lens

Security lens applied because the change touches GitHub PR state, Linear writeback, scheduler terminal gates and trust boundaries.

Review result:

- Scheduler does not trust worker-reported PR terminal state; GitHub PR snapshot comes from adapter/client.
- Scheduler still uses repo-local Legion evidence verifier for task evidence and `git-worktree-pr` lifecycle file validation.
- OpenCode worker env remains unchanged and does not inherit Linear/GitHub scheduler secrets.
- Linear side effects are queued through DB-backed idempotent outbox rows rather than direct ad-hoc API calls.
- Final summary payloads contain PR/evidence/status metadata, not secrets.

No exploitable trust-boundary blocker found in the local prototype surface.

## Verification Evidence Reviewed

- `npm --prefix scheduler test` PASS — 35/35 tests.
- `npm --prefix scheduler run health -- --db :memory:` PASS.
- `npm run test:regression` PASS — 18/18 tests.
- `npm run pack:dry-run` PASS.
- `git diff --check` PASS.

## Non-blocking Suggestions

- Production GitHub adapter should eventually include required status contexts / branch protection policy instead of relying only on check-runs and reviews.
- Production Linear adapter should make the mapping from scheduler state to team-specific workflow state / labels configurable.
- Future migration hardening can add explicit legacy-schema migration tests for existing on-disk DBs with old `native_outbox.side_effect` constraints.
