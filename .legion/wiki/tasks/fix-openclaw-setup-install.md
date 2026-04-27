# Task Summary: fix-openclaw-setup-install

## Status

- Implementation mode: completed in worktree `fix-openclaw-setup-install`.
- Review verdict: PASS (`.legion/tasks/fix-openclaw-setup-install/docs/review-change.md`).

## Problem

`setup-openclaw.ts` only updated `~/.openclaw/openclaw.json` with `skills.load.extraDirs`, which made setup depend on the repository checkout path and left verification at path/config presence level.

## Outcome

- `setup-openclaw.ts` now installs LegionMind skills into OpenClaw's local managed root: `~/.openclaw/skills/<skill>/`.
- It records managed ownership/checksums under `~/.openclaw/.legionmind/` and uses strict verify to detect missing, unmanaged, type-mismatched, symlink-drifted, or checksum-drifted files.
- It safe-skips unmanaged or modified files by default and supports `--force` to back up and overwrite.
- It still updates `skills.load.extraDirs` by default for compatibility with the previous OpenClaw setup behavior.

## Changed files

- `scripts/setup-openclaw.ts`
- `package.json`
- `README.md`
- `.legion/tasks/fix-openclaw-setup-install/**`

## Verification

- Fresh isolated install + strict verify: PASS.
- Idempotent reinstall: PASS.
- Checksum drift detection: expected FAIL.
- Force repair after drift + strict verify: PASS.

Raw evidence: `.legion/tasks/fix-openclaw-setup-install/docs/test-report.md`.

## Durable conclusion

For OpenClaw skill-pack installation, prefer local skills root installation with a managed manifest and strict verification; keep `skills.load.extraDirs` as compatibility/diagnostic support rather than the only installation mechanism.
