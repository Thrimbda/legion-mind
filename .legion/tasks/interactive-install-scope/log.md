# Log: interactive-install-scope

## 2026-06-21

- User reported that `lgmind install` is still not an interactive install experience and requested default interactive install plus project/global selection.
- Entered Legion workflow and git-worktree-pr envelope.
- Opened worktree `.worktrees/interactive-install-scope/` from `origin/master` on branch `legion/interactive-install-scope`.
- Contract sets `0.3.0` as target because this is a user-visible CLI capability change in the current 0.x series.
- Recommended semantics: TTY prompts for runtime and project/global scope; non-TTY keeps deterministic `opencode` + `global` defaults; `--scope project|global` bypasses the scope prompt.
- Implemented `--scope project|global`, `--interactive`, and `--no-interactive` in `scripts/lgmind.ts`; `install` / `setup` prompt for missing runtime/scope in interactive mode.
- Project scope maps OpenCode to `<project>/.legionmind/opencode/{config,home}` and OpenClaw to `<project>/.legionmind/openclaw`.
- Updated README/help text, generated runtime JS, and package version to `0.3.0`.
- Added regression coverage for interactive prompt flow, project scope mapping, and installed package bin execution.
- Verification passed: `build:runtime-js`, regression suite 18/18, and package dry-run for `lgmind@0.3.0`.
- Change review passed with filesystem install-scope safety lens applied.
- Reviewer walkthrough and PR body were written under `docs/`.
- Wiki writeback added `tasks/interactive-install-scope.md` and promoted interactive install + `--scope project|global` as the current npm CLI pattern.
