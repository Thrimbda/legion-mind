# Task summary: fix-npm-bin-node-modules-ts

## Outcome

- Prepared hotfix `lgmind@0.2.1` for the `0.2.0` npm bin runtime failure.
- Replaced published package runtime execution of `scripts/*.ts` with committed `scripts/*.js` runtime files.
- Added installed-package regression that executes package bins under a `node_modules/lgmind` layout.
- Published `lgmind@0.2.1`; npm `latest` now resolves to `0.2.1`.

## Evidence

- Raw contract: `.legion/tasks/fix-npm-bin-node-modules-ts/plan.md`
- Verification: `.legion/tasks/fix-npm-bin-node-modules-ts/docs/test-report.md`
- Review: `.legion/tasks/fix-npm-bin-node-modules-ts/docs/review-change.md`
- Walkthrough: `.legion/tasks/fix-npm-bin-node-modules-ts/docs/report-walkthrough.md`
- Publish result: `.legion/tasks/fix-npm-bin-node-modules-ts/docs/publish-result.md`

## Current state

- Repo hotfix PR #25 is merged.
- npm registry state is `version = 0.2.1`, `latest = 0.2.1`, versions `[0.1.0, 0.2.0, 0.2.1]`.
- Real `npx --yes lgmind@latest install --dry-run ...` smoke succeeds on `0.2.1`.
- The regression suite now has 16 tests, including installed-package bin execution.

## Durable conclusions

- Published npm bins must not execute `.ts` runtime files under `node_modules`; Node type stripping rejects that location.
- Package verification must execute an installed/package-like layout, not only inspect `npm pack --dry-run` metadata.
- `prepack` should refresh generated runtime JS from TS source before publish.
