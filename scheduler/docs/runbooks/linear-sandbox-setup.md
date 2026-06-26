# Linear Sandbox Setup Runbook

## Goal

Create a Linear sandbox project that exercises scheduler read-path decisions without affecting production work.

## Project

Recommended project:

- Name: `Legion Scheduler Sandbox`
- Key or slug: `scheduler-sandbox`
- Team key: `SBOX` or another clearly non-production team key

Record the project ID in `LINEAR_PROJECT_ID` inside the encrypted secret file.

## Required Labels

Scheduler policy labels:

- `agent:ready`
- `contract:stable`
- `contract:needs-review`
- `agent:needs-human`
- `repo:legion-mind`
- `risk:low`
- `risk:medium`
- `risk:high`
- `area:api`
- `area:docs`
- `area:ui`
- `mutex:db-migration`

Optional sandbox filter labels:

- `scheduler:sandbox`
- `scheduler:read-path`
- `scheduler:dispatch-fixture`
- `scheduler:github-linked`

## Required Issue Scenarios

| Identifier | Purpose | Labels | Blockers | Expected scheduler interpretation |
|---|---|---|---|---|
| `SBOX-READY` | Basic ready WI | `agent:ready`, `contract:stable`, `repo:legion-mind`, `risk:low`, `area:docs` | none | ready |
| `SBOX-MANUAL-DONE` | Manual upstream completion | `contract:stable`, `repo:legion-mind`, `risk:low` | none | not candidate, can satisfy blocker if no active agent labels |
| `SBOX-BLOCKED-BY-MANUAL` | Downstream of manual Done | `agent:ready`, `contract:stable`, `repo:legion-mind`, `risk:low`, `area:api` | `SBOX-MANUAL-DONE` | ready after manual blocker satisfaction policy |
| `SBOX-UPSTREAM-ACTIVE` | Incomplete upstream | `agent:running`, `contract:stable`, `repo:legion-mind`, `risk:medium`, `area:api` | none | not candidate / not blocker-satisfied |
| `SBOX-DEPENDENCY-BLOCKED` | Blocked downstream | `agent:ready`, `contract:stable`, `repo:legion-mind`, `risk:medium`, `area:ui` | `SBOX-UPSTREAM-ACTIVE` | skipped `dependency_blocked` |
| `SBOX-NEEDS-HUMAN` | Human gate | `agent:ready`, `agent:needs-human`, `contract:stable`, `repo:legion-mind`, `risk:medium`, `area:docs` | none | skipped `human_gate` |
| `SBOX-CONTRACT-MISSING` | Missing stable contract | `agent:ready`, `repo:legion-mind`, `risk:low`, `area:docs` | none | skipped `contract_not_stable` |
| `SBOX-RISK-MISSING` | Missing risk | `agent:ready`, `contract:stable`, `repo:legion-mind`, `area:docs` | none | skipped `risk_missing` |
| `SBOX-LOCK-A` | Lock conflict A | `agent:ready`, `contract:stable`, `repo:legion-mind`, `risk:medium`, `area:api` | none | ready / can be claimed in fixture dispatch |
| `SBOX-LOCK-B` | Lock conflict B | `agent:ready`, `contract:stable`, `repo:legion-mind`, `risk:medium`, `area:api` | none | waiting for lock when A is planned/claimed |

## Issue Body Template

Use the WI-01 policy fields:

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

## Live Read-Path Command

```bash
sops exec-env secrets/linear-scheduler.sops.yaml 'npm --prefix scheduler run debug -- scan project --project "$LINEAR_PROJECT_ID" --db "$SCHEDULER_DB" --delegate "$LINEAR_DELEGATE_APP_USER_ID" --scheduler-run-url-base "$SCHEDULER_RUN_URL_BASE"'
```

## Evidence To Capture

- Linear project ID/name/key.
- Issue identifiers and labels.
- Blocker relations.
- Ready count and identifiers.
- Skipped count and reasons.
- Any unexpected state/label mapping.

## Stop Conditions

- A production project appears in the scan.
- A human-gated or contract-missing issue appears ready.
- The scan output cannot be explained by the expected issue table.
