# Log: fix-npm-bin-node-modules-ts

## 2026-06-18

- User reported `npx lgmind install` failure for `lgmind@0.2.0`: `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING` for `node_modules/lgmind/scripts/lgmind.ts`.
- Root cause hypothesis captured in contract: published bin wrappers execute `.ts` runtime files from `node_modules`, which Node refuses to type-strip.
- Opened worktree `.worktrees/fix-npm-bin-node-modules-ts/` from `origin/master` on branch `legion/fix-npm-bin-node-modules-ts`.
- Patch release target set to `0.2.1`.
- During generated-runtime smoke testing, `setup-openclaw --help` fell through to default install and wrote managed assets to the default OpenClaw home; immediately cleaned with `setup-openclaw uninstall --force`.
- Implemented JS runtime packaging: bin wrappers now spawn `scripts/*.js` without `--experimental-strip-types`; `lgmind` JS dispatches runtime JS files.
- Added `scripts/build-runtime-js.mjs`, `build:runtime-js`, and `prepack` so runtime JS can be regenerated from TS source before pack/publish.
- Updated package allowlist to include JS runtime files and exclude TS runtime files from npm runtime surface.
- Added regression coverage that executes copied package files under `node_modules/lgmind` using plain Node.
- Verification passed: build runtime JS, regression suite 16/16, and package dry-run for `lgmind@0.2.1`.
- Change review passed with npm runtime supply-chain lens applied.
- Reviewer walkthrough and PR body were written under `docs/`.
- Wiki writeback added `tasks/fix-npm-bin-node-modules-ts.md` and promoted installed-package bin execution as required release coverage.
- PR #25 merged as `4e58ae1 fix: ship runnable lgmind npm bins (#25)`; hotfix worktree was cleaned and main workspace refreshed.
- GitHub Actions trusted-publishing run `27746769602` published `lgmind@0.2.1` successfully.
- Registry verification now reports `version = 0.2.1`, `dist-tags.latest = 0.2.1`, and versions `[0.1.0, 0.2.0, 0.2.1]`.
- Real `npx --yes lgmind@latest install --dry-run ...` smoke succeeded with `0.2.1` and `OK_INSTALL opencode`.
