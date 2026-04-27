# Test Report: Fix OpenClaw setup install

## Scope

Validated `scripts/setup-openclaw.ts` after changing it from config-only setup to managed OpenClaw skill installation plus strict integrity verification.

## Commands

1. Direct isolated install:

   ```bash
   node --experimental-strip-types scripts/setup-openclaw.ts install --config-dir .tmp/openclaw-home --json
   ```

   Result: PASS. Installed 39 skill files into an isolated OpenClaw home, wrote `openclaw.json`, and emitted `OK_INSTALL`.

2. Package strict verify:

   ```bash
   npm run openclaw:verify -- --config-dir .tmp/openclaw-home --json
   ```

   Result: PASS. Emitted `READY` after checking `skills.load.extraDirs`, managed manifest, and all installed skill file checksums. npm printed `Unknown env config "tmp"` because the test passed `--config-dir` through npm; the script still received the argument and succeeded.

3. Idempotent direct install:

   ```bash
   node --experimental-strip-types scripts/setup-openclaw.ts install --config-dir .tmp/openclaw-home --json
   ```

   Result: PASS. Emitted `OK_INSTALL` with copied/linked `0` and skipped `39`, confirming same-content managed files are adopted/skipped rather than overwritten.

4. Drift detection:

   ```bash
   # Edited the isolated installed brainstorm/SKILL.md, then ran:
   node --experimental-strip-types scripts/setup-openclaw.ts verify --strict --config-dir .tmp/openclaw-home --json
   ```

   Result: EXPECTED FAIL. Verify emitted `E_VERIFY_CHECKSUM` for the drifted file and final `E_VERIFY_STRICT`.

5. Force repair after drift:

   ```bash
   node --experimental-strip-types scripts/setup-openclaw.ts install --config-dir .tmp/openclaw-home --force --json && \
     node --experimental-strip-types scripts/setup-openclaw.ts verify --strict --config-dir .tmp/openclaw-home --json
   ```

   Result: PASS. Install created a backup for the drifted file, recopied the source file, and strict verify emitted `READY`.

6. Fresh install after final ordering adjustment:

   ```bash
   node --experimental-strip-types scripts/setup-openclaw.ts install --config-dir .cache/openclaw-setup-test/openclaw-fresh --json && \
     node --experimental-strip-types scripts/setup-openclaw.ts verify --strict --config-dir .cache/openclaw-setup-test/openclaw-fresh --json
   ```

   Result: PASS. Confirms the final implementation still installs then verifies cleanly after moving config validation before file sync.

7. Documentation diff hygiene:

   ```bash
   git diff --check
   ```

   Result: PASS. No whitespace errors after updating README quick start and task/wiki documentation.

## Why these commands

- Isolated `--config-dir` runs prove the installer can create OpenClaw config, local skills, and managed state without touching the real `~/.openclaw`.
- Strict verify is the critical acceptance path because the old script only checked path/config presence.
- Idempotency and drift/force-repair checks cover the safety behavior borrowed from `setup-opencode.ts`.
- `git diff --check` covers the README-only follow-up because the executable install/verify behavior is already proven by the earlier commands.

## Skipped

- No live OpenClaw runtime was started; this change targets filesystem installation and verification, and OpenClaw's documented discovery roots are external behavior.
