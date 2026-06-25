# Report Walkthrough — linear-0xc-61

Mode: implementation

## Reviewer Summary

WI-06 adds a conservative parallel dispatch layer for the Linear + Legion scheduler prototype. The scheduler can now plan and claim several ready, non-conflicting WIs in one pass while preserving resource-lock safety, capacity limits, restart recovery, and visible waiting reasons.

## What Changed

- Added `scheduler/src/resource-locks.ts` for canonical lock parsing and conflict checks:
  - `repo:<name>` repo-wide mutual exclusion by default;
  - `area:<name>` scoped as `area:<repo>/<name>`;
  - `mutex:<name>` global mutual exclusion.
- Added `scheduler/src/dispatcher.ts` for:
  - fair priority sorting with age/starvation boost;
  - global/project/repo concurrency limits;
  - capacity-before-claim planning;
  - waiting records for lock, capacity, and blocker waits;
  - stale-lock detection events without auto-release.
- Extended `scheduler/src/scanner.ts` ready candidates with dispatch metadata and `parallelRepoKeys` support.
- Extended `scheduler/src/sqlite-store.ts` with held/stale lock inspection, scheduler event listing, and conflict-matrix enforcement inside claim.
- Added `dispatch fixture` CLI and updated scheduler docs / WI-06 delivery docs.
- Added `scheduler/tests/linear-dispatcher.test.ts` and strengthened core claim lock expectations.

## Safety / Boundary Notes

- Claim remains the only durable lock acquisition boundary through `SchedulerStore.claimReadyWorkItem()`.
- Waiting candidates are not claimed, do not hold locks, and are not marked `agent:running`.
- TTL is only stale detection metadata; stale locks remain held until terminal/admin release.
- No production Linear adapter, webhook ingestion, multi-runtime abstraction, or merge-conflict prediction was added.

## Verification Evidence

- `npm --prefix scheduler test` — PASS, 43 tests.
- `npm run test:regression` — PASS, 18 tests.
- See `.legion/tasks/linear-0xc-61/docs/test-report.md` for command rationale and skipped live integrations.

## Review Evidence

- RFC review: `.legion/tasks/linear-0xc-61/docs/review-rfc.md` — PASS.
- Change review: `.legion/tasks/linear-0xc-61/docs/review-change.md` — PASS, security lens applied with no blocker.

## Files to Review First

1. `scheduler/src/resource-locks.ts`
2. `scheduler/src/dispatcher.ts`
3. `scheduler/tests/linear-dispatcher.test.ts`
4. `scheduler/src/sqlite-store.ts`
5. `scheduler/src/scanner.ts`
