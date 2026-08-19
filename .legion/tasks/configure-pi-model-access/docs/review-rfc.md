# RFC Review: Legion Pi model policy and credential boundary

- **Reviewer**: `review-rfc-swift-sparrow`
- **Role**: independent `review-rfc` reviewer
- **Reviewed sources**: current on-disk `plan.md`, current revised `docs/rfc.md`, current setup implementation, and exact published Pi `0.84.2` artifacts
- **Verdict**: **PASS**

This review supersedes the earlier obsolete **FAIL** report that previously occupied this file.

## Blocking Findings

None.

## Gate Assessment

### 1. Dual v1/v2 parser and rollback: closed

The revised RFC defines two non-overlapping contracts: v1 retains exactly the original fields and renders no model policy, while v2 requires one strict `models` object and preserves its schema in active config. That is a bounded discriminated parser change, not an uncontrolled schema expansion (`docs/rfc.md:51-59`).

The lifecycle is feasible with the current installer. Install already backs up each changed managed target before replacement (`scripts/lib/setup-core.ts:390-430`), verify loads the active profile rather than assuming the source manifest (`scripts/setup-pi.ts:652-679`), and explicit-id rollback restores prior bytes and managed metadata before reloading the restored active config (`scripts/lib/setup-core.ts:534-570`, `scripts/setup-pi.ts:806-870`). Once the shared parser accepts both schemas, a v2 upgrade can therefore restore and verify byte-equivalent v1 active config and settings. The RFC also separates the initial upgrade backup id from later force-reconciliation backups and specifies the full v1-to-v2-to-v1-to-v2 regression sequence (`docs/rfc.md:62`, `docs/rfc.md:108`, `docs/rfc.md:117-122`).

### 2. Pi model-switch settings drift: closed

Pi `0.84.2` persists model selection into global settings: `AgentSession.setModel()` and both cycle paths call `SettingsManager.setDefaultModelAndProvider()`, which writes `defaultProvider` and `defaultModel` (`dist/core/agent-session.js:1197-1262`, `dist/core/settings-manager.js:452-458`). The revised RFC now treats that write as expected temporary managed drift rather than a session-only overlay (`docs/rfc.md:60`).

The prescribed sequence is complete: switch back to `openai-codex/gpt-5.6-sol`, close the disposable session, force-reconcile with backup, restart PI WEB, run strict verify, and prove a fresh session uses the managed default (`docs/rfc.md:62`, `docs/rfc.md:97-103`, `docs/rfc.md:115`). Pi's CLI also prefers the saved default when it is inside the enabled scope (`dist/main.js:380-400`), so the default and wildcard policy are compatible. The separately recorded initial backup id keeps abandonment rollback deterministic after reconciliation creates newer backup batches.

### 3. Auth ownership, fail-closed behavior, and auth-free startup: closed

The revised RFC establishes an implementable ownership protocol before any auth mutation: stop PI WEB/sessiond, validate owner/type/mode, permit only `absent -> exact task reference` or exact-reference no-op, reject conflicts, record only non-secret ownership facts, and conditionally remove only task-owned entries during rollback (`docs/rfc.md:73-77`, `docs/rfc.md:99-100`, `docs/rfc.md:117-122`). Pi's `FileAuthStorageBackend.withLockAsync()` holds its `proper-lockfile` lock across read-modify-write, so the required exact-entry check can occur inside the same Pi-compatible lock (`dist/core/auth-storage.js:76-155`, `dist/core/auth-storage.js:379-405`). OpenAI Codex is OAuth-only in the pinned provider and Pi login/refresh persist through the credential store, making a separate Pi-owned OAuth lifecycle feasible without copying OpenCode refresh state.

Pi command-backed keys return a cached unresolved value when the command is missing, fails, or prints empty output; the standard DeepSeek/Kimi resolver can then consult `DEEPSEEK_API_KEY` or `KIMI_API_KEY`. The RFC now closes that fallback explicitly by requiring those ambient credential variables to be absent from active service environments, negative-testing every resolver/source failure class, and restarting after a cached failure (`docs/rfc.md:77`, `dist/core/resolve-config-value.js:117-188`, Pi AI `dist/auth/helpers.js:7-29`). This is fail-closed under the stated runtime boundary.

The startup-probe design is also supported by the pinned API. `ModelRuntime.create()` accepts an injected `CredentialStore`, disables create-time network refresh unless explicitly enabled, and can skip initial refresh; `createAgentSession()` accepts that runtime (`dist/core/model-runtime.d.ts:3-19`, `dist/core/model-runtime.js:74-108`, `dist/core/sdk.js:66-73`). An empty in-memory store therefore prevents the probe from reading or executing live `auth.json` references while still loading the static runtime and extensions. The required sentinel regression makes this boundary verifiable (`docs/rfc.md:88-89`, `docs/rfc.md:109`).

### 4. Literal policy and separate catalog oracles: closed

The validator contract is now literal and exhaustive: exact provider/model strings, exact ordered enabled array, no normalization or thinking-suffix interpretation, strict duplicate/reorder/additional-field rejection, and an explicit code/test change for any future policy update (`docs/rfc.md:53-57`). This removes implementation discretion around wildcard acceptance.

The exact Pi `0.84.2` package data supports the proposed policy:

- `openai-codex`: seven required models, including `gpt-5.6-sol`
- `deepseek`: `deepseek-v4-flash` and `deepseek-v4-pro`
- `kimi-coding`: `k3` and `k3-256k` are present; the raw bundle also contains `kimi-for-coding` and `kimi-for-coding-highspeed`, which the two literal Kimi entries intentionally exclude

The RFC now separates provenance correctly. The pinned-offline oracle requires the exact 11 policy-selected bundled ids, while the live selector oracle requires those 11, rejects any additional Kimi id, and permits additional Codex/DeepSeek ids admitted by the intentional provider wildcards (`docs/rfc.md:111-115`). Remote catalog growth can no longer make the pinned exact-count claim ambiguous.

## Non-Blocking Implementation Guardrails

- `AuthStorage` and `FileAuthStorageBackend` are internal Pi `0.84.2` modules rather than public root exports. The bounded configurator must load the validated pinned module path and perform compare-and-write or compare-and-delete inside `withLockAsync()`; an unlocked read followed by `AuthStorage.delete()` would not satisfy the approved design.
- The offline oracle must project the literal policy over the pinned provider data, not count every raw `kimi-coding` entry. The raw Kimi catalog has four entries, while the approved policy intentionally selects two.
- Force reconciliation must run only after the disposable session has closed and no settings writer remains active. If that cannot be demonstrated operationally, stopping PI WEB/sessiond before reconciliation is the safe implementation of the RFC's controlled sequence.

## Conclusion

**PASS**. The revised RFC is implementable, independently verifiable, security-bounded, and rollbackable. It closes the earlier parser/rollback, settings-drift, auth ownership/startup-isolation, and validator/catalog-oracle blockers. Provider entitlement or interactive OAuth failure may still block runtime acceptance, but the RFC correctly treats those as fail-closed rollout outcomes rather than reasons to leak credentials, share OAuth state, or broaden policy.

No runtime auth file or credential value was read, modified, or exercised during this review.

## Verdict
PASS
