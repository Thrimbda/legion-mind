# Configure Legion Pi model access - 日志

## 会话进展 (2026-08-19)

### ✅ 已完成

- Confirmed Pi 0.84.2 already bundles 7 Codex OAuth models, 2 DeepSeek models, and Kimi k3/k3-256k.
- Materialized the stable task contract and approved Standard RFC after independent review-rfc-swift-sparrow PASS.
- Implemented strict schema v2 model policy while preserving schema v1 install, verify, explicit rollback, and reinstall compatibility.
- Injected an empty in-memory AuthStorage/ModelRuntime into startup probes and covered environment credential stripping in both lifecycle and startup-matrix fixtures.
- Updated operator docs and generated runtime JavaScript; setup-pi and startup-matrix targeted regressions pass, and a real Pi 0.84.2 credential-free probe passes with the managed default configured.
- Installed schema v2 into the live Legion Pi profile and recorded initial upgrade backup 1787110392204-cdba60fb.
- Stopped PI WEB/sessiond after confirming no active Pi turn, then atomically installed exact DeepSeek/Kimi command references with Pi FileAuthStorageBackend; both resolve successfully and remain owner-only.
- Completed dedicated Pi openai-codex OAuth without copying OpenCode OAuth state.
- Confirmed the pinned 11-model oracle, exact 11-model live selector, fresh default openai-codex/gpt-5.6-sol, successful PI WEB switching across DeepSeek/Kimi/Codex, and one bounded PASS smoke per provider.
- Force-reconciled after switching, restarted services, and returned the live profile to READY.
- Explicitly rolled live v2 back through historical backup `1787110392204-cdba60fb`, verified schema v1, and reinstalled v2; the historical id was consumed and final rollback anchor `1787113970531-7675a002` is current.
- Full repository verification, live lifecycle verification, secret exclusion, and independent `verify-change-playful-dolphin` verification passed.
- Closed both initial `review-change-clever-otter` blockers with complete operator quiesce/restart guidance, durable literal/schema rejection cases, and READY-v2 idempotent reinstall coverage; full verification passed again.
- Re-ran independent verification and security-aware review against the final implementation; both current Verdicts are `PASS` with zero open findings.
- Generated `report-data.json` and renderer-derived HTML/Markdown/PR body, then wrote the Legion Wiki current-truth update. HTML review disposition is local artifact only; no public preview surface was added.

(暂无)
### 🟡 进行中

- Complete branch rebase, commit, PR checks/review/merge, worktree cleanup, and main-workspace refresh.
### ⚠️ 阻塞/待定

- `docs/test-report.md`: primary repository and live verification evidence.
- `docs/verify-change.md`: independent verification PASS.
- `docs/review-change.md`: current security-aware review PASS with historical blockers marked closed.
- `docs/report-data.json`: reviewer artifact source of truth.
- `docs/report-walkthrough.html`: local rendered reviewer artifact.
- `.legion/wiki/tasks/configure-pi-model-access.md`: durable task summary.

(暂无)
(暂无)
(暂无)
---

## 关键文件

(暂无)
---

## 关键决策

| 决策 | 原因 | 替代方案 | 日期 |
|------|------|----------|------|
| Treat Pi --list-models as the full authenticated catalog and validate enabledModels through resolveModelScopeWithDiagnostics/the fresh session scope instead. | The full catalog correctly includes two older Kimi models, while the selector scope must and does exclude them. | Misclassify the full catalog as selector drift; broaden enabledModels; remove Kimi provider auth. | 2026-08-19 |
---

## 快速交接

**下次继续从这里开始：**

1. Run final secret/diff/status checks, commit only the intended delivery files, then fetch and rebase onto `origin/master`.
2. Push the task branch, create a squash PR from generated `docs/pr-body.md`, enable auto-merge, and follow checks/review to terminal state.

**注意事项：**

- Live services are active and profile verify is READY; auth ownership record is ignored under `.cache` and contains checksums/metadata only.
- Use final rollback anchor `1787113970531-7675a002`; `1787110392204-cdba60fb` is historical and already consumed.
---

*最后更新: 2026-08-19 04:30 by Legion CLI*
