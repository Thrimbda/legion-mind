# Test report: `lgmind` setup UX

## Summary

PASS.

The regression suite now covers product-level `lgmind` runtime selection, OpenClaw dispatch, quiet default output, verbose/json escape hatches, and npm package contents. Targeted smoke checks also confirmed setup commands route to both supported runtimes without noisy OK event logs in default text mode.

## Commands

### Targeted CLI smoke

```bash
node bin/lgmind.js setup --agent opencode --dry-run --config-dir .cache/verify-opencode-config --opencode-home .cache/verify-opencode-home
node bin/lgmind.js setup --agent openclaw --dry-run --config-dir .cache/verify-openclaw-home --openclaw-home .cache/verify-openclaw-home --no-extra-dir
node bin/lgmind.js verify --agent opencode --verbose --config-dir .cache/verify-opencode-config --opencode-home .cache/verify-opencode-home || true
node bin/lgmind.js verify --agent opencode --json --config-dir .cache/verify-opencode-config --opencode-home .cache/verify-opencode-home || true
```

Result: PASS for routing and output-mode evidence.

Evidence highlights:

- Default setup output is concise:
  - `OK_INSTALL opencode copied=42 linked=0 skipped=0 warnings=0 failures=0`
  - `OK_INSTALL openclaw copied=45 linked=0 skipped=0 warnings=0 failures=0`
- Default setup output did not print per-file `OK_SYNC` lines.
- `--verbose` printed detailed warning/check event lines plus final summary.
- `--json` printed structured event JSON lines plus final result JSON.

The verify smoke intentionally used dry-run install roots, so warnings about missing manifest/files are expected and useful for proving warnings remain visible.

### Regression suite

```bash
npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run test:regression
```

Result: PASS, 15/15 tests.

Evidence highlights:

- `lgmind npm bin exposes help and version`
- `lgmind npm bin runs lifecycle in isolated directories`
- `lgmind selects OpenClaw runtime non-interactively`
- `default text output is quiet and verbose/json keep details`
- Existing OpenCode/OpenClaw lifecycle, rollback/uninstall safety, skill-surface, and Legion CLI filesystem invariant tests remain green.

### Package dry-run

```bash
npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run pack:dry-run
```

Result: PASS.

Evidence highlights:

- Package id remains `lgmind@0.1.0`.
- Package includes `bin/lgmind.js`, `bin/setup-opencode.js`, `scripts/lgmind.ts`, `scripts/setup-opencode.ts`, `scripts/setup-openclaw.ts`, `scripts/lib/setup-core.ts`, README, LICENSE, OpenCode agents, and skills.
- Package excludes `.legion/`, `.worktrees/`, `tests/`, and `.cache/` by regression assertion.
- Bin modes are executable for `bin/lgmind.js` and `bin/setup-opencode.js` (`493` in npm dry-run output).

## Why these commands

- Targeted smoke proves the new CLI UX contract directly: setup routing, OpenCode/OpenClaw runtime selection, quiet default text mode, and detailed output escape hatches.
- Regression proves the new behavior without losing existing installer lifecycle and safety invariants.
- Pack dry-run proves the npm-visible package surface contains the newly required OpenClaw and aggregator files.

## Failures / skipped

- No blocking failures.
- Interactive TTY prompt behavior is represented by code path and help/docs; automated regression uses non-interactive `--agent` paths to avoid CI hangs.
- No npm publish was run; publishing is out of scope for this task.
