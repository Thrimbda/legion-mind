# review-change: setup-opencode npm CLI

## Decision

PASS.

## Blocking findings

None.

## Scope compliance

PASS. The implementation stays within the approved scope:

- Package metadata and npm publish file surface were updated in `package.json`.
- A portable `bin/setup-opencode.js` wrapper was added for the npm executable.
- `scripts/setup-opencode.ts` gained help/version and clearer argument handling without changing managed install/verify/rollback/uninstall core semantics.
- README now documents `npx setup-opencode@latest`, global install, local development usage, and the non-publish boundary.
- Regression tests now cover wrapper help/version, wrapper lifecycle, and `npm pack --dry-run` contents.
- Task docs record RFC, RFC review, and verification evidence.

## Correctness / maintainability

PASS.

- The wrapper uses a plain Node shebang and resolves the TypeScript implementation relative to the installed package, which matches npm package layout expectations.
- The existing installer core remains unchanged, reducing regression risk for managed manifest and rollback safety.
- The package dry-run test protects the highest-risk publish issue: accidentally omitting dot-directory assets or setup core files.
- The README clearly says actual `npm publish` is not performed, avoiding overclaiming release state.

## Security lens

Security lens applied lightly because the installer writes to user-selected filesystem paths and package publishing changes what code/assets users may execute through `npx`.

PASS. No new exploitable trust-boundary issue found:

- The wrapper executes the repository-local `scripts/setup-opencode.ts` resolved from the package directory, not a user-controlled command string.
- Existing path safety, managed root, backup, rollback, and uninstall checks remain in `setup-core.ts` unchanged.
- Package contents are constrained by `files` and verified not to include `.legion/`, `.worktrees/`, `tests/`, or `.cache/` artifacts.

## Verification evidence reviewed

- `npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run test:regression` — PASS, 13/13 tests.
- `npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run pack:dry-run` — PASS, package id `setup-opencode@0.1.0`, required CLI/install assets present.

## Non-blocking suggestions

- Before the actual npm publish, a maintainer should decide whether to keep the public package name unscoped (`setup-opencode`) or switch to an organization scope; this is not blocking for the implementation because the bin wrapper remains valid either way.
