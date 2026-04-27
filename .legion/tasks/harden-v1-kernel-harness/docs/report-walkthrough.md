# report-walkthrough: harden-v1-kernel-harness

## Mode

implementation

## Reviewer summary

This change hardens the current LegionMind v1 kernel surface without expanding the runtime matrix. It converges current truth out of stale root `docs/`, aligns OpenClaw setup lifecycle semantics with OpenCode through a shared setup core, adds focused regression coverage, and updates user-facing README/benchmark documentation to match the current runtime boundary.

## What changed

### 1. Docs deletion and current-truth convergence

- Deleted stale root docs called out by the RFC: `docs/benchmark.md`, `docs/legionmind-usage.md`, `docs/skill-split-plan.md`, and `docs/legion-context-management-raw-wiki-schema.md`.
- Updated README references so current truth is carried by README, `.legion/wiki`, skills, and `vibe-harness-bench/README.md` rather than the deleted root docs.
- Verification evidence: `docs/test-report.md` reports a passing stale-reference check across README, package metadata, benchmark README, and current wiki surfaces.

### 2. OpenClaw parity and shared setup core

- Added `scripts/lib/setup-core.ts` as the runtime-agnostic shared lifecycle core for install/verify/rollback/uninstall behavior.
- Reduced `scripts/setup-opencode.ts` and `scripts/setup-openclaw.ts` to runtime adapters that provide argument parsing, source enumeration, managed-root/state declarations, and OpenClaw-specific config handling.
- OpenClaw now has parity with OpenCode for rollback, uninstall, managed manifests, strict managed-file verification, backup-index semantics, and `--to` rollback selection.
- OpenClaw `openclaw.json` remains conservatively handled: install appends `skills.load.extraDirs`; verify treats config compatibility as warning-only; rollback/uninstall do not own or delete user config.
- Evidence: `docs/test-report.md` includes static delegation checks; `docs/review-change.md` confirms prior blockers around shared lifecycle core and destructive path hardening are closed.

### 3. Regression suite

- Added focused `node:test` regression tests under `tests/regression/`:
  - `setup-lifecycle.test.ts`
  - `legion-cli.test.ts`
  - `skill-surface.test.ts`
- Added `package.json` regression/setup script surface including `npm run test:regression` and OpenClaw rollback/uninstall entries.
- Coverage includes OpenCode/OpenClaw lifecycle, rollback `--to`, uninstall drift safe-skip/force, tampered manifest/backup rejection, symlinked managed-root refusal, invalid backup-index blocking, required skill presence, OpenClaw skill superset behavior, and thin CLI filesystem invariants.
- Evidence: `docs/test-report.md` reports `npm run test:regression` PASS with 10/10 tests and no skipped tests.

### 4. README/runtime boundary and benchmark note

- README status now reflects `可运行内核 / v1 前硬化中`.
- README limits maintained setup/runtime support to OpenCode and OpenClaw and removes Claude/Codex/Cursor/Gemini generalized runtime claims.
- README keeps the CLI boundary thin and does not introduce a runtime orchestrator or runtime adapter layer.
- `vibe-harness-bench/README.md` now acts as the benchmark current-truth location rather than delegating through deleted `docs/benchmark.md`.
- Evidence: `docs/test-report.md` reports a passing README runtime-boundary and thin-CLI static check.

## Verification and review evidence

- `docs/review-rfc.md`: PASS. The RFC was reviewed as implementable, bounded, rollback-aware, and aligned with the OpenCode/OpenClaw-only scope.
- `docs/test-report.md`: PASS. Final verification passed, including `npm run test:regression` with 10/10 tests and additional static checks for setup-core ownership, destructive path coverage, repo-local temp roots, stale docs references, README runtime boundary, and thin CLI behavior.
- `docs/review-change.md`: PASS. Security-aware review found no blocking issues and confirmed shared lifecycle core, destructive path hardening, regression evidence, scope compliance, and conservative OpenClaw config semantics.

## Known limitations / non-goals

- CLI remains a thin filesystem tool; no workflow phase engine, runtime orchestrator, or agent runtime adapter was added.
- No repo hygiene cleanup was attempted, including old worktrees, superpowers, or unrelated repository maintenance.
- Runtime support was not expanded beyond OpenCode and OpenClaw.
- OpenClaw `openclaw.json` is not managed as an owned rollback/uninstall asset; this is intentional to avoid deleting or rewriting user config.

## Reviewer entry points

1. Start with `docs/review-change.md` for the final review verdict.
2. Use `docs/test-report.md` for command-level evidence and exact passing test output.
3. Use `docs/rfc.md` and `docs/review-rfc.md` to compare implementation scope against the approved design gate.
