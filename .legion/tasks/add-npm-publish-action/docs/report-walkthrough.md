# Walkthrough: add npm publish GitHub Action

Mode: implementation workflow task.

## What changed

- Added `.github/workflows/publish-npm.yml`.
- Added task evidence for the npm trusted-publishing workflow path.

## Why

Local `npm publish --access public` for `lgmind@0.2.0` reached the correct artifact but failed with npm `EOTP`. The user requested moving the publish step to GitHub Actions, which can use npm trusted publishing / OIDC instead of a local OTP prompt.

## Workflow behavior

- Trigger: manual `workflow_dispatch`.
- Permissions: `contents: read`, `id-token: write`.
- Runtime: GitHub-hosted `ubuntu-latest`, Node `24.x`.
- Release checks before publish:
  - `npm run test:regression`
  - `npm run pack:dry-run`
- Publish command: `npm publish --access public`.

## Verification

- `git diff --check`: PASS.
- Regression suite: PASS, 15/15 tests.
- Package dry run: PASS, `lgmind@0.2.0`, 61 packed entries.

See `docs/test-report.md` for command-level evidence.

## Review status

- Change review: PASS.
- Supply-chain lens applied: no npm token committed; OIDC permission is explicit; workflow remains manual for this release.

See `docs/review-change.md` for details.

## Post-merge publish path

1. Merge this workflow PR to `master`.
2. Refresh main workspace.
3. Configure npm trusted publisher for:
   - package: `lgmind`
   - repository: `Thrimbda/legion-mind`
   - workflow file: `publish-npm.yml`
   - permission: allow `npm publish`
4. Dispatch `Publish npm package` on `master`.
5. Verify npm `version` and `dist-tags.latest` are `0.2.0`.
