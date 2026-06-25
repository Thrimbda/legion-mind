# Linear Scheduler Overall Acceptance

## Contract

- **Name**: Linear Scheduler Overall Acceptance
- **Task ID**: `accept-linear-scheduler-overall`
- **Goal**: Perform a careful overall acceptance review of the `scheduler/` Linear + Legion Scheduler prototype and produce a reviewer-ready report that distinguishes local prototype readiness from remaining production-readiness blockers.
- **Problem**: The scheduler spans Linear graph scanning, durable state, worker dispatch, PR delivery gates, parallel locks, reliability, admin controls and security posture. A superficial test-pass statement is not enough; reviewers need an explicit case matrix, evidence, gaps and go/no-go conclusion before relying on it for real work coordination.

## Acceptance Criteria

1. Inventory the scheduler surface area from current repo code and design docs: WI contract policy, SQLite store/state machine, scanner, worker runner, PR tracker/writeback, dispatcher/locks, webhook/retry/recovery, admin/observability/security and CLI boundaries.
2. Execute the strongest local validation available without external credentials: full scheduler regression tests plus representative CLI fixture/smoke commands.
3. Review important acceptance cases and edge cases, including duplicate claims, stale snapshots, blocker satisfaction, cycles, resource conflicts, capacity waits, worker result identity, missing evidence, PR terminal gates, webhook dedupe, retry/backoff, stale recovery, admin pause/cancel/retry/lock release and secret redaction.
4. Produce `docs/acceptance-report.md` with pass/fail/partial status, command evidence, case coverage, uncovered or untested assumptions, production blockers and explicit recommendation.
5. Do not change scheduler production code as part of this acceptance task unless a blocker is separately authorized.

## Scope

- `scheduler/src/**`
- `scheduler/tests/**`
- `scheduler/README.md`
- `docs/linear-legion-scheduler/**`
- Task-local evidence under `.legion/tasks/accept-linear-scheduler-overall/**`

## Non-goals

- No real Linear API project scan, GitHub REST PR tracking or OpenCode worker end-to-end production run unless separately provided with credentials and targets.
- No scheduler behavior changes or bug fixes in this task.
- No claim that the prototype is production-ready merely because local tests pass.
- No replacement of existing WI delivery docs or RFC truth sources.

## Assumptions

- User confirmed the acceptance boundary is **local prototype acceptance**.
- Node.js in the environment supports `--experimental-strip-types` and `--experimental-sqlite` as required by `scheduler/package.json`.
- Fixture-based CLI smoke tests are acceptable evidence for local integration paths that normally depend on external systems.
- Absence of external credentials means production Linear/GitHub/OpenCode behavior remains a risk item rather than a tested fact.

## Constraints

- Repository writes must happen inside `.worktrees/accept-linear-scheduler-overall/` and be delivered through the default Legion git-worktree-pr lifecycle.
- Persistent evidence belongs in this task directory; temporary scheduler artifacts should stay repo-local under `.cache/` when commands create them.
- Report language should be precise enough for a high-stakes release decision and should not hide partial coverage.

## Risks

- Local tests may not exercise live Linear/GitHub API drift, permissions, rate limits or real OpenCode process behavior.
- The scheduler is documented as a local prototype; production-readiness could be overstated if the report collapses prototype acceptance and production acceptance.
- Wide surface area may hide untested cross-component interactions unless the report explicitly tracks gaps.
- CLI smoke commands may mutate only local SQLite state; they do not prove real native writeback side effects.

## Design Summary

- Treat acceptance as a read-mostly verification/review task with no scheduler code changes.
- Use existing design docs as the intended behavior contract, then compare against code/tests and executable local evidence.
- Separate verdicts into: local prototype acceptance, cases verified, cases partially verified, cases not covered without external integration, and production go-live blockers.
- Record command evidence and case matrix in a task-local report so reviewers can audit the reasoning.

## Phases

1. **Contract materialization**: create task docs and confirm scope.
2. **Context inventory**: read scheduler docs, code boundaries and tests.
3. **Verification execution**: run full test suite and CLI fixture/smoke commands.
4. **Acceptance analysis**: map cases to code/tests/results and identify gaps.
5. **Report generation**: write `docs/acceptance-report.md` and supporting test evidence.
6. **Review and delivery**: self-review report, update wiki if durable cross-task knowledge changed, then complete PR lifecycle.
