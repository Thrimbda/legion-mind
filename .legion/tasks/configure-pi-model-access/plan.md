# Configure Legion Pi model access

## 目标

Make the deployed Legion Pi profile durably expose all built-in OpenAI Codex OAuth models, all built-in DeepSeek models, and Kimi K3/K3-256K, with openai-codex/gpt-5.6-sol as the default, while keeping every credential out of Git and Nix store outputs.

## 问题陈述

The deployed isolated Legion Pi profile has an empty auth.json and intentionally omits defaultProvider/defaultModel, so Pi reports no available models and PI WEB falls back to unknown/unknown even though compatible provider credentials exist in separate OpenCode state.

## 验收标准

- [ ] The Legion Pi manifest and setup lifecycle support an exact default provider/model and enabled-model policy without accepting arbitrary new config surfaces.
- [ ] Generated profile settings select openai-codex/gpt-5.6-sol and enable openai-codex/*, deepseek/*, kimi-coding/k3, and kimi-coding/k3-256k while retaining the pinned package/skills configuration.
- [ ] DeepSeek and Kimi credentials are resolved from the existing 0600 OpenCode auth file through non-secret runtime references; no key value is copied into Git, Nix, logs, or review artifacts.
- [ ] Pi uses an independent openai-codex OAuth credential lifecycle completed by the operator and does not copy or share OpenCode OAuth refresh state.
- [ ] The pinned offline catalog contains the exact seven Codex, two DeepSeek, and two Kimi K3 models; the live selector contains at least those models, and after switch/reconciliation PI WEB starts new sessions on gpt-5.6-sol.
- [ ] Regression tests, independent verification/security review, reviewer walkthrough, Wiki writeback, and the PR lifecycle complete with no secret or existing-profile regression.

## 假设 / 约束 / 风险

- **假设**: Axiom remains the execution host and the deployed Pi 0.84.2 catalog continues to contain the verified Codex, DeepSeek, and Kimi K3 model IDs.
- **假设**: The existing OpenCode deepseek and kimi-for-coding entries remain valid static API credentials and its auth file remains owner-only.
- **假设**: The operator can complete one browser-based Pi Codex OAuth flow and has a Kimi plan entitled to k3/k3-256k.
- **约束**: Never print, diff, stage, commit, or place provider credentials or OAuth tokens in Nix store paths; inspect only provider names, credential types, field names, permissions, and success status.
- **约束**: Use a dedicated Pi openai-codex OAuth entry; do not copy the OpenCode openai OAuth object or share refresh tokens across clients.
- **约束**: Do not change the pinned Pi/extension versions, PI WEB package, dotfiles network/auth topology, or existing OpenCode auth contents.
- **约束**: Model policy is managed by setup-pi; credential state remains user-owned runtime state and setup must not overwrite unrelated auth entries.
- **约束**: Auth mutation uses Pi's own file lock with exact-entry ownership checks; model-switch verification must reconcile the managed settings drift and restore the approved default before acceptance.
- **风险**: Expanding the manifest schema incorrectly could make setup-pi accept uncontrolled configuration or overwrite operator settings.
- **风险**: Command-backed key references depend on the stable OpenCode auth schema and jq availability; schema or path drift must fail closed with a clear verification error.
- **风险**: Codex OAuth is interactive and Kimi K3 availability depends on account entitlement; either can block runtime acceptance without justifying credential leakage or fallback token sharing.
- **风险**: A provider smoke call may incur small external usage and must not record prompt, response, or credential content.
- **风险**: Codex/DeepSeek wildcard catalogs may gain refreshed models; exact-count evidence applies to the pinned offline artifact, while live acceptance permits additional matching provider models.

## 要点

- Keep the declarative model allowlist separate from user-owned auth state.
- Prefer exact provider/model patterns over copying a dynamic model catalog into the manifest.
- Use dedicated OAuth for rotating credentials and command references only for existing static API keys.

## 范围

- 范围内：legion-pi manifest/schema, setup-pi generated settings, regression tests, and operator documentation.
- 范围内：Axiom live profile auth references for DeepSeek/Kimi, dedicated Codex OAuth login, model listing, PI WEB session verification, and bounded provider smokes.
- 范围外：Pi/PI WEB upgrades, custom provider implementation, OpenCode credential mutation, key rotation automation, dotfiles/Nix/network changes, and OAuth token sharing.

## 设计索引 (Design Index)

> **Design Source of Truth**: docs/rfc.md (Standard RFC, approved by `review-rfc-swift-sparrow`)

**摘要**:
- Model selection policy becomes a narrow reviewed manifest surface owned by setup-pi.
- Static API credentials remain in OpenCode state and are resolved only at runtime; Codex receives a separate Pi-owned OAuth lifecycle.
- Verification proves exact model visibility, default selection, provider usability, idempotence, and secret exclusion before PR delivery.

## 阶段概览

1. **Design gate** - Write and independently review the Standard RFC for model policy ownership and credential boundaries
2. **Implementation** - Implement the narrow manifest model policy and setup lifecycle with regression coverage
3. **Runtime configuration** - Apply model policy, configure non-secret DeepSeek/Kimi references, and complete dedicated Codex OAuth
4. **Verification and review** - Verify idempotence, PI WEB default/switch behavior, bounded provider smokes, and secret exclusion
5. **Delivery closeout** - Generate walkthrough, write Wiki disposition, and complete PR lifecycle

---

*创建于: 2026-08-19 | 最后更新: 2026-08-19*
