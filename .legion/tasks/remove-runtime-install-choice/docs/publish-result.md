# Publish result: lgmind 0.3.1

## Summary

PASS. `lgmind@0.3.1` was published to npm and verified with registry and real `npx` smoke checks.

## Pull request

- PR: #29 `feat: simplify lgmind install prompt`
- Merge commit: `2a2e5e5 feat: simplify lgmind install prompt (#29)`

## GitHub Actions publication

- Workflow: `Publish npm package` (`.github/workflows/publish-npm.yml`)
- Run: `https://github.com/Thrimbda/legion-mind/actions/runs/27898145420`
- Result: success
- Completed steps included regression suite, package dry-run, and `npm publish --access public`.

## Registry verification

Command:

```bash
npm_config_cache=/home/c1/Work/legion-mind/.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm view lgmind version dist-tags.latest versions --json
```

Result:

```json
{
  "version": "0.3.1",
  "dist-tags.latest": "0.3.1",
  "versions": ["0.1.0", "0.2.0", "0.2.1", "0.3.0", "0.3.1"]
}
```

## Real npx smoke

Commands:

```bash
npm_config_cache=/home/c1/Work/legion-mind/.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npx --yes lgmind@latest --version
npm_config_cache=/home/c1/Work/legion-mind/.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npx --yes lgmind@latest install --interactive --dry-run --verbose <<< $'1\n'
```

Result summary:

```text
0.3.1
Choose an install scope:
  1) Project - install under /home/c1/Work/legion-mind/.cache/npx-smoke-031/.legionmind
  2) Global  - install to global agent defaults
Install scope [1/project]:
OK_INSTALL opencode copied=42 linked=0 skipped=0 warnings=0 failures=0
```

The smoke selected project scope and confirmed that the OpenCode/OpenClaw runtime prompt no longer appears in the default interactive path.
