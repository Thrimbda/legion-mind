# Legion Wiki Log

## [2026-04-25] writeback | harden-strict-verify-integrity

- Promoted strict install verification as a durable CLI pattern in `patterns.md`.
- Added task summary for `harden-strict-verify-integrity` under `tasks/`.
- Recorded one non-blocking manifest self-consistency follow-up in `maintenance.md`.

## [2026-04-23] writeback | tighten-cli-doc-drift

- Added `maintenance.md` entry for an unverified `task create` materialization observation seen during task bootstrap.
- No new cross-task pattern or hard decision was added; existing CLI role guidance remains in `patterns.md`.

## [2026-04-23] writeback | fix-task-create-materialization

- Promoted `task create` staging + rename materialization to a durable CLI pattern in `patterns.md`.
- Removed the earlier open maintenance entry for one-off `task create` partial materialization after the invariant-hardening fix landed and success-path verification passed.
