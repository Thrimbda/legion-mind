# Interactive install scope selection

## Task contract

- **Name:** Interactive install scope selection
- **Task ID:** `interactive-install-scope`
- **Goal:** make `lgmind install` / `lgmind setup` feel like a first-run installer by default: interactive in a TTY, with explicit runtime and project/global scope choices.
- **Problem:** after `lgmind@0.2.1`, `npx lgmind install` runs a non-interactive OpenCode install path by default. Users expected an installer prompt, and there is no default prompt to choose project-scoped vs global installation.

## Acceptance

- In an interactive TTY, `lgmind install` and `lgmind setup` default to a guided flow.
- The guided flow asks for:
  - agent runtime: OpenCode or OpenClaw
  - install scope: project or global
- Project scope installs into paths under the current working directory by default, avoiding writes to user-global config/home locations.
- Global scope preserves current default global behavior for the selected runtime.
- Non-TTY/scripted invocations remain non-interactive and deterministic, so CI and existing automation do not hang.
- Explicit CLI flags can bypass prompts:
  - `--agent` / `--runtime` for runtime
  - a new install-scope flag for project/global
- README and CLI help document the default interactive behavior and the non-interactive flags.
- Regression tests cover interactive prompt routing, project/global scope mapping, non-TTY default behavior, and package/bin execution.
- Package version is bumped to `0.3.0`; after PR merge, trusted publishing publishes `lgmind@0.3.0` and npm `latest` resolves to `0.3.0`.
- Task evidence, walkthrough, and wiki writeback are recorded.

## Scope

- Update `lgmind` product-level CLI dispatch and generated JS runtime.
- Add project/global scope mapping for OpenCode and OpenClaw setup commands.
- Add tests for interactive and non-interactive command behavior.
- Update user-facing docs and package version.
- Publish the release after merge through the existing GitHub Actions trusted-publishing workflow.

## Non-goals

- No new agent runtimes beyond OpenCode and OpenClaw.
- No change to lower-level setup lifecycle semantics, backup/rollback behavior, or managed-file rules.
- No hidden writes during project-mode dry-run tests.
- No long-lived npm token or local OTP publishing path.

## Assumptions

- `project` install means local to the current project directory, not a package manager dependency install. Default paths should live under the current working directory and be safe for review/testing.
- `global` install means the existing default runtime locations remain in effect.
- Non-TTY `lgmind install` should keep the old deterministic default of OpenCode/global unless explicit flags are passed, to avoid breaking scripts.
- The current 0.x release policy treats user-visible CLI capability changes as minor releases; target version is `0.3.0`.

## Constraints

- Work happens in `.worktrees/interactive-install-scope/` on branch `legion/interactive-install-scope`.
- Base ref is `origin/master`.
- Use repo-local npm cache: `npm_config_cache=.cache/npm`.
- Before pushing, run `git fetch origin && git rebase origin/master` in the worktree.
- Publish only from merged `master` through `.github/workflows/publish-npm.yml`.

## Risks

- Scope semantics can be ambiguous; docs must state exactly which paths project/global use.
- Interactive tests can become flaky if they depend on real terminals; prefer deterministic stdin/stdout simulation where possible.
- Project install must not accidentally write into real home directories in tests.
- Generated JS runtime can drift from TS source; `build:runtime-js` / `prepack` and regression must stay part of verification.

## Recommended direction

- Treat `lgmind` as the only interactive product-level installer.
- Add `--scope project|global` as the explicit non-interactive install-scope flag.
- In TTY mode, prompt for any missing runtime/scope values for `install` and `setup`.
- In non-TTY mode, keep deterministic defaults: runtime `opencode`, scope `global`, unless explicit flags override them.
- For project scope, map selected runtime to project-local config/home roots:
  - OpenCode: `.legionmind/opencode/config` and `.legionmind/opencode/home`
  - OpenClaw: `.legionmind/openclaw`
- Keep lower-level setup scripts unchanged; `lgmind` should translate high-level scope into their existing path flags.

## Phases

1. Open isolated worktree and materialize task contract.
2. Inspect current `lgmind` dispatch and setup script path semantics.
3. Implement interactive runtime/scope selection and explicit scope flag.
4. Update generated runtime JS, package version, README/help, and regression tests.
5. Run regression and pack verification.
6. Review, walkthrough, wiki writeback.
7. Commit, rebase, push PR, merge, cleanup, refresh main.
8. Dispatch trusted-publishing workflow and verify npm `latest = 0.3.0`.
