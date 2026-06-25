# Task Summary: accept-linear-scheduler-overall

## Status

- Date: 2026-06-25
- Outcome: local prototype acceptance PASS; production rollout BLOCKED / not accepted
- Raw evidence: `.legion/tasks/accept-linear-scheduler-overall/`

## Summary

Performed an overall acceptance review of the Linear + Legion Scheduler local prototype across docs, source, tests and CLI smoke paths.

The scheduler passed local prototype acceptance:

- `npm --prefix scheduler test` passed 57/57.
- Local CLI smoke passed for health, scanner fixture, dispatcher fixture, runs list, PR delivery fixture and project health.
- The report covers ready/skipped decisions, claim/DB/terminal gates, worker/evidence validation, PR delivery gates, resource locks, reliability, admin controls and security/redaction.

The scheduler is not production-accepted yet. Live Linear/GitHub/OpenCode integration, production native adapter behavior, security posture, observability, data retention and staged rollout still require separate proof.

## Key Artifacts

- Acceptance report: `.legion/tasks/accept-linear-scheduler-overall/docs/acceptance-report.md`
- Test evidence: `.legion/tasks/accept-linear-scheduler-overall/docs/test-report.md`
- Review evidence: `.legion/tasks/accept-linear-scheduler-overall/docs/review-change.md`
- Reviewer walkthrough: `.legion/tasks/accept-linear-scheduler-overall/docs/report-walkthrough.md`

## Durable Conclusions

- Treat `scheduler/` as a local prototype / sandbox integration candidate, not as production unattended scheduler.
- Before production rollout, run staged validation: real Linear read-only scan, sandbox native writeback, live GitHub PR tracker, real OpenCode worker E2E, then limited parallelism.
- Native stop/cancel lock release needs production hardening so conflicting work does not start until worker side effects are stopped or cleanup is complete.
- README / docs need cleanup for missing `project.json` fixture references, omitted admin-observability test listing and unchecked delivered-WI work item checklists.

## Follow-ups

- Add or correct the README scanner/dispatcher fixture example.
- Add `linear-admin-observability.test.ts` to the README test layout.
- Reconcile WI-04 through WI-08 work-item acceptance checklists with delivered artifacts.
- Ensure production Linear state writeback uses configured mapping, not suggested state-name hints.
