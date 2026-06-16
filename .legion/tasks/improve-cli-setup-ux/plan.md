# Improve `lgmind` CLI setup UX

## Contract

- **name:** Improve `lgmind` CLI setup UX
- **taskId:** `improve-cli-setup-ux`
- **goal:** make the published `lgmind` CLI feel more like a modern setup CLI: provide an explicit setup entry that lets users choose the target agent runtime, and make default text output quieter by hiding noisy per-file lifecycle logs unless requested.
- **problem:** `lgmind` currently exposes the OpenCode installer directly. It is useful, but it assumes one target runtime, prints low-level lifecycle events in normal text mode, and does not give first-time users a Context7-style guided setup path. The user explicitly wants to reference Context7 / `ctx7` setup UX and confirmed that “agent selection” means runtime selection, not per-agent subset selection.

## Acceptance

1. `lgmind` has a setup-oriented entrypoint that can select the target runtime between supported agents/runtimes, starting with OpenCode and OpenClaw.
2. The runtime selection works non-interactively for scripts/tests and interactively when a TTY user does not provide a target.
3. Existing OpenCode commands remain compatible: `setup-opencode ...` still behaves as the OpenCode installer alias, and existing lifecycle commands keep working.
4. OpenClaw remains within the supported runtime surface if exposed by `lgmind`; package contents and docs include whatever files are required to run it from npm.
5. Default human-readable output hides noisy per-file/per-check lifecycle logs and shows concise success/warning/error summaries; detailed events remain available through `--verbose` and machine-readable output through `--json`.
6. README/help/tests document and verify the new setup flow, runtime selection, quiet default output, and verbose/json escape hatches.

## Scope

- Add or refactor CLI entrypoint behavior for `lgmind setup` / runtime selection.
- Preserve `install / verify / rollback / uninstall` semantics for OpenCode and OpenClaw installers.
- Add runtime selection flags or aliases needed for non-interactive usage.
- Add quiet-by-default reporting with explicit `--verbose` for detailed text events and unchanged `--json` event streams.
- Update npm package files allowlist if OpenClaw runtime support becomes package-visible.
- Update README and regression tests.
- Record task evidence and durable CLI UX lessons in `.legion/wiki/**`.

## Non-goals

- Do not redesign managed manifest, backup, rollback, uninstall, or strict verify safety semantics.
- Do not add per-OpenCode-agent subset selection in this task.
- Do not add new unsupported runtimes beyond OpenCode and OpenClaw.
- Do not introduce a full terminal UI framework unless the design gate proves it is necessary.
- Do not publish a new npm version from this task unless a separate release task is explicitly opened.

## Assumptions

- “Agent selection” means selecting the target runtime/client, per the user’s clarification: OpenCode vs OpenClaw.
- Context7’s relevant UX pattern is `npx ctx7 setup`: a guided setup command that prompts for setup mode when options are omitted, while still supporting non-interactive CLI usage.
- `--json` is a compatibility boundary for automation and should remain event-rich.
- Quiet default output should not hide failures, warnings, skipped drift, or recovery hints.

## Constraints

- All implementation happens in `.worktrees/improve-cli-setup-ux/` under branch `legion/improve-cli-setup-ux`.
- Push before PR must be preceded by `git fetch origin && git rebase origin/master` in the worktree.
- Npm/cache/log output must stay repo-local, e.g. `.cache/npm`.
- Keep published `lgmind@0.1.0` compatibility in mind, but do not perform npm publish in this task.

## Risks

- Runtime selection can accidentally blur the current OpenCode/OpenClaw support boundary or imply a generic runtime orchestrator.
- Changing default output may break tests or users that rely on text logs rather than `--json`.
- Exposing OpenClaw through the npm CLI may require package files changes; missing files would only surface after pack/install checks if not tested.
- Interactive prompts can hang CI if non-interactive defaults are not explicit and testable.

## Recommended direction

- Add a `setup` command as the first-time UX, modeled after `ctx7 setup`: if no runtime is specified and stdin is a TTY, prompt for OpenCode/OpenClaw; otherwise require or default a safe runtime selection without hanging automation.
- Add a non-interactive runtime flag such as `--agent opencode|openclaw` (or equivalent) and document it as the scripting path.
- Keep `setup-opencode` as a direct OpenCode alias and preserve existing commands for compatibility.
- Add a shared reporting mode that prints only final summaries plus warnings/errors by default, while `--verbose` keeps current detailed event logs and `--json` keeps structured event logs.
- Treat this as medium-risk and run a concise RFC/review before implementation because it touches CLI contract, runtime packaging, and output compatibility.

## Phases

1. **Contract and worktree:** stabilize this task contract and create isolated worktree.
2. **Design gate:** write and review a concise RFC covering command grammar, runtime selection, logging modes, compatibility, and package surface.
3. **Implementation:** update CLI entrypoints/reporting/docs/tests in scope.
4. **Verification and review:** run regression, targeted smoke tests for quiet/verbose/json modes, and npm pack dry-run.
5. **Closeout:** produce test report, review-change, walkthrough/PR body, wiki writeback.
6. **PR lifecycle:** commit, rebase, push, PR, auto-merge/checks/review follow-up, cleanup, and main refresh.

## Design gate decision

Risk is medium because the task changes the public CLI contract and package-visible runtime surface. A concise RFC and review are required before implementation.
