## Summary

Implements Linear WI-04: an OpenCode-only Legion worker runner for the scheduler prototype.

- Adds deterministic Linear issue -> Legion task id mapping.
- Adds OpenCode prompt artifact rendering, native startup outbox processing, process launch, heartbeat/timeout/cancel handling, worker result parsing, and Legion evidence verification.
- Adds single `worker dispatch` debug command and WI-04 delivery docs.
- Hardens trust boundaries after review: DB identity checks, repo-contained evidence paths, prompt artifact argv, env allowlist, process-group termination, and stop/cancel native side-effect gating.

## Verification

- `npm --prefix scheduler test` — PASS (29/29)
- `npm --prefix scheduler run health -- --db :memory:` — PASS
- `npm run test:regression` — PASS (18/18)
- `npm run pack:dry-run` — PASS
- `git diff --check` — PASS

## Legion evidence

- Plan: `.legion/tasks/linear-0xc-58/plan.md`
- Test report: `.legion/tasks/linear-0xc-58/docs/test-report.md`
- Review: `.legion/tasks/linear-0xc-58/docs/review-change.md`
- Walkthrough: `.legion/tasks/linear-0xc-58/docs/report-walkthrough.md`

## Out of scope

- No PR checks / review / merge tracking (WI-05).
- No parallel dispatch (WI-06).
- No multi-runtime abstraction.
