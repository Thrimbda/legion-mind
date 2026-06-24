# linear-legion-scheduler-wi-01

## Metadata

- `task-id`: `linear-legion-scheduler-wi-01`
- `status`: `completed-through-review`
- `risk`: `medium`
- `schema-version`: `2026-06-24`
- `historical`: `false`
- `supersedes`: `(none)`
- `superseded-by`: `(none)`

## Outcome Summary

- WI-01 now has a concrete Linear-side scheduling policy artifact: `docs/linear-legion-scheduler/linear-wi-contract-policy.md`.
- The policy turns the approved scheduler RFC into a copyable Linear issue template, label taxonomy, configurable state mapping, ready/skipped rules, blocker terminal-satisfied rules, native agent control-plane boundaries, terminal terminology, examples and a 5-node DAG walkthrough.
- `docs/linear-legion-scheduler/index.md` links the WI-01 policy, and `work-items/WI-01-linear-wi-contract.md` marks its acceptance checklist complete.
- Validation passed with `git diff --check` and targeted policy acceptance checks. `review-change` passed with security lens applied.

## Reusable Decisions

- For the Linear + Legion scheduler MVP, implementation dispatch requires both `agent:ready` and `contract:stable`; `contract:needs-review` remains a hard gate and must not flow into implementation runs.
- Linear labels, Linear status and AgentSession objects are UI/control-plane signals only. Scanner / scheduler implementations must use Scheduler DB state for active runs, terminal gates, resource locks and downstream unlock.
- Future scanner implementation should emit deterministic skipped reasons aligned with the WI-01 policy: `contract_not_stable`, `human_gate`, `dependency_blocked`, `repo_mapping_missing`, `repo_mapping_ambiguous`, `repo_paused`, `project_paused`, `resource_conflict`, `concurrency_limit`, `stale_snapshot`, and related conflict variants.
- Manual Linear Done can satisfy a blocker only when there is no scheduler run and no active agent labels, and it should create an audit event such as `manual_blocker_satisfied`.

## Related Raw Sources

- `plan`: `.legion/tasks/linear-legion-scheduler-wi-01/plan.md`
- `log`: `.legion/tasks/linear-legion-scheduler-wi-01/log.md`
- `tasks`: `.legion/tasks/linear-legion-scheduler-wi-01/tasks.md`
- `test-report`: `.legion/tasks/linear-legion-scheduler-wi-01/docs/test-report.md`
- `review`: `.legion/tasks/linear-legion-scheduler-wi-01/docs/review-change.md`
- `walkthrough`: `.legion/tasks/linear-legion-scheduler-wi-01/docs/report-walkthrough.md`
- `policy`: `docs/linear-legion-scheduler/linear-wi-contract-policy.md`
- `work-item`: `docs/linear-legion-scheduler/work-items/WI-01-linear-wi-contract.md`

## Notes

- This task did not implement scheduler runtime code. It is the policy contract that subsequent implementation WIs should consume.
- PR lifecycle still determines final delivery status; this wiki page records the completed Legion evidence state before GitHub terminal state.
