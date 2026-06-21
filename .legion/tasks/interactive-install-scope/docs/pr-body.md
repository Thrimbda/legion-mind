## Summary

- Make `lgmind install` / `lgmind setup` interactive by default in TTY contexts.
- Add project/global install scope selection with `--scope project|global` for non-interactive use.
- Map project installs to current-project `.legionmind/` roots for OpenCode and OpenClaw.
- Keep non-TTY behavior deterministic and non-interactive for CI/scripts.
- Bump package version to `0.3.0`.

## Verification

- `npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run build:runtime-js` — PASS
- `npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run test:regression` — PASS, 18/18
- `npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run pack:dry-run` — PASS, `lgmind@0.3.0`

## Notes

- After merge, dispatch `publish-npm.yml` from `master` to publish `lgmind@0.3.0`.
- Post-publish smoke should verify `npx lgmind@latest install` enters the new installer flow.
