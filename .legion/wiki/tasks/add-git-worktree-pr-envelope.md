# Task summary: add-git-worktree-pr-envelope

## Status

- Date: 2026-04-25
- Result: completed
- Source docs: `.legion/tasks/add-git-worktree-pr-envelope/`

## What changed

- Added `skills/git-worktree-pr/SKILL.md` as the rigid Git worktree + PR lifecycle envelope.
- Added hard entry rules to `AGENTS.md` and `.opencode/agents/legion.md` for development tasks.
- Updated `skills/legion-workflow/SKILL.md` to route modifying development tasks through `git-worktree-pr` without adding a fourth execution mode.
- Updated workflow references:
  - `SUBAGENT_DISPATCH_MATRIX.md`: Git envelope wraps existing modes.
  - `REF_AUTOPILOT.md`: PR follow-up continues checks/review/merge/cleanup; speed/autopilot wording does not waive envelope.
  - `REF_ENVELOPE.md`: adds Git lifecycle fields for handoff/state.
- Added README mention for worktree + PR lifecycle.

## Current effective conclusion

- `git-worktree-pr` is the mandatory lifecycle envelope for Legion-managed development tasks that modify repository content, validate, commit, push, create/update PRs, or handle checks/review.
- It is not a fourth execution mode. Existing execution modes remain:
  1. 默认实现模式
  2. 已批准设计后的续跑模式
  3. 重型仅设计模式
- Default base ref for this repository is `origin/master`; worktrees live under `.worktrees/<task-id>/`.
- PR creation and blocked handoff are not completion. Completion requires PR merged, or closed / confirmed abandoned with reason and next steps recorded; review/checks handled; worktree deleted; and main workspace refreshed after Legion evidence and wiki writeback.

## Evidence

- RFC: `.legion/tasks/add-git-worktree-pr-envelope/docs/rfc.md`
- RFC review: `.legion/tasks/add-git-worktree-pr-envelope/docs/review-rfc.md` (`PASS`)
- Verification: `.legion/tasks/add-git-worktree-pr-envelope/docs/test-report.md` (`PASS`, targeted assertions 57/57 after strictness patch, `git diff --check` pass)
- Review: `.legion/tasks/add-git-worktree-pr-envelope/docs/review-change.md` (`PASS`)
- Walkthrough / PR body: `.legion/tasks/add-git-worktree-pr-envelope/docs/report-walkthrough.md`, `.legion/tasks/add-git-worktree-pr-envelope/docs/pr-body.md`

## Follow-ups

- No mandatory follow-up recorded.
- Future installer work may need to ensure `git-worktree-pr` is copied into target agent skill directories.
