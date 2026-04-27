# Tasks: Fix OpenClaw setup install

## Phase 1 — Contract and worktree

- [x] Create isolated git worktree for `fix-openclaw-setup-install`.
- [x] Materialize task contract in `.legion/tasks/fix-openclaw-setup-install/`.

## Phase 2 — Exploration

- [x] Identify the current `setup-openclaw.ts` install and verify gaps.
- [x] Identify reusable managed-file patterns from `setup-opencode.ts`.

## Phase 3 — Implementation

- [x] Add managed skill sync into OpenClaw's local skills root.
- [x] Add safe conflict handling and manifest state.
- [x] Strengthen verify to check managed ownership and content integrity.
- [x] Preserve CLI ergonomics (`--dry-run`, `--json`, target-dir options).

## Phase 4 — Verification

- [x] Run install/verify against an isolated temporary OpenClaw config directory.
- [x] Validate idempotent install behavior.
- [x] Validate drift or missing-file detection where practical.

## Phase 5 — Reporting

- [x] Update README quick start to reflect current OpenCode/OpenClaw install paths.
- [x] Record test evidence in `docs/test-report.md`.
- [x] Record implementation summary in `docs/report-walkthrough.md`.
- [x] Summarize remaining risks or follow-ups.
