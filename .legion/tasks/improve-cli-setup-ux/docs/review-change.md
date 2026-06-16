# review-change: `lgmind` setup UX

## Decision

PASS.

## Blocking findings

None.

## Scope compliance

PASS.

- Added product-level `lgmind` aggregator (`bin/lgmind.js`, `scripts/lgmind.ts`) with `setup`, `--agent/--runtime opencode|openclaw`, TTY prompt fallback, and non-interactive defaults.
- Preserved `setup-opencode` as the OpenCode-only alias.
- Added quiet default text output, `--verbose` for detailed text events, and preserved `--json` structured event output.
- Added OpenClaw to npm-visible package surface via package allowlist.
- Updated README and regression tests for setup/runtime selection and output modes.
- Did not add per-agent subset selection, new runtimes, release publishing, or installer lifecycle redesign.

## Correctness / maintainability

PASS.

- The aggregator dispatches to runtime scripts with `spawnSync` argument arrays, not shell strings.
- Runtime values are normalized and validated; missing values and conflicting `--agent` / `--runtime` selections error instead of silently choosing the wrong runtime.
- TTY prompting is limited to `setup` without explicit runtime and requires both stdin/stdout TTY, so CI/non-interactive runs cannot hang.
- The shared reporter change is centralized in `scripts/lib/setup-core.ts`, avoiding duplicated filtering logic.
- Text quieting suppresses only non-actionable `OK_*` details; warnings and errors still print by default.

## Security lens

Security lens applied because this change routes user-controlled CLI input to runtime scripts and expands npm package-visible executable behavior.

PASS.

- Runtime dispatch does not invoke a shell and only allows the two supported runtime constants.
- The change does not alter managed-root containment, manifest validation, backup validation, rollback, or uninstall safety logic.
- No secrets, tokens, credentials, or auth material are introduced.
- Package dry-run verification confirms task docs, worktrees, tests, and cache remain excluded from npm output.

## Verification evidence reviewed

- Targeted CLI smoke for `lgmind setup --agent opencode` and `lgmind setup --agent openclaw`.
- `--verbose` and `--json` output-mode smoke.
- `npm run test:regression` — PASS, 15/15 tests.
- `npm run pack:dry-run` — PASS, package includes aggregator/OpenClaw files and executable bins.

## Non-blocking suggestions

- Future release work should bump/package-publish in a separate release task; this task intentionally does not publish.
- If users later ask for per-agent subset selection, treat it as a separate design problem because it changes verification semantics.
