# Log: remove-runtime-install-choice

## 2026-06-21

- User requested Legion workflow task: remove the OpenCode/OpenClaw runtime selection from `lgmind install` default prompt and keep only project/global installation choice; bump release to `0.3.1`.
- Loaded `legion-workflow`, `brainstorm`, `git-worktree-pr`, and `legion-docs` before implementation.
- Opened worktree `.worktrees/remove-runtime-install-choice/` on branch `legion/remove-runtime-install-choice` from `origin/master` at `52ab75e`.
- Materialized stable task contract in `plan.md` and `tasks.md`.
- Implemented scope-only default interaction in `scripts/lgmind.ts`; generated `scripts/lgmind.js`.
- Updated README/help copy and regression expectations so default first-run docs no longer present OpenCode/OpenClaw runtime choice.
- Bumped package version and npm metadata to `0.3.1`.
- Verification PASS: scope-only smoke showed only `Choose an install scope`, regression suite passed 18/18, and package dry-run reported `lgmind@0.3.1` with 62 entries.
- Change review PASS: default interactive flow now asks only scope; explicit `--agent` / `--runtime` compatibility remains; no security trigger or blocking finding.
- Reviewer walkthrough and PR body written under `docs/`.
- Wiki writeback complete: added `tasks/remove-runtime-install-choice.md`, updated CLI npm pattern, and marked the `0.3.0` runtime prompt conclusion as superseded by the `0.3.1` release target.
- PR #29 merged as `2a2e5e5 feat: simplify lgmind install prompt (#29)`; worktree `.worktrees/remove-runtime-install-choice/` was cleaned and main workspace refreshed.
- GitHub Actions trusted-publishing run `27898145420` published `lgmind@0.3.1` successfully.
- Registry verification now reports `version = 0.3.1`, `dist-tags.latest = 0.3.1`, and versions `[0.1.0, 0.2.0, 0.2.1, 0.3.0, 0.3.1]`.
- Real `npx --yes lgmind@latest install --interactive --dry-run --verbose` smoke showed only `Choose an install scope` and succeeded with `OK_INSTALL opencode`.
