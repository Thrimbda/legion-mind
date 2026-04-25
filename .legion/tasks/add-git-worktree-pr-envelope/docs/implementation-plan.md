# Implementation plan: Git worktree + PR lifecycle envelope

## Preconditions

- `docs/rfc.md` has passed `review-rfc` with no blocking findings.
- Scope remains limited to the files listed in the task plan.
- No changes to `skills/legion-workflow/scripts/**`.

## Milestone 1: Add lifecycle skill

Files:

- `skills/git-worktree-pr/SKILL.md`

Tasks:

1. Create the skill with frontmatter name `git-worktree-pr` and a description that makes it discoverable for Legion modifying development tasks.
2. Define hard gate, main workspace boundary, default `origin/master` base ref, lifecycle phases, forbidden actions, red flags, and completion conditions.
3. State that the skill wraps Legion execution modes and never defines a fourth mode.

Acceptance:

- The skill can stand alone as the detailed Git/PR lifecycle procedure.
- It does not redefine Legion phase order.

## Milestone 2: Wire top-level entry rules

Files:

- `AGENTS.md`
- `.opencode/agents/legion.md`
- `README.md`

Tasks:

1. Add a concise hard rule that modifying Legion development tasks must use `git-worktree-pr` after `legion-workflow` entry/restore determines the task is in scope.
2. Limit main workspace actions to preparation, read-only checks, final refresh, and cleanup checks.
3. Add README product-level mention that delivery uses worktree + PR lifecycle and that PR creation alone is not completion.

Acceptance:

- Entry docs reference the envelope without duplicating its procedure.
- README remains concise and user-facing.

## Milestone 3: Update workflow truth sources

Files:

- `skills/legion-workflow/SKILL.md`
- `skills/legion-workflow/references/SUBAGENT_DISPATCH_MATRIX.md`
- `skills/legion-workflow/references/REF_AUTOPILOT.md`
- `skills/legion-workflow/references/REF_ENVELOPE.md`

Tasks:

1. In `legion-workflow`, describe Git lifecycle as an envelope around exactly three execution modes.
2. In the dispatch matrix, add wording that phase chains run inside the envelope for modifying tasks; do not alter phase chains.
3. In autopilot, require PR follow-up through checks/review/terminal or blocked state.
4. In envelope reference, add optional `git` fields and enum semantics, with `baseRef: origin/master` as the default example.

Acceptance:

- The three execution modes and phase chains remain unchanged.
- PR follow-up and Git status fields are consistent across refs.

## Milestone 4: Verify and prepare handoff

Files:

- `.legion/tasks/add-git-worktree-pr-envelope/docs/test-report.md`
- `.legion/tasks/add-git-worktree-pr-envelope/docs/review-change.md`
- `.legion/tasks/add-git-worktree-pr-envelope/docs/report-walkthrough.md`
- `.legion/tasks/add-git-worktree-pr-envelope/docs/pr-body.md`

Tasks:

1. Run targeted doc consistency checks and `git diff --check`.
2. Confirm no CLI script changes.
3. Confirm no fourth mode wording was introduced.
4. Complete `review-change`, walkthrough, PR body, and wiki writeback per normal Legion lifecycle.

Acceptance:

- Verification evidence explicitly covers mode count, envelope consistency, and script non-modification.
- Reviewer can understand the design without reading this implementation plan first.
