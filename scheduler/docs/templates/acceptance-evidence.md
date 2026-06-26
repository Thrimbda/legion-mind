# Scheduler Acceptance Evidence

## Metadata

| Field | Value |
|---|---|
| Date/time | |
| Operator | |
| Repo commit | |
| Working directory | |
| Node version | |
| Scheduler DB path | |
| Secret file path | `secrets/linear-scheduler.sops.yaml` |
| Secret injection method | `sops exec-env` |

## Commands

| Stage | Command | Result | Output artifact / notes |
|---|---|---|---|
| Local tests | | PASS / FAIL / BLOCKED | |
| Fixture scan | | PASS / FAIL / BLOCKED | |
| Fixture dispatch | | PASS / FAIL / BLOCKED | |
| Linear live scan | | PASS / FAIL / BLOCKED | |
| GitHub PR tracking | | PASS / FAIL / BLOCKED | |
| Worker E2E | | PASS / FAIL / BLOCKED | |

## Linear Evidence

| Field | Value |
|---|---|
| Project ID | |
| Project name | |
| Team key | |
| Ready count | |
| Skipped count | |
| Cycles | |
| Unexpected classifications | |

| Issue | Expected | Actual | Pass? | Notes |
|---|---|---|---|---|
| | | | | |

## GitHub Evidence

| PR URL | Head SHA | Checks | Review | Merge/close state | Expected scheduler decision | Actual scheduler decision |
|---|---|---|---|---|---|---|
| | | | | | | |

## Scheduler Evidence

| Field | Value |
|---|---|
| Run ID | |
| Attempt ID | |
| Trace ID | |
| Task ID | |
| Lock keys | |
| Outbox side effects | |
| Final run state | |
| Delivery gate status | |
| Evidence status | |
| Terminal kind | |

## Blockers Found

| Blocker | Severity | Owner | Next action |
|---|---|---|---|
| | | | |

## Decision

- Decision: PASS / FAIL / BLOCKED
- Reason:
- Follow-up owner:
- Next review date:

## Redaction Check

- [ ] No token values included.
- [ ] No private key material included.
- [ ] No sensitive payload copied without redaction.
- [ ] Artifact paths are repo-local.
