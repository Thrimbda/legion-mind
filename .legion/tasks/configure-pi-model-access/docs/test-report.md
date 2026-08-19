# Verification Report: Configure Legion Pi Model Access

- **Date**: 2026-08-19
- **Profile**: Standard
- **Result**: PASS
- **Final live rollback anchor**: `1787113970531-7675a002`

## Why these checks

The change affects a strict manifest schema, generated runtime JavaScript, credential isolation, a live managed profile, and paid provider access. Repository tests alone cannot prove the live auth/model behavior, while a provider smoke alone cannot prove rollback or secret exclusion. The verification therefore combines deterministic repository checks, an isolated credential-failure matrix, and a bounded live rollout/rollback exercise.

`pi --list-models` is used only as the full authenticated catalog. It intentionally includes two older Kimi models. The actual selector contract is verified through Pi's `resolveModelScopeWithDiagnostics()` and a fresh SDK session using the managed `enabledModels` setting.

## Repository evidence

| Command | Result | Evidence |
| --- | --- | --- |
| `npm run build:runtime-js` | PASS | Regenerated the checked-in runtime JavaScript from the TypeScript sources. |
| `npm run test:regression` | PASS | 61/61 tests passed, including v1/v2 migration, the full literal/schema rejection table, READY-v2 idempotent reinstall, settings drift protection, startup credential isolation, and all 8 extension matrix rows. |
| `npm run pack:dry-run` | PASS | `lgmind@0.5.0` packed 72 intended files, including generated Pi runtime assets and updated documentation. |
| `npm run audit:context` | PASS | No context budget or required-reference failures. |
| `git diff --check` | PASS | No whitespace errors. |
| `node .cache/configure-pi-model-access/secret-scan.mjs` | PASS | Final scan covered the complete changed/untracked delivery surface against 7 exact credential values without outputting those values; no match. |

## Resolver isolation

`node .cache/configure-pi-model-access/negative-resolver.mjs` returned PASS for a valid fixture and fail-closed `nonzero-empty-output` for every required failure class:

- missing source;
- wrong source credential type;
- empty source key;
- non-`0600` source;
- missing resolver binary;
- resolver command failure.

The live OpenCode source and Pi target were both regular files owned by uid 1000 with mode `0600`. PI WEB and sessiond process environments contained none of `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`, or `KIMI_API_KEY`. The Pi-owned entries remained exact task references, and a resolution check reported only:

```json
{"deepseek":"resolved","kimi-coding":"resolved"}
```

## Live model evidence

The pinned Pi `0.84.2` provider data produced the exact policy-selected offline oracle:

```text
deepseek-v4-flash
deepseek-v4-pro
gpt-5.3-codex-spark
gpt-5.4
gpt-5.4-mini
gpt-5.5
gpt-5.6-luna
gpt-5.6-sol
gpt-5.6-terra
k3
k3-256k
```

The fresh live session reported default `openai-codex/gpt-5.6-sol` and exactly these scoped selector entries:

```text
deepseek/deepseek-v4-flash
deepseek/deepseek-v4-pro
kimi-coding/k3
kimi-coding/k3-256k
openai-codex/gpt-5.3-codex-spark
openai-codex/gpt-5.4
openai-codex/gpt-5.4-mini
openai-codex/gpt-5.5
openai-codex/gpt-5.6-luna
openai-codex/gpt-5.6-sol
openai-codex/gpt-5.6-terra
```

`kimi-coding/kimi-for-coding` and `kimi-coding/kimi-for-coding-highspeed` remained available in the provider's full catalog but were absent from the selector, as required.

The operator completed a dedicated Pi `openai-codex` OAuth login and confirmed PI WEB model switching from DeepSeek to Kimi K3 and back to Codex without `unknown/unknown`. The auth metadata check showed `openai-codex` type `oauth`; token fields and values were not output.

## Provider smoke

`node .cache/configure-pi-model-access/provider-smoke.mjs` ran one ephemeral `--no-session` call per provider with tools, extensions, skills, templates, themes, context files, stdout, and response capture disabled. Only provider/model/status was retained:

```json
[
  {"provider":"openai-codex","model":"gpt-5.6-sol","status":"PASS"},
  {"provider":"deepseek","model":"deepseek-v4-flash","status":"PASS"},
  {"provider":"kimi-coding","model":"k3","status":"PASS"}
]
```

## Live lifecycle

1. The original schema v1 profile verified `READY`.
2. Normal v2 install returned `OK_INSTALL`; initial upgrade backup `1787110392204-cdba60fb` was recorded.
3. PI WEB/sessiond were stopped before auth mutation. The two command references were merged under Pi's `FileAuthStorageBackend` lock, and dedicated Codex OAuth was completed after services restarted.
4. After PI WEB switching, `setup-pi install --force` returned `OK_INSTALL`, followed by `READY` and a fresh default-model PASS.
5. Services were stopped and `rollback --to 1787110392204-cdba60fb` returned `OK_ROLLBACK`. The restored active config was schema v1, settings had no model fields, auth remained intact, and verify returned `READY`.
6. A normal v2 reinstall returned `OK_INSTALL`, creating final rollback anchor `1787113970531-7675a002`.
7. With services quiesced again, a second ordinary v2 install returned `OK_INSTALL legion-pi copied=0 linked=0 skipped=3`. Managed/auth metadata and the one-entry backup index remained unchanged, preserving final anchor `1787113970531-7675a002`; verify returned `READY`.
8. PI WEB and sessiond were restarted; resolver, exact selector, fresh default, and service-environment checks passed again.

## Review blocker closure

The first security-aware review found two delivery blockers. Both received bounded fixes:

- `legion-pi/README.md` now requires closing the disposable session, quiescing PI WEB/sessiond, force-reconciling, restarting, verifying `READY`, and checking the default in a fresh session. The task handoff now identifies `1787110392204-cdba60fb` as consumed and `1787113970531-7675a002` as current.
- The committed validation table now covers unsupported schema, v1 carrying models, missing model fields, wrong values, case/whitespace changes, reorder, duplicate, missing/additional patterns, and unknown nested fields. The migration regression performs a second normal READY-v2 install and asserts unchanged managed/auth bytes and backup count.

After these fixes, runtime JavaScript regeneration, 61/61 regression, pack dry-run, context audit, live idempotent install, `git diff --check`, and exact-secret scan all passed again.

## Failures and skipped items

- No final acceptance check failed. The initial review blockers are retained in the historical review artifact and closed by the evidence above.
- No browser trace, screenshot, prompt, model response, API key, OAuth token, or resolver output was retained. PI WEB switching is supported by operator attestation plus independent selector/default checks and provider smokes.

## Verdict
PASS
