## Summary

- 完成 `linear-legion-scheduler` WI-02：新增 SQLite-backed scheduler core 和 durable state skeleton。
- 新增 run state machine、SQLite migrations、transactional claim API、resource locks、scheduler events、webhook dedupe shape、native / worker outbox 与 debug command。
- 更新 WI-02 交付文档与 scheduler index，明确后续 WI-03 / WI-04 / WI-05 的 repository / outbox 接入边界。

## Verification

- `npm run test:linear-scheduler` — PASS，12 tests。
- `npm run test:regression` — PASS，30 tests。
- `npm run scheduler:debug -- health --db :memory:` — PASS。
- `git diff --check` — PASS。

## Legion Evidence

- Task contract: `.legion/tasks/linear-legion-scheduler-wi-02/plan.md`
- Verification: `.legion/tasks/linear-legion-scheduler-wi-02/docs/test-report.md`
- Review: `.legion/tasks/linear-legion-scheduler-wi-02/docs/review-change.md`
- Walkthrough: `.legion/tasks/linear-legion-scheduler-wi-02/docs/report-walkthrough.md`
- Delivery artifact: `docs/linear-legion-scheduler/scheduler-core-sqlite.md`

## Notes for reviewers

- DB is intentionally SQLite for this WI per user constraint; production DB / workflow-engine hardening remains future work.
- Real Linear API, OpenCode worker launch, PR tracking and webhook HTTP handling remain out of scope for WI-03+.
