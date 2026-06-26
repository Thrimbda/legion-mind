# GitHub Sandbox Setup Runbook

## Goal

Create GitHub PR scenarios that let the scheduler PR tracker read real PR/check/review state without touching production repositories.

## Repository

Recommended repo name:

- `linear-legion-scheduler-sandbox`

Keep it separate from production repos. A README-only repository is enough for read-path acceptance.

## Token Scope

Use a fine-grained token scoped only to the sandbox repo. It should allow reading:

- Pull requests.
- Check runs / checks.
- Reviews.
- Commit metadata needed by PR status.

Do not use an admin token and do not bypass branch protection.

## Required PR Scenarios

| Scenario | Purpose | Expected scheduler decision |
|---|---|---|
| Open PR with pending checks/review | Baseline in-review state | `in_review`, not Done |
| Draft PR | Draft gate | `in_review`, not Done |
| Checks failing | Failure gate | `blocked` / `pr_blocked` |
| Review changes requested | Review gate | `blocked` / `pr_blocked` |
| Merged PR | Terminal success candidate | Done only if Legion evidence and lifecycle evidence pass |
| Closed unmerged PR | Terminal non-success | terminal non-success, downstream not satisfied |

If branch protection or checks are not configured in the sandbox repo, document the limitation instead of faking production readiness.

## Naming Convention

Use PR titles or branch names that include the matching Linear sandbox issue identifier when useful:

```text
SBOX-PR-OPEN: open PR acceptance case
SBOX-PR-MERGED: merged PR acceptance case
```

## Live Read-Path Command

```bash
sops exec-env secrets/linear-scheduler.sops.yaml 'npm --prefix scheduler run debug -- delivery track --run "$SCHEDULER_RUN_ID" --repo "$SCHEDULER_REPO_PATH" --pr-url "$GITHUB_OPEN_PR_URL" --db "$SCHEDULER_DB"'
```

Notes:

- A scheduler run row must exist before `delivery track` can update it.
- This command writes scheduler DB state and enqueues native writeback rows.
- It does not send Linear native writeback because no production native adapter exists.

## Evidence To Capture

- Repo owner/name.
- PR URL/number.
- Head SHA.
- Draft/open/merged/closed state.
- Checks summary.
- Review decision.
- Scheduler decision and run state.
- Delivery/evidence gate status.

## Stop Conditions

- PR state is interpreted as Done before merge.
- Failed checks or changes requested are not blocked.
- Closed-unmerged PR satisfies downstream.
- Token needs broader access than sandbox repo read-path.
