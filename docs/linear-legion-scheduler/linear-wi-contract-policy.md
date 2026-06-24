# Linear WI Contract and Scheduling Policy

> **WI**: [WI-01 Linear WI contract and scheduling policy](work-items/WI-01-linear-wi-contract.md)<br>
> **Audience**: WI-02 / WI-03 / WI-04 implementers and humans preparing Linear issues for scheduler execution.<br>
> **Status**: WI-01 delivery artifact.<br>
> **Design source**: [RFC: Linear + Legion 自动调度器](rfc.md)

## 1. Core rules

1. **Linear is the human queue, not the machine truth.** Linear issues, labels, states, comments and native agent UI help people see and steer work. Scheduler DB owns claims, attempts, locks, terminal gates and downstream unlock decisions.
2. **MVP implementation runs require `contract:stable`.** `contract:needs-review` is not auto-runnable. A future brainstorm-only run kind must have separate state, locks, completion semantics and human review.
3. **Labels are coarse indexing.** They make issues searchable and visible. They do not prove an active run, a successful terminal state or blocker satisfaction.
4. **`isBlockerSatisfied()` is the only downstream unlock gate.** Linear Done, PR open, PR in review or AgentSession complete are not enough.
5. **Native agent objects are presentation/control plane.** `Issue.delegate`, AgentSession, Activities, Agent Plan, externalUrls and stop signals never replace Scheduler DB truth.

## 2. Copyable Linear issue template

Use this template for any WI intended for scheduler execution. The scheduler may parse it directly, but humans should still be able to read it without knowing implementation details.

```md
## Goal
One or two sentences describing the outcome. Include why this WI matters.

## Acceptance Criteria
- [ ] Observable result 1
- [ ] Observable result 2
- [ ] Required evidence or artifact

## Scope
- Files, packages, systems or documents this WI may change.
- Allowed behavior changes.

## Out of Scope
- Explicit non-goals.
- Work that must become a separate WI.

## Dependencies / Blockers
- Blocks: <issue identifiers this WI blocks, if any>
- Blocked by: <issue identifiers that must be terminal-satisfied first>
- Manual dependencies: <external decisions or approvals>

## Repo / Package
- repo: <repo-key matching scheduler config>
- package: <optional package or workspace>
- area: <area hint such as docs, cli, scheduler-core>
- mutex: <optional mutually exclusive resource, such as db-migration>

## Risk Level
- risk: low | medium | high
- design gate hint: none | lightweight | RFC
- rollback note: <how to undo or stop safely>

## Verification
- Commands, document checks, manual walkthroughs, fixtures or review evidence required.

## Delivery Notes
- Expected PR / artifact shape.
- Special reviewer instructions.
- Linear native agent notes, if human interaction may be needed.
```

### Minimum parseable fields

| Field | Required for auto-run | Scheduler use | Missing field behavior |
|---|---:|---|---|
| Goal | yes | Worker prompt summary and human review context | `contract_missing_goal`; add `contract:needs-review` |
| Acceptance Criteria | yes | Verification and Legion task acceptance | `contract_missing_acceptance`; do not dispatch |
| Scope | yes | Worktree / reviewer scope guard | `contract_missing_scope`; do not dispatch |
| Out of Scope | yes | Prevents hidden scope expansion | `contract_missing_non_goals`; do not dispatch |
| Dependencies / Blockers | yes, can be empty | DAG edges and `isBlockerSatisfied()` input | Treat unknown blockers as unresolved |
| Repo / Package | yes | Repo mapping, branch/worktree routing, resource locks | `repo_mapping_missing`; do not dispatch |
| Risk Level | yes | Legion design gate hint | `risk_missing`; do not dispatch until labeled or configured |
| Verification | yes | Required evidence and test-report expectations | `verification_missing`; do not dispatch |
| Delivery Notes | optional | PR body, Linear writeback, reviewer hints | Keep runnable if other fields are stable |

## 3. Label taxonomy

Labels support filtering, queue views and coarse state hints. They must be normalized before use. Scheduler DB remains authoritative for active run, terminal success and downstream unlock.

| Label | Owner | Add when | Remove when | Notes |
|---|---|---|---|---|
| `agent:ready` | Human owner or scheduler admin | Issue has enough Linear-side context to be considered by scheduler | Human pauses the issue, contract regresses, or issue leaves candidate state | Required for MVP auto-run |
| `agent:queued` | Scheduler | Claim transaction succeeds but worker has not started | Worker starts, claim is cancelled, or claim fails | UI hint only; active claim lives in DB |
| `agent:running` | Scheduler | Active attempt starts | Attempt enters in-review, blocked, failed, cancelled or done | UI hint only; active run lives in DB |
| `agent:blocked` | Scheduler or human owner | Dependency, review, infra, permission, verification or lifecycle blocker exists | Blocker is cleared and scheduler records event | Should include skipped / blocked reason in activity or comment |
| `agent:needs-human` | Scheduler or human owner | Human decision, missing permission, native stop, ambiguity or unsafe action required | Human resolves and records outcome | Hard gate: issue is not implementation-ready |
| `contract:stable` | Human owner or reviewer | Goal, acceptance, scope, non-goals, repo and verification are stable enough to start Legion | Contract changes materially or reviewer finds ambiguity | Required for MVP implementation runs; does not skip Legion `brainstorm` if worker detects drift |
| `contract:needs-review` | Scheduler or human owner | Contract is missing, contradictory or too broad | Reviewer updates issue and applies `contract:stable` | Hard gate: not auto-runnable as implementation |
| `risk:low` | Human owner or reviewer | Change is local, reversible and low coordination | Risk changes | Guides Legion design gate only |
| `risk:medium` | Human owner or reviewer | Cross-module, behavior, rollout or rollback risk exists | Risk changes | Usually requires design check |
| `risk:high` | Human owner or reviewer | Security, data, concurrency, migration or multi-system risk exists | Risk changes | Requires stronger design gate before implementation |
| `repo:<name>` | Human owner or scheduler admin | Target repo is known and configured | Repo target changes or issue closes | Must map to scheduler repo config |
| `area:<name>` | Human owner or scheduler admin | Work touches a logical module area | Scope changes | Used for resource hints and reporting |
| `mutex:<name>` | Human owner or scheduler admin | Work needs exclusive resource, e.g. `mutex:db-migration` | Exclusive section no longer applies or issue closes | Scheduler turns this into a resource lock |

### Label conflict rules

| Conflict | Result |
|---|---|
| `contract:stable` + `contract:needs-review` | Not runnable; skip reason `contract_conflict` |
| `agent:ready` + `agent:needs-human` | Not runnable; skip reason `human_gate` |
| Multiple `repo:*` labels | Not runnable unless config explicitly allows multi-repo WI; default `repo_mapping_ambiguous` |
| Missing `risk:*` | Not runnable; default `risk_missing` |
| Multiple `risk:*` labels | Not runnable; default `risk_conflict` |

## 4. State mapping policy

Linear workflow names differ by workspace. Implementations must load state mapping from config instead of hard-coding names.

```yaml
linearStateMapping:
  candidate:
    types: ["backlog", "unstarted"]
    names: ["Ready", "Backlog"]
  claimed:
    names: ["Queued"]
  running:
    names: ["In Progress"]
  in_review:
    names: ["In Review"]
  done:
    types: ["completed"]
    names: ["Done"]
  blocked:
    names: ["Blocked"]
  failed:
    names: ["Failed"]
  cancelled:
    names: ["Canceled", "Cancelled", "Duplicate"]
```

Rules:

- Linear state is the human-visible projection of scheduler state.
- Scheduler DB run state wins if Linear state and DB state disagree.
- A Done-looking Linear state does not satisfy downstream if scheduler evidence says non-success, in-review, missing evidence or lifecycle blocked.
- State writes should be idempotent and audit-backed; failure to update Linear must not create a duplicate run.

## 5. Ready / skipped decision table

A WI is ready for MVP implementation dispatch only when every ready condition passes. Scanner implementations should emit one primary skipped reason plus supporting details.

| Check | Ready when | Skipped reason | Owner / repair |
|---|---|---|---|
| Linear state | State maps to `candidate` | `state_not_candidate` | Human moves issue to candidate state |
| Ready label | Has `agent:ready` | `agent_ready_missing` | Human owner or scheduler admin adds label |
| Stable contract | Has `contract:stable`, lacks `contract:needs-review` | `contract_not_stable` / `contract_conflict` | Human or reviewer fixes issue contract |
| Human gate | Lacks `agent:needs-human` | `human_gate` | Human resolves ambiguity, permission, stop or decision |
| Terminal status | Issue has no terminal success / terminal non-success run | `already_terminal` | No dispatch; inspect historical run |
| Active run | No active scheduler DB run for issue or taskId | `active_run_exists` | Scheduler waits or recovers stale run |
| Blockers | Every incoming blocker is `blocker_satisfied` | `dependency_blocked` | Upstream WI must reach success or admin override |
| Cycle | Project DAG has no cycle involving issue | `dependency_cycle` | Human resolves Linear relations |
| Repo mapping | Exactly one configured `repo:*` or config mapping exists | `repo_mapping_missing` / `repo_mapping_ambiguous` | Human/admin fixes labels or config |
| Repo/project pause | Target repo and project are not paused | `repo_paused` / `project_paused` | Scheduler admin resumes |
| Risk | Exactly one `risk:*` is present or config default exists | `risk_missing` / `risk_conflict` | Human/reviewer fixes risk label |
| Resource locks | Required `repo:*`, `area:*`, `mutex:*` locks are available | `resource_conflict` | Scheduler waits; admin inspects locks |
| Concurrency | Project and repo concurrency capacity exists | `concurrency_limit` | Scheduler waits |
| Snapshot freshness | Claim revalidation sees unchanged labels, blockers and updatedAt/hash | `stale_snapshot` | Scheduler re-reconciles |

### Ready predicate

```text
candidate Linear state
AND agent:ready
AND contract:stable
AND NOT contract:needs-review
AND NOT agent:needs-human
AND NOT already terminal
AND no active scheduler DB run
AND every blocker satisfies isBlockerSatisfied()
AND repo mapping exists and target is not paused
AND required resource locks are available
AND project/repo concurrency has capacity
AND claim-time snapshot revalidation passes
```

## 6. Blocker terminal-satisfied policy

Graph direction is `blocker -> blocked`. Downstream issues can start only after every incoming blocker satisfies `isBlockerSatisfied(blocker)`.

| Blocker state | Satisfied? | Reason / required evidence |
|---|---:|---|
| Scheduler run exists, `run.state = done`, delivery gate passed, evidence verifier passed, PR lifecycle complete where required | yes | `run_terminal_success` |
| Scheduler run queued / running / in_review / blocked / failed / cancelled | no | Active or non-success run is not a downstream unlock |
| Scheduler DB says done but PR/evidence/lifecycle gate fails | no | `inconsistent_terminal_state`; keep downstream blocked |
| No scheduler run; Linear state maps to Done; no `agent:queued`, `agent:running`, `agent:blocked`, `agent:needs-human` | yes, as manual completion | Record audit event `manual_blocker_satisfied` |
| No scheduler run; Linear Done but has active agent labels | no | Ambiguous manual/agent state; skip `manual_done_conflict` |
| PR open, draft, checks pending or in review | no | PR is not terminal success |
| PR closed unmerged / abandoned | no by default | Terminal non-success; requires explicit admin ignore/supersede |
| Linear Canceled / Cancelled / Duplicate | no by default | Terminal non-success; requires explicit admin ignore/supersede |
| Design-only blocker PR merged or configured design acceptance recorded | yes if project policy allows | Must be explicit policy, not open PR |
| Admin explicit ignore/supersede with reason | yes for dependency calculation only | Must write scheduler event and Linear activity/comment |

`run_terminal_non_success` never unlocks downstream by default. Admin override must be visible, reasoned and auditable; it is not the same as converting the upstream run to success.

## 7. Linear Native Agent control plane

| Object | Scheduler usage | Not allowed to prove |
|---|---|---|
| `Issue.delegate` | Show that the agent is delegated as executor / assistant while human `assignee` remains owner | Work completion, active run ownership, downstream unlock |
| AgentSession | One scheduler run maps to one session; reuse sessions created by mention/delegate when idempotency keys match | Claim truth, lock ownership, terminal success |
| AgentActivities | Emit progress: `thought`, `action`, `elicitation`, `response`, `error` | Durable event log or evidence verifier truth |
| Agent Plan | Present a session checklist: ready check, claim, worker launch, PR review, final writeback | Legion `.legion/tasks/<task-id>/tasks.md` |
| `externalUrls` | Link scheduler run, GitHub PR, Legion report and verification report | Evidence itself or PR terminal state |
| Stop signal | Persist event, transition active attempt to canceling, kill/stop worker, run cleanup, emit final activity | Ordinary comment, success state or lock release by itself |

Stop / cancel flow:

```text
Linear stop signal or admin cancel
  -> persist and dedupe webhook/admin event
  -> set runs.native_stop_requested_at
  -> transition active attempt to canceling
  -> dispatcher stops worker side effects
  -> cleanup policy runs before lock release
  -> final AgentSession response/error is queued
  -> run_terminal_non_success unless admin later records explicit override
```

## 8. Terminal terms

| Term | Meaning | Downstream effect |
|---|---|---|
| `run_terminal_success` | Run reached `done` and passed delivery, PR/evidence and lifecycle gates for its run kind | Satisfies blockers by default |
| `run_terminal_non_success` | Run ended as cancelled, abandoned, duplicate, closed-unmerged, superseded, human rejected or terminal evidence failure | Does not satisfy blockers by default |
| `blocker_satisfied` | Dependency-specific predicate returned true via `isBlockerSatisfied()` | Allows downstream candidate evaluation to continue |
| `active_run` | Scheduler DB has queued/running/in_review/blocked run that is not terminal | Prevents duplicate dispatch |
| `manual_done` | Linear Done issue without scheduler run and without active agent labels | Can satisfy blocker only after audit event |
| `admin_override` | Human/admin explicitly ignores or supersedes a blocker with reason | Can satisfy dependency calculation but must remain auditable |

## 9. Example issues

| Example | Linear shape | Blockers | Scheduler decision | Why |
|---|---|---|---|---|
| A: Docs policy WI | Candidate state; `agent:ready`, `contract:stable`, `risk:low`, `repo:legion-mind`, `area:docs`; complete template fields | none | Ready | All ready conditions pass and no active run exists |
| B: Missing acceptance | Candidate state; `agent:ready`, `repo:legion-mind`, `risk:low`; no Acceptance Criteria; no `contract:stable` | none | Skipped `contract_not_stable` | MVP implementation run cannot repair contract inline |
| C: Needs product choice | Candidate state; `agent:ready`, `contract:stable`, `agent:needs-human`, `repo:legion-mind` | none | Skipped `human_gate` | Human decision is an explicit hard gate |
| D: Blocked by PR in review | Candidate state; ready labels and stable contract | Blocker WI has scheduler run `in_review` with open PR | Skipped `dependency_blocked` | PR open / in review is not terminal success |
| E: Manual upstream done | Candidate state; ready labels and stable contract | Blocker has no scheduler run, Linear state Done, no active agent labels | Ready after audit | Manual completion can satisfy blocker when recorded |
| F: Repo paused | Candidate state; ready labels and stable contract; `repo:legion-mind` | none | Skipped `repo_paused` | Scheduler admin pause prevents dispatch |
| G: Resource conflict | Candidate state; ready labels and stable contract; `mutex:db-migration` | none | Skipped `resource_conflict` | Another active run holds the same mutex lock |

## 10. Five-node DAG walkthrough

Project graph:

```text
WI-A -> WI-C -> WI-E
WI-B -> WI-D -> WI-E
```

Current observations:

| WI | Observation | `isBlockerSatisfied()` result |
|---|---|---|
| WI-A | Scheduler run `done`, PR merged, evidence verifier PASS, cleanup/refresh complete | true |
| WI-B | No scheduler run, Linear Done, no active agent labels | true after `manual_blocker_satisfied` audit event |
| WI-C | Candidate, `agent:ready`, `contract:stable`, blocker WI-A satisfied | ready |
| WI-D | Candidate, `agent:ready`, `contract:stable`, blocker WI-B satisfied, but `mutex:api-schema` held by another run | skipped `resource_conflict` |
| WI-E | Candidate, `agent:ready`, `contract:stable`, blockers WI-C and WI-D not terminal-satisfied | skipped `dependency_blocked` |

Expected scanner output:

```text
ready:   [WI-C]
skipped: [
  { issue: WI-D, reason: resource_conflict, lock: mutex:api-schema },
  { issue: WI-E, reason: dependency_blocked, blockers: [WI-C, WI-D] }
]
```

After WI-C and WI-D reach `run_terminal_success`, the next reconcile may consider WI-E. If WI-D is cancelled or closed unmerged, WI-E remains blocked unless an admin records an explicit override.

## 11. Implementation handoff checks

WI-03 scanner and WI-02 state implementation should be able to derive these tests from this policy:

- Parse template fields and reject missing goal / acceptance / scope / non-goals / repo / risk / verification.
- Normalize labels and detect `contract:stable` vs `contract:needs-review`, multiple `repo:*`, multiple `risk:*`, and human gate conflicts.
- Load state mapping from config and avoid hard-coded state names.
- Emit deterministic skipped reasons for every failed ready condition.
- Use Scheduler DB active run and terminal evidence, not Linear labels, for duplicate prevention and downstream unlock.
- Treat manual Done as satisfiable only when no scheduler run and no active agent labels exist, and record an audit event.
- Keep AgentSession state out of `isBlockerSatisfied()`.
