# Task summary: remove-runtime-install-choice

## Outcome

- Prepared `lgmind@0.3.1` to remove the OpenCode/OpenClaw runtime choice from the default `lgmind install` / `lgmind setup` interactive flow.
- Default first-run interaction now asks only for install scope: project or global.
- `--scope project|global` remains the scripted scope selector.
- Explicit `--agent` / `--runtime` compatibility routing remains available for scripts and lower-level runtime-specific paths, but is no longer presented as the default user choice.

## Evidence

- Raw contract: `.legion/tasks/remove-runtime-install-choice/plan.md`
- Verification: `.legion/tasks/remove-runtime-install-choice/docs/test-report.md`
- Review: `.legion/tasks/remove-runtime-install-choice/docs/review-change.md`
- Walkthrough: `.legion/tasks/remove-runtime-install-choice/docs/report-walkthrough.md`
- PR body: `.legion/tasks/remove-runtime-install-choice/docs/pr-body.md`
- Publish result: `.legion/tasks/remove-runtime-install-choice/docs/publish-result.md`

## Current state

- PR #29 is merged.
- npm registry state is `version = 0.3.1`, `latest = 0.3.1`, versions `[0.1.0, 0.2.0, 0.2.1, 0.3.0, 0.3.1]`.
- Real `npx --yes lgmind@latest install --interactive --dry-run --verbose` smoke succeeds and shows only the project/global scope prompt.
- Verification passed locally:
  - scope-only smoke: no `Choose an agent runtime to configure:` output
  - regression suite: 18/18 PASS
  - package dry-run: `lgmind@0.3.1`, 62 entries

## Durable conclusions

- Product-level `lgmind install` / `setup` should not prompt users to choose OpenCode vs OpenClaw by default.
- The default interactive choice is install scope only: project or global.
- Non-TTY/scripted usage must stay deterministic and non-interactive; use `--scope project|global` for scope, and only use `--agent` / `--runtime` as advanced compatibility routing.
- Project scope still maps default OpenCode-backed install paths under current-project `.legionmind/opencode/{config,home}` unless explicit runtime/path flags override.
