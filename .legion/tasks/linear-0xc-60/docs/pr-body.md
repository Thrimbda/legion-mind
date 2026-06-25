## Summary

- Add WI-05 PR delivery tracker for scheduler runs, including GitHub PR snapshot adapter, PR state -> run transition mapping, and terminal success/non-success gates.
- Queue idempotent Linear native writeback rows for PR URL, activity/plan, coarse issue state/labels, final comments, and final responses.
- Change worker `done` handling so worker evidence can only move a run to `in_review`; GitHub PR tracking must verify merged/checks/review + Legion evidence + `git-worktree-pr` lifecycle before `done`.
- Document the WI-05 delivery artifact and update scheduler README/index.

## Verification

- `npm --prefix scheduler test` PASS (35/35)
- `npm --prefix scheduler run health -- --db :memory:` PASS
- `npm run test:regression` PASS (18/18)
- `npm run pack:dry-run` PASS
- `git diff --check` PASS

## Legion Evidence

- Task: `.legion/tasks/linear-0xc-60/`
- Test report: `.legion/tasks/linear-0xc-60/docs/test-report.md`
- Review: `.legion/tasks/linear-0xc-60/docs/review-change.md`
- Walkthrough: `.legion/tasks/linear-0xc-60/docs/report-walkthrough.md`
