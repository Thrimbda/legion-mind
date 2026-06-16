# review-change: publish `lgmind@0.1.0`

## Decision

PASS for repository release configuration.

## Blocking findings

None.

## Scope compliance

PASS.

- `package.json` now uses `name: "lgmind"`, keeps version `0.1.0`, adds `publishConfig` for public npm registry, and exposes both `lgmind` and `setup-opencode` bins.
- `scripts/setup-opencode.ts` help text leads with `lgmind` and keeps `setup-opencode` as an alias.
- README examples now use `npx lgmind@latest` and global `lgmind` commands.
- Regression tests assert the new package name, dual bin mapping, and public publish config.
- Task docs record the release contract, RFC, review, and pre-publish verification.

## Correctness / maintainability

PASS.

- Keeping a single wrapper for both bin names avoids duplicated CLI behavior.
- The previous package files allowlist remains intact, so `.legion/`, `.worktrees/`, `tests/`, and `.cache/` remain out of the npm package.
- The bin wrapper mode was corrected to `0755` and confirmed by `npm pack --dry-run` mode `493`.
- `npm view lgmind` still returns `E404` before publish, reducing package-name collision risk at review time.
- `npm whoami` now succeeds as `thrimbda`, so publish is not currently blocked by local auth.

## Security / release lens

Security and release lens applied because this change affects npm publishing, identity/auth state, and executable package contents.

PASS.

- No secrets or npm tokens were written to the repository.
- Npm cache/logs were kept under repo-local `.cache/npm` for command execution.
- Publish is sequenced after PR merge and final verification from refreshed `origin/master`, reducing the risk of publishing an unmerged branch state.
- The task explicitly treats post-publish rollback as a new-version remediation path, not a normal unpublish/reuse flow.

## Verification evidence reviewed

- `npm view lgmind --json --registry=https://registry.npmjs.org || true` — expected `E404` before publish.
- `npm whoami --registry=https://registry.npmjs.org` — PASS as `thrimbda` after user login.
- `npm run test:regression` — PASS, 13/13 tests.
- `npm run pack:dry-run` — PASS, package id `lgmind@0.1.0`, wrapper executable mode `493`.

## Non-blocking notes

- Actual publish has not happened yet and must be performed only after PR merge and final post-refresh verification.
