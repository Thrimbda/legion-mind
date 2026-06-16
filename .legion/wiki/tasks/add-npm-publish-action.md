# Task summary: add-npm-publish-action

## Outcome

- Added manual GitHub Actions workflow `.github/workflows/publish-npm.yml` to publish `lgmind` through npm trusted publishing / OIDC.
- The workflow verifies the release with regression tests and package dry run before `npm publish --access public`.
- The workflow uses tokenless OIDC permissions instead of committing or requiring a long-lived npm token.
- After npm trusted publisher configuration, workflow run `27597051575` published `lgmind@0.2.0` successfully.

## Evidence

- Raw contract: `.legion/tasks/add-npm-publish-action/plan.md`
- Workflow: `.github/workflows/publish-npm.yml`
- Verification: `.legion/tasks/add-npm-publish-action/docs/test-report.md`
- Review: `.legion/tasks/add-npm-publish-action/docs/review-change.md`
- Walkthrough: `.legion/tasks/add-npm-publish-action/docs/report-walkthrough.md`
- Publish result: `.legion/tasks/add-npm-publish-action/docs/publish-result.md`

## Current state

- The workflow is manual `workflow_dispatch` only.
- npm trusted publisher identity is repository `Thrimbda/legion-mind` with workflow file `publish-npm.yml` and publish permission.
- Latest successful run: `27597051575` on `master`.

## Durable conclusions

- Prefer npm trusted publishing / OIDC over long-lived npm tokens for this repository.
- Release workflows should keep `contents: read` and `id-token: write` as the minimal permissions.
- Use Node 24.x for npm trusted publishing so the bundled npm supports OIDC.
- Keep npm publish manual until release automation policy is deliberately expanded.
