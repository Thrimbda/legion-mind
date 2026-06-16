# Walkthrough: release lgmind 0.2.0

Mode: implementation release task.

## What changed

- Bumped `package.json` from `0.1.0` to `0.2.0`.
- Added task-local release notes and release evidence for `lgmind@0.2.0`.

## Why

PR #21 already merged the user-facing setup UX improvements, but npm still points `lgmind@latest` at `0.1.0`. This release makes the merged CLI UX available to npm users.

## Release contents

`0.2.0` is intended to ship:

- product-level `lgmind` CLI entrypoint
- `lgmind setup --agent opencode|openclaw`
- `--runtime` alias for `--agent`
- interactive TTY runtime selection for `lgmind setup`
- quiet default text output with `--verbose` and `--json` escape hatches
- existing `setup-opencode` compatibility alias

## Verification

- Regression suite: PASS, 15/15 tests.
- Package dry run: PASS, `lgmind@0.2.0`, `lgmind-0.2.0.tgz`, 61 packed entries.
- Pre-publish npm registry check: current `version` and `dist-tags.latest` are still `0.1.0`.

See `docs/test-report.md` for command-level evidence.

## Review status

- Change review: PASS.
- Security/supply-chain lens: applied; no code trust-boundary changes, publish surface reviewed through dry-run pack output.

See `docs/review-change.md` for details.

## Release sequence

1. Merge release PR to `master`.
2. Cleanup the release worktree and refresh the main workspace to `origin/master`.
3. Run `npm publish --access public` from the refreshed `master` baseline.
4. Verify `npm view lgmind version dist-tags.latest` reports `0.2.0`.
