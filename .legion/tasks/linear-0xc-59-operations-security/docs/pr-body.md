## Summary

- Add scheduler admin service/CLI for reconcile, run inspect/list/retry/cancel, locks list/release, and project pause/resume/health.
- Add durable `project_controls` pause/security-blocked state and enforce it before new claims and pending worker launch.
- Add structured observability helpers, secret redaction, security validation, PermissionChange security blocking, README commands, and security checklist.

## Verification

- `npm --prefix scheduler test` — 57/57 PASS

## Legion evidence

- Plan: `.legion/tasks/linear-0xc-59-operations-security/plan.md`
- RFC: `.legion/tasks/linear-0xc-59-operations-security/docs/rfc.md`
- RFC review: `.legion/tasks/linear-0xc-59-operations-security/docs/review-rfc.md`
- Test report: `.legion/tasks/linear-0xc-59-operations-security/docs/test-report.md`
- Change review: `.legion/tasks/linear-0xc-59-operations-security/docs/review-change.md`
- Walkthrough: `.legion/tasks/linear-0xc-59-operations-security/docs/report-walkthrough.md`

Linear: https://linear.app/0xc1/issue/0XC-59/wi-08-add-admin-cli-observability-and-security-hardening
