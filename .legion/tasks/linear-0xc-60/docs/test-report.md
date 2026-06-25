# Test Report: Linear WI-05 PR Tracking and Linear Delivery Writeback

## Result

PASS

## Why these checks

- `npm --prefix scheduler test` is the strongest targeted validation for WI-05 because it runs scheduler core, graph scanner, worker runner and the new PR tracker tests in the same Node/SQLite runtime used by the prototype.
- `npm --prefix scheduler run health -- --db :memory:` validates the migrated SQLite schema, including the WI-05 native outbox side-effect migration surface.
- `npm run test:regression` checks that scheduler changes did not break the root LegionMind CLI / installer regression suite.
- `npm run pack:dry-run` confirms the root `lgmind` npm package boundary remains intact and does not accidentally publish the standalone `scheduler/` prototype.
- `git diff --check` catches whitespace errors before review.

## Commands

### Scheduler unit / integration tests

```bash
npm --prefix scheduler test
```

Result: PASS — 35/35 tests.

Coverage highlights:

- PR open -> `in_review` with idempotent PR URL / activity / plan / coarse state / labels writeback rows.
- Checks failure and review changes requested -> `blocked` / `pr_blocked`, no downstream unlock.
- PR merged + checks/review resolved + Legion evidence PASS + lifecycle evidence complete -> `done`, gates passed, locks released, downstream reconcile requested, final summary writeback queued.
- PR merged with missing Legion evidence -> `blocked` / `legion_evidence_missing`.
- PR merged with incomplete `git-worktree-pr` lifecycle evidence -> `blocked` / `lifecycle_blocked`.
- Closed-unmerged / rejected -> terminal non-success, locks released, no blocker satisfaction.
- Worker `done` result now waits in `in_review` and records `pr_tracking_required` rather than marking run `done` directly.
- `delivery track` CLI consumes fixture snapshots.

### Scheduler DB health smoke

```bash
npm --prefix scheduler run health -- --db :memory:
```

Result: PASS — migrations applied, all seven scheduler tables present, 0 active runs, 0 pending outbox rows.

### Root regression suite

```bash
npm run test:regression
```

Result: PASS — 18/18 tests.

### Root package dry run

```bash
npm run pack:dry-run
```

Result: PASS — npm dry-run completed; package file list still contains CLI/install assets only and excludes the standalone `scheduler/` prototype.

### Whitespace check

```bash
git diff --check
```

Result: PASS — no whitespace errors.

## Skipped / manual validation

- Real GitHub API calls were not run in automated tests. The GitHub REST adapter is exercised through shape/unit logic and fixture mode; production use still needs a least-privilege token and rate-limit handling.
- Real Linear native writeback was not sent. WI-05 queues native outbox payloads for activities, external URLs, comments, labels, state and final responses; a production native adapter remains outside this local test surface.
- No real PR was merged during this validation. Terminal success is covered by fixture snapshots plus repo-local Legion evidence / lifecycle fixtures.

## Residual risks

- GitHub REST review/check interpretation may need tightening once repository-specific branch protection and required review policy are known.
- Native adapter implementations must map `update_issue_state` / `update_issue_labels` payloads to each Linear team’s configured workflow states and labels.
