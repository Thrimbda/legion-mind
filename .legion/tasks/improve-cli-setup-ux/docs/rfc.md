# RFC: `lgmind` setup UX, runtime selection, and quiet logs

## Status

Draft for review.

## Context

The published `lgmind@0.1.0` CLI currently points `lgmind` and `setup-opencode` at the same OpenCode installer wrapper. This made first release simple, but it creates two UX gaps:

1. First-time users do not get a guided setup command that asks which supported agent runtime they want to configure.
2. Normal text output prints low-level lifecycle events for every successful check/copy/update, which is useful for debugging but too noisy as the default.

The user explicitly asked to reference Context7 / `ctx7` and clarified that “agent selection” means runtime/client selection. Current Context7 docs show the relevant pattern:

- `npx ctx7 setup` is the setup command.
- `ctx7 setup` can prompt users to choose a setup mode.
- Direct non-installed CLI usage remains available with commands such as `npx ctx7 --help`.

This task should adopt the product shape, not Context7 internals: a clear setup entry, an explicit non-interactive path, and quiet default logs.

## Decisions

### 1. Add a real `lgmind` aggregator entrypoint

Add `bin/lgmind.js` -> `scripts/lgmind.ts`, and change `package.json#bin.lgmind` to point to it. Keep `package.json#bin.setup-opencode` pointing to `bin/setup-opencode.js`.

Rationale:

- `lgmind` is now the product-level CLI and should be allowed to route to multiple supported runtimes.
- `setup-opencode` remains a compatibility alias for direct OpenCode setup.
- Keeping a separate aggregator avoids overloading `scripts/setup-opencode.ts` with OpenClaw-specific options and messaging.

### 2. Command grammar

Support these user-facing forms:

```bash
npx lgmind@latest setup
npx lgmind@latest setup --agent opencode
npx lgmind@latest setup --agent openclaw
npx lgmind@latest install --agent opencode
npx lgmind@latest verify --agent openclaw --strict
setup-opencode install
```

Definitions:

- `setup` is a product-level alias for runtime `install`.
- `--agent <opencode|openclaw>` selects the runtime. `--runtime` can be accepted as an alias if trivial, but docs should lead with `--agent` because that is the user’s chosen vocabulary.
- Existing lifecycle commands remain `install / verify / rollback / uninstall`.
- For compatibility, `lgmind install` with no `--agent` defaults to OpenCode.
- For first-time UX, `lgmind setup` with no `--agent` prompts only when stdin/stdout are TTY; in non-TTY it defaults to OpenCode with concise text output so CI cannot hang.

### 3. Runtime dispatch

The aggregator dispatches by spawning the runtime script with the selected lifecycle command and all remaining supported flags.

- OpenCode: `scripts/setup-opencode.ts`
- OpenClaw: `scripts/setup-openclaw.ts`

The package allowlist must include `scripts/lgmind.ts`, `scripts/setup-openclaw.ts`, and existing shared setup core. This makes `npx lgmind@latest setup --agent openclaw` viable from the npm package.

### 4. Quiet default output

Change shared `Reporter` semantics for text mode:

- `--json`: unchanged; emit every structured event plus final state JSON.
- `--verbose`: emit existing detailed text events for OK/W/E lifecycle lines plus final summary.
- default text mode: suppress `OK_*` event lines; print warnings/errors and one concise final summary.

Final text summary shape should be stable but compact, for example:

```text
OK_INSTALL opencode copied=12 linked=0 skipped=0 warnings=0 failures=0
READY openclaw warnings=1 failures=0
```

Failures and warnings must stay visible in default text mode because they are actionable. This means quiet mode reduces success noise, not diagnostic value.

### 5. Compatibility and aliases

- `setup-opencode` keeps its current behavior except for quieter default text output and new `--verbose` support.
- Existing `node bin/setup-opencode.js install` and npm scripts remain valid.
- `--json` event streams are treated as the automation compatibility boundary and should not be made quieter.
- README should avoid implying a generic runtime orchestrator: only OpenCode and OpenClaw are supported.

## Alternatives considered

### Extend `scripts/setup-opencode.ts` directly

- **Pros:** Fewer files.
- **Cons:** Confuses OpenCode-specific options with product-level runtime routing; makes `setup-opencode` alias less clearly OpenCode-only.
- **Decision:** Reject.

### Make `lgmind setup` always prompt

- **Pros:** Strong first-run guided UX.
- **Cons:** Can hang CI, tests, or non-interactive `npx` use.
- **Decision:** Reject. Prompt only in TTY; otherwise default safely or require explicit `--agent` where needed.

### Silence all reporter output by default

- **Pros:** Minimal output.
- **Cons:** Hides warnings/skips/errors and makes recovery harder.
- **Decision:** Reject. Only successful OK event noise is hidden.

### Add per-agent subset selection

- **Pros:** More customization.
- **Cons:** User chose runtime selection; subset selection expands installer semantics and verification matrix.
- **Decision:** Out of scope.

## Verification plan

1. Regression suite:
   - `npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run test:regression`
2. Targeted smoke checks:
   - `node bin/lgmind.js --help`
   - `node bin/lgmind.js setup --agent opencode --dry-run --config-dir .cache/opencode-config --opencode-home .cache/opencode-home`
   - `node bin/lgmind.js setup --agent openclaw --dry-run --config-dir .cache/openclaw-home --openclaw-home .cache/openclaw-home --no-extra-dir`
   - default output should not include `OK_SYNC` / `OK_VERIFY` details.
   - `--verbose` should include detailed OK lifecycle lines.
   - `--json` should continue emitting structured events and final result JSON.
3. Package dry-run:
   - `npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run pack:dry-run`
   - Expected: package contains `bin/lgmind.js`, `bin/setup-opencode.js`, `scripts/lgmind.ts`, `scripts/setup-opencode.ts`, `scripts/setup-openclaw.ts`, `scripts/lib/setup-core.ts`, assets, README, LICENSE; excludes `.legion/`, `.worktrees/`, `tests/`, `.cache/`.

## Rollback / failure handling

- Before merge: revert or close the PR.
- If runtime selection proves too broad, keep quiet logging and revert `lgmind` aggregation to direct OpenCode routing in a follow-up PR.
- If users need previous detailed logs, `--verbose` restores detailed text output and `--json` remains event-rich.
- If npm package dry-run misses OpenClaw files, block merge until package allowlist and tests are fixed.

## Open questions

No blocking open questions. The interactive prompt copy and exact summary wording can be finalized during implementation as long as the behavior above holds.
