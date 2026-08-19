# RFC: Legion Pi model policy and credential boundary

> **Profile**: Standard
> **Status**: Approved
> **Created**: 2026-08-19

## Decision

Promote model selection from implicit user drift to a narrow, reviewed Legion Pi manifest policy while keeping provider credentials entirely outside the manifest and installer lifecycle.

The shipped configuration moves to schema v2 and requires:

```json
{
  "models": {
    "defaultProvider": "openai-codex",
    "defaultModel": "gpt-5.6-sol",
    "enabledModels": [
      "openai-codex/*",
      "deepseek/*",
      "kimi-coding/k3",
      "kimi-coding/k3-256k"
    ]
  }
}
```

`setup-pi` renders those fields into its managed `agent/settings.json`. It does not create, merge, validate, back up, or roll back `agent/auth.json`.

## Context

- The active isolated profile has an empty `auth.json`, no default provider/model, and `pi --list-models` reports no available models.
- Pi `0.84.2` already contains seven `openai-codex` models, two `deepseek` models, and Kimi `k3`/`k3-256k`; no provider or package upgrade is required.
- The existing OpenCode auth file contains static DeepSeek and Kimi API credentials, plus rotating OpenAI OAuth state. Static keys may be resolved by reference; rotating OAuth state must not be copied across clients.
- The v1 manifest deliberately rejected provider/model fields. This task changes that contract explicitly rather than bypassing it with a manual edit to generated settings.

## Goals

- Make `openai-codex/gpt-5.6-sol` the durable default.
- Expose all built-in Codex and DeepSeek models plus only the two Kimi K3 variants.
- Preserve credential-free install/startup verification and existing package/skill pins.
- Configure the deployed profile without committing, logging, or duplicating provider secrets.

## Non-goals

- Pi, PI WEB, extension, dotfiles, FRP, nginx, or Auth Mini upgrades.
- Custom providers or a copied model catalog.
- OpenCode auth mutation, key rotation automation, or shared OAuth refresh state.
- Making `setup-pi` a credential manager.

## Manifest Contract

- `schemaVersion: 1` remains a supported legacy contract with exactly the original top-level fields and no model policy. New code may install, verify, and restore it without reinterpretation.
- `schemaVersion: 2` adds one required top-level `models` object. `models` accepts exactly `defaultProvider`, `defaultModel`, and `enabledModels`.
- The v2 validator accepts only the shipped literal policy: provider `openai-codex`, model `gpt-5.6-sol`, and the ordered enabled array `openai-codex/*`, `deepseek/*`, `kimi-coding/k3`, `kimi-coding/k3-256k`. It performs no trim, case folding, glob normalization, thinking suffix parsing, or arbitrary-provider acceptance.
- Duplicate, reordered, missing, additional, or differently cased policy values fail closed. A future policy change requires an explicit validator, manifest, and test update.
- `renderActiveConfig()` preserves the source schema and records the non-secret model policy only for v2. `renderPiSettings()` omits model fields for v1 and emits all three upstream fields for v2.
- The existing `active-config.v1.json` filename denotes the installer artifact envelope, not the nested manifest schema, and does not change.

`settings.json` remains a fully managed file. A user edit is drift: ordinary install fails closed, `--force` backs it up before replacement, and rollback restores the previous managed version. Pi 0.84.2 model switching persists the selected model into global settings, so live switching is an intentional temporary drift during rollout, not a session-local overlay.

After live switch checks, the operator must switch back to `openai-codex/gpt-5.6-sol`, close the disposable session, run a controlled `setup-pi install --force` reconciliation, restart PI WEB, run strict verify, and prove a fresh session starts on the managed default. The initial v1-to-v2 backup id is recorded separately so later reconciliation backups cannot change the PR-abandonment rollback target.

## Runtime Credential Boundary

### DeepSeek and Kimi

The active Pi `auth.json` receives only command-backed API-key references:

- Pi provider `deepseek` resolves the existing OpenCode `deepseek` static key.
- Pi provider `kimi-coding` resolves the existing OpenCode `kimi-for-coding` static key.

The one-time configurator must verify both source entries are static API credentials, the source is a regular `0600` file owned by the current user, and the target is absent or a regular `0600` file owned by that user. It uses Pi 0.84.2's own `AuthStorage`/`proper-lockfile` implementation rather than an external rename.

Before mutation, PI WEB and sessiond are stopped after checking for valuable active sessions. For each task-owned entry, only `absent -> exact task reference` or `exact task reference -> no-op` is allowed; any different existing entry blocks without overwrite. A worktree-local non-secret ownership record stores only provider id, before-state class, exact command-reference checksum, and task-created boolean. Rollback deletes an entry only if it still equals the task reference. OAuth ownership is established by `openai-codex` being absent before the operator starts the task login; later refresh remains task-owned without storing token-derived evidence.

The command references use fixed provider selectors and an absolute owner-only source path. Active PI WEB/sessiond environments must contain none of the ambient DeepSeek/Kimi credential variables, so resolver failure cannot fall through to an environment key. Source missing, wrong type, empty key, non-`0600`, missing resolver command, and command failure are negative tests; after a cached failure, the Pi process is restarted before retest. Output is limited to provider/type/status/exit class.

### Codex

The operator completes Pi's own `openai-codex` OAuth flow through PI WEB. Pi stores and refreshes that credential in its own auth file. OpenCode's `openai` OAuth object is never copied, linked, or used as fallback.

## Implementation Scope

- `legion-pi/legion-pi.json`: schema v2 and approved policy.
- `scripts/lib/pi-distro.ts` plus generated runtime JS: v1/v2 types, strict validation, active config, and settings rendering.
- `scripts/setup-pi.ts`/generated JS help text: model policy is managed, credentials are not; verify/rollback accept a valid legacy active v1 profile.
- `scripts/pi-startup-probe.mjs`: construct `ModelRuntime` with an in-memory empty credential store and no model-network refresh, so the startup check remains credential-free even after live auth is configured.
- Regression tests: valid rendering, unknown/nested fields, invalid defaults/patterns, duplicates, schema mismatch, idempotence, drift protection, and rollback.
- `legion-pi/README.md` and root README: operator login, model selection, credential boundary, and recovery.

No committed implementation reads OpenCode auth or writes Pi auth; that remains an explicitly bounded deployment action.

## Rollout

1. Run targeted and full regression suites plus runtime-JS parity checks in the worktree.
2. Install the approved manifest into the existing profile with normal `setup-pi install`; record the resulting v1-to-v2 backup id. Do not use `--force` unless pre-existing managed drift is independently understood.
3. Run `setup-pi verify` and confirm settings/model policy without outputting auth content.
4. Confirm there is no valuable active session, stop PI WEB/sessiond, audit the credential-variable name denylist, and merge the two non-secret command references through Pi's locked auth storage.
5. Restart PI WEB/sessiond, confirm DeepSeek/Kimi availability, and complete dedicated Codex OAuth in PI WEB.
6. Reopen the model selector; verify the bundled and live model oracles separately.
7. In a disposable session, switch to DeepSeek and Kimi, switch back to Codex, then reconcile the expected settings drift with `setup-pi install --force`.
8. Restart PI WEB/sessiond, run strict verify, and prove a fresh session starts on `openai-codex/gpt-5.6-sol`.

## Verification

- Static: config validation, rendered active config/settings, package pins, strict unknown-field rejection, and generated TS/JS parity.
- Lifecycle: v1 fresh install, ordinary v2 upgrade, v2 READY/idempotence, v2 CLI rollback to byte-equivalent v1 active/settings content, v1 READY under the compatibility parser, explicit v2 reinstall, managed settings drift refusal, forced backup, and explicit-id rollback.
- Startup isolation: a configured or failing live auth command cannot be read or executed by the credential-free in-memory startup probe.
- Secret boundary: staged diff scan; source/target permission and auth field-name checks only; no credential values in command output or artifacts.
- Bundled catalog oracle: offline inspection of the pinned 0.84.2 package must equal these 11 ids: `gpt-5.3-codex-spark`, `gpt-5.4`, `gpt-5.4-mini`, `gpt-5.5`, `gpt-5.6-luna`, `gpt-5.6-sol`, `gpt-5.6-terra`, `deepseek-v4-flash`, `deepseek-v4-pro`, `k3`, and `k3-256k`.
- Live selector oracle: it must contain all 11 pinned ids and no `kimi-coding` id outside `k3`/`k3-256k`. Additional authenticated Codex or DeepSeek models from a refreshed upstream catalog are accepted because the approved policy intentionally uses provider wildcards.
- Provider availability: command-backed DeepSeek/Kimi auth resolves successfully; independent Codex OAuth reports configured.
- Bounded smoke: one no-session minimal call through default Codex, one DeepSeek model, and Kimi `k3`; record only command, selected provider/model, exit status, and bounded error class.
- PI WEB: switching to DeepSeek and Kimi succeeds without `unknown/unknown`; after managed reconciliation and restart, strict verify passes and a new session starts on `openai-codex/gpt-5.6-sol`.

## Rollback

- Code/config failure: v2 `setup-pi rollback --to <initial-upgrade-backup-id>` restores the prior v1 managed settings/config batch, which the v2 compatibility parser can verify. The source manifest remains v2; reinstall is explicit.
- Runtime auth failure: with PI WEB/sessiond stopped, delete `deepseek`/`kimi-coding` only when each current entry exactly equals its task reference. Delete `openai-codex` only when the ownership record proves it was absent before this task and the task initiated the login. Preserve unrelated Pi auth entries and all OpenCode state.
- Provider entitlement or OAuth failure blocks runtime acceptance; do not copy OAuth tokens or broaden the model policy as fallback.
- If the PR is abandoned after live rollout, roll back managed settings and task-owned Pi auth entries before worktree cleanup.

## Risks and Residuals

- Command references depend on the OpenCode auth path/schema and an available resolver command. A future schema move requires explicit reconfiguration and fails unavailable when ambient credential variables remain absent.
- Static API key rotation is picked up on the next Pi process because command results are cached for process lifetime.
- Kimi K3 availability depends on account tier; catalog presence does not prove entitlement.
- Credential-free startup proves the distribution can initialize without secrets, not that a paid provider call will succeed.
- `settings.json` is installer-owned; Pi model switching creates managed drift and every live switch test must end with the specified force-reconcile/restart/verify/default sequence.

## Alternatives

- **Manual settings edit**: quickest, but `setup-pi` treats it as drift and future installs are not reproducible. Rejected.
- **Credentials in manifest/Nix**: declarative but leaks secret material into repository or Nix store surfaces and conflates policy with auth. Forbidden.
- **Copy OpenCode auth wholesale**: simple but schemas differ and shared OAuth refresh rotation can break either client. Rejected.
- **Upgrade Pi for model support**: unnecessary because the pinned catalog already contains every requested model. Rejected.

## References

- `.legion/tasks/configure-pi-model-access/plan.md`
- `legion-pi/legion-pi.json`
- `scripts/lib/pi-distro.ts`
- `scripts/setup-pi.ts`
- `tests/regression/setup-pi.test.ts`
- Pi provider/settings documentation shipped with `@earendil-works/pi-coding-agent@0.84.2`
