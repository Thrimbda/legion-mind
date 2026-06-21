# Review change: remove-runtime-install-choice

## 结论

PASS。变更可以进入 reviewer walkthrough / PR 交付阶段。

## Scope compliance

- In scope:
  - `scripts/lgmind.ts` default `install` / `setup` interaction no longer prompts for OpenCode/OpenClaw runtime.
  - `scripts/lgmind.js` was regenerated from the TS source.
  - README/help copy now presents project/global scope as the default first-run decision.
  - Regression tests assert the runtime prompt is absent and the scope prompt remains.
  - `package.json` version and npm metadata move to `0.3.1`.
- Out of scope avoided:
  - No rewrite of lower-level setup lifecycle, manifest, verify, rollback, or uninstall semantics.
  - No removal of `setup-opencode` or explicit `--agent openclaw` compatibility routing.
  - No change to trusted publishing workflow.

## Correctness review

- `promptRuntime` was removed from the default interactive flow, and missing runtime now resolves deterministically to `opencode` without prompting.
- `--agent` / `--runtime` still normalize and reject conflicts, preserving explicit compatibility routing for existing scripts.
- `selectScope` remains the only interactive question for install/setup when `--scope` is omitted.
- `--json` and `--no-interactive` still suppress prompts; non-TTY default remains global.
- Generated JS and source TS are in sync via `npm run build:runtime-js`.
- Regression evidence directly covers the requested behavior and package/bin execution.

## Maintainability review

- The implementation is a minimal deletion/simplification rather than a new abstraction.
- Help text keeps runtime-specific flags in an advanced compatibility section, preventing default UX drift while preserving documented escape hatches.
- Tests name the new invariant directly: `lgmind interactive install prompts for project scope only`.

## Security lens

No new security trigger was introduced. This change does not add auth/session/token handling, secrets, signing, network calls, privilege escalation, or new user-controlled filesystem write semantics. Existing user-controlled path flags and setup safety behavior remain covered by the existing lifecycle regression suite.

## Blocking findings

None.

## Non-blocking suggestions

- After publishing `0.3.1`, run a real `npx lgmind@latest install --interactive --dry-run --verbose` smoke to confirm npm package behavior matches local regression.
