# Change Review — linear-0xc-61

## Verdict

PASS

## Scope Review

The change stays within WI-06 scope:

- Adds resource lock parsing / conflict detection for `repo:*`, repo-scoped `area:*`, and `mutex:*`.
- Adds a dispatcher that claims multiple non-conflicting WIs under global/project/repo limits.
- Adds stale-lock inspection hooks without automatic release.
- Adds waiting visibility for lock, capacity, and blocker waits without marking waiting candidates as running.
- Updates scheduler docs and local fixture/debug coverage.

No webhook ingestion, production Linear adapter, multi-runtime worker abstraction, or merge-conflict prediction was added.

## Correctness / Maintainability

- PASS: lock conflict enforcement is inside `SchedulerStore.claimReadyWorkItem()` as well as dispatcher planning, so a race between dispatchers still hits the durable claim boundary.
- PASS: default claim lock derivation now scopes area locks through `resourceLockKeysForIssue()`; direct claim callers do not accidentally create unscoped area locks.
- PASS: capacity-before-claim keeps waiting items unclaimed and prevents idle queued candidates from holding locks.
- PASS: stale-lock detection records `stale_lock_detected` and keeps held locks conflicting until terminal/admin release.
- PASS: tests cover parser, conflict matrix, fairness, dispatch limits, restart recovery, terminal release, stale locks, CLI fixture, and existing scheduler/core/worker/PR behavior.

## Security Lens

Applied because this change affects a scheduler trust boundary and parses external Linear labels / fixture input.

- No secrets, tokens, auth scopes, signing, or webhook verification paths were changed.
- Fixture CLI input is parsed as JSON and used to create DB rows/outbox payloads; it does not execute shell commands.
- Resource lock parsing rejects unknown prefixes and invalid lock names, limiting malformed label effects to command/test failure rather than unsafe scheduling.
- No tenant/organization isolation behavior is introduced; cross-org scheduling remains out of scope.

No security blocker found.

## Non-blocking Suggestions

- Future WI-07/WI-08 should build admin release and stale recovery on top of the new stale-lock inspection hooks rather than changing TTL into auto-release.
- Future production Linear adapters should consume the waiting visibility payloads and continue avoiding `agent:running` for unclaimed work.

## Evidence Reviewed

- `.legion/tasks/linear-0xc-61/plan.md`
- `.legion/tasks/linear-0xc-61/docs/rfc.md`
- `.legion/tasks/linear-0xc-61/docs/review-rfc.md`
- `.legion/tasks/linear-0xc-61/docs/test-report.md`
- Test evidence: `npm --prefix scheduler test` and `npm run test:regression`, both PASS.
