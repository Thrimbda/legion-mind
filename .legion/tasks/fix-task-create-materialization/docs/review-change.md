# Review Change — fix-task-create-materialization

## Result

PASS

## Blocking findings

None. No blocker found in correctness, maintainability, scope compliance, or the success-path materialization guarantee.

## Review notes

- `skills/legion-workflow/scripts/lib/cli.ts:587-605` now materializes new tasks in a sibling staging directory and only exposes the final task root via `renameSync(stagingRoot, draft.root)` after `docs/`, `plan.md`, `log.md`, and `tasks.md` are all written. That directly fixes the reviewed success-path risk: a successful `task create` no longer makes the final task directory visible before required files exist.
- The helper split into `createTaskStagingRoot()` and `cleanupTaskStagingRoot()` keeps the change localized to the task creation path and is maintainable.
- The implementation matches the RFC intent and stays within the task's declared repair scope for task materialization.

## Residual risk / follow-up

- Residual risk is low for the reviewed success path.
- Failure-injection coverage is still absent in `docs/test-report.md`, so interrupted-write and rename-failure behavior remains justified by code inspection rather than executed evidence.
- Optional follow-up only: add a focused fault-injection test later if the CLI gains a low-scope way to simulate write/rename failure.
