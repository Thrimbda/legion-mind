## Summary

- Add Linear webhook ingestion primitives with raw-body HMAC verification, timestamp replay checks, dedupe persistence, AgentSessionEvent / PermissionChange routing, and a thin Node HTTP handler.
- Add retry taxonomy/backoff and integrate worker timeout/crash retry without creating duplicate active runs.
- Add stale run recovery with worker liveness checks and safe lock release rules.
- Update scheduler docs/tests for WI-07 reliability behavior.

## Verification

- `npm --prefix scheduler test` — 50/50 PASS

## Legion evidence

- Task: `.legion/tasks/linear-0xc-62-webhooks-retry-recovery/plan.md`
- RFC: `.legion/tasks/linear-0xc-62-webhooks-retry-recovery/docs/rfc.md`
- RFC review: `.legion/tasks/linear-0xc-62-webhooks-retry-recovery/docs/review-rfc.md`
- Test report: `.legion/tasks/linear-0xc-62-webhooks-retry-recovery/docs/test-report.md`
- Change review: `.legion/tasks/linear-0xc-62-webhooks-retry-recovery/docs/review-change.md`
- Walkthrough: `.legion/tasks/linear-0xc-62-webhooks-retry-recovery/docs/report-walkthrough.md`

## Linear

Closes 0XC-62.
