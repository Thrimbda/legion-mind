# RFC: Git worktree + PR lifecycle envelope for LegionMind

## Status

- Draft for `review-rfc`
- Task: `.legion/tasks/add-git-worktree-pr-envelope/`
- Date: 2026-04-25

## Context

LegionMind already defines a task lifecycle: contract, optional RFC, implementation, verification, review, walkthrough, and wiki writeback. The missing layer is the repository delivery lifecycle. Today an agent can still modify the main checkout directly, skip an isolated worktree, treat “PR opened” as done, or stop before checks/reviews/cleanup are closed.

The desired design integrates the user-provided AIM-style Git/worktree/PR semantics into Legion, but does not copy AIM wholesale and does not create another workflow truth source.

Current relevant truth sources:

- `AGENTS.md`: mandatory `legion-workflow` entry gate before exploration/implementation.
- `skills/legion-workflow/SKILL.md`: three execution modes and phase order.
- `skills/legion-workflow/references/SUBAGENT_DISPATCH_MATRIX.md`: runtime phase dispatch truth source.
- `skills/legion-workflow/references/REF_AUTOPILOT.md`: autopilot expectations and PR-as-review carrier.
- `skills/legion-workflow/references/REF_ENVELOPE.md`: orchestrator-to-subagent handoff fields.

## Goals

1. Make Git worktree + PR lifecycle a mandatory envelope for Legion development tasks.
2. Preserve the existing three Legion execution modes exactly; Git lifecycle is not a fourth mode.
3. Keep detailed Git procedure in one new skill, with other files only declaring hard entry, status fields, or short references.
4. Ensure completion means: Legion evidence complete, PR lifecycle resolved, worktree cleaned, and main workspace baseline refreshed.
5. Keep implementation documentation-only at this RFC stage.

## Non-goals

- Do not modify `skills/legion-workflow/scripts/**` or CLI behavior.
- Do not force worktrees for simple read-only answers, pure diagnostics, or explicit Legion bypass.
- Do not bypass branch protection, checks, or human reviews.
- Do not copy the AIM `AGENTS.md` text wholesale into Legion.
- Do not introduce “Git mode”, “PR mode”, or any other fourth execution mode.

## Decision

Adopt a new required lifecycle skill, `git-worktree-pr`, as a wrapper around Legion’s existing execution modes.

The conceptual order becomes:

```text
legion-workflow entry gate
  -> restore/brainstorm until contract stable
  -> git-worktree-pr envelope opens repository lifecycle
  -> one of exactly three Legion execution modes runs inside the worktree
  -> PR is opened and followed until merged / closed / confirmed abandoned, or blocked handoff is recorded without claiming completion
  -> worktree cleanup + main workspace baseline refresh
  -> Legion task can be considered complete
```

`legion-workflow` remains the source for entry, modes, and phase order. `git-worktree-pr` becomes the source for repository lifecycle mechanics and completion conditions.

## Detailed design

### 1. New `skills/git-worktree-pr/SKILL.md`

Add a rigid skill dedicated to the Git/PR lifecycle envelope.

Required content:

- **Hard gate**: for Legion-managed development tasks that will modify repository files, use an isolated Git worktree before implementation or writeable exploration.
- **Base ref default**: use `origin/master` unless repo/user rules override it.
- **Main workspace boundary**:
  - Allowed in main workspace: entry gate, task restore, read-only checks needed to prepare the worktree, fetching base refs, final baseline refresh, and cleanup checks.
  - Disallowed in main workspace: implementation edits, test-driven code changes, commits, PR branch development, or “just one quick patch”.
- **Lifecycle phases**:
  1. Prepare: confirm repo state, fetch latest base, derive task branch name.
  2. Create worktree from latest base: e.g. branch `legion/<task-id>-<slug>` from `origin/master`.
  3. Run Legion selected execution mode inside the worktree.
  4. Commit scope-bound changes.
  5. Before every push, run `git fetch origin && git rebase origin/master` inside the worktree.
  6. Push only the PR branch; never push `master` / `main` directly.
  7. Create PR with required Legion artifacts linked or summarized.
  8. Immediately attempt auto-merge and follow required checks/review.
  9. Follow PR checks/review until merged, closed, or confirmed abandoned; blocked states are handoff only, not completion.
  10. Delete worktree after safe terminal condition.
  11. Refresh main workspace baseline after merge/close/abandon as appropriate.
- **Completion conditions**:
  - PR merged, or PR explicitly closed/superseded with documented reason; and
  - checks/review state is resolved; and
  - worktree is deleted; and
  - main workspace baseline is refreshed; and
  - Legion `report-walkthrough` and `legion-wiki` are complete when applicable.
- **Red flags**:
  - Direct edits in main workspace after the envelope should have opened.
  - “PR created” claimed as completion.
  - Worktree left behind without reason.
  - Checks/reviews ignored under autopilot.
  - Branch created from stale base when fetch was possible.

The skill should be procedural enough for agents to act consistently, but should not redefine Legion task modes or phase sequence.

### 2. `AGENTS.md` hard rule

Extend `AGENTS.md` with a short hard rule after the current Legion entry gate:

- After `legion-workflow` determines a non-bypass development task will modify repository files, the task must run inside the `git-worktree-pr` envelope.
- The main workspace is limited to preparation/read-only/final refresh.
- User instruction remains highest priority, but generic speed/autopilot phrases do not waive the envelope.

Keep this concise. `AGENTS.md` should not become a second Git procedure manual.

### 3. `legion-workflow` integration

Update `skills/legion-workflow/SKILL.md` to describe `git-worktree-pr` as an outer lifecycle envelope that wraps all three execution modes.

Important wording:

- Execution modes remain exactly:
  1. default implementation mode,
  2. approved-design continuation mode,
  3. heavy design-only mode.
- `git-worktree-pr` is not a mode; it is a repository lifecycle envelope.
- For development tasks with repository modifications, completion requires both Legion phase completion and strict Git/PR lifecycle completion: PR merged or closed / confirmed abandoned with reason, reviews/checks handled, worktree deleted, and main workspace refreshed.
- For heavy design-only mode, the envelope can still apply when the design artifacts are intended to be delivered via a documentation PR; it does not add verify/review-change to design-only mode.

### 4. Dispatch matrix wording

Update `SUBAGENT_DISPATCH_MATRIX.md` with a small preface or core rule:

- This matrix only defines Legion phase dispatch after a stable contract.
- When the task modifies repository files, all listed phase chains run inside the `git-worktree-pr` envelope.
- The envelope does not alter required phase chains and does not add a fourth mode.
- Post-PR follow-up remains outside phase dispatch but inside task completion.

Avoid adding Git commands or duplicating the new skill’s lifecycle details here.

### 5. Autopilot PR follow-up

Update `REF_AUTOPILOT.md` so autopilot means the agent follows the PR lifecycle without extra prompting when safe:

- Opening a PR is not completion.
- The agent should monitor/follow checks and review comments, address non-blocking failures when within scope, and record blockers when human permissions or branch protection prevent progress.
- Human decision should concentrate on the PR, but autopilot still must produce task evidence and continue until terminal PR state or explicit blocker.
- Draft PRs are acceptable for heavy design-only work, but must be labeled as design review carriers, not delivery completion.

### 6. `REF_ENVELOPE` Git fields

Add optional Git lifecycle fields to the subagent envelope. These fields let the orchestrator pass repository lifecycle context without changing CLI scripts.

Proposed fields:

```yaml
git:
  lifecycle: git-worktree-pr
  baseRef: origin/master
  branch: legion/<task-id>-<slug>
  worktreePath: /repo/.worktrees/<branch-or-task>
  prUrl: null
  prState: not_created
  checksState: unknown
  reviewState: unknown
  cleanupState: pending
  mainWorkspaceRefresh: pending
```

Suggested enum semantics:

- `prState`: `not_created | draft | open | merged | closed | blocked | superseded`
- `checksState`: `unknown | pending | passing | failing | blocked | skipped`
- `reviewState`: `unknown | pending | approved | changes_requested | blocked | skipped`
- `cleanupState`: `pending | completed | kept_with_reason | blocked`
- `mainWorkspaceRefresh`: `pending | completed | skipped_with_reason | blocked`

`blocked`, `kept_with_reason`, and `skipped_with_reason` represent blocked handoff or incomplete lifecycle states. They are not completion states.

These fields are optional because read-only tasks and explicit bypasses do not need them. For modifying development tasks, the orchestrator should include them in phase handoffs when available.

### 7. README mention

Add a short mention in README’s system model or quick-start narrative:

- Non-simple modifying Legion tasks normally run in a Git worktree and are delivered through a PR lifecycle.
- Task completion requires the Legion evidence loop plus PR/check/review follow-up, worktree deletion, and baseline refresh. Blocked handoff is not completion.

This should be a concise product-level statement, not a command reference.

## Alternatives considered

### Alternative A: Put the full Git procedure directly into `legion-workflow`

- **Pros**: One less skill to discover; centralizes all workflow rules.
- **Cons**: Overloads `legion-workflow`, mixes task phase semantics with repository mechanics, and increases risk of duplicating AIM wholesale.
- **Decision**: Rejected. `legion-workflow` should reference the envelope and preserve phase truth source responsibilities.

### Alternative B: Add a fourth execution mode for Git/PR tasks

- **Pros**: Easy to represent in dispatch tables.
- **Cons**: Violates task constraints, confuses delivery mechanism with execution phase chain, and would force needless matrix expansion.
- **Decision**: Rejected. Git/PR is an envelope, not a mode.

### Alternative C: Only update `AGENTS.md` with a hard worktree rule

- **Pros**: Minimal change; strong top-level instruction.
- **Cons**: Lacks procedural detail, status fields, and PR follow-up semantics; agents may still diverge.
- **Decision**: Rejected as insufficient.

### Alternative D: Reuse existing Superpowers worktree/finishing skills directly

- **Pros**: Prior art exists for worktree setup and branch finishing.
- **Cons**: Their semantics are not Legion-specific, do not encode Legion phase completion, and may import incompatible assumptions.
- **Decision**: Rejected as direct dependency. They may inform wording, but `git-worktree-pr` must be Legion-native.

### Alternative E: Make PR creation optional and treat local branch completion as done

- **Pros**: Works in offline or permission-limited environments.
- **Cons**: Fails the design goal of connecting Legion evidence to real repository delivery.
- **Decision**: Rejected as default. If PR creation is impossible, record `prState: blocked` with reason; do not claim normal completion.

## Rollback plan

All planned implementation changes are documentation/skill text only. Rollback is straightforward:

1. Remove `skills/git-worktree-pr/SKILL.md`.
2. Revert the short references in `AGENTS.md`, `.opencode/agents/legion.md`, `skills/legion-workflow/SKILL.md`, dispatch/autopilot/envelope refs, and README.
3. Confirm the three execution modes in `legion-workflow` and `SUBAGENT_DISPATCH_MATRIX.md` match their pre-change wording.
4. Leave task docs as historical design evidence unless the task itself is being abandoned.

Partial rollback is also safe: if the new skill wording proves too strict, keep the `AGENTS.md`/workflow references but revise only `git-worktree-pr` lifecycle details.

## Verification plan

Targeted documentation verification should check:

1. `skills/git-worktree-pr/SKILL.md` exists and contains hard gate, main workspace boundaries, lifecycle phases, red flags, and completion conditions.
2. `AGENTS.md` and `.opencode/agents/legion.md` mention the mandatory worktree/PR envelope for modifying Legion development tasks without duplicating the full procedure.
3. `skills/legion-workflow/SKILL.md` still lists exactly three execution modes and explicitly says Git lifecycle is an envelope, not a mode.
4. `SUBAGENT_DISPATCH_MATRIX.md` still contains the same three phase chains and adds only envelope wording.
5. `REF_AUTOPILOT.md` states PR creation is not completion and includes checks/review follow-up behavior.
6. `REF_ENVELOPE.md` includes optional Git lifecycle fields with `baseRef` defaulting to `origin/master`.
7. README includes a concise worktree + PR lifecycle mention.
8. No files under `skills/legion-workflow/scripts/**` are modified.
9. `git diff --check` passes.

Review verification should specifically look for accidental introduction of a fourth mode or duplicated AIM procedure text.

## Open questions

None blocking. The main implementation choice left to the next phase is exact prose, not architecture.

## Handoff to implementation

Proceed after `review-rfc` passes. Implementation should stay within the task scope and avoid touching CLI scripts.
