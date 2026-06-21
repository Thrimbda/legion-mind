# Walkthrough: interactive install scope selection

Mode: implementation release task.

## What changed

- `lgmind install` and `lgmind setup` now use a guided installer in interactive mode.
- The guided flow asks for:
  - agent runtime: OpenCode or OpenClaw
  - install scope: project or global
- Added explicit flags:
  - `--scope project|global`
  - `--interactive`
  - `--no-interactive`
- Project scope maps to current-project local roots:
  - OpenCode: `.legionmind/opencode/config` and `.legionmind/opencode/home`
  - OpenClaw: `.legionmind/openclaw`
- Non-TTY/scripted invocations remain deterministic and non-interactive.
- Package version bumped to `0.3.0`.

## Why

The published `lgmind@0.2.1` fixed runnable npm bins, but `npx lgmind install` still behaved like a non-interactive OpenCode install. The requested first-run behavior is an installer flow that explicitly asks project vs global installation.

## Compatibility

- Existing scripted usage remains non-interactive.
- Existing lower-level setup scripts and managed-file lifecycle semantics are unchanged.
- `setup-opencode` remains a direct OpenCode alias.
- `--json` disables prompts and remains automation-friendly.

## Verification

- `npm run build:runtime-js`: PASS
- `npm run test:regression`: PASS, 18/18
- `npm run pack:dry-run`: PASS, `lgmind@0.3.0`, 62 packed entries

See `docs/test-report.md` for command-level evidence.

## Review status

- Change review: PASS.
- Filesystem safety lens applied for project/global install target changes.

See `docs/review-change.md`.

## Release path

1. Merge the PR to `master`.
2. Cleanup worktree and refresh main workspace.
3. Dispatch `publish-npm.yml` trusted-publishing workflow.
4. Verify npm `version` / `latest` are `0.3.0`.
5. Run real `npx lgmind@latest install` smoke.
