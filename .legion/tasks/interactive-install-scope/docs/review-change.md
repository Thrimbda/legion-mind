# Change review: interactive-install-scope

## Verdict

PASS.

## Scope compliance

- In scope: `lgmind` product-level CLI now supports interactive install/setup prompts for runtime and install scope.
- In scope: explicit `--scope project|global`, plus `--interactive` and `--no-interactive` controls.
- In scope: project/global path mapping for OpenCode and OpenClaw without changing lower-level setup lifecycle semantics.
- In scope: README/help/test/package version updates for `0.3.0`.
- No new agent runtime, dependency, token, or alternate publish path was introduced.

## Correctness

- TTY/default interactive behavior is implemented for install-like commands (`install`, `setup`) via `shouldPrompt`.
- Non-TTY invocations do not hang and still default to deterministic `opencode + global` unless flags override them.
- `--scope project` maps to project-local paths:
  - OpenCode: `.legionmind/opencode/config` and `.legionmind/opencode/home`
  - OpenClaw: `.legionmind/openclaw`
- `--scope global` leaves lower-level setup script defaults intact.
- `--agent` / `--runtime` and `--scope` are stripped before dispatch so lower-level scripts only receive supported path/runtime lifecycle flags.
- Generated JS runtime was refreshed from TS source and package version is `0.3.0`.

## Verification evidence reviewed

- `docs/test-report.md` records:
  - `npm run build:runtime-js`: PASS
  - `npm run test:regression`: PASS, 18/18
  - `npm run pack:dry-run`: PASS, `lgmind@0.3.0`, 62 packed entries
- Regression covers:
  - interactive runtime + project-scope prompt flow
  - explicit project scope mapping for OpenCode/OpenClaw
  - existing non-interactive and installed package bin execution paths

## Security / safety lens

Applied because install scope changes filesystem write targets.

- Project mode defaults to current working directory under `.legionmind/`, avoiding surprise writes to global user config.
- Global mode is explicit in prompt and preserves existing behavior.
- Tests use `--dry-run` and isolated repo-local cache/temp roots.
- No change to managed-file containment, backup, rollback, uninstall, or symlink safety checks.
- No credentials or npm tokens added.

## Blocking findings

None.

## Non-blocking notes

- `--interactive` is also useful for deterministic prompt tests with piped stdin; true TTY behavior still uses `readline`.
- The `selectScope` parameter list keeps `rawCommand` for semantic clarity, though prompting eligibility is already computed before the call.
