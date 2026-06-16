# Test report: publish `lgmind@0.1.0`

## Summary

PASS for repository release configuration and pre-publish checks.

Npm auth is now available, `lgmind` still returns registry `E404` before publish, regression passed, and package dry-run produced `lgmind@0.1.0` with executable bin mode.

## Commands

### Package availability

```bash
npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm view lgmind --json --registry=https://registry.npmjs.org || true
```

Result: expected `E404 Not Found`, meaning `lgmind` was not visible in the public registry at check time.

### Npm auth

```bash
npm_config_cache=.cache/npm npm_config_update_notifier=false npm whoami --registry=https://registry.npmjs.org
```

Result: BLOCKED.

```text
ENEEDAUTH: This command requires you to be logged in.
```

After user completed `npm login`, the auth check was rerun:

```bash
npm_config_cache=.cache/npm npm_config_update_notifier=false npm whoami --registry=https://registry.npmjs.org
```

Result: PASS. Authenticated npm user: `thrimbda`.

### Regression suite

```bash
npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run test:regression
```

Result: PASS, 13/13 tests.

Evidence highlights:

- `lgmind npm bin exposes help and version`
- `lgmind npm bin runs lifecycle in isolated directories`
- `npm dry-run package includes CLI and install assets only`
- Existing OpenCode/OpenClaw lifecycle and skill-surface regression tests remain green.

### Npm package dry-run

```bash
npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run pack:dry-run
```

Result: PASS.

Evidence highlights:

- Package id: `lgmind@0.1.0`
- Included `bin/setup-opencode.js`, `.opencode/agents/legion.md`, setup core files, skills assets, README, LICENSE, and package metadata.
- `bin/setup-opencode.js` was corrected to executable mode `493` (`0755`) and pack dry-run was rerun successfully.
- The regression test asserts `package.json#bin.lgmind`, `package.json#bin.setup-opencode`, and `publishConfig.access = public`.

### Pre-commit rerun

After walkthrough/wiki updates, the release preflight was rerun with repo-local npm cache:

- `npm view lgmind --json --registry=https://registry.npmjs.org || true` — expected `E404`.
- `npm whoami --registry=https://registry.npmjs.org` — PASS as `thrimbda`.
- `npm run test:regression` — PASS, 13/13 tests.
- `npm run pack:dry-run` — PASS, package id `lgmind@0.1.0`, wrapper mode `493`.

## Why these commands

- Registry availability and auth checks are mandatory publish preflights.
- The regression suite proves the renamed package/bin surface did not break installer lifecycle behavior.
- `npm pack --dry-run --json` directly checks the publish file set without publishing.

## Failures / skipped

- Initial npm auth check failed with `ENEEDAUTH`; user logged in and the follow-up auth check passed.
- No current blockers in repository verification.
- After PR #19 merged and the main workspace was refreshed to `origin/master`, final pre-publish checks passed: `npm view lgmind` returned expected `E404`, `npm whoami` passed as `thrimbda`, and `npm run pack:dry-run` produced `lgmind@0.1.0`.
- The first publish attempt reached npm but was blocked by `EOTP`; the user completed the one-time-password publish step.

## Published state

```bash
npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm view lgmind version dist-tags.latest --registry=https://registry.npmjs.org
```

Result: PASS.

```text
version = '0.1.0'
dist-tags.latest = '0.1.0'
```

Final state: `lgmind@0.1.0` is published on npm with the `latest` dist-tag.
