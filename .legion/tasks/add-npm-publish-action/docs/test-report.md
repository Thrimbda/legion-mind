# Test report: add-npm-publish-action

## Summary

PASS for local release-command verification. The new workflow uses the same regression and pack dry-run commands that pass locally for `lgmind@0.2.0`; final OIDC publish can only be verified after the workflow is merged and dispatched from GitHub.

## Commands

### Diff whitespace check

```bash
git diff --check
```

- Result: PASS.

### Regression suite

```bash
npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run test:regression
```

- Result: PASS.
- Evidence: Node test runner reported 15 tests, 15 pass, 0 fail.

### Package dry run

```bash
npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run pack:dry-run
```

- Result: PASS.
- Evidence: dry run produced package metadata for `lgmind@0.2.0` with filename `lgmind-0.2.0.tgz` and 61 packed entries.

## Workflow shape checked

Manual readback of `.github/workflows/publish-npm.yml` confirms:

- trigger: `workflow_dispatch`
- permissions: `contents: read`, `id-token: write`
- runner: `ubuntu-latest`
- setup: `actions/checkout@v6`, `actions/setup-node@v6`, Node `24.x`, npm registry URL `https://registry.npmjs.org`, package-manager cache disabled
- verification steps: `npm run test:regression`, `npm run pack:dry-run`
- publish step: `npm publish --access public`

## Skipped / pending

- GitHub-side workflow execution is pending until this PR is merged to the default branch.
- npm trusted publisher configuration is pending until after merge or until npm accepts configuration for the workflow filename.
