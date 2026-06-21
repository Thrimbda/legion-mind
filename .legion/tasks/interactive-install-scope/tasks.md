# Tasks: interactive-install-scope

## Status

- Current phase: contract materialized; implementation next.
- Branch: `legion/interactive-install-scope`
- Worktree: `.worktrees/interactive-install-scope/`
- Base: `origin/master`

## Checklist

- [x] Open worktree from latest `origin/master`.
- [x] Materialize task contract.
- [x] Inspect current `lgmind` dispatch and setup path semantics.
- [x] Implement interactive runtime/scope installer flow.
- [x] Add explicit `--scope project|global` non-interactive flag.
- [x] Update generated runtime JS and package version to `0.3.0`.
- [x] Update README/help docs.
- [x] Add regression coverage for interactive and non-interactive project/global behavior.
- [x] Run regression suite.
- [x] Run package dry-run and inspect contents.
- [x] Record verification evidence.
- [x] Record change review and walkthrough evidence.
- [x] Update wiki.
- [ ] Commit scoped changes.
- [ ] Rebase on latest `origin/master` before push.
- [ ] Push branch and open PR.
- [ ] Enable/follow auto-merge, checks, and review.
- [ ] Cleanup worktree and refresh main workspace.
- [ ] Dispatch trusted-publishing workflow for `0.3.0`.
- [ ] Verify npm `latest` resolves to `0.3.0`.
