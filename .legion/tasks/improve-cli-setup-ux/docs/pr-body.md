## Summary

- add a product-level `lgmind` setup aggregator with `--agent opencode|openclaw`
- keep `setup-opencode` as the OpenCode-only alias
- make default text output quiet while preserving details with `--verbose` and `--json`
- include OpenClaw setup files in the npm package surface and update README/tests

## Tests

```bash
node bin/lgmind.js setup --agent opencode --dry-run --config-dir .cache/verify-opencode-config --opencode-home .cache/verify-opencode-home
node bin/lgmind.js setup --agent openclaw --dry-run --config-dir .cache/verify-openclaw-home --openclaw-home .cache/verify-openclaw-home --no-extra-dir
npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run test:regression
npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run pack:dry-run
```

## Evidence

- Task: `.legion/tasks/improve-cli-setup-ux/plan.md`
- RFC: `.legion/tasks/improve-cli-setup-ux/docs/rfc.md`
- Test report: `.legion/tasks/improve-cli-setup-ux/docs/test-report.md`
- Review: `.legion/tasks/improve-cli-setup-ux/docs/review-change.md`
- Walkthrough: `.legion/tasks/improve-cli-setup-ux/docs/report-walkthrough.md`
- HTML walkthrough: `.legion/tasks/improve-cli-setup-ux/docs/report-walkthrough.html`

## Release boundary

This PR changes the repository/package layout but does not publish a new npm version. Publishing should be handled by a separate release task.
