## Summary

- rename the npm package from `setup-opencode` to `lgmind`
- expose `lgmind` as the primary bin and keep `setup-opencode` as an alias
- update CLI help, README examples, and regression assertions for `npx lgmind@latest`
- add public npm `publishConfig` and pre-publish release evidence

## Tests

```bash
npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm view lgmind --json --registry=https://registry.npmjs.org || true
npm_config_cache=.cache/npm npm_config_update_notifier=false npm whoami --registry=https://registry.npmjs.org
npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run test:regression
npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run pack:dry-run
```

## Evidence

- Task: `.legion/tasks/publish-lgmind-npm/plan.md`
- RFC: `.legion/tasks/publish-lgmind-npm/docs/rfc.md`
- Test report: `.legion/tasks/publish-lgmind-npm/docs/test-report.md`
- Review: `.legion/tasks/publish-lgmind-npm/docs/review-change.md`
- Walkthrough: `.legion/tasks/publish-lgmind-npm/docs/report-walkthrough.md`
- HTML walkthrough: `.legion/tasks/publish-lgmind-npm/docs/report-walkthrough.html`

## Release boundary

This PR prepares and merges the `lgmind@0.1.0` release configuration. Actual `npm publish --access public` happens after merge from refreshed `origin/master`.
