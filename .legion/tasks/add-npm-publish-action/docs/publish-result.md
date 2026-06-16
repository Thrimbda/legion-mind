# Publish result: lgmind 0.2.0

## Summary

PASS. `lgmind@0.2.0` was published to npm through the manual GitHub Actions trusted-publishing workflow after npm trusted publisher configuration was completed.

## GitHub Actions

- Workflow: `Publish npm package` (`.github/workflows/publish-npm.yml`)
- Trigger: `workflow_dispatch` on `master`
- Run: `https://github.com/Thrimbda/legion-mind/actions/runs/27597051575`
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
  "version": "0.2.0",
  "dist-tags.latest": "0.2.0",
  "versions": ["0.1.0", "0.2.0"]
}
```

## Notes

- First workflow run `27596687944` failed at npm publish with `E404` / permission denied because trusted publishing was not yet configured or not yet matching.
- After the user configured npm trusted publisher for `Thrimbda/legion-mind` + `publish-npm.yml`, rerun `27597051575` succeeded.
