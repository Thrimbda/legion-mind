# PR Tracking and Linear Delivery Writeback

> **WI**: [WI-05 PR tracking and Linear delivery writeback](work-items/WI-05-delivery-pr-writeback.md)<br>
> **Status**: WI-05 delivery artifact<br>
> **Runtime**: standalone `scheduler/` npm project<br>
> **Design source**: [RFC](rfc.md), [WI-04 worker runner](worker-runner.md)

## 1. What WI-05 delivers

WI-05 adds the scheduler-side delivery layer that observes GitHub PR state after a worker has produced a PR. The worker runner can still parse PR URLs and verify Legion evidence, but it no longer treats a worker-reported `done` result as terminal success by itself. Terminal success now requires the PR tracker to combine:

1. persisted scheduler run identity and PR URL;
2. GitHub PR snapshot: open/draft, checks, review, merged/closed state;
3. scheduler-side Legion evidence verifier result;
4. `git-worktree-pr` lifecycle evidence: PR merged, checks/review complete, worktree removed, main refreshed;
5. final Linear native writeback queued idempotently.

Delivered source:

| Path | Purpose |
|---|---|
| `scheduler/src/pr-tracker.ts` | PR snapshot model, GitHub adapter boundary, PR delivery decision mapping, terminal success/non-success gate and Linear writeback outbox enqueueing |
| `scheduler/src/sqlite-store.ts` | Adds WI-05 native writeback side effects and migration guard; exposes evaluated snapshot lookup for risk-aware evidence verification |
| `scheduler/src/worker-runner.ts` | Changes worker `done` handling to wait in `in_review` until PR tracker verifies GitHub terminal state; extends native adapter payloads for comments, labels and state mapping |
| `scheduler/src/cli.ts` | Adds `delivery track` debug command with fixture or GitHub REST mode |
| `scheduler/tests/linear-pr-tracker.test.ts` | PR state mapping, terminal gate, writeback idempotency, evidence/lifecycle negative cases and CLI fixture coverage |

## 2. PR delivery decision model

`trackPrDelivery(store, client, options)` is the scheduler entry point. It reads the run from DB, resolves the PR URL from explicit input or `runs.pr_url`, fetches a `PullRequestSnapshot` through the adapter, records `pr_snapshot_observed`, and applies the centralized decision table:

| PR snapshot | Run effect | Downstream unlock |
|---|---|---|
| open / draft / pending checks / review required | `queued/running/blocked -> in_review`; `delivery_gate_status = pending`; PR external URL and in-review activity/plan/state/labels enqueued | no |
| checks failing | `blocked`, `failure_type = pr_blocked` | no |
| review changes requested | `blocked`, `failure_type = pr_blocked` | no |
| merged + checks/review resolved + Legion evidence PASS + lifecycle complete | `done`, `delivery_gate_status = passed`, `evidence_status = passed`, locks released, downstream reconcile event recorded, final response/comment/state/labels enqueued | yes |
| merged + missing Legion evidence | `blocked`, `failure_type = legion_evidence_missing` | no |
| merged + lifecycle evidence incomplete | `blocked`, `failure_type = lifecycle_blocked` | no |
| closed-unmerged / rejected / duplicate | terminal non-success (`failed`), delivery gate failed, locks released, final non-success writeback enqueued | no |
| cancelled | terminal non-success (`cancelled`) | no |
| abandoned / superseded | terminal non-success (`abandoned`) | no |

`done` is still not sufficient by name alone. Downstream only unlocks through `SchedulerStore.isBlockerSatisfiedByRun()` when `state = done`, `delivery_gate_status = passed` and `evidence_status = passed`.

## 3. GitHub adapter boundary

The tracker uses a small adapter interface:

```ts
interface GitHubPrClient {
  fetchPullRequest(prUrl: string): Promise<PullRequestSnapshot>;
}
```

Two adapters exist:

- `StaticPullRequestClient` for fixtures and unit/integration tests.
- `createGitHubRestPullRequestClient()` for debug/prototype use with GitHub REST. It fetches the PR, check-runs for the head SHA, and PR reviews. A token can be supplied through `GITHUB_TOKEN` or the CLI `--token-env` override.

The unit tests do not require network access. Production policy should still provide least-privilege GitHub token scope and rate-limit handling before long-running operation.

## 4. Linear native writeback outbox

WI-05 keeps Linear as presentation/control plane. All writeback is queued through `native_outbox` with deterministic idempotency keys so repeated reconcile does not spam activities/comments.

New side-effect payloads added to the native outbox contract:

| Side effect | Intended adapter behavior |
|---|---|
| `update_issue_state` | Map scheduler state (`in_review`, `blocked`, `done`, terminal non-success) to configured Linear workflow state, e.g. In Review / Done |
| `update_issue_labels` | Add/remove coarse labels such as `agent:running`, `agent:blocked`, `agent:needs-human`, `agent:done` |
| `create_comment` | Create final summary or compatibility comment when a durable comment is required |

Existing side effects remain in use:

- `create_activity` for PR created / blocked / error / final progress;
- `update_external_urls` for GitHub PR URL;
- `update_plan` for session checklist;
- `final_response` for terminal native agent response.

Final summary payloads include PR URL, Legion task path, result, checks/review summary, `git-worktree-pr` lifecycle summary, downstream reconcile status and terminal kind.

## 5. Worker runner integration

Before WI-05, `processOpenCodeWorkerDispatch()` could transition a worker-reported `done` result to `done` after evidence verification. WI-05 changes that boundary:

1. Worker `done` + evidence PASS now becomes `in_review` with `evidence_status = passed`.
2. The worker dispatch outbox row is marked sent, and a `pr_tracking_required` event is recorded.
3. The PR tracker must later verify GitHub merged/checks/review state before terminal success.

This prevents worker self-attestation or lifecycle evidence alone from unlocking downstream WIs.

## 6. Debug command

Fixture mode:

```bash
npm --prefix scheduler run debug -- delivery track \
  --run <run-id> \
  --repo <repo-path> \
  --fixture scheduler/tests/fixtures/pr-open.json \
  --db .cache/linear-scheduler/dev.sqlite
```

GitHub REST mode:

```bash
GITHUB_TOKEN=... npm --prefix scheduler run debug -- delivery track \
  --run <run-id> \
  --repo <repo-path> \
  --pr-url https://github.com/OWNER/REPO/pull/123 \
  --db .cache/linear-scheduler/dev.sqlite
```

The command updates scheduler DB state and enqueues native writeback rows. It does not directly call Linear; native outbox processing remains adapter-driven.

## 7. Boundaries for later WIs

- WI-06 can now rely on `run_terminal_success` as the default downstream unlock signal when adding parallel dispatch and resource locks.
- WI-07 still owns webhook ingestion, retry/backoff, stale recovery and long-running native outbox workers.
- WI-08 still owns production-grade GitHub/Linear token policy, metrics, admin UX and security hardening.
