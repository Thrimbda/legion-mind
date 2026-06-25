# Task Summary: linear-0xc-60

## Status

- **Task**: `linear-0xc-60`
- **Linear**: `0XC-60` — WI-05: Track PR delivery and write back Linear status
- **Outcome**: PR delivery tracking and Linear writeback outbox implemented for the standalone `scheduler/` npm project.
- **Delivery artifact**: `docs/linear-legion-scheduler/delivery-pr-writeback.md`
- **Raw evidence**: `.legion/tasks/linear-0xc-60/`

## What changed

- Added `scheduler/src/pr-tracker.ts` with PR snapshot model, `GitHubPrClient`, fixture/static client, GitHub REST debug client, PR state mapping and terminal gate logic.
- Extended scheduler native outbox side effects for PR delivery writeback: `create_comment`, `update_issue_labels`, `update_issue_state`, plus richer `final_response` payloads.
- Changed worker `done` handling: worker evidence can move a run to `in_review`, but cannot mark `done` without PR tracker verification.
- Added `delivery track` CLI debug command and PR fixture support.
- Added PR tracker test coverage and delivery docs.

## Current truth promoted

- Worker output is not terminal authority. Scheduler must verify GitHub PR snapshot, Legion evidence and `git-worktree-pr` lifecycle evidence before `run_terminal_success`.
- `run_terminal_success` for PR-backed implementation requires PR merged, checks/review resolved, evidence verifier PASS, lifecycle evidence complete and final Linear writeback queued/sent.
- PR open/draft/pending review is `in_review`; checks failing or changes requested is `blocked` / `pr_blocked`; merged-but-evidence-missing is `legion_evidence_missing`; merged-but-lifecycle-incomplete is `lifecycle_blocked`.
- Closed-unmerged, rejected, cancelled, abandoned or superseded runs are terminal non-success and do not satisfy downstream blockers by default.
- Linear native writeback remains presentation/control plane via idempotent DB outbox rows; Scheduler DB remains machine truth.

## Verification

- `npm --prefix scheduler test` PASS (35/35).
- `npm --prefix scheduler run health -- --db :memory:` PASS.
- `npm run test:regression` PASS (18/18).
- `npm run pack:dry-run` PASS.
- `git diff --check` PASS.

## Review

- Final verdict: PASS.
- Security / trust-boundary lens applied.
- Review found and fixed one blocker before PASS: terminal success must enqueue final Linear writeback before `done`, lock release and downstream reconcile.

## Follow-ups

- Run real GitHub REST PR tracking smoke with least-privilege token against a test PR before production use.
- Implement production Linear native adapter mapping `update_issue_state` / `update_issue_labels` to team-specific workflow states and labels.
- Add branch-protection / required-context awareness if repository policy needs stricter than check-run/review snapshot interpretation.
- Add explicit legacy SQLite migration coverage for old `native_outbox.side_effect` CHECK constraints if scheduler DBs become long-lived.
