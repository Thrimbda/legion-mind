# RFC: setup-opencode npm CLI surface

## Status

Draft for review.

## Context

The current OpenCode installer is executable from the checkout via `node scripts/setup-opencode.ts ...` and the package exposes `legion-mind-opencode` directly to `scripts/setup-opencode.ts`. That works for repository-local usage, but not for a polished npm CLI:

- A published package should expose a stable bin script with a portable `#!/usr/bin/env node` shebang.
- Users should be able to copy a Context7-style command such as `npx setup-opencode@latest install` without knowing the repository layout or Node flags.
- Package contents must include dot-directory assets (`.opencode/**`) and skills assets (`skills/**`) that the installer syncs.
- Release docs must distinguish “ready to publish / pack verified” from “already published”.

Reference signal: Context7 CLI docs emphasize `npx ctx7@latest ...`, optional global install, and simple command grouping. The requested task explicitly asks to model `setup-opencode` after that CLI presentation style.

## Decision summary

Use `setup-opencode` as both npm package name and primary executable. Add a small JavaScript wrapper at `bin/setup-opencode.js` and point `package.json#bin.setup-opencode` to it. Keep implementation in `scripts/setup-opencode.ts`, but make the wrapper responsible for invoking Node with `--experimental-strip-types` so users do not need to know that flag.

## Options considered

### Option A — Keep current direct TypeScript bin

- **Shape:** `bin` points directly to `scripts/setup-opencode.ts`.
- **Pros:** Minimal diff; no wrapper.
- **Cons:** The current shebang includes a Node flag and is not a reliable user-facing npm executable across environments. It also leaves help/version and package file verification weak.
- **Decision:** Reject. It does not satisfy the CLI portability acceptance criterion.

### Option B — Add JS wrapper around existing TypeScript implementation

- **Shape:** `bin/setup-opencode.js` has `#!/usr/bin/env node`, handles `--version` preflight if needed, and spawns `node --experimental-strip-types scripts/setup-opencode.ts ...`.
- **Pros:** Portable bin, minimal implementation churn, compatible with current Node engine, keeps lifecycle logic unchanged, easy to smoke test from npm package contents.
- **Cons:** Still depends on Node strip-types support and an extra spawn hop.
- **Decision:** Choose. This is the smallest safe publish-ready path.

### Option C — Build compiled JavaScript distribution

- **Shape:** Add TypeScript build pipeline and publish `dist/**`.
- **Pros:** Best runtime compatibility; no strip-types flag.
- **Cons:** Adds build tooling and release complexity outside the current zero-dependency setup; unnecessary for current Node `>=22.6.0` constraint.
- **Decision:** Defer. Consider later if broader Node support becomes a release requirement.

## Detailed design

### Package metadata

- Rename package to `setup-opencode` to match the requested CLI and confirmed npm availability at task start.
- Add `bin: { "setup-opencode": "bin/setup-opencode.js" }`.
- Add an explicit `files` allowlist that includes:
  - `bin/`
  - `scripts/setup-opencode.ts`
  - `scripts/lib/setup-core.ts`
  - `.opencode/agents/**`
  - `.opencode/plugins/**` if present
  - `skills/**`
  - `README.md`
  - `LICENSE`
- Add repository, bugs, homepage, keywords, and package manager-neutral scripts for local smoke checks.

### CLI behavior

- `setup-opencode` defaults to `install`, preserving current behavior.
- Supported commands remain `install`, `verify`, `rollback`, and `uninstall`.
- Add `--help` / `help` output with commands, options, examples, defaults, and release boundary.
- Add `--version` / `version` output sourced from root `package.json`.
- Unsupported commands should fail with a clear error plus help hint.

### Wrapper behavior

- The wrapper is plain JavaScript with `#!/usr/bin/env node`.
- It resolves `../scripts/setup-opencode.ts` relative to the installed package.
- It spawns `process.execPath` with `--experimental-strip-types` and forwards stdio and exit code.
- If the wrapper itself is called with `--help` or `--version`, it can still delegate to the TypeScript CLI; the TypeScript CLI remains the single help/version source.

### Documentation

- README OpenCode section should lead with:
  - `npx setup-opencode@latest install`
  - `npx setup-opencode@latest verify --strict`
  - optional `npm install -g setup-opencode`
- Keep repository-local development commands in a separate “local development” block.
- Clearly state this task prepares package layout and docs; actual `npm publish` is not performed by the PR.

## Rollback plan

- Revert package name/bin/files changes and remove `bin/setup-opencode.js`.
- Existing repository-local commands (`npm run opencode:*` and `node scripts/setup-opencode.ts`) should remain functional throughout, so rollback does not require data migration.
- The installer-managed user files are not changed by this packaging work except through existing lifecycle commands.

## Verification plan

1. `npm run test:regression`
2. `node bin/setup-opencode.js --help`
3. `node bin/setup-opencode.js --version`
4. Wrapper lifecycle smoke in isolated repo-local directories:
   - `node bin/setup-opencode.js install --config-dir .cache/... --opencode-home .cache/...`
   - `node bin/setup-opencode.js verify --strict --config-dir .cache/... --opencode-home .cache/...`
5. `npm pack --dry-run --json` or equivalent package listing check with npm cache/logs kept under `.cache/npm`, then assert package contents include `bin/setup-opencode.js`, `.opencode/agents/legion.md`, `skills/legion-workflow/SKILL.md`, and setup core files.

## Open questions

- No blocking open questions. If reviewers prefer keeping `legion-mind-opencode` as package name, the implementation can keep `setup-opencode` as bin alias and adjust README examples before publish.
