# Walkthrough: Linear Scheduler WI-01

> **Profile**: implementation (docs-only)<br>
> **Task**: `linear-legion-scheduler-wi-01`<br>
> **Status**: Ready for PR lifecycle<br>
> **Primary artifact**: `docs/linear-legion-scheduler/linear-wi-contract-policy.md`

## Reviewer summary

WI-01 is complete as a documentation / policy implementation. The change turns the previously defined work item into a concrete Linear-side contract that later scheduler implementation WIs can consume.

The delivered policy defines:

- a copyable Linear issue template;
- label taxonomy with owner / add / remove timing;
- configurable Linear state mapping;
- ready / skipped decision table;
- `isBlockerSatisfied()` terminal gate;
- Linear Native Agent control-plane boundaries;
- terminal success / non-success terminology;
- seven example issues and a five-node DAG walkthrough.

## Scope changed

| Path | Purpose |
|---|---|
| `docs/linear-legion-scheduler/linear-wi-contract-policy.md` | New WI-01 delivery artifact and implementation handoff policy |
| `docs/linear-legion-scheduler/index.md` | Adds reviewer entry link to the WI-01 policy |
| `docs/linear-legion-scheduler/work-items/WI-01-linear-wi-contract.md` | Links the delivery artifact and marks WI-01 acceptance complete |
| `.legion/tasks/linear-legion-scheduler-wi-01/**` | Task contract, log, validation, review and walkthrough evidence |

No runtime scheduler code, Linear API client, database schema, scanner, worker runner, webhook server, GitHub integration or Legion workflow behavior changed.

## Evidence map

| Claim | Evidence |
|---|---|
| Task contract is stable | `.legion/tasks/linear-legion-scheduler-wi-01/plan.md` |
| Implementation is docs-only and within approved design | `plan.md`; `docs/linear-legion-scheduler/rfc.md`; `.legion/tasks/linear-legion-scheduler-rfc/docs/review-rfc.md` |
| WI-01 acceptance is covered | `.legion/tasks/linear-legion-scheduler-wi-01/docs/test-report.md` |
| Validation passed | `test-report.md` records `git diff --check` PASS and WI-01 policy acceptance checks PASS |
| Readiness review passed | `.legion/tasks/linear-legion-scheduler-wi-01/docs/review-change.md` |

## Verification status

**PASS**

Commands recorded in `docs/test-report.md`:

- `git diff --check`
- targeted WI-01 policy acceptance check using `test`, `rg` and example-count assertions

`npm run test:regression` was intentionally skipped because the PR does not change runtime code, package metadata, setup scripts or tests.

## Review status

**PASS**

`review-change` found no blocking scope, correctness, maintainability or security issues. Security lens was applied because the document defines scheduler protocol / trust-boundary behavior; the policy preserves Scheduler DB as machine truth and keeps Linear native agent objects out of terminal-gate decisions.

## Reviewer checklist

- [ ] Confirm `linear-wi-contract-policy.md` is concrete enough for WI-03 scanner implementation.
- [ ] Confirm labels / AgentSession / Linear state are not described as machine truth.
- [ ] Confirm blocker satisfaction does not unlock downstream on PR open, in-review, cancelled or closed-unmerged states.
- [ ] Confirm examples and DAG walkthrough are understandable for future implementers.

## Remaining lifecycle work

This walkthrough does not complete the task by itself. The remaining required lifecycle steps are:

1. `legion-wiki` writeback;
2. commit / rebase / push;
3. PR creation / update;
4. checks / review / auto-merge follow-up;
5. worktree cleanup and main workspace refresh after PR terminal state.
