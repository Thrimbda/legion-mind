# setup-opencode npm CLI

## Contract

- **name:** setup-opencode npm CLI
- **taskId:** `setup-opencode-npm-cli`
- **goal:** turn the existing OpenCode setup script into a first-class npm CLI that users can run with a Context7-style `npx` / global install flow.
- **problem:** `scripts/setup-opencode.ts` already performs install / verify / rollback / uninstall, but the package still exposes an implementation file directly and README usage is repository-local. That is not enough for a publishable npm CLI: the executable name, help surface, package metadata, publish file set, and smoke verification need to make npm installation safe and obvious.

## Acceptance

1. Package metadata is publish-ready for the OpenCode installer: package name, executable `bin`, `files`, repository/license metadata, and Node engine communicate how npm should install the CLI.
2. The npm executable is a stable CLI entrypoint named `setup-opencode`, with a portable `#!/usr/bin/env node` shebang and support for `--help` / `--version` without relying on users to pass Node flags manually.
3. Existing lifecycle commands continue to work: `install`, `verify --strict`, `rollback`, and `uninstall` preserve managed manifest / backup safety semantics.
4. README documents Context7-inspired usage: `npx setup-opencode@latest ...`, global install, commands, options, isolated dry-run examples, and publish / pack verification expectations.
5. Automated evidence covers regression and packaging smoke checks, including the executable entrypoint and package contents enough to catch non-publishable layouts.

## Scope

- Update `package.json` metadata, executable mapping, npm files list, and scripts as needed.
- Add a CLI wrapper or entrypoint that can run the TypeScript implementation safely from npm-installed package contents.
- Add help/version behavior to the OpenCode setup command surface.
- Update README OpenCode install docs from repo-local script usage to npm CLI usage while keeping local development commands discoverable.
- Add or adjust regression tests for CLI help/version, wrapper smoke, and package file surface.
- Record verification, review, walkthrough, and wiki evidence through the Legion closeout chain.

## Non-goals

- Do not publish to npm from this task.
- Do not redesign OpenClaw installation or turn this package into a universal runtime installer.
- Do not replace the existing managed manifest / backup / rollback implementation.
- Do not add heavy CLI dependencies unless required; keep the package lightweight.
- Do not broaden Legion workflow semantics beyond the packaging / CLI surface needed for `setup-opencode`.

## Assumptions

- The npm package name should be `setup-opencode` because the user explicitly asked to make `setup-opencode` the CLI and npm registry lookup returned 404 for that name at task start.
- The CLI can require Node `>=22.6.0`, matching the existing project engine and TypeScript strip-types dependency.
- The implementation may keep `scripts/setup-opencode.ts` as source, but the npm `bin` should point at a stable wrapper under package-managed contents.
- Context7 is used as the documentation/style reference for simple `npx <package>@latest` and global-install examples, not as a dependency.

## Constraints

- Work must happen inside `.worktrees/setup-opencode-npm-cli/` and be delivered via PR.
- The executable must not require users to invoke `node --experimental-strip-types` directly.
- Package contents must include all assets the installer syncs: `.opencode/**`, `skills/**`, and setup core files, while avoiding caches, tests, task docs, and worktrees.
- Existing tests should remain runnable with current repository tooling.

## Risks

- Node's TypeScript strip behavior around `--experimental-strip-types` can be version-sensitive; a JS wrapper may need to respawn with the flag for compatibility.
- Renaming the npm package from `legion-mind-opencode` to `setup-opencode` is a public-facing packaging decision and should be explicit in docs and review evidence.
- Npm packing can accidentally omit dot-directories such as `.opencode`; verification must inspect package contents rather than assume defaults.
- Release readiness can be overstated if docs imply the package was already published.

## Recommended direction

- Use a tiny JS `bin/setup-opencode.js` wrapper with `#!/usr/bin/env node` that dispatches to `scripts/setup-opencode.ts` under Node with the required TypeScript flag when needed.
- Keep the core installer code mostly intact and add only CLI presentation features (`help`, `version`, clearer parse errors) around it.
- Configure `package.json` for npm publish with `name: setup-opencode`, `bin.setup-opencode`, a conservative `files` allowlist, and npm scripts that exercise the wrapper.
- Document usage in README in the same shape as Context7 CLI docs: `npx setup-opencode@latest`, global install, command examples, and local development fallback.

## Phases

1. **Contract and worktree setup:** create this task contract, branch, and isolated worktree.
2. **Implementation:** update package metadata, add executable wrapper, enhance CLI help/version, and update README/tests.
3. **Verification:** run regression tests and npm pack / wrapper smoke checks with cache/artifacts kept inside the repo.
4. **Review and delivery:** produce test-report, review-change, walkthrough, PR body, wiki writeback, commit, push, PR, and follow PR lifecycle.

## Design gate decision

Risk is medium but bounded: the change crosses packaging, CLI entry, docs, and tests, while preserving installer semantics. A lightweight RFC is useful to make the package-name and wrapper decisions reviewable before implementation.
