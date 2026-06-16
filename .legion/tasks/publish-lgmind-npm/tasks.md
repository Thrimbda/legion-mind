# publish-lgmind-npm tasks

## Current status

- Stage: PR lifecycle
- Branch: `legion/publish-lgmind-npm`
- Worktree: `.worktrees/publish-lgmind-npm/`
- Base ref: `origin/master`

## Checklist

- [x] Enter Legion workflow and create stable release contract.
- [x] Enter git-worktree-pr envelope and create isolated worktree.
- [x] Write release RFC for package name, bin aliases, publish sequencing, and rollback/blocker handling.
- [x] Review RFC and resolve blockers.
- [x] Update package, CLI help, README, and regression tests for `lgmind`.
- [x] Run regression and npm dry-run verification.
- [x] Run npm auth and package-name checks using repo-local npm cache.
- [x] Produce `docs/test-report.md`.
- [x] Produce `docs/review-change.md`.
- [x] Produce walkthrough/PR body and wiki writeback.
- [ ] Commit, rebase, push, open PR, enable auto-merge, follow checks/review, merge, cleanup worktree, refresh main workspace. *(pre-commit verification rerun passed)*
- [ ] Publish `lgmind@0.1.0` to npm or record publish blocker.
- [ ] Record final publish state in task docs/wiki.

## Acceptance tracking

- [x] Package name is `lgmind@0.1.0`.
- [x] Primary CLI bin is `lgmind`; `setup-opencode` alias decision is documented.
- [x] README/help examples use `npx lgmind@latest`.
- [x] Regression and pack dry-run pass.
- [ ] PR lifecycle reaches terminal merged state.
- [ ] npm publish succeeds or blocker is explicit.
