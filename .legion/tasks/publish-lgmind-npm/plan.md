# Publish `lgmind` to npm

## Contract

- **name:** Publish `lgmind` npm package
- **taskId:** `publish-lgmind-npm`
- **goal:** rename the prepared npm package from `setup-opencode` to the shorter public package name `lgmind`, merge that release configuration through the normal PR lifecycle, then publish version `0.1.0` to npm.
- **problem:** PR #17 prepared a publishable OpenCode installer CLI, but deliberately stopped before publication and left package naming as an open release decision. The user now selected a shorter package name, preferring `lgmind`, and explicitly asked to publish while referencing a local release example.

## Acceptance

1. `package.json` uses npm package name `lgmind` at version `0.1.0`, with publish metadata and npm file allowlist still intact.
2. The package exposes a primary `lgmind` CLI bin for `npx lgmind@latest ...`; `setup-opencode` may remain as an alias if it keeps the installer purpose clear and avoids breaking the previous package preparation work.
3. README and CLI help/version examples describe the `lgmind` package name and release boundary accurately.
4. Regression and package dry-run verification pass, including checks that package contents and bin entries match the new package name.
5. Git lifecycle completes through PR merge, worktree cleanup, and main workspace refresh.
6. `npm publish --access public` publishes `lgmind@0.1.0`, or a blocker is recorded if npm auth, 2FA, registry policy, or package-name race prevents publication.

## Scope

- Update npm package name, bin entries, CLI help text, README examples, tests, and task/wiki release evidence.
- Use repo-local npm cache/log paths for npm commands.
- Use the merged `origin/master` package state as the release source of truth before publishing.
- Execute npm publish only after PR merge and final release verification from refreshed master.

## Non-goals

- Do not publish under the old `setup-opencode` package name.
- Do not change installer lifecycle semantics or managed file safety logic.
- Do not redesign OpenClaw setup.
- Do not introduce a build pipeline or compiled distribution unless required to unblock publish.
- Do not rely on secrets or npm tokens committed to the repository.

## Assumptions

- `lgmind` is the selected package name because the user accepted the recommendation after considering `lgmd` and `lgmind`.
- Version remains `0.1.0`, matching the current package and first npm release.
- Unscoped packages are public by default, but the release command will use `--access public` for clarity.
- The local reference path `~/Work/opencode-feishu-notifier` was cloned by the user, but current tool permissions still block external-directory reads; this task follows npm CLI documentation and current repository release evidence unless the reference becomes accessible.

## Constraints

- All repository modifications happen inside `.worktrees/publish-lgmind-npm/` until PR merge.
- Push before PR must be preceded by `git fetch origin && git rebase origin/master` in the worktree.
- Persistent npm cache/log output must stay inside the repository, e.g. `.cache/npm`.
- `npm publish` is externally visible and version/name combinations cannot be reused; publish only after the merged release configuration is verified.

## Risks

- Package-name availability can race between dry-run and publish.
- npm auth or 2FA may block publication despite code readiness.
- Publishing the wrong package name/version is not practically reversible; even unpublish cannot make a name/version safely reusable.
- Multiple bin names can confuse docs if README and help do not clearly identify `lgmind` as the package and primary command.

## Recommended direction

- Rename the package to `lgmind` and expose both `lgmind` and `setup-opencode` bins to the same wrapper, with docs leading on `npx lgmind@latest`.
- Keep wrapper implementation minimal and reuse the previously validated package allowlist.
- Treat release as two gates: first merge code/docs/test updates by PR, then publish from refreshed `origin/master` using repo-local npm cache.
- Record release evidence under this task's docs and promote durable npm release lessons into `.legion/wiki/**`.

## Phases

1. **Contract and worktree:** create this release contract and isolated worktree.
2. **Design gate:** write and review a concise release RFC for package name, bin aliases, verification, and publish sequencing.
3. **Implementation:** update package/docs/tests for `lgmind`.
4. **Verification and review:** run regression, pack dry-run, npm auth/name checks, and change review.
5. **PR lifecycle:** commit, rebase, push, PR, auto-merge/checks/review follow-up, merge, cleanup, main refresh.
6. **Publish:** verify from refreshed master and run `npm publish --access public`; record published package URL or blocker.
7. **Closeout:** update report/walkthrough/wiki with final release state.

## Design gate decision

Risk is high because npm publish is an external, mostly irreversible release action. A concise RFC and review are required before implementation and publish.
