# Tasks: release-lgmind-0-2-0

## Status

- Current phase: contract materialized; release implementation next.
- Branch: `legion/release-lgmind-0-2-0`
- Worktree: `.worktrees/release-lgmind-0-2-0/`
- Base: `origin/master`

## Checklist

- [x] Open release worktree from latest `origin/master`.
- [x] Materialize `plan.md`, `tasks.md`, and `log.md`.
- [x] Bump `package.json` version to `0.2.0`.
- [x] Run regression suite.
- [x] Run package dry run and inspect packed metadata.
- [x] Record verification evidence in `docs/test-report.md`.
- [x] Record change review and walkthrough evidence.
- [x] Update wiki release knowledge.
- [ ] Commit scoped release changes.
- [ ] Rebase on latest `origin/master` before push.
- [ ] Push release branch and open PR.
- [ ] Enable/follow auto-merge, checks, and review.
- [ ] Cleanup worktree and refresh main workspace.
- [ ] Publish `lgmind@0.2.0` to npm.
- [ ] Verify npm `latest` resolves to `0.2.0`.
