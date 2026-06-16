## Summary

- Add a manual GitHub Actions workflow to publish `lgmind` to npm via trusted publishing / OIDC.
- Keep the workflow release-only and tokenless: `workflow_dispatch`, `contents: read`, `id-token: write`.
- Run regression and package dry-run checks before `npm publish --access public`.

## Verification

- `git diff --check` — PASS
- `npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run test:regression` — PASS, 15/15 tests
- `npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run pack:dry-run` — PASS, `lgmind@0.2.0`

## Post-merge

- Configure npm trusted publisher for `Thrimbda/legion-mind` + `publish-npm.yml` with publish permission.
- Dispatch the `Publish npm package` workflow from `master`.
