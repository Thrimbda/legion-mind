# Change Review: Configure Legion Pi Model Access

- **Reviewer**: `review-change-clever-otter`
- **Role**: independent security-aware `review-change` agent
- **Reviewed at**: 2026-08-19
- **Security lens**: Applied explicitly to auth, OAuth, command-backed credentials, file permissions, service environment, session lifecycle, rollback ownership, and secret handling
- **Result**: **PASS**

This was a read-only review. I did not change implementation or runtime state, invoke a provider, operate services, inspect credential values, commit, or push. The only write is this report.

## Findings

No open finding remains. The two historical blocking findings are closed by the final diff and independent verification evidence below. No new correctness, security, scope, or evidence blocker was found.

## Historical Blocker Closure

### 1. [CLOSED] Lifecycle guidance and rollback handoff

`legion-pi/README.md:66-77` now requires switching back to the managed default, closing the disposable session, proving no active settings writer remains, stopping both PI WEB units, force-reconciling, restarting sessiond/web, obtaining `READY`, and confirming `openai-codex/gpt-5.6-sol` in a fresh PI WEB session. It also forbids using `--force` against unexplained drift. This matches the approved sequence in `.legion/tasks/configure-pi-model-access/docs/rfc.md:60-62` and `.legion/tasks/configure-pi-model-access/docs/rfc.md:97-103`.

`.legion/tasks/configure-pi-model-access/log.md:12-19` and `.legion/tasks/configure-pi-model-access/log.md:48-58` now identify `1787110392204-cdba60fb` as historical and consumed, identify `1787113970531-7675a002` as the current final anchor, and direct delivery to wait for current verification/review PASS. The prior unsafe/stale operator guidance is closed.

### 2. [CLOSED] Literal/schema and READY-v2 idempotence regression evidence

`tests/regression/setup-pi.test.ts:497-516` now contains a durable 13-case table covering missing models, unsupported schema, v1 carrying models, missing nested policy, wrong literals, case/whitespace changes, reorder, duplicate, missing/additional patterns, and unknown nested fields. The exact v2 validator remains unchanged and fail-closed (`scripts/lib/pi-distro.ts:289-361`).

`tests/regression/setup-pi.test.ts:257-320` now performs v1 install/verify, v2 upgrade, explicit-id byte-equivalent v1 rollback/verify, v2 reinstall, and a second ordinary install against READY v2. It asserts all three managed target bytes, unrelated auth bytes, and backup count remain unchanged. The full suite passed 61/61, and the quiesced live equivalent returned `copied=0 linked=0 skipped=3` without changing the current anchor or auth metadata (`.legion/tasks/configure-pi-model-access/docs/test-report.md:92-110`). Independent `verify-change-playful-dolphin` reproduced the repository evidence and verified the live aftermath with a current `PASS` verdict.

## Security Lens

No credential disclosure, startup-isolation defect, ambient fallback in the verified live services, or current auth-entry conflict was found.

- `scripts/pi-startup-probe.mjs:10-28` injects `AuthStorage.inMemory()`, sets `modelsPath: null`, disables create-time refresh, and passes that runtime into `createAgentSession()`. The pinned 0.84.2 implementation confirms this path neither opens live `auth.json` nor performs availability/OAuth/network refresh.
- `scripts/lib/pi-distro.ts:289-402` discriminates external v1/v2 input, enforces the exact ordered v2 literal, preserves schema in active config, omits model settings for validated v1 input, and emits all three settings fields for validated v2 input.
- The ignored `.cache/configure-pi-model-access/configure-auth.mjs` uses fixed absolute selectors, validates source and target owner/type/mode, rejects conflicting entries, performs compare-and-write and compare-and-delete under Pi's `FileAuthStorageBackend.withLockAsync()`, keeps OAuth separate, and emits metadata/status only.
- Current verification rechecked exact static references, dedicated Pi OAuth metadata, owner-only regular files, resolver success, absence of `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`, and `KIMI_API_KEY` from both service processes, and a valid task ownership record without exposing values.
- The post-fix changed/untracked delivery surface was scanned against exact live credential values by the implementation verifier. This re-review adds no credential-derived content, and the reviewed Git diff contains no credential value. No ignored helper is part of the delivery set.

## Evidence Assessment

The positive evidence is otherwise strong and internally consistent:

- Generated TypeScript/runtime-JavaScript parity reproduced for all seven pairs; packaging included the required runtime files.
- 61/61 regression tests passed, including the complete literal/schema table, READY-v2 idempotence, migration, rollback, drift refusal/force reconciliation, auth non-ownership, and startup-runtime injection.
- The pinned offline oracle is exactly seven Codex, two DeepSeek, and two Kimi K3 models.
- The full authenticated catalog is correctly distinguished from the selector: 13 catalog entries versus exactly the approved 11 current selector entries, with legacy Kimi models excluded from scope.
- Same-day bounded smokes passed for default Codex, DeepSeek, and Kimi; PI WEB switching was operator-attested and independently bounded by current selector/default checks.
- Explicit live v1 rollback and v2 reinstall passed; the final schema-v1 rollback anchor was independently inspected and the final profile is `READY` on schema v2.
- Secret-scan, `git diff --check`, context audit, and package dry-run evidence passed.

That evidence proves the present implementation and live state and closes both historical delivery blockers.

## Scope Assessment

The tracked diff is limited to the expected manifest, setup/runtime sources, generated JavaScript, startup probe, tests, and operator documentation. Task documents are the only untracked delivery files. Pi/extension versions, PI WEB packages, OpenCode auth contents, Nix/dotfiles/network topology, and unrelated runtime surfaces are unchanged.

`git status --ignored` reports `.cache/` as ignored; the one-time auth, smoke, resolver, selector, ownership, and secret-scan helpers are not entering delivery. No unintended tracked or untracked file was found outside the declared task/documentation scope.

## Residual Risks

- Paid provider calls and browser switching were not repeated by the independent verifier or this reviewer. They rely on same-day bounded smoke evidence and operator attestation, with current auth/selector/default state independently rechecked.
- This reviewer did not repeat the live ordinary install under the read-only boundary. Its exact no-op result is recorded in `docs/test-report.md`; the committed isolated regression and independently checked one-anchor/exact-auth/READY aftermath corroborate it.
- Provider entitlement, OAuth expiry, upstream availability, and future OpenCode auth-schema/key rotation remain operational risks; the current command references fail closed only while the documented service environment remains free of ambient fallback variables.
- The ignored auth helper derives the ownership record's initial static-entry classification from a read immediately before, rather than inside, the Pi lock (`.cache/configure-pi-model-access/configure-auth.mjs:90-117`). The stopped-service/quiescent rollout and current exact record make this non-blocking for the executed run, but future reuse should return the before-state from the locked callback and validate the record's fixed provider set/checksums before rollback.

## 中文摘要

复审结论为通过，当前开放 finding 为 0，历史两个 blocker 均已关闭。README 已补齐关闭会话、隔离 settings writer、停止并重启 PI WEB、`READY` 验证和新会话默认模型确认；handoff 已明确旧锚点被消费、最终锚点为 `1787113970531-7675a002`。

提交的 13 类 literal/schema 负例和 READY-v2 二次普通安装幂等回归均已落地。最终 61 项回归、7 组 TS/JS 一致性、72 文件打包、context/diff 检查和 18 文件 secret scan 均通过；线上幂等安装 aftermath、精确 auth 引用、11 模型 selector、默认模型、服务环境和最终回滚锚点也经独立复验。未发现新的 correctness、安全、scope 或证据阻塞项。

## Verdict
PASS
