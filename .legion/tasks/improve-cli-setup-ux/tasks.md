# improve-cli-setup-ux tasks

## Current status

- Stage: wiki writeback complete / PR lifecycle next
- Branch: `legion/improve-cli-setup-ux`
- Worktree: `.worktrees/improve-cli-setup-ux/`
- Base ref: `origin/master`

## Checklist

- [x] Enter Legion workflow and brainstorm the task contract.
- [x] Confirm “agent selection” means runtime selection.
- [x] Enter git-worktree-pr envelope and create isolated worktree.
- [x] Materialize `plan.md` and `tasks.md`.
- [x] Write RFC for command grammar, runtime selection, logging modes, compatibility, and package surface.
- [x] Review RFC and resolve blockers.
- [x] Implement CLI setup/runtime selection and quiet default logging.
- [x] Update README/help/regression tests/package dry-run expectations.
- [x] Run verification and produce `docs/test-report.md`.
- [x] Produce `docs/review-change.md`.
- [x] Produce walkthrough/PR body and wiki writeback.
- [ ] Commit, rebase, push, open PR, enable auto-merge, follow checks/review, merge, cleanup worktree, refresh main workspace.

## Acceptance tracking

- [x] `lgmind` supports setup-oriented runtime selection for OpenCode/OpenClaw.
- [x] Runtime selection has non-interactive and interactive behavior that cannot hang CI.
- [x] `setup-opencode` alias remains compatible.
- [x] Default text logs are concise; `--verbose` and `--json` preserve details.
- [x] Package dry-run includes required runtime files and excludes task/cache/test/worktree files.
