# Report Walkthrough: Fix OpenClaw setup install

## Summary

Mode: implementation.

- Reworked `scripts/setup-openclaw.ts` from a config-only helper into a managed OpenClaw skills installer.
- The installer now copies or symlinks repository skills into `~/.openclaw/skills`, records managed ownership under `~/.openclaw/.legionmind/`, preserves existing user-owned files unless `--force` is used, and still updates `skills.load.extraDirs` by default.
- `npm run openclaw:verify` now runs strict verification so missing, unmanaged, or checksum-drifted skill files are detected.

## Files changed

- `scripts/setup-openclaw.ts`
  - Added managed-file manifest, backup index, safe overwrite decisions, dynamic skill discovery, copy/symlink install strategies, and strict verification.
  - Kept `--dry-run`, `--json`, `--config-dir`, and `--skills-dir`; added `--force`, `--strict`, `--strategy`, `--openclaw-home`, and `--no-extra-dir`.
- `package.json`
  - Updated `openclaw:verify` to invoke strict verification.
- `README.md`
  - Updated Quick Start to document OpenCode and OpenClaw install/verify paths, managed state locations, repository-local isolated test dirs, and OpenClaw `--force` / `--no-extra-dir` options.
- `.legion/tasks/fix-openclaw-setup-install/**`
  - Added task contract and verification/report evidence.

## Behavior notes

- Default install target is `~/.openclaw/skills/<skill>/`, matching OpenClaw's documented managed/local skills root.
- Default config path remains `~/.openclaw/openclaw.json`; by default it also includes the source `skills/` directory in `skills.load.extraDirs` for compatibility with the previous script behavior.
- User-owned conflicts are safe-skipped by default and require `--force` to back up and overwrite.

## Verification

See `docs/test-report.md`. Targeted checks passed for fresh install, strict verify, idempotent reinstall, drift detection, and force repair.

## Remaining risks

- The script still parses `openclaw.json` as strict JSON, matching the previous implementation. If OpenClaw accepts JSON5 configs, supporting JSON5 would require a separate design decision or dependency.
- Live OpenClaw discovery was not executed; the change follows documented filesystem roots and verifies the installed files directly.
