# Publish result: lgmind 0.2.1

## Summary

PASS. `lgmind@0.2.1` was published to npm and verified with both registry and real `npx` smoke checks.

## Pull request

- PR: #25 `fix: ship runnable lgmind npm bins`
- Merge commit: `4e58ae1 fix: ship runnable lgmind npm bins (#25)`

## GitHub Actions publication

- Workflow: `Publish npm package` (`.github/workflows/publish-npm.yml`)
- Run: `https://github.com/Thrimbda/legion-mind/actions/runs/27746769602`
- Result: success
- Completed steps:
  - checkout
  - setup Node.js 24.x
  - show npm registry surface
  - regression suite
  - package dry run
  - `npm publish --access public`

## Registry verification

Command:

```bash
npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm view lgmind version dist-tags.latest versions --json
```

Result:

```json
{
  "version": "0.2.1",
  "dist-tags.latest": "0.2.1",
  "versions": ["0.1.0", "0.2.0", "0.2.1"]
}
```

## Real npx smoke

Command:

```bash
mkdir -p ".cache/npx-smoke" && \
npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npx --yes lgmind@latest --version && \
npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npx --yes lgmind@latest install --dry-run --config-dir .cache/npx-smoke/opencode-config --opencode-home .cache/npx-smoke/opencode-home
```

Result:

```text
0.2.1
OK_INSTALL opencode copied=42 linked=0 skipped=0 warnings=0 failures=0
```

## Conclusion

The user-reported `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING` path is fixed in the published npm package.
