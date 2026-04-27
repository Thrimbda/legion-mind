# Log: Fix OpenClaw setup install

## 2026-04-25

- User confirmed the task contract and asked why `ledger.csv` would be touched.
- Clarified that `ledger.csv` is not in scope and should not be manually edited; the earlier status-tool attempt failed because `.legion/config.json` is absent and did not establish a need to write `ledger.csv`.
- Created worktree `.worktrees/fix-openclaw-setup-install` on branch `fix-openclaw-setup-install` from `origin/master`.
- Materialized the task contract and phase checklist.
- Implemented managed OpenClaw skill installation by adapting the `setup-opencode.ts` manifest, backup, safe overwrite, and strict verify patterns to `scripts/setup-openclaw.ts`.
- Updated `package.json` so `npm run openclaw:verify` runs strict verification.
- Ran isolated install/verify checks under repository-local temp/cache directories; results are recorded in `docs/test-report.md`.
- Updated README quick start so it documents current OpenCode npm scripts, current OpenClaw managed local skills installation, managed state locations, repository-local isolated targets, and safe `--force` / `--no-extra-dir` behavior.
