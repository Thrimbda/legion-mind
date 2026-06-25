# Test Report: WI-08 Admin CLI, Observability, and Security Hardening

## Verdict

PASS — scheduler test suite passed after WI-08 implementation and the pause-before-worker-launch fix.

## Command executed

```bash
npm --prefix scheduler test
```

## Result

```text
tests 57
pass 57
fail 0
cancelled 0
skipped 0
duration_ms 347.711416
```

Node emitted the expected experimental warnings for `node:sqlite`; no test failed.

## Why this validation was chosen

- `scheduler/package.json` defines this as the scheduler-local regression suite.
- The suite exercises all scheduler modules touched by WI-08 plus prior WI layers that could regress: scanner, dispatcher, store, webhook, retry/recovery, PR tracking, worker runner, CLI.
- New `tests/linear-admin-observability.test.ts` directly covers WI-08 acceptance areas: pause/resume, reason-required admin actions, retry/cancel/release lock audit events, run inspect, redaction, metrics, security validation, PermissionChange security blocking, and CLI JSON paths.
- Existing tests continue to prove the scheduler still preserves blocker policy, resource locks, PR terminal gate, webhook dedupe, native stop, stale recovery, and evidence verifier behavior.

## Coverage summary

| Acceptance area | Evidence |
|---|---|
| Admin inspect timeline / native fields / terminal reason | `admin CLI exposes pause, health and run inspect JSON`; `project pause is durable...` |
| Pause blocks new workers but active runs remain inspectable | `project pause is durable, blocks new dispatch, and keeps active runs inspectable`; `project pause defers pending worker dispatch before a new worker launches` |
| Retry/cancel/release lock require reason and audit | `admin dangerous actions require reasons and write audit events` |
| Metrics helpers | `redaction preserves shape while removing tokens, headers and signed URL secrets` includes `SchedulerMetrics` counters/gauges/timings |
| Logs do not leak tokens | `redaction preserves shape...` covers Authorization, GitHub token, signed URL, nested payloads |
| PermissionChange / security blocked | `security validation and PermissionChange block affected projects`; `PermissionChange webhook records security_blocked control and keeps dedupe semantics` |
| CLI integration | `admin CLI exposes pause, health and run inspect JSON`; existing scan/dispatch/delivery CLI tests |
| Regression safety | Full suite 57/57 PASS |

## Failures / skipped items

- No failures.
- No skipped tests.

## Manual drill status

Manual drill requirements were represented as fixture-backed tests:

- Explain a blocked or paused WI: dispatch output reports `project_paused` / waiting reasons with control details.
- Release a stale/admin lock: `releaseLock()` path requires reason and writes audit.
- Pause then resume project: project control APIs and CLI pause path covered; resume is implemented and reason-guarded.
