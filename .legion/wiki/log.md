# Legion Wiki Log

## [2026-04-25] writeback | add-git-worktree-pr-envelope

- Promoted Git worktree + PR lifecycle envelope as a durable development-task pattern in `patterns.md`.
- Added task summary for `add-git-worktree-pr-envelope` under `tasks/`.
- Recorded current conclusion: `git-worktree-pr` wraps existing execution modes and is not a fourth mode; push-before-rebase is mandatory; PR creation, blocked handoff, kept worktree, or skipped refresh are not completion.

## [2026-04-25] supplement | harden-legion-workflow-gate

- Expanded `legion-workflow` diagram guidance after review feedback: entry state machine, mode selector, and stage-chain rollback map are now the current documentation shape.
- Reaffirmed that applicable chains complete only after `report-walkthrough` evidence and `legion-wiki` writeback.

## [2026-04-25] writeback | harden-legion-workflow-gate

- Promoted Legion entry-gate-first behavior as a durable workflow pattern in `patterns.md`.
- Added task summary for `harden-legion-workflow-gate` under `tasks/`.
- Recorded current mode taxonomy: three execution modes after stable contract; `bypass` / `restore` / `brainstorm` remain entry runtime states.

## [2026-04-25] writeback | harden-strict-verify-integrity

- Promoted strict install verification as a durable CLI pattern in `patterns.md`.
- Added task summary for `harden-strict-verify-integrity` under `tasks/`.
- Recorded one non-blocking manifest self-consistency follow-up in `maintenance.md`.

## [2026-04-23] writeback | tighten-cli-doc-drift

- Added `maintenance.md` entry for an unverified `task create` materialization observation seen during task bootstrap.
- No new cross-task pattern or hard decision was added; existing CLI role guidance remains in `patterns.md`.

## [2026-04-23] writeback | fix-task-create-materialization

- Promoted `task create` staging + rename materialization to a durable CLI pattern in `patterns.md`.
- Removed the earlier open maintenance entry for one-off `task create` partial materialization after the invariant-hardening fix landed and success-path verification passed.
