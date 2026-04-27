# Walkthrough: AIM autonomous PR flow wording

## Summary

- Clarifies that `git-worktree-pr` defaults to completing the Git lifecycle: commit, push PR branch, create/update PR, follow checks/review/auto-merge, cleanup, and main refresh.
- Removes the possible interpretation that agents should stop at local changes unless the user explicitly says “commit”, “push”, or “open PR”.
- Preserves all strict lifecycle controls: push-before-rebase, no direct `master`/`main` push, repo-only outputs, PR creation not completion, and blocked handoff not completion.

## Files Changed

- `skills/git-worktree-pr/SKILL.md`: Core hard gate, lifecycle, checks/review semantics, red flags, and rationalization table.
- `AGENTS.md`: Repository entry rule updated with autonomous commit/push/PR default.
- `.opencode/agents/legion.md`: OpenCode agent entry rule aligned with `AGENTS.md`.
- `skills/legion-workflow/references/REF_AUTOPILOT.md`: Autopilot now explicitly includes default commit/push/PR lifecycle follow-through.
- `README.md`: Product-level description updated.
- `.legion/tasks/fix-aim-autonomous-pr-flow/**`: Task evidence.
- `.legion/wiki/**`: Durable pattern and task writeback.

## Verification

- `git diff --check`: PASS.
- Targeted assertion script: PASS, 37/37.
- `skills/legion-workflow/scripts/**`: unchanged.

## Reviewer Focus

- Confirm the new wording solves the AIM fidelity issue without implying branch protection or review can be bypassed.
- Confirm explicit user no-commit/no-push/no-PR remains honored as explicit bypass/blocker, not as the default path.
