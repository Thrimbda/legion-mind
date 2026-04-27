# Task Summary: fix-aim-autonomous-pr-flow

## Current Truth

- `git-worktree-pr` now treats commit, push PR branch, PR create/update, checks/review/auto-merge follow-up, cleanup, and main workspace refresh as default lifecycle actions once the envelope applies.
- User silence or lack of per-action wording like “commit”, “push”, or “open PR” is not a reason to stop at local changes.
- Explicit user no-commit/no-push/no-PR/no-follow-up or explicit bypass still overrides the default flow, but must be recorded as explicit bypass/blocker.

## Preserved Constraints

- Push before rebase remains mandatory: `git fetch origin && git rebase origin/master` inside the worktree.
- Direct `master` / `main` commit or push remains forbidden.
- Local `master` / `main` must not carry development.
- Persistent outputs remain inside the repo.
- PR creation and blocked handoff are not completion.

## Evidence

- Plan: `.legion/tasks/fix-aim-autonomous-pr-flow/plan.md`
- Test report: `.legion/tasks/fix-aim-autonomous-pr-flow/docs/test-report.md`
- Review: `.legion/tasks/fix-aim-autonomous-pr-flow/docs/review-change.md`
- Walkthrough: `.legion/tasks/fix-aim-autonomous-pr-flow/docs/report-walkthrough.md`
