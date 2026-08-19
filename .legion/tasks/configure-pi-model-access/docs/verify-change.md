# Independent Verification: Configure Legion Pi Model Access

- **Reviewer**: `verify-change-playful-dolphin`
- **Role**: independent `verify-change` agent
- **Verified at**: 2026-08-19T13:04:53+08:00
- **Reviewed inputs**: `AGENTS.md`, `plan.md`, approved `docs/rfc.md`, `docs/review-rfc.md`, historical `docs/review-change.md`, final implementation diff, and `docs/test-report.md`
- **Result**: PASS

## Verification Boundary

This final verification reran repository tests and used bounded read-only live inspection. It did not repeat the live install, run `provider-smoke.mjs`, stop or restart a service, switch a model, alter settings or auth, initiate login, or print any credential value. Auth output was restricted to ownership/mode, provider ids, credential types and field names, exact task-reference classification, OAuth presence, and bounded resolver status.

## Checks Run

| Surface | Command or check | Result | Evidence |
| --- | --- | --- | --- |
| Schema compatibility and literal policy | Committed table-driven setup regression plus direct parser/render inspection | PASS | Schema v1 validates without model fields and renders no model policy. Schema v2 renders the exact approved provider, model, and ordered four-entry allowlist. The durable 13-case table rejects missing models, unsupported schema, v1 carrying models, missing nested policy, wrong literals, case/whitespace changes, reorder, duplicate, missing/additional patterns, and unknown nested fields. |
| Generated TS/JS parity | Read-only reproduction of `scripts/build-runtime-js.mjs` over all seven generated pairs | PASS | 7/7 generated JavaScript files were byte-equivalent to their TypeScript-derived output, both before and after packaging. |
| Regression suite | `npm run test:regression` | PASS | 61/61 tests passed. Relevant coverage includes v1 install/verify, v1-to-v2 upgrade and byte-equivalent rollback, the complete literal/schema table, v2 reinstall, a second ordinary READY-v2 install with unchanged managed/auth bytes and backup count, managed settings drift refusal/force reconciliation, auth-file non-ownership, and in-memory startup credential isolation. |
| Resolver failure matrix | `node .cache/configure-pi-model-access/negative-resolver.mjs` | PASS | The valid fixture resolved. Missing source, wrong type, empty key, wrong mode, missing resolver, and command failure all returned nonzero with empty output. |
| Packaging | `npm run pack:dry-run` | PASS | Prepack regenerated runtime JavaScript without diff and the package contained 72 intended files, including the model-policy runtime and startup probe. |
| Repository hygiene | `npm run audit:context`; `git diff --check HEAD` | PASS | Context audit reported no failures and the diff has no whitespace errors. |
| Secret exclusion | `node .cache/configure-pi-model-access/secret-scan.mjs` | PASS | The final post-fix scan covered all 18 changed/untracked delivery files, including this report and the historical review, against seven exact credential values and found no match. No secret value appeared in command output or this artifact. |

## Live Evidence

| Claim | Check | Result | Current evidence |
| --- | --- | --- | --- |
| Strict active profile | Current install-state/managed checksum inspection plus the recorded post-install verify | PASS | Latest state is `verify`/`READY` with zero warnings and zero failures; all three managed checksums match current bytes. The real credential-free startup probe passed in the recorded verify and in the earlier independent live verify. |
| Active generated configuration | Bounded JSON assertion over active config, settings, and managed-file metadata | PASS | Active schema is v2; settings and active config contain the exact literal model policy; `auth.json` is not a managed target. |
| Model-switch drift protection and operator sequence | Regression lifecycle, final README, and reconciled live state | PASS | Ordinary install refuses switched settings and force install restores the reviewed default. The README now requires close/quiesce, force reconcile, restart, verify `READY`, and fresh-session default confirmation; the current settings are reconciled. |
| READY-v2 idempotent live reinstall | Recorded quiesced execution plus independently checked current aftermath | PASS | `docs/test-report.md` records `OK_INSTALL legion-pi copied=0 linked=0 skipped=3` with unchanged managed/auth metadata and backup count. Current read-only checks show the same exact auth references, current managed checksums, a one-entry backup index at `1787113970531-7675a002`, `READY`, and active restarted services. The committed isolated regression reproduces the same invariants. |
| Services | User-scope `systemctl` state and fixed-name process-environment inspection | PASS | `pi-web.service` and `pi-web-sessiond.service` are active/running. Their current main-process environments contain none of `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`, or `KIMI_API_KEY`. |
| Task-owned static references | `node .cache/configure-pi-model-access/configure-auth.mjs status` | PASS | `deepseek` and `kimi-coding` both classify as `exact`; Pi Codex OAuth is present. |
| Bounded credential resolution | `node .cache/configure-pi-model-access/configure-auth.mjs resolve-check` | PASS | `deepseek` and `kimi-coding` both report `resolved`; no resolved value was output. |
| Auth metadata and ownership | Bounded metadata assertion over source, target, and ownership record | PASS | Source, target, and ownership record are regular current-user `0600` files. Source static entries are type `api`; target static entries are type `api_key`; `openai-codex` is type `oauth` with OAuth field names present. The ownership record shows both static entries and the OAuth lifecycle were absent before this task and task-created/initiated. |
| Pinned offline catalog | Direct read of pinned `pi-coding-agent`/`pi-ai` 0.84.2 built-in provider data | PASS | Policy projection is exactly seven Codex, two DeepSeek, and `k3`/`k3-256k`, for 11 models. Raw Kimi data also contains the two legacy entries intentionally excluded by policy. |
| Full authenticated catalog | Credential-isolated `pi --list-models` with `PI_OFFLINE=1` | PASS | The full catalog currently has 13 relevant entries: the 11 policy models plus `kimi-for-coding` and `kimi-for-coding-highspeed`. This command was not used as selector evidence. |
| Selector and fresh default | `node .cache/configure-pi-model-access/verify-live-session.mjs` | PASS | `resolveModelScopeWithDiagnostics()` returned exactly the approved 11 selector entries, no diagnostics, and a fresh in-memory session selected `openai-codex/gpt-5.6-sol`. |
| Final rollback anchor | Read-only backup-index and backup-content assertion | PASS | Latest anchor is `1787113970531-7675a002`; both backup files are safe regular files and restore schema v1 active config plus settings with no model policy. The earlier upgrade anchor was consumed by the recorded rollback and is correctly historical rather than the current final anchor. |

## Test Report Assessment

`docs/test-report.md` accurately distinguishes the three model oracles:

| Oracle | Verified meaning | Current result |
| --- | --- | --- |
| Pinned catalog | Exact policy projection over bundled Pi 0.84.2 provider data | 11 exact models |
| Full live catalog | All currently authenticated provider models shown by `pi --list-models` | 13 models, including two legacy Kimi entries |
| Selector scope | Models admitted by managed `enabledModels` through `resolveModelScopeWithDiagnostics()` | Exactly 11 models; legacy Kimi entries excluded |

The report's 61-test and 72-file packaging counts reproduced exactly. Its final 18-file secret-scan count also reproduced. The live lifecycle narrative is consistent with the current schema-v2 state, quiesced idempotent reinstall, restarted services, and valid final schema-v1 rollback anchor. The earlier `1787110392204-cdba60fb` id is correctly identified as consumed; only `1787113970531-7675a002` remains current.

## Review Blocker Closure

| Historical blocker | Final evidence | Status |
| --- | --- | --- |
| Lifecycle guidance could race the settings writer and named a consumed anchor as current | `legion-pi/README.md` now requires closing the disposable session, proving quiescence or stopping both PI WEB units, force reconciliation, service restart, `READY`, and a fresh-session default check. `log.md` and `test-report.md` identify the old id as consumed and the final anchor as current. | CLOSED |
| Literal/schema and READY-v2 idempotence regression evidence was not persistent | `tests/regression/setup-pi.test.ts` now contains the durable 13-case literal/schema rejection table and a second ordinary READY-v2 install asserting unchanged managed bytes, unrelated auth bytes, and backup count. The full 61-test suite passes, and the quiesced live execution records `skipped=3` with the same final anchor. | CLOSED |

## Findings

No blocking finding, security issue, test failure, unverifiable required static claim, or contract drift remains. Both findings in the historical `review-change.md` are closed by the final diff and evidence above; this verification does not replace the required independent review-change re-review.

- Schema v1/v2 behavior and the exact schema-v2 literal policy match the approved RFC.
- Generated active config/settings behavior, persistent literal rejection, READY-v2 idempotence, drift protection, startup credential isolation, and generated TS/JS parity are covered and pass.
- Live settings, selector, default, idempotent-install aftermath, service state, auth metadata, exact references, resolver status, and rollback anchor all match the acceptance contract.
- Credentials remain outside Git, generated settings, managed-file metadata, package contents, and verification output.

## Residual Risks

- The independent verifier did not repeat paid provider calls because the task boundary explicitly forbids them. Current end-to-end provider response and entitlement therefore rely on the same-day three-provider PASS evidence in `docs/test-report.md`, while current auth/reference/selector readiness was independently rechecked.
- The independent verifier did not repeat browser model switching because that would intentionally mutate managed settings and require service/session lifecycle actions. The earlier operator attestation remains the browser-specific evidence; current post-reconciliation READY state, exact selector, and fresh default were independently reproduced.
- The independent verifier did not repeat the live ordinary install because the final boundary is read-only. Its exact no-op result is recorded in `docs/test-report.md`; the persistent isolated regression and current one-anchor/exact-auth/READY aftermath independently support it.
- The ignored auth helper records the initial static-entry classification from a read immediately before, rather than inside, Pi's lock. The executed rollout was quiesced and current entries remain exact, so this is non-blocking for this task; future reuse should return before-state from the locked callback and validate the ownership record's fixed providers/checksums before rollback.
- Provider entitlement, OAuth expiry, upstream availability, and future source-schema/key rotation remain operational risks. The current resolver and OAuth metadata are healthy, and failures remain bounded by the documented fail-closed behavior.

## 中文摘要

独立复验通过。历史审查的两个阻塞项均已关闭：README 已补齐关闭会话、隔离 settings writer、强制 reconciliation、重启、`READY` 验证和新会话默认模型确认；提交的回归测试已固化完整 literal/schema 负例和 READY-v2 二次普通安装幂等性。最终 61 项回归、7 组 TS/JS 一致性、72 文件打包、context/diff 检查和 18 文件精确 secret scan 均通过。

线上 profile 当前为 `READY`，两个 PI WEB 服务均在运行，selector 恰好为 11 个目标模型，新会话默认 `openai-codex/gpt-5.6-sol`。DeepSeek/Kimi 引用精确且可解析，Codex OAuth 元数据存在，最终备份索引仅保留有效锚点 `1787113970531-7675a002`。本次按只读边界未重复线上安装、付费 smoke 或浏览器切换；它们由持久回归、当前线上 aftermath 和同日记录支撑，作为非阻塞残余风险保留。

## Verdict
PASS
