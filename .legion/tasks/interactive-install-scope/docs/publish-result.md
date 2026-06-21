# Publish result: lgmind 0.3.0

## Summary

PASS. `lgmind@0.3.0` was published to npm and verified with registry and real `npx` interactive-install smoke checks.

## Pull request

- PR: #27 `feat: add interactive lgmind install scope`
- Merge commit: `af51451 feat: add interactive lgmind install scope (#27)`

## GitHub Actions publication

- Workflow: `Publish npm package` (`.github/workflows/publish-npm.yml`)
- Run: `https://github.com/Thrimbda/legion-mind/actions/runs/27896703695`
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
  "version": "0.3.0",
  "dist-tags.latest": "0.3.0",
  "versions": ["0.1.0", "0.2.0", "0.2.1", "0.3.0"]
}
```

## Real npx smoke

Command:

```bash
npm_config_cache=/home/c1/Work/legion-mind/.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npx --yes lgmind@latest --version && \
npm_config_cache=/home/c1/Work/legion-mind/.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npx --yes lgmind@latest install --interactive --dry-run --verbose <<< $'1\n1\n'
```

Result summary:

```text
0.3.0
Choose an agent runtime to configure:
...
Choose an install scope:
...
OK_INSTALL opencode copied=42 linked=0 skipped=0 warnings=0 failures=0
```

The smoke selected OpenCode + project scope and confirmed project-local `.legionmind/opencode/...` targets.
