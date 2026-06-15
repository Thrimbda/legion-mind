## Summary

- expose the OpenCode installer as a publish-ready `setup-opencode` npm CLI with a portable `bin/setup-opencode.js` wrapper
- add package metadata/files allowlist plus help/version behavior for the CLI
- update README with Context7-style `npx setup-opencode@latest` and global install docs
- add regression coverage for wrapper lifecycle and npm pack dry-run contents

## Tests

```bash
npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run test:regression
npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run pack:dry-run
```

## Evidence

- Task: `.legion/tasks/setup-opencode-npm-cli/plan.md`
- RFC: `.legion/tasks/setup-opencode-npm-cli/docs/rfc.md`
- Test report: `.legion/tasks/setup-opencode-npm-cli/docs/test-report.md`
- Review: `.legion/tasks/setup-opencode-npm-cli/docs/review-change.md`
- Walkthrough: `.legion/tasks/setup-opencode-npm-cli/docs/report-walkthrough.md`
- HTML walkthrough: `.legion/tasks/setup-opencode-npm-cli/docs/report-walkthrough.html`

## Release boundary

This PR prepares npm package layout and verification evidence only. It does not run `npm publish`.
