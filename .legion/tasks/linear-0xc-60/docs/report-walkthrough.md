# Report Walkthrough: Linear WI-05 PR Tracking and Linear Delivery Writeback

## Mode

implementation

## Reviewer Summary

This change completes WI-05 for the standalone `scheduler/` prototype. The scheduler now observes GitHub PR delivery state after a worker produces a PR, writes coarse native Linear delivery updates through idempotent `native_outbox` rows, and only marks a run `done` when PR terminal state, Legion evidence and `git-worktree-pr` lifecycle evidence all pass.

The key safety change is that worker output no longer has authority to complete a run. A worker-reported `done` result with valid Legion evidence moves the run to `in_review` and records `pr_tracking_required`; `trackPrDelivery()` must later observe a merged PR with successful checks/review and complete lifecycle evidence before `run_terminal_success` can unlock downstream work.

## What Changed

### PR delivery tracker

- Added `scheduler/src/pr-tracker.ts`.
- Introduces `PullRequestSnapshot`, `GitHubPrClient`, fixture/static client and GitHub REST debug adapter.
- Maps PR states to scheduler decisions:
  - open / draft / pending review -> `in_review`;
  - checks failure or changes requested -> `blocked` / `pr_blocked`;
  - merged + checks/review + evidence/lifecycle PASS -> `done`;
  - merged but missing evidence -> `blocked` / `legion_evidence_missing`;
  - merged but lifecycle incomplete -> `blocked` / `lifecycle_blocked`;
  - closed-unmerged / rejected / cancelled / abandoned -> terminal non-success without downstream unlock.

### Linear writeback outbox

- Extended `native_outbox` side-effect surface with:
  - `create_comment`;
  - `update_issue_labels`;
  - `update_issue_state`.
- Delivery tracker enqueues deterministic writeback rows for PR external URLs, activities, Agent Plan, coarse state/labels, final comments and final responses.
- Final summary payloads include PR URL, Legion task path, result, checks/review summary, lifecycle summary, downstream reconcile status and terminal kind.

### Worker runner terminal gate

- Updated `scheduler/src/worker-runner.ts` so worker `done` no longer directly transitions to `done`.
- Evidence PASS from the worker runner is retained, but GitHub PR terminal state is now required before delivery success.
- Native adapter interface now supports comment/state/label/final-summary payloads.

### CLI / docs / fixtures

- Added `delivery track` debug command to `scheduler/src/cli.ts`.
- Added fixture `scheduler/tests/fixtures/pr-open.json`.
- Added delivery artifact `docs/linear-legion-scheduler/delivery-pr-writeback.md` and updated scheduler README / index / WI-05 doc.

## Files to Review First

1. `scheduler/src/pr-tracker.ts` — core WI-05 delivery decision and writeback logic.
2. `scheduler/tests/linear-pr-tracker.test.ts` — acceptance and negative cases.
3. `scheduler/src/worker-runner.ts` — worker `done` now waits for PR tracking.
4. `scheduler/src/sqlite-store.ts` — native outbox side effects, migration guard and failure-clearing transition behavior.
5. `docs/linear-legion-scheduler/delivery-pr-writeback.md` — reviewer-facing delivery artifact.

## Verification Evidence

See `.legion/tasks/linear-0xc-60/docs/test-report.md`.

Executed and passing:

- `npm --prefix scheduler test` — PASS, 35/35 tests.
- `npm --prefix scheduler run health -- --db :memory:` — PASS.
- `npm run test:regression` — PASS, 18/18 tests.
- `npm run pack:dry-run` — PASS.
- `git diff --check` — PASS.

## Review Evidence

See `.legion/tasks/linear-0xc-60/docs/review-change.md`.

- Final verdict: PASS.
- Security / trust-boundary lens applied.
- Review initially found a terminal gate ordering issue; fixed so final writeback rows are queued before `done` / lock release / downstream reconcile.

## Residual Notes

- Real GitHub API calls were not part of automated validation; fixture coverage validates scheduler decisions without network dependency.
- Real Linear native API writeback remains adapter-driven and was not sent during local tests.
- Production state/label mapping should be configurable for each Linear team workflow.

## Reviewer Checklist

- [ ] Confirm worker result cannot directly unlock downstream.
- [ ] Confirm merged PR success path requires GitHub snapshot + evidence verifier + lifecycle evidence.
- [ ] Confirm blocked / terminal non-success paths do not satisfy blockers.
- [ ] Confirm native writeback rows use deterministic idempotency keys.
- [ ] Confirm root npm package boundary still excludes `scheduler/` prototype.
