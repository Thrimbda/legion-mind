# Review Change: Fix OpenClaw setup install

## Verdict

PASS.

## Scope check

- In scope: `scripts/setup-openclaw.ts`, `package.json`, README quick start documentation, and task-local `.legion` evidence.
- No OpenClaw upstream/runtime files were changed.
- No manual `ledger.csv` edit was introduced.

## Correctness review

- Install now targets OpenClaw's documented managed/local skill root (`<openclawHome>/skills/<skill>/`) and dynamically discovers repository skills containing `SKILL.md`.
- Managed manifest and checksum verification are based on expected source files, not on manifest-driven traversal, matching the safer `setup-opencode.ts` pattern.
- Existing unmanaged or locally modified files are safe-skipped unless `--force` is provided; force creates backups before overwrite.
- Config validation now occurs before file sync, avoiding partial unmanaged copies when `openclaw.json` is invalid.

## Security lens

Applied because the change writes files into user-controlled local application directories. No exploitable trust-boundary issue found:

- Target writes are constrained under `<openclawHome>/skills` before sync.
- Secret-like paths and common sensitive filenames are skipped during recursive copy.
- The installer does not execute installed skill content; it only copies/symlinks files and verifies checksums.

## Verification evidence

See `docs/test-report.md` for fresh install, strict verify, idempotent install, drift detection, and force repair evidence.

## Non-blocking notes

- The script still expects strict JSON for `openclaw.json`, consistent with the previous implementation. JSON5 support can be considered separately if OpenClaw configs commonly use comments/trailing commas.
