# setup-opencode skill target change

## Task ID

`setup-opencode-agents-skills`

## Goal

Update `setup-opencode.ts` so the setup script installs or copies skills into `~/.agents` instead of the current OpenCode-oriented destination.

## Problem

The setup script currently targets the OpenCode skill location, but the requested runtime target is the shared agents skill directory under the user's home directory. Leaving the old target in place would install skills where the desired agents environment will not discover them.

## Acceptance

- `setup-opencode.ts` uses `~/.agents` as the skill copy/install destination.
- Existing setup behavior outside the destination change remains unchanged.
- Verification demonstrates the TypeScript script still parses or passes the repository's relevant checks.
- Legion delivery evidence records the implementation, verification, and PR lifecycle state.

## Assumptions

- The requested destination is the top-level `~/.agents` directory, not a nested `~/.agents/skills` path, unless the script already appends a skill subdirectory internally.
- The script name remains `setup-opencode.ts`; renaming the script or broader product terminology is outside this task.
- The change should be minimal and should not migrate unrelated setup behavior.

## Constraints

- Implement only inside the isolated worktree `.worktrees/setup-opencode-agents-skills/`.
- Do not modify unrelated generated files or existing untracked files in the main workspace.
- Preserve existing style and runtime assumptions in the script.

## Risks

- The script may build the final copy path in multiple places; missing one would leave mixed destinations.
- If downstream documentation or tests assert the old path, they may need scoped updates only when directly required for consistency.

## Scope

- Inspect and update `setup-opencode.ts` destination handling.
- Update narrowly related tests or docs only if they directly encode the old destination.
- Record verification and delivery artifacts under this task directory.

## Non-goals

- No broad setup redesign.
- No script rename or OpenCode branding cleanup.
- No changes to global user directories during verification unless an existing safe dry-run path supports it.

## Design summary

- Treat this as a low-risk, design-lite implementation: change the destination constant/path construction to point at `~/.agents` while preserving the rest of the copy logic.
- Prefer a single source of truth if the existing script already has a target path variable.
- Verify with the narrowest credible command available in the repository.

## Phases

1. Materialize task contract and open isolated worktree.
2. Implement the destination change.
3. Run relevant verification and record results.
4. Review readiness, create walkthrough/wiki evidence, commit, push, and open PR.
5. Follow PR checks/review to terminal state, then cleanup and refresh main workspace.
