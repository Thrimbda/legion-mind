# Task summary: interactive-install-scope

## Outcome

- Prepared `lgmind@0.3.0` with interactive install/setup scope selection.
- `lgmind install` / `lgmind setup` now prompt in interactive mode for runtime and project/global scope.
- Added `--scope project|global`, `--interactive`, and `--no-interactive` to the product-level CLI.
- Project scope installs under current-project `.legionmind/` paths instead of runtime-global defaults.
- Published `lgmind@0.3.0`; npm `latest` now resolves to `0.3.0`.

## Evidence

- Raw contract: `.legion/tasks/interactive-install-scope/plan.md`
- Verification: `.legion/tasks/interactive-install-scope/docs/test-report.md`
- Review: `.legion/tasks/interactive-install-scope/docs/review-change.md`
- Walkthrough: `.legion/tasks/interactive-install-scope/docs/report-walkthrough.md`
- Publish result: `.legion/tasks/interactive-install-scope/docs/publish-result.md`

## Current state

- PR #27 is merged.
- npm registry state is `version = 0.3.0`, `latest = 0.3.0`, versions `[0.1.0, 0.2.0, 0.2.1, 0.3.0]`.
- Real `npx --yes lgmind@latest install --interactive --dry-run --verbose` smoke succeeds and shows runtime + scope prompts.
- Regression suite now has 18 tests, including interactive install and project-scope mapping.

## Durable conclusions

- Product-level `lgmind install` / `setup` should be interactive in TTY contexts and choose runtime plus project/global scope.
- Non-TTY/scripted usage must stay deterministic and non-interactive; explicit flags are `--agent` / `--runtime` plus `--scope project|global`.
- Project scope defaults:
  - OpenCode: `<project>/.legionmind/opencode/config` and `<project>/.legionmind/opencode/home`
  - OpenClaw: `<project>/.legionmind/openclaw`
