# setup-opencode-npm-cli tasks

## Current status

- Stage: implementation
- Branch: `legion/setup-opencode-npm-cli`
- Worktree: `.worktrees/setup-opencode-npm-cli/`
- Base ref: `origin/master`

## Checklist

- [x] Enter Legion workflow and create task contract.
- [x] Enter git-worktree-pr envelope and create isolated worktree.
- [x] Write lightweight RFC for package name, wrapper, publish surface, and verification plan.
- [x] Review RFC and resolve blockers before implementation.
- [x] Implement npm CLI package surface.
- [x] Update README and tests.
- [x] Run regression and npm packaging smoke verification.
- [x] Produce `docs/test-report.md`.
- [x] Produce `docs/review-change.md`.
- [x] Produce `docs/report-walkthrough.md` and `docs/pr-body.md`.
- [x] Update `.legion/wiki/**` with durable release/packaging knowledge.
- [ ] Commit, rebase on `origin/master`, push branch, open PR, enable auto-merge, follow checks/review, cleanup worktree, refresh main workspace.

## Acceptance tracking

- [x] Publish-ready package metadata and file allowlist.
- [x] Portable `setup-opencode` npm executable with help/version.
- [x] Lifecycle commands retain install/verify/rollback/uninstall behavior.
- [x] README documents npx/global/local usage and release boundaries.
- [x] Automated evidence catches wrapper and package content regressions.
