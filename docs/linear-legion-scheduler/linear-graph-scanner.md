# Linear Graph Scanner and Skipped Reason Report

> **WI**: [WI-03 Linear API integration and ready graph scanner](work-items/WI-03-linear-graph-scanner.md)<br>
> **Status**: WI-03 delivery artifact<br>
> **Runtime**: standalone `scheduler/` npm project<br>
> **Design source**: [RFC](rfc.md), [WI-01 policy](linear-wi-contract-policy.md), [WI-02 SQLite core](scheduler-core-sqlite.md)

## 1. What WI-03 delivers

WI-03 adds a dry-run scanner that answers which Linear Work Items are ready and why the rest are skipped. The scanner builds on WI-02 durable state but deliberately stops before claim / worker launch.

Delivered source:

| Path | Purpose |
|---|---|
| `scheduler/src/scanner.ts` | Linear GraphQL snapshot fetcher, graph builder, cycle detection, eligibility parser, terminal blocker policy, ready/skipped report |
| `scheduler/src/cli.ts` | Adds `scan project` and `scan fixture` dry-run commands |
| `scheduler/tests/linear-graph-scanner.test.ts` | Unit / integration coverage for graph direction, cycle paths, terminal blocker policy, skipped reasons, snapshot persistence and CLI fixture scan |
| `.legion/tasks/linear-legion-scheduler-wi-03/**` | Legion contract, progress log and delivery evidence |

## 2. Scanner output

Dry-run output is JSON with the stable shape required by the WI:

```json
{
  "project": { "id": "project-id", "name": "linear-opencode-scheduler", "key": "scheduler" },
  "observedAt": "2026-06-24T12:00:00.000Z",
  "ready": [
    {
      "identifier": "WI-READY",
      "title": "Ready fixture",
      "priority": 1,
      "locks": ["area:scheduler", "repo:legion-mind"],
      "snapshotHash": "...",
      "linearUpdatedAt": "2026-06-24T00:00:00.000Z",
      "nativePreview": {
        "delegate": "linear-agent-app",
        "agentSession": "create_or_find",
        "agentSessionKey": "linear-issue:<id>:agent-session",
        "initialActivity": { "kind": "thought", "message": "Scheduler would claim WI-READY after ready graph checks pass." },
        "externalUrls": [{ "label": "Scheduler run", "url": "scheduler://runs/pending/WI-READY" }]
      }
    }
  ],
  "skipped": [
    { "identifier": "WI-BLOCKED", "reason": "dependency_blocked", "details": { "blockers": [{ "identifier": "WI-UPSTREAM", "reason": "linear_not_done" }] } }
  ],
  "cycles": [{ "path": ["WI-A", "WI-B", "WI-A"] }]
}
```

Ready items include priority, required locks, source `linearUpdatedAt`, snapshot hash and native action preview. The preview is intentionally descriptive only: WI-03 does not create/find AgentSessions, set delegates, emit activities or attach external URLs.

## 3. Skipped reasons

The scanner emits typed skipped reasons aligned with the WI-01 policy:

- `agent_ready_missing`
- `contract_not_stable` / `contract_conflict`
- `dependency_blocked`
- `dependency_cycle`
- `human_gate`
- `repo_mapping_missing` / `repo_mapping_ambiguous`
- `active_run_exists`
- `resource_conflict`
- `project_paused` / `repo_paused`
- `stale_snapshot`

Additional policy reasons such as `state_not_candidate`, `already_terminal`, `risk_missing` and `risk_conflict` are included for admin/debug clarity.

## 4. Terminal blocker policy

`isBlockerSatisfied()` is implemented in `scheduler/src/scanner.ts` and uses Scheduler DB truth before Linear fallback:

1. If a scheduler run exists for the blocker, delegate to `SchedulerStore.isBlockerSatisfiedByRun()`.
2. `done` satisfies only when delivery and evidence gates are `passed`.
3. `failed`, `cancelled` and `abandoned` are terminal non-success and do not unlock downstream.
4. A DB `done` row without passed delivery/evidence is `inconsistent_terminal_state` and does not unlock downstream.
5. If no scheduler run exists, Linear Done can satisfy manually only when active agent labels are absent.

This preserves the RFC rule that Linear `Done`, PR open/in-review or AgentSession complete are not enough to unlock downstream.

## 5. Commands

Fixture / integration dry-run:

```bash
npm --prefix scheduler run debug -- scan fixture --fixture <snapshot.json> --db :memory:
```

Real Linear project dry-run:

```bash
LINEAR_API_KEY=<token> npm --prefix scheduler run debug -- scan project --project <linear-project-id> --db .cache/linear-scheduler/dev.sqlite
```

The command uses Linear's GraphQL API with Relay pagination (`first` / `after` / `pageInfo`) and writes only `work_item_snapshots` to the scheduler DB. It does not modify Linear.

## 6. Boundaries for later WIs

- WI-04 consumes ready candidates / native preview semantics when launching OpenCode workers.
- WI-05 remains responsible for PR terminal tracking and evidence gate updates.
- WI-06 can extend lock and concurrency checks for true parallel dispatch.
- WI-07 can add webhook-triggered reconcile and stale recovery around the same scanner output contract.
