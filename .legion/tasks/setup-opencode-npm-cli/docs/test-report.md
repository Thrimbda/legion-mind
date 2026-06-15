# Test report: setup-opencode npm CLI

## Summary

PASS.

The change was validated with the full repository regression suite plus an explicit npm package dry-run. These commands directly cover the changed surface: CLI wrapper help/version behavior, lifecycle install/verify/uninstall through the npm bin, existing setup safety semantics, and publish package contents.

## Commands

### Full regression suite

```bash
npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run test:regression
```

Result: PASS, 13/13 tests.

Evidence highlights:

- `setup-opencode npm bin exposes help and version`
- `setup-opencode npm bin runs lifecycle in isolated directories`
- `npm dry-run package includes CLI and install assets only`
- Existing OpenCode lifecycle, rollback, uninstall drift, tamper safety, OpenClaw lifecycle, and skill-surface tests remained green.

### Npm package dry-run

```bash
npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run pack:dry-run
```

Result: PASS.

Evidence highlights from npm output:

- Package id: `setup-opencode@0.1.0`
- Included `bin/setup-opencode.js` with executable mode.
- Included `.opencode/agents/legion.md`, `scripts/setup-opencode.ts`, `scripts/lib/setup-core.ts`, `skills/legion-workflow/SKILL.md`, `README.md`, `LICENSE`, and `package.json`.
- Dry-run output did not include `.legion/`, `.worktrees/`, `tests/`, or `.cache/` artifacts.

## Why these commands

- The regression suite is the repository's current default verification surface and now includes targeted npm CLI wrapper and pack-content assertions.
- `npm run pack:dry-run` is the most direct evidence that the package can be published with the intended file set without creating a tarball or publishing.
- Repo-local `npm_config_cache=.cache/npm` keeps npm cache/log artifacts inside the worktree.

## Failures / skipped

- No validation failures.
- No skipped checks.

## Notes

- Before repo-local npm cache was configured, an earlier `npm view setup-opencode name version` availability check emitted a debug log under the user npm cache; external-directory permissions blocked cleanup. All subsequent npm commands in verification used `.cache/npm`.
