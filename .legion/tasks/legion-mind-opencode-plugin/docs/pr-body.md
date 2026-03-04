## What
This PR delivers a release-ready one-command installation path for LegionMind in OpenCode, centered on `scripts/setup-opencode.ts` plus packaging/docs updates.
It adds installer lifecycle commands (`install/verify/rollback/uninstall`), managed state tracking, safe-overwrite behavior, and strict readiness verification.

## Why
The previous workflow relied on clone + manual setup and was not distribution-friendly for new users.
Given Medium risk (user local config writes + public install surface), we followed the required convergence path: feasibility research first, then RFC + review-rfc gate, then implementation.
This keeps rollout low-interruption while preserving rollback and safety boundaries.

## How
Implemented command-mode installer orchestration in `scripts/setup-opencode.ts`, including atomic state writes, backup index, managed-file manifest, and guarded rollback/uninstall path validation.
Updated `package.json` with `bin` and `opencode:*` scripts to standardize local invocation and future publish mapping.
Updated `README.md` with install/verify/rollback runbook, safe-overwrite semantics, whitelist asset scope, and strict verification expectations.

## Testing
- Report: `.legion/tasks/legion-mind-opencode-plugin/docs/test-report.md`
- Result: PASS (6/6 scenarios), including dry-run no-write, strict READY gate, safe-overwrite skip behavior, force+rollback restoration, symlink idempotency, and tampered-state precheck rejection.

## Risk / Rollback
- Risk level: Medium.
- Main risks: local file overwrite mistakes, state drift impact on rollback symmetry, mixed copy/symlink operational confusion.
- Mitigations: default safe-overwrite, managed-root boundary checks, strict verify gate, backup-index driven rollback.
- Rollback: `node scripts/setup-opencode.ts rollback` (or `--to <backup-id>`); code-level rollback by reverting this PR.

## Links
- Task Brief: `.legion/tasks/legion-mind-opencode-plugin/docs/task-brief.md`
- RFC: `.legion/tasks/legion-mind-opencode-plugin/docs/rfc.md`
- RFC Review: `.legion/tasks/legion-mind-opencode-plugin/docs/review-rfc.md`
- Code Review: `.legion/tasks/legion-mind-opencode-plugin/docs/review-code.md`
- Security Review: `.legion/tasks/legion-mind-opencode-plugin/docs/review-security.md`
- Walkthrough: `.legion/tasks/legion-mind-opencode-plugin/docs/report-walkthrough.md`
