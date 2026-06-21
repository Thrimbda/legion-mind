# Tasks: remove-runtime-install-choice

## Status

- Current phase: ready for commit / PR.
- Branch: `legion/remove-runtime-install-choice`
- Worktree: `.worktrees/remove-runtime-install-choice/`
- Base: `origin/master`

## Checklist

- [x] Open worktree from latest `origin/master`.
- [x] Materialize task contract.
- [x] Inspect current `lgmind` runtime/scope prompt implementation.
- [x] Remove runtime selection from default interactive install/setup flow.
- [x] Preserve non-interactive deterministic behavior and compatible setup aliases.
- [x] Update generated runtime JS and package version to `0.3.1`.
- [x] Update README/help docs.
- [x] Update regression coverage for scope-only interactive behavior.
- [x] Run regression suite.
- [x] Run package dry-run and inspect contents.
- [x] Record verification evidence.
- [x] Record change review evidence.
- [x] Record walkthrough evidence.
- [x] Update wiki.
- [ ] Commit scoped changes.
- [ ] Rebase on latest `origin/master` before push.
- [ ] Push branch and open PR.
- [ ] Enable/follow auto-merge, checks, and review.
- [ ] Cleanup worktree and refresh main workspace.
- [ ] Dispatch trusted-publishing workflow for `0.3.1`.
- [ ] Verify npm `latest` resolves to `0.3.1`.
