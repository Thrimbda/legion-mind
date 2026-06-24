# OpenCode Legion Worker Runner

> **WI**: [WI-04 Legion task mapping and worker runner](work-items/WI-04-legion-worker-runner.md)<br>
> **Status**: WI-04 delivery artifact<br>
> **Runtime**: standalone `scheduler/` npm project<br>
> **Design source**: [RFC](rfc.md), [WI-02 SQLite core](scheduler-core-sqlite.md), [WI-03 graph scanner](linear-graph-scanner.md)

## 1. What WI-04 delivers

WI-04 adds the first executable worker boundary between a claimed Linear WI and a Legion-managed OpenCode worker. The scheduler still does not implement PR tracking or parallel dispatch, but it can now render the worker contract, process native startup outbox rows, launch one OpenCode attempt, parse the result block and reject missing Legion evidence before a run can become `done`.

Delivered source:

| Path | Purpose |
|---|---|
| `scheduler/src/task-id.ts` | Shared deterministic mapping from Linear identifier to Legion task id, e.g. `ENG-123 -> linear-eng-123` |
| `scheduler/src/worker-runner.ts` | OpenCode prompt renderer, prompt artifact writer, native startup processor, process launcher, result parser, evidence verifier and single dispatch executor |
| `scheduler/src/sqlite-store.ts` | Adds public attempt lifecycle, heartbeat, native context, outbox failure and worker event support around existing WI-02 tables |
| `scheduler/src/cli.ts` | Adds `worker dispatch` debug command for one pending worker-dispatch outbox row |
| `scheduler/tests/linear-worker-runner.test.ts` | Unit / integration coverage for taskId mapping, prompt contract, native startup, fake OpenCode launch, malformed / nonzero / cancel paths and evidence verifier |

## 2. Deterministic task mapping

`taskIdFromLinearIdentifier(identifier)` normalizes Linear issue identifiers into Legion task ids:

```text
ENG-123 -> linear-eng-123
0XC-58  -> linear-0xc-58
```

The scanner and runner share this helper so retries and stale recovery restore the same `.legion/tasks/<task-id>/` instead of creating duplicate task directories.

## 3. Worker launch contract

The runner renders one prompt artifact per attempt under `.cache/linear-scheduler/prompts/` with owner-only file mode. The OpenCode argv prompt contains only an instruction to read that artifact, so Linear issue context and native session context are not exposed directly through the process argument list. The prompt artifact is the worker's only task input and includes:

- Linear issue id / identifier / title / labels / blockers / risk / contract state;
- native agent context: AgentSession id, delegate app user id and stop signal source;
- repo path, base ref, branch prefix and Legion task id;
- hard gates requiring `legion-workflow`, `brainstorm` on unstable contract and `git-worktree-pr` for repository modifications;
- a machine-readable result block schema delimited by `LEGION_WORKER_RESULT_START` / `LEGION_WORKER_RESULT_END`;
- the scheduler-side evidence verifier output path.

OpenCode is launched in non-interactive mode (`opencode -p "read prompt artifact ..." -f json -q -c <repo>`). Timeout, heartbeat and cancellation are scheduler responsibilities, not assumed to be native OpenCode behavior. The child process receives an allowlisted environment for OpenCode/model provider settings; Linear, GitHub and scheduler secrets are not inherited by default.

## 4. Native startup boundary

`claimReadyWorkItem()` already enqueues native startup rows and a `worker_dispatch` row in one transaction. WI-04 adds `processNativeAgentOutbox()` with an adapter interface for:

1. create/find AgentSession;
2. set delegate;
3. create initial `thought` activity;
4. update Agent Plan;
5. update external URLs;
6. final response for stop / cancel.

Native startup rows are processed per run in the required order. Later side effects are not attempted while an earlier prerequisite is unsent or retrying. If a stop/cancel has already been requested, pending startup rows are failed/skipped and only the final response path is allowed. The runner refuses to launch a worker unless all required native startup rows for the same run are `sent`. Tests use a fake adapter; production Linear native API wiring remains behind the adapter boundary and must stay idempotent.

## 5. Attempt lifecycle and stop/cancel

The worker dispatch executor updates the existing WI-02 tables instead of bypassing the store:

- marks the attempt started with prompt hash and prompt artifact path;
- transitions the run `queued -> running` when launch begins;
- heartbeats the run while the launcher is active;
- captures stdout/stderr and exit metadata in `.cache/linear-scheduler/worker-logs/`;
- marks attempt `success`, `blocked`, `failed`, `timeout` or `cancelled`;
- honors `native_stop_requested_at` before launch and through launcher cancellation checks;
- launches OpenCode in a process group, sends `SIGTERM` on timeout/cancel, escalates to `SIGKILL` after a grace period and waits for process close before recording the terminal attempt result.

There is still no separate `canceling` run state in WI-02's state machine. The observable canceling boundary is `native_stop_requested_at` plus the stop event, followed by terminal non-success `cancelled`.

## 6. Result parser and evidence verifier

Worker output must include exactly one JSON result block. Missing or malformed blocks set the run to `failed` with `unknown_result`; a non-zero OpenCode exit sets `agent_failed`; timeout sets `worker_timeout`; cancelled output sets terminal non-success.

The parser accepts only one result block and validates required field types. Before launch, dispatch requires the outbox row columns, payload, run row and attempt row to agree; prompt and evidence identity are derived from `runs.task_id` / `runs.linear_identifier`, not mutable outbox payload. After launch, dispatch also requires result `runId`, `attemptId`, `linearIssue`, `taskId` and AgentSession identity (when present) to match the scheduler DB row before evidence verification. The scheduler-side evidence verifier rejects PR-only results. For implementation runs it requires:

- `plan.md`, `tasks.md`, `log.md`;
- `docs/test-report.md`;
- `docs/review-change.md` containing `PASS`;
- `docs/report-walkthrough.md`;
- wiki writeback pointer;
- for medium/high risk: `docs/rfc.md` and `docs/review-rfc.md` containing `PASS`;
- for PR-backed runs: PR URL plus a repo-local lifecycle evidence file at `.legion/tasks/<task-id>/docs/git-worktree-lifecycle.json` proving PR merged, checks/review complete, worktree removed and main workspace refreshed.

Evidence paths must be repo-relative and match the expected task-local or wiki location for the run's task id; absolute paths and out-of-task evidence are rejected. Review docs must contain an explicit `Verdict: PASS` / `## Verdict\nPASS` style verdict rather than arbitrary `PASS` text. If Legion evidence is absent, the run is blocked with `legion_evidence_missing`. If PR lifecycle evidence is incomplete after otherwise valid evidence, the run is blocked with `lifecycle_blocked`. Only a parsed `done` result plus evidence verifier PASS can move a run to `done`, set delivery/evidence gates to `passed`, release locks and satisfy downstream blockers.

## 7. Debug command

One pending dispatch row can be executed locally:

```bash
npm --prefix scheduler run debug -- worker dispatch \
  --run <run-id> \
  --attempt <attempt-id> \
  --repo <repo-path> \
  --db .cache/linear-scheduler/dev.sqlite \
  --timeout-ms 3600000
```

This command is a local debug/smoke entry point, not the production dispatcher. It will fail fast if the native startup outbox is still pending for the run.

## 8. Boundaries for later WIs

- WI-05 remains responsible for GitHub PR checks/review/merge tracking and final Linear delivery writeback.
- WI-06 remains responsible for parallel dispatch and resource scheduling beyond one outbox row.
- WI-07 remains responsible for webhook-driven stop/retry/recovery hardening.
- WI-08 remains responsible for production admin CLI, observability and security hardening.
