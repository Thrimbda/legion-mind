## Summary

- Remove OpenCode/OpenClaw runtime selection from the default `lgmind install` / `setup` interactive flow.
- Keep only project/global scope selection in the first-run prompt while preserving explicit `--agent` / `--runtime` compatibility routing.
- Update README/help/tests/generated runtime JS and bump package version to `0.3.1`.

## Verification

- `node bin/lgmind.js install --interactive --dry-run --verbose <<< $'1\n'` shows only `Choose an install scope:` and ends with `OK_INSTALL opencode`.
- `npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run test:regression` → 18/18 PASS.
- `npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run pack:dry-run` → `lgmind@0.3.1`, 62 entries.

## Legion evidence

- Plan: `.legion/tasks/remove-runtime-install-choice/plan.md`
- Test report: `.legion/tasks/remove-runtime-install-choice/docs/test-report.md`
- Review: `.legion/tasks/remove-runtime-install-choice/docs/review-change.md`
- Walkthrough: `.legion/tasks/remove-runtime-install-choice/docs/report-walkthrough.md`
