## Summary

- Add `git-worktree-pr` as the mandatory Git worktree + PR lifecycle envelope for modifying Legion development tasks.
- Wire concise references into agent entry rules, `legion-workflow`, dispatch/autopilot/envelope refs, README, and the OpenCode installed skill list while keeping the existing three Legion execution modes unchanged.
- Define completion as Legion evidence plus PR merged/closed/confirmed-abandoned handling, review/checks handled, worktree deletion, and main workspace refresh; PR creation or blocked handoff is not completion.

## Reviewer notes

- Mode: implementation reviewer view.
- Git envelope is not a fourth execution mode.
- `scripts/setup-opencode.ts` only adds `git-worktree-pr` to `INSTALLED_SKILLS`; no workflow CLI semantics changed.
- No CLI scripts changed; validation evidence reports no changes under `skills/legion-workflow/scripts/**`.
- Blocked PR/check/review states should be documented as blocked handoff conditions, not completion.

## Verification

- PASS: `docs/review-rfc.md` found no blocking design issues.
- PASS: `docs/test-report.md` targeted documentation/skill validation passed, including `git diff --check`, mode-count consistency checks, lifecycle field checks, installed-skill list coverage, script non-modification checks, and 57/57 targeted assertions.
- PASS: `docs/review-change.md` found no blocking implementation issues.

## Scope / boundaries

- This is a documentation/skill workflow change.
- Full test suite/install verification was skipped per existing test report because the validation surface was targeted textual consistency.
- GitHub PR checks/review follow-up was not available in the existing verification run.
