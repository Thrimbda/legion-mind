## Summary

- Rework OpenClaw setup from config-only setup into managed skill installation under `~/.openclaw/skills`.
- Add safe overwrite behavior, managed manifests, backup tracking, and strict checksum verification.
- Keep `skills.load.extraDirs` compatibility, update `openclaw:verify` to run strict checks, and refresh README Quick Start.

## Verification

- Fresh isolated install + strict verify: PASS
- Idempotent reinstall: PASS
- Drift detection: expected FAIL with `E_VERIFY_CHECKSUM` / `E_VERIFY_STRICT`
- Force repair after drift + strict verify: PASS

See `.legion/tasks/fix-openclaw-setup-install/docs/test-report.md` for details.
