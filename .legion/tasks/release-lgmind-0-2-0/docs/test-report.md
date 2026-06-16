# Test report: release-lgmind-0-2-0

## Summary

PASS. The release bump to `0.2.0` preserves the existing CLI regression surface and packs the expected npm artifact metadata for `lgmind@0.2.0`.

## Commands

### Regression suite

```bash
npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run test:regression
```

- Result: PASS
- Evidence: Node test runner reported 15 tests, 15 pass, 0 fail.

### Package dry run

```bash
npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run pack:dry-run
```

- Result: PASS
- Evidence: dry run produced package metadata for `lgmind@0.2.0` with filename `lgmind-0.2.0.tgz`.
- Packed entry count: 61
- Critical packed files include:
  - `bin/lgmind.js`
  - `bin/setup-opencode.js`
  - `scripts/lgmind.ts`
  - `scripts/setup-opencode.ts`
  - `scripts/setup-openclaw.ts`
  - `scripts/lib/setup-core.ts`
  - `README.md`
  - `LICENSE`

### Current npm registry state before publish

```bash
npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm view lgmind version dist-tags.latest
```

- Result: PASS
- Evidence: current published `version` and `dist-tags.latest` are still `0.1.0`, confirming `0.2.0` has not yet been published before this release PR.

## Why these checks

- The change is a version-only release bump plus release evidence; the regression suite proves the already-merged CLI behavior still passes under the release version.
- The package dry run is the strongest pre-publish guard because it validates the npm artifact version and allowlisted packed contents without publishing.
- The npm registry query establishes the before/after boundary for the eventual publish step.

## Skipped

- No additional runtime install smoke was run here because PR #21 already validated the setup UX, and this task does not change setup logic.
