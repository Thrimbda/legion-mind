# Report walkthrough: remove-runtime-install-choice

## Mode

implementation

## Reviewer summary

This change removes the OpenCode/OpenClaw runtime selection from the default `lgmind install` / `lgmind setup` interactive flow. The guided first-run path now asks only for install scope: project or global. The package version is bumped to `0.3.1` for release.

## Why this change exists

`lgmind@0.3.0` asks users to choose an agent runtime before scope. The user reported that this choice is not useful in the default flow because the meaningful decision is whether assets should be installed for the current project or globally.

Source contract: `.legion/tasks/remove-runtime-install-choice/plan.md`

## What changed

- `scripts/lgmind.ts`
  - Removed default interactive runtime prompting.
  - Kept explicit `--agent` / `--runtime` compatibility routing.
  - Kept `--scope project|global` as the guided and scripted install-scope selector.
  - Fixed value error text so `--scope` errors mention `project or global`.
- `scripts/lgmind.js`
  - Regenerated runtime JS for npm execution.
- `scripts/setup-opencode.ts` / `.js`
  - Updated help copy to point first-run users at `lgmind install --scope project|global`.
- `README.md`
  - Updated quick start and OpenCode docs so the default path no longer says to choose OpenCode/OpenClaw.
  - Kept OpenClaw-specific compatibility examples in the OpenClaw section.
- `tests/regression/setup-lifecycle.test.ts`
  - Updated regression to assert the runtime prompt is absent and the scope prompt is present.
- `package.json`
  - Bumped version to `0.3.1` and adjusted npm metadata wording.

## Verification evidence

See `.legion/tasks/remove-runtime-install-choice/docs/test-report.md`.

PASS evidence:

- Scope-only smoke:
  - Command: `node bin/lgmind.js install --interactive --dry-run --verbose <<< $'1\n'`
  - Output included `Choose an install scope:` and `OK_INSTALL opencode`.
  - Output did not include `Choose an agent runtime to configure:`.
- Regression:
  - Command: `npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run test:regression`
  - Result: 18/18 PASS.
- Package dry-run:
  - Command: `npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run pack:dry-run`
  - Result: `lgmind@0.3.1`, 62 package entries.

## Review evidence

See `.legion/tasks/remove-runtime-install-choice/docs/review-change.md`.

Review conclusion: PASS.

- Scope is compliant.
- Existing setup lifecycle and OpenClaw compatibility routing were preserved.
- No security trigger or blocker was found.

## Release path

After PR merge:

1. Dispatch `.github/workflows/publish-npm.yml` from `master`.
2. Verify npm registry `latest = 0.3.1`.
3. Run real `npx` smoke for `lgmind@latest install --interactive --dry-run --verbose` to confirm only scope prompt appears.
4. Record publish closeout in task docs/wiki.

## Reviewer checklist

- Confirm default `lgmind install` no longer presents OpenCode/OpenClaw as the first question.
- Confirm `--scope project|global` remains documented and tested.
- Confirm explicit `--agent openclaw` compatibility remains available but is no longer the first-run default path.
- Confirm package version is `0.3.1`.
