# Change review: add-npm-publish-action

## Verdict

PASS.

## Scope compliance

- In scope: add a manual GitHub Actions workflow for npm publication.
- In scope: task-local evidence for the workflow and release-command verification.
- No CLI runtime behavior, package version, npm package name, or package allowlist changed in this task.
- No npm token or secret value was committed.

## Correctness

- Workflow file: `.github/workflows/publish-npm.yml`.
- Trigger is manual `workflow_dispatch`, matching the user's request to push publication into GitHub Actions without introducing automatic publish-on-push behavior.
- Permissions are limited to:
  - `contents: read`
  - `id-token: write`
- Node version is `24.x`, which matches the trusted-publishing requirement for an npm version with OIDC support.
- The workflow runs the same release verification used locally before publish:
  - `npm run test:regression`
  - `npm run pack:dry-run`
- Publish command is `npm publish --access public`, consistent with `package.json#publishConfig.access` and the existing public package.

## Security / supply-chain lens

Applied because this task changes release automation and an external package publication path.

- No long-lived `NPM_TOKEN` path was added.
- OIDC permission is explicitly scoped through `id-token: write`; repository content access remains read-only.
- Manual dispatch limits release blast radius for the immediate `0.2.0` publish.
- `package-manager-cache: false` avoids package-manager cache reuse during release builds.
- Trusted publisher configuration must exactly match `publish-npm.yml`; this is documented as an external setup requirement.

## Verification evidence reviewed

- `docs/test-report.md` records:
  - `git diff --check`: PASS
  - regression suite: 15/15 passing
  - package dry run: `lgmind@0.2.0`, 61 packed entries

## Blocking findings

None for merging the workflow.

## Remaining external risk

- Actual publication can still fail if npm trusted publisher configuration is absent or mismatched. If `npm trust github lgmind --file publish-npm.yml --repo Thrimbda/legion-mind --allow-publish` cannot be configured from the current session, the user must configure the trusted publisher in npm package settings before dispatching the workflow.
