# Legion Wiki Log

## [2026-04-27] writeback | refresh-readme-current-reality

- Added task summary for `refresh-readme-current-reality` under `tasks/`.
- Recorded that README current reality now explicitly reflects the post-hardening repository state: workflow kernel, OpenCode/OpenClaw setup parity, regression suite, VibeHarnessBench v0.1, current-truth convergence, and still-ungraduated CI/release/onboarding/runtime/sandbox boundaries.

## [2026-04-27] writeback | harden-v1-kernel-harness

- Added task summary for `harden-v1-kernel-harness` under `tasks/`.
- Promoted setup lifecycle shared core, OpenClaw rollback/uninstall parity, regression suite coverage, and docs current-truth convergence as durable patterns.
- Recorded one non-blocking setup-core auditability follow-up around managed root textual/canonical correspondence.

## [2026-04-27] writeback | fix-aim-autonomous-pr-flow

- Tightened `git-worktree-pr` autonomous delivery semantics: commit, push PR branch, PR create/update, PR follow-up, cleanup, and main refresh are default lifecycle actions after the envelope applies.
- Recorded that user silence or lack of per-action commit/push/PR wording is not a stop condition; explicit no-commit/no-push/no-PR or bypass must be recorded as explicit bypass/blocker.
- Preserved strict Git safety constraints and completion definition.

## [2026-04-25] writeback | fix-openclaw-setup-install

- Added task summary for `fix-openclaw-setup-install` under `tasks/`.
- Promoted OpenClaw local skills root + managed manifest installation as a durable CLI pattern in `patterns.md`.
- Recorded current conclusion: `setup-openclaw` should install to `~/.openclaw/skills` and use strict verify for ownership/checksum drift, while keeping `skills.load.extraDirs` compatibility.

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

## [2026-04-25] writeback | complete-vibeharnessbench-v01

- Added task summary for `complete-vibeharnessbench-v01` under `tasks/`.
- Promoted verifier-owned temp copy for hidden test injection as a durable benchmark isolation pattern in `patterns.md`.
- Updated maintenance to mark MVP contract-verifier upgrade as completed in local-first semantic scope and to preserve remaining Docker/GIF/RPC/browser/sandbox boundaries.

## [2026-04-25] writeback | build-vibeharnessbench-mvp

- Added task summary for `build-vibeharnessbench-mvp` under `tasks/`.
- Promoted repo-outside HUT execution root as a durable benchmark isolation pattern in `patterns.md`.
- Recorded benchmark MVP follow-ups for high-fidelity verifiers, Docker/offline runtimes, sandboxing and symlink hardening in `maintenance.md`.

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
