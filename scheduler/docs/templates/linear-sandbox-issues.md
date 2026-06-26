# Linear Sandbox Issues Template

Create these issues in the Linear sandbox project. Replace identifiers with your workspace's actual generated issue keys after creation.

## SBOX-READY

Labels:

- `scheduler:sandbox`
- `agent:ready`
- `contract:stable`
- `repo:legion-mind`
- `risk:low`
- `area:docs`

Expected: ready.

## SBOX-MANUAL-DONE

State: Done

Labels:

- `scheduler:sandbox`
- `contract:stable`
- `repo:legion-mind`
- `risk:low`

Expected: not candidate; can satisfy a blocker only through the manual Done policy when no active agent labels are present.

## SBOX-BLOCKED-BY-MANUAL

Blocked by: `SBOX-MANUAL-DONE`

Labels:

- `scheduler:sandbox`
- `agent:ready`
- `contract:stable`
- `repo:legion-mind`
- `risk:low`
- `area:api`

Expected: ready after manual blocker satisfaction policy.

## SBOX-UPSTREAM-ACTIVE

State: In Progress

Labels:

- `scheduler:sandbox`
- `agent:running`
- `contract:stable`
- `repo:legion-mind`
- `risk:medium`
- `area:api`

Expected: not candidate and not blocker-satisfied.

## SBOX-DEPENDENCY-BLOCKED

Blocked by: `SBOX-UPSTREAM-ACTIVE`

Labels:

- `scheduler:sandbox`
- `agent:ready`
- `contract:stable`
- `repo:legion-mind`
- `risk:medium`
- `area:ui`

Expected: skipped `dependency_blocked`.

## SBOX-NEEDS-HUMAN

Labels:

- `scheduler:sandbox`
- `agent:ready`
- `agent:needs-human`
- `contract:stable`
- `repo:legion-mind`
- `risk:medium`
- `area:docs`

Expected: skipped `human_gate`.

## SBOX-CONTRACT-MISSING

Labels:

- `scheduler:sandbox`
- `agent:ready`
- `repo:legion-mind`
- `risk:low`
- `area:docs`

Expected: skipped `contract_not_stable`.

## SBOX-RISK-MISSING

Labels:

- `scheduler:sandbox`
- `agent:ready`
- `contract:stable`
- `repo:legion-mind`
- `area:docs`

Expected: skipped `risk_missing`.

## SBOX-LOCK-A

Labels:

- `scheduler:sandbox`
- `agent:ready`
- `contract:stable`
- `repo:legion-mind`
- `risk:medium`
- `area:api`

Expected: ready; can be claimed in fixture dispatch.

## SBOX-LOCK-B

Labels:

- `scheduler:sandbox`
- `agent:ready`
- `contract:stable`
- `repo:legion-mind`
- `risk:medium`
- `area:api`

Expected: waits for `area:legion-mind/api` when `SBOX-LOCK-A` is planned/claimed.

## Copyable Body

```md
## Goal

Sandbox-only scheduler acceptance case. This issue must not touch production code or production Linear work.

## Acceptance Criteria
- [ ] Scheduler read-path classifies this issue as expected.
- [ ] Evidence is recorded in the acceptance report.

## Scope
- Sandbox acceptance only.

## Out of Scope
- Production code changes.
- Production Linear writeback.

## Dependencies / Blockers
- Blocks: <fill if applicable>
- Blocked by: <fill if applicable>

## Repo / Package
- repo: legion-mind
- area: <docs|api|ui>

## Risk Level
- risk: low
- design gate hint: none

## Verification
- Run `scan project` against the sandbox project.

## Delivery Notes
- No worker should run unless a later stage explicitly approves it.
```
