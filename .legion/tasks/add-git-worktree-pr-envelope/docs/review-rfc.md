# review-rfc: Git worktree + PR lifecycle envelope

## Verdict

PASS

## Blocking findings

None.

The RFC and implementation plan are implementable, bounded to documentation/skill changes, verifiable with explicit consistency checks, and rollbackable by reverting the new skill plus short references. The design preserves the existing three Legion execution modes, excludes CLI changes, avoids making `AGENTS.md` or `legion-workflow` a duplicated Git procedure source, and sets `origin/master` as the default base ref.

## Review notes

- **No fourth execution mode**: PASS. The RFC repeatedly states that `git-worktree-pr` is a lifecycle envelope, not a mode, and verification explicitly checks mode count and unchanged dispatch chains.
- **No CLI changes**: PASS. Both RFC and implementation plan exclude `skills/legion-workflow/scripts/**` and include verification for script non-modification.
- **No duplicated workflow truth source**: PASS. Detailed Git mechanics live in the new skill; `AGENTS.md`, `legion-workflow`, matrix, autopilot, envelope ref, and README are limited to hard entry, references, status fields, and completion semantics.
- **Mandatory enough via `AGENTS.md` + `legion-workflow`**: PASS. The entry gate rule is added at top-level and reinforced in `legion-workflow` after non-bypass modifying task determination.
- **PR completion semantics**: PASS. PR creation is explicitly not completion; completion requires PR merged or closed / confirmed abandoned with reason, checks/review handled, worktree deletion, baseline refresh, and Legion evidence. Recorded blockers are handoff states, not completion.
- **Base ref default**: PASS. `origin/master` is specified as the default base ref with repo/user override allowance.

## Suggestions

1. In implementation prose, distinguish clearly between **completion** and **blocked handoff**: a blocked PR/check/review state may pause the current run only when documented as a blocker, but must not be counted as development task completion.
2. Keep `REF_ENVELOPE.md` fields optional for bypass/read-only tasks, but make them expected once the envelope opens for modifying development work.
3. In the new skill, include one short red-flag sentence that generic autopilot/speed instructions do not waive the envelope unless the user explicitly overrides it.
