## Summary

- Fix `lgmind@0.2.0` npm bin failure where Node refuses to strip TypeScript under `node_modules`.
- Publish runnable JS runtime files and point bin wrappers at `.js` instead of `.ts`.
- Add installed-package regression that executes copied package files under `node_modules/lgmind`.
- Bump package version to `0.2.1`.

## Verification

- `npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run build:runtime-js` — PASS
- `npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run test:regression` — PASS, 16/16
- `npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run pack:dry-run` — PASS, `lgmind@0.2.1`

## Notes

- This directly addresses the reported `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING` from `npx lgmind install`.
- After merge, dispatch `publish-npm.yml` from `master` to publish `lgmind@0.2.1`.
