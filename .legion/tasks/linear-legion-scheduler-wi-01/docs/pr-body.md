## Summary

- 完成 `linear-legion-scheduler` 的 WI-01，新增 `docs/linear-legion-scheduler/linear-wi-contract-policy.md`。
- 该 policy 明确定义 Linear issue template、label taxonomy、state mapping、ready/skipped 判定、blocker terminal gate、Linear Native Agent control-plane 边界、terminal 术语、example issues 与 5-node DAG walkthrough。
- 更新 scheduler docs index 与 WI-01 work item，链接交付产物并标记 WI-01 验收项完成。

## Evidence

- Task contract: `.legion/tasks/linear-legion-scheduler-wi-01/plan.md`
- Verification: `.legion/tasks/linear-legion-scheduler-wi-01/docs/test-report.md`
- Review: `.legion/tasks/linear-legion-scheduler-wi-01/docs/review-change.md`
- Walkthrough: `.legion/tasks/linear-legion-scheduler-wi-01/docs/report-walkthrough.md`

## Validation

- `git diff --check` ✅
- WI-01 policy acceptance checks ✅

`npm run test:regression` 未运行：本 PR 只改文档与 Legion task evidence，不触及 runtime code、installer、package metadata 或 test fixtures。

## Review notes

- `review-change`: PASS
- Security lens applied: PASS。文档保持 Scheduler DB 为 machine truth，Linear labels/status/AgentSession 只作为 presentation/control plane。

## Reviewer checklist

- [ ] Policy 是否足以让 WI-03 scanner 实现 eligibility parser / skipped reasons？
- [ ] `isBlockerSatisfied()` 是否避免 PR open / Linear Done / AgentSession complete 误解锁 downstream？
- [ ] WI-01 examples 与 DAG walkthrough 是否覆盖 ready 和 skipped 场景？
