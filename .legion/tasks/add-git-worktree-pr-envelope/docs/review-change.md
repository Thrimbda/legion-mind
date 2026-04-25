# review-change: Git worktree PR envelope documentation change

## Verdict

PASS

## Blocking findings

None.

## Findings

- **Correctness**: PASS. The implementation matches the RFC: `git-worktree-pr` is introduced as a lifecycle envelope, `AGENTS.md` and `legion-workflow` enforce it for non-bypass modifying Legion development tasks, and PR creation is explicitly not completion.
- **AIM fidelity tightening**: PASS. Follow-up edits now make push-before-rebase mandatory, reject blocked/kept/skipped states as completion, require immediate auto-merge attempt plus required-checks follow-up, prohibit direct `master`/`main` commit/push and local `master`/`main` development, and keep persistent outputs inside the repo.
- **Install asset list re-run**: PASS. The post-review update to `scripts/setup-opencode.ts` is limited to adding `'git-worktree-pr'` to `INSTALLED_SKILLS`; it does not alter workflow CLI commands, parser/state semantics, install behavior, verify behavior, or files under `skills/legion-workflow/scripts/**`.
- **Maintainability**: PASS. Detailed Git/PR procedure is centralized in `skills/git-worktree-pr/SKILL.md`; other files add concise hard-entry, completion, or status-field references rather than duplicating a second procedure source.
- **Scope compliance**: PASS. Reviewed changes are documentation/skill workflow files in scope plus task docs. No `skills/legion-workflow/scripts/**` or CLI behavior changes were detected. Untracked `superpowers/` remains outside the reviewed task surface and is not part of this change.
- **No fourth execution mode**: PASS. `legion-workflow` and `SUBAGENT_DISPATCH_MATRIX.md` still define exactly the three existing execution modes and describe `git-worktree-pr` as an outer lifecycle envelope only.
- **Consistency checks**: PASS. `origin/master`, `.worktrees/<task-id>/`, branch naming, PR/check/review states, cleanup state, and main workspace refresh semantics are consistent across the new skill, `REF_AUTOPILOT.md`, `REF_ENVELOPE.md`, README, and agent entry rules.
- **Verification evidence**: PASS. Re-read `plan.md`, `docs/rfc.md`, `docs/review-rfc.md`, `docs/test-report.md`, the current diff, `skills/git-worktree-pr/SKILL.md`, and the install-list change. Re-ran `git diff --check` and checked `skills/legion-workflow/scripts/**`; both produced no output.

## Security lens

Not applied. This is a documentation/skill workflow change and does not modify auth, identity, token handling, secrets, crypto, tenant isolation, privileged user-input paths, or runtime trust-boundary enforcement code.

## Non-blocking suggestions

- When producing the final walkthrough/PR body, explicitly call out that `blocked` PR/check/review state is a documented handoff condition, not successful completion.
- Optional future check: if the installer asset list changes again, re-run the targeted verification because `git-worktree-pr` must stay in `INSTALLED_SKILLS` to be installed and strict-verified.
