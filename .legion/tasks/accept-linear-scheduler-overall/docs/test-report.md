# Test Report: Linear Scheduler Overall Acceptance

## Verdict

PASS for local prototype validation. All selected local verification commands completed successfully after correcting one CLI fixture path invocation.

This does **not** prove production readiness for real Linear / GitHub / OpenCode integration; those remain outside the confirmed local prototype acceptance boundary.

## Environment

- Date: 2026-06-25
- Worktree: `.worktrees/accept-linear-scheduler-overall/`
- Node command surface: `node --test --experimental-strip-types --experimental-sqlite`
- Scheduler package: `scheduler/package.json`

## Commands Executed

### 1. Full scheduler regression suite

```bash
npm --prefix scheduler test
```

Result: PASS

Summary from Node test runner:

```text
tests 57
pass 57
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 356.736376
```

Final pre-commit rerun also passed:

```text
tests 57
pass 57
fail 0
duration_ms 356.552912
```

Coverage represented by test names included:

- SQLite migration, run state machine, claim transaction, duplicate claim, resource lock conflicts, outbox idempotency, terminal blocker policy and snapshot hashing.
- Linear graph scanner pagination, relation normalization, cycle detection, skipped reasons, blocker satisfaction and fixture CLI dry run.
- Worker prompt hard gates, result parsing, environment sanitizer, evidence verification, native startup ordering, identity mismatch rejection, malformed result/nonzero/cancel handling and default evidence path layout.
- PR tracker open/pending, failing checks, changes requested, merged success gate, missing evidence/lifecycle gap, closed-unmerged terminal non-success and CLI fixture tracking.
- Parallel dispatcher lock parsing/conflict matrix, fairness, capacity waits, restart recovery, terminal lock release, stale lock hook and fixture CLI claims.
- Webhook raw body signature, timestamp replay, dedupe, AgentSession stop, retry taxonomy, timeout retry and stale recovery.
- Admin project controls, dangerous action reasons/audit, dispatch pause gate, redaction, security validation/PermissionChange block and admin CLI JSON.

### 2. Scheduler health CLI smoke

```bash
npm --prefix scheduler run health -- --db :memory:
```

Result: PASS

Observed JSON included:

```json
{
  "ok": true,
  "dbPath": ":memory:",
  "activeRuns": 0,
  "pendingOutbox": 0,
  "projectControls": 0
}
```

The table list included `native_outbox`, `project_controls`, `resource_locks`, `run_attempts`, `runs`, `scheduler_events`, `webhook_events`, and `work_item_snapshots`.

### 3. Scanner fixture CLI smoke

Initial command with a repo-root-relative fixture path failed because `npm --prefix scheduler` runs the script from the scheduler package context:

```text
ENOENT: no such file or directory, open '.legion/tasks/accept-linear-scheduler-overall/fixtures/local-project-snapshot.json'
```

Corrected command with absolute repo-local paths:

```bash
npm --prefix scheduler run debug -- scan fixture \
  --fixture /home/c1/Work/legion-mind/.worktrees/accept-linear-scheduler-overall/.legion/tasks/accept-linear-scheduler-overall/fixtures/local-project-snapshot.json \
  --db /home/c1/Work/legion-mind/.worktrees/accept-linear-scheduler-overall/.cache/linear-scheduler/acceptance-scan.sqlite \
  --delegate linear-agent-app
```

Result: PASS

Observed behavior:

- `ready`: `WI-READY-A`, `WI-READY-B`, `WI-CONFLICT`.
- `skipped`: `WI-BLOCKED` as `dependency_blocked`, `WI-MANUAL` as `state_not_candidate`, `WI-NEEDS-HUMAN` as `human_gate`, `WI-UPSTREAM` as `state_not_candidate`.
- Ready items included task id mapping, lock requirements, redacted snapshot hash, native preview, delegate and external URL previews.

### 4. Dispatcher fixture CLI smoke

```bash
npm --prefix scheduler run debug -- dispatch fixture \
  --fixture /home/c1/Work/legion-mind/.worktrees/accept-linear-scheduler-overall/.legion/tasks/accept-linear-scheduler-overall/fixtures/local-project-snapshot.json \
  --db /home/c1/Work/legion-mind/.worktrees/accept-linear-scheduler-overall/.cache/linear-scheduler/acceptance-dispatch.sqlite \
  --parallel-repos legion-mind \
  --global-concurrency 4 \
  --per-repo-concurrency 4
```

Result: PASS

Observed behavior:

- Claimed two non-conflicting WIs: `WI-READY-A` with `area:legion-mind/api`, and `WI-READY-B` with `area:legion-mind/docs`.
- Held `WI-CONFLICT` as `waiting_for_lock` because it requested `area:legion-mind/api` already planned for `WI-READY-A`.
- Represented `WI-BLOCKED` as `waiting_for_blocker` from the scanner dependency report.
- Did not launch workers; it only wrote scheduler DB rows/events/outbox jobs, matching the documented fixture command boundary.

### 5. Runs list smoke after dispatch

```bash
npm --prefix scheduler run debug -- runs list \
  --db /home/c1/Work/legion-mind/.worktrees/accept-linear-scheduler-overall/.cache/linear-scheduler/acceptance-dispatch.sqlite
```

Result: PASS

Observed behavior:

- Two active queued runs existed for `WI-READY-A` and `WI-READY-B`.
- Run rows included deterministic task ids, branch/worktree paths, pending delivery gate, unknown evidence status and redacted prompt/snapshot hashes.

### 6. PR delivery tracker fixture smoke

```bash
npm --prefix scheduler run debug -- delivery track \
  --run f2ef18a2-bfd1-4e69-9c93-4f268092ffc2 \
  --repo /home/c1/Work/legion-mind/.worktrees/accept-linear-scheduler-overall \
  --fixture /home/c1/Work/legion-mind/.worktrees/accept-linear-scheduler-overall/scheduler/tests/fixtures/pr-open.json \
  --db /home/c1/Work/legion-mind/.worktrees/accept-linear-scheduler-overall/.cache/linear-scheduler/acceptance-dispatch.sqlite
```

Result: PASS

Observed JSON:

```json
{
  "runState": "in_review",
  "deliveryGateStatus": "pending",
  "evidenceStatus": "pending",
  "decision": "in_review",
  "reason": "open PR, checks pending, review required"
}
```

The tracker did not mark the run `done` for an open PR with pending checks/review, which matches the terminal-gate policy.

### 7. Project health admin CLI smoke

```bash
npm --prefix scheduler run debug -- project health project-linear-scheduler \
  --db /home/c1/Work/legion-mind/.worktrees/accept-linear-scheduler-overall/.cache/linear-scheduler/acceptance-dispatch.sqlite
```

Result: PASS

Observed behavior:

- Returned project health JSON with active runs, held locks, pending outbox count and recent waiting/skipped events.
- Sensitive hash-like fields and Linear issue URL labels were redacted in CLI JSON output.

## Why These Commands Were Chosen

- `npm --prefix scheduler test` is the strongest available local regression signal because it exercises every scheduler test file in the standalone package.
- Health, scan fixture, dispatch fixture, delivery track fixture and project health commands verify the CLI/admin paths documented in `scheduler/README.md` and the WI delivery docs without external credentials.
- Fixture commands intentionally prove local scheduler DB / planning / gate behavior, not live Linear/GitHub side effects.

## Skipped / Not Proven Locally

- Real Linear GraphQL project scan with `LINEAR_API_KEY`.
- Real Linear Native Agent writeback adapter behavior for AgentSession, delegate, activities, plan, external URLs and comments.
- Real GitHub REST token scope, rate limit behavior and branch-protection interaction.
- Real OpenCode process launch under production credentials, long-running cancellation and OS/process-group behavior outside the fake launcher tests.
- Production metrics dashboard/exporter and retention policy.

## Notes From Static Inspection

- `scheduler/README.md` references `scheduler/tests/fixtures/project.json`, but only `scheduler/tests/fixtures/pr-open.json` exists. The scanner/dispatcher smoke commands therefore used a task-local fixture.
- `scheduler/README.md` omits `scheduler/tests/linear-admin-observability.test.ts` from its test layout even though the full test suite runs it.
- Manual Linear Done satisfaction currently returns `manual_done` from the scanner predicate; production reconcile should ensure the policy-required audit event is written at the orchestration boundary.
- Native stop/cancel releases locks immediately in the local implementation path; production rollout should harden this so real worker side effects are stopped/cleaned before conflicting work starts.

## Artifacts

- Acceptance fixture: `.legion/tasks/accept-linear-scheduler-overall/fixtures/local-project-snapshot.json`
- Local SQLite smoke DBs: `.cache/linear-scheduler/acceptance-scan.sqlite`, `.cache/linear-scheduler/acceptance-dispatch.sqlite`
