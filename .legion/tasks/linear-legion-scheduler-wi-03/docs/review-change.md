# Review Change: Linear Scheduler WI-03

## Verdict

PASS。

当前变更符合 `linear-legion-scheduler-wi-03` contract：实现 dry-run Linear graph scanner、skipped reason report、terminal blocker policy、snapshot persistence 与 CLI / docs 交付；未发现阻塞级 correctness、scope、maintainability 或 security 问题。

## Review scope

- `.legion/tasks/linear-legion-scheduler-wi-03/plan.md`
- `.legion/tasks/linear-legion-scheduler-wi-03/docs/test-report.md`
- `scheduler/src/scanner.ts`
- `scheduler/src/cli.ts`
- `scheduler/src/sqlite-store.ts`
- `scheduler/tests/linear-graph-scanner.test.ts`
- `scheduler/README.md`
- `docs/linear-legion-scheduler/linear-graph-scanner.md`
- `docs/linear-legion-scheduler/index.md`
- `docs/linear-legion-scheduler/work-items/WI-03-linear-graph-scanner.md`

## Blocking findings

None.

## Correctness review

- Graph direction is explicitly `blocker -> blocked` and covered by test assertions for outgoing / incoming edges.
- Cycle detection returns cycle paths and scanner marks affected issues with `dependency_cycle` before dependency readiness evaluation.
- `isBlockerSatisfied()` delegates scheduler-run truth to `SchedulerStore.isBlockerSatisfiedByRun()` and only falls back to manual Linear Done when no run exists and active agent labels are absent.
- Ready report includes required `priority`, `locks`, `snapshotHash`, `linearUpdatedAt` and `nativePreview` fields.
- Required skipped reasons are represented as typed values and covered in scanner tests: missing ready label, unstable contract, unresolved blocker, cycle, human gate, missing repo mapping, active run, resource conflict, project pause and stale snapshot.
- `scan project` uses Linear GraphQL pagination and only issues read queries; `scan fixture` validates the same report path without Linear API access.
- `work_item_snapshots` persistence is exercised through `SchedulerStore.recordSnapshot()` and asserted in tests.

## Scope review

In scope:

- Scheduler project code under `scheduler/`.
- Docs for WI-03 delivery and task evidence.
- Small WI-02 store query helpers needed by scanner (`latestRunForIssue`, `findActiveRunForIssue`, `heldLockConflicts`, `listSnapshots`).

Out of scope avoided:

- No run claim or worker dispatch was added to scanner.
- No Linear mutation / label / comment / delegate / AgentSession writeback was added.
- No webhook server, PR tracker, parallel dispatcher or full admin CLI was introduced.
- Root `lgmind` package publishing boundary remains unchanged.

## Security lens

Security lens applied because this change touches Linear API access, a local CLI, user-provided fixture / DB paths and token-bearing HTTP requests.

Findings:

- Linear API key is read from `LINEAR_API_KEY` or a caller-selected env var and is not logged or persisted.
- GraphQL request body contains only the scanner query and variables; no mutation path exists in `scanner.ts`.
- Fixture reading is a local debug command and does not grant privileged write behavior; DB writes are limited to scheduler SQLite migration / `work_item_snapshots` in the caller-selected DB.
- Native action output is a preview object only; no delegate / AgentSession / activity side effects are executed.
- Test fixtures use synthetic emails / issue data; no real token or private Linear payload is committed.

No exploitable trust-boundary or secret-handling blocker found.

## Verification evidence reviewed

- `npm --prefix scheduler test` — PASS, 17 tests.
- `npm --prefix scheduler run health -- --db :memory:` — PASS.
- `npm run test:regression` — PASS, 18 tests.
- `npm run pack:dry-run` — PASS; root package file list excludes `scheduler/` runtime project.
- `git diff --check` — PASS.

## Non-blocking suggestions

- Before enabling this against a live project, run `scan project` once with a read-only / least-privilege Linear token against a dedicated test project and compare 3-5 issues manually.
- If Linear relation fields drift, keep the adapter isolated in `scanner.ts` and update the mock GraphQL fixture first so relation direction remains locked by tests.

## Readiness

Ready for `report-walkthrough` and `legion-wiki` closeout.
