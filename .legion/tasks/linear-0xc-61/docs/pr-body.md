## Summary

- Add WI-06 parallel dispatch planning/execution with resource locks and capacity limits.
- Add canonical `repo:*` / repo-scoped `area:*` / `mutex:*` parsing and conflict checks inside dispatcher planning and the durable claim transaction.
- Add waiting visibility for lock/capacity/blocker waits, stale-lock inspection hooks, dispatch fixture CLI, docs, and regression coverage.

## Verification

- `npm --prefix scheduler test` — PASS (43 tests)
- `npm run test:regression` — PASS (18 tests)

## Legion Evidence

- Plan: `.legion/tasks/linear-0xc-61/plan.md`
- RFC: `.legion/tasks/linear-0xc-61/docs/rfc.md`
- RFC review: `.legion/tasks/linear-0xc-61/docs/review-rfc.md`
- Test report: `.legion/tasks/linear-0xc-61/docs/test-report.md`
- Change review: `.legion/tasks/linear-0xc-61/docs/review-change.md`
- Walkthrough: `.legion/tasks/linear-0xc-61/docs/report-walkthrough.md`
