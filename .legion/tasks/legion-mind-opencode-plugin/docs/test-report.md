# Test Report

## Command
`python3 - <<'PY'  # isolated harness invoking node scripts/setup-opencode.ts for 6 regression cases`

## Result
PASS

## Summary
- Covered 6/6 requested scenarios in isolated temp dirs via `--config-dir` and `--opencode-home`.
- `install --dry-run` returned `OK_INSTALL` and did not create target/state files.
- `install` + `verify --strict` returned `READY` with exit code 0.
- `safe-overwrite` behaved correctly for both `unmanaged-existing` and `user-modified` (`W_SAFE_SKIP`).
- `--force` overwrite + `rollback` worked: forced install restored source content, rollback restored pre-force modified content.
- Symlink strategy second install emitted `same-content` skip and did not emit `user-modified`; tampered rollback/uninstall state both failed with `E_PRECHECK`.

## Failures (if any)
- None.

## Notes
- why this command: CI only runs OpenCode action trigger and has no dedicated regression test job; `package.json` provides command-level scripts, so direct `node scripts/setup-opencode.ts ... --json` gives the most accurate and lowest-cost coverage for install/verify/rollback/uninstall behaviors.
- alternatives considered: `npm run opencode:*` (less flexible for multi-case isolated paths), adding a formal test runner (`npm test`/`make test`) (not currently present in repo).
