# Tasks: fix-npm-bin-node-modules-ts

## Status

- Current phase: completed; `lgmind@0.2.1` published and verified.
- Branch: `legion/fix-npm-bin-node-modules-ts`
- Worktree: `.worktrees/fix-npm-bin-node-modules-ts/`
- Base: `origin/master`

## Checklist

- [x] Open hotfix worktree from latest `origin/master`.
- [x] Materialize task contract.
- [x] Inspect current bin/runtime package path.
- [x] Fix npm bin runtime to avoid `.ts` execution under `node_modules`.
- [x] Bump package version to `0.2.1`.
- [x] Add installed-package regression.
- [x] Run regression suite.
- [x] Run package dry-run and inspect contents.
- [x] Record verification evidence.
- [x] Record change review and walkthrough evidence.
- [x] Update wiki.
- [x] Commit scoped changes.
- [x] Rebase on latest `origin/master` before push.
- [x] Push branch and open PR.
- [x] Enable/follow auto-merge, checks, and review.
- [x] Cleanup worktree and refresh main workspace.
- [x] Dispatch trusted-publishing workflow for `0.2.1`.
- [x] Verify npm `latest` resolves to `0.2.1`.
