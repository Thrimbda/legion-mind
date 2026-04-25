# Report walkthrough: Git worktree PR envelope

## Mode

- Reviewer view: `implementation`
- Rationale: skill/docs changed, and both verification evidence (`docs/test-report.md`) and implementation review evidence (`docs/review-change.md`) exist.

## What changed

This task integrates a Git worktree + PR lifecycle as a required repository-delivery envelope for modifying Legion development tasks.

Changed-file surface reviewed in existing evidence:

- `skills/git-worktree-pr/SKILL.md`
- `scripts/setup-opencode.ts`
- `AGENTS.md`
- `.opencode/agents/legion.md`
- `skills/legion-workflow/SKILL.md`
- `skills/legion-workflow/references/SUBAGENT_DISPATCH_MATRIX.md`
- `skills/legion-workflow/references/REF_AUTOPILOT.md`
- `skills/legion-workflow/references/REF_ENVELOPE.md`
- `README.md`
- Task evidence under `.legion/tasks/add-git-worktree-pr-envelope/`

## Design intent

- Add `git-worktree-pr` as the detailed lifecycle skill for worktree creation, PR follow-up, cleanup, and main workspace refresh.
- Keep `legion-workflow` responsible for entry, restore, execution-mode selection, and phase semantics.
- Keep Git lifecycle mechanics out of duplicated truth sources: top-level docs and workflow references provide hard-entry rules, concise references, status fields, and completion semantics.

## Explicit reviewer notes

- Git envelope is **not a fourth execution mode**. Existing Legion execution modes remain the three canonical modes.
- Development task completion now includes PR merged/closed/confirmed-abandoned handling, review/checks handled, worktree deletion, and main workspace baseline refresh in addition to Legion evidence completion.
- `scripts/setup-opencode.ts` only adds `git-worktree-pr` to the installed skill list; no workflow CLI commands, parser/state semantics, install/verify behavior, or `skills/legion-workflow/scripts/**` semantics changed.
- No CLI scripts changed. Existing evidence specifically reports no changes under `skills/legion-workflow/scripts/**`.
- PR creation alone is not completion; blocked PR/check/review states must be recorded as blocked handoff conditions, not completion.

## Evidence readout

- `docs/rfc.md`: Defines the Git lifecycle as an outer envelope around existing Legion modes, with `origin/master` default base ref, `.worktrees/<task-id>/` worktree expectation, PR follow-up, cleanup, and main refresh semantics.
- `docs/review-rfc.md`: PASS with no blocking findings; explicitly validates no fourth mode, no CLI changes, no duplicated workflow truth source, and PR completion semantics.
- `docs/test-report.md`: PASS for targeted documentation/skill validation, including `git diff --check`, required skill presence, installed-skill list coverage, entry-rule updates, canonical mode preservation, dispatch matrix consistency, autopilot follow-up semantics, lifecycle fields, no workflow script changes, and 57/57 targeted assertions passing.
- `docs/review-change.md`: PASS with no blocking findings; validates correctness, maintainability, scope compliance, no fourth execution mode, and consistency across refs.

## Verification boundaries

- Full test suite/install verification was skipped in existing evidence because this is a documentation/skill consistency change.
- GitHub PR checks/review follow-up was not verified in this run because no PR lifecycle was available for the verification evidence.
- Untracked `superpowers/` was reported as outside the task surface and not part of the reviewed change.

## Reviewer focus

Review should focus on whether the prose consistently enforces the new lifecycle envelope without accidentally redefining Legion modes, duplicating Git procedure across multiple truth sources, or implying that an opened PR is a completed development task.
