# Task summary: interactive-install-scope

## Outcome

- Prepared `lgmind@0.3.0` with interactive install/setup scope selection.
- `lgmind install` / `lgmind setup` now prompt in interactive mode for runtime and project/global scope.
- Added `--scope project|global`, `--interactive`, and `--no-interactive` to the product-level CLI.
- Project scope installs under current-project `.legionmind/` paths instead of runtime-global defaults.

## Evidence

- Raw contract: `.legion/tasks/interactive-install-scope/plan.md`
- Verification: `.legion/tasks/interactive-install-scope/docs/test-report.md`
- Review: `.legion/tasks/interactive-install-scope/docs/review-change.md`
- Walkthrough: `.legion/tasks/interactive-install-scope/docs/report-walkthrough.md`

## Current state

- Repo release target is `lgmind@0.3.0`.
- npm `latest` remains `0.2.1` until the PR merges and `publish-npm.yml` is dispatched from `master`.
- Regression suite now has 18 tests, including interactive install and project-scope mapping.

## Durable conclusions

- Product-level `lgmind install` / `setup` should be interactive in TTY contexts and choose runtime plus project/global scope.
- Non-TTY/scripted usage must stay deterministic and non-interactive; explicit flags are `--agent` / `--runtime` plus `--scope project|global`.
- Project scope defaults:
  - OpenCode: `<project>/.legionmind/opencode/config` and `<project>/.legionmind/opencode/home`
  - OpenClaw: `<project>/.legionmind/openclaw`
