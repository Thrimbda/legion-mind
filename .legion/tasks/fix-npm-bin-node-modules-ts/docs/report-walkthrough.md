# Walkthrough: fix npm bin TypeScript runtime failure

Mode: implementation hotfix.

## What broke

`lgmind@0.2.0` publishes bin wrappers that jump into `scripts/*.ts` under `node_modules`. Node refuses to type-strip files under `node_modules`, so `npx lgmind install` fails with `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING` before CLI dispatch starts.

## What changed

- `bin/lgmind.js` now executes `scripts/lgmind.js` with plain Node.
- `bin/setup-opencode.js` now executes `scripts/setup-opencode.js` with plain Node.
- Added published JS runtime files:
  - `scripts/lgmind.js`
  - `scripts/setup-opencode.js`
  - `scripts/setup-openclaw.js`
  - `scripts/lib/setup-core.js`
- Added `scripts/build-runtime-js.mjs`, `build:runtime-js`, and `prepack` to regenerate JS runtime from TS source before pack/publish.
- Updated package allowlist to publish JS runtime files instead of TS runtime files.
- Bumped package version to `0.2.1`.

## Regression added

New test: `packed npm package bins run from node_modules without TypeScript stripping`.

It copies the dry-run package files into a temporary `node_modules/lgmind` layout and executes:

- `lgmind --version`
- `setup-opencode --help`
- `lgmind install --dry-run ...`
- `lgmind setup --agent opencode --dry-run ...`
- `lgmind setup --agent openclaw --dry-run ...`

This is the key coverage missing from `0.2.0`: package inspection alone did not prove installed-package execution.

## Verification

- `npm run build:runtime-js`: PASS
- `npm run test:regression`: PASS, 16/16
- `npm run pack:dry-run`: PASS, `lgmind@0.2.1`, 62 packed entries
- runtime JS grep: no `.ts` runtime references and no `--experimental-strip-types`

See `docs/test-report.md` for command-level evidence.

## Review status

- Change review: PASS.
- Supply-chain lens applied: no new dependencies, no credentials, explicit package allowlist preserved.

See `docs/review-change.md`.

## Release path

1. Merge hotfix PR.
2. Cleanup worktree and refresh main workspace.
3. Dispatch `publish-npm.yml` trusted-publishing workflow from `master`.
4. Verify npm `version` and `dist-tags.latest` are `0.2.1`.
