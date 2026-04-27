## Summary

- Clarify that `git-worktree-pr` defaults to commit, push PR branch, create/update PR, PR follow-up, cleanup, and main refresh after the envelope applies.
- Explicitly reject “the user did not ask for commit/push/PR” as a stopping condition.
- Preserve explicit bypass/no-commit/no-push/no-PR handling plus existing Git safety and completion rules.

## Verification

- PASS: `git diff --check`
- PASS: targeted assertions for AIM autonomous lifecycle wording and preserved hard rules (`37/37`)
- PASS: no changes under `skills/legion-workflow/scripts/**`

## Notes

- This is a documentation/skill contract change only.
- Branch protection, checks, review, push-before-rebase, and strict completion semantics remain mandatory.
