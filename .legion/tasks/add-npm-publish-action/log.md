# Log: add-npm-publish-action

## 2026-06-16

- Local `npm publish --access public` for `lgmind@0.2.0` failed with `EOTP` after showing the correct publish artifact.
- User selected GitHub Actions publication instead of providing a local OTP.
- Created worktree `.worktrees/add-npm-publish-action/` from `origin/master` on branch `legion/add-npm-publish-action`.
- Added manual workflow `.github/workflows/publish-npm.yml` for trusted-publishing/OIDC based npm publish.
- Local verification passed: `git diff --check`, regression suite 15/15, and package dry-run for `lgmind@0.2.0`.
- Change review passed with release automation supply-chain lens applied.
- Reviewer walkthrough and PR body were written under `docs/`.
- Wiki writeback added `tasks/add-npm-publish-action.md` and promoted trusted publishing / OIDC as preferred npm release path.
