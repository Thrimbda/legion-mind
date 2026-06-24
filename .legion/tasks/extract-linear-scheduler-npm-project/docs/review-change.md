# Review Change: Extract Linear Scheduler into an Independent npm Project

## Verdict

**PASS**

No blocking correctness, maintainability, scope, packaging, or security issues found.

## Scope Review

The implemented change matches the task contract:

- Scheduler runtime files were moved out of root `scripts/` into `scheduler/src/`.
- Scheduler tests were moved out of root `tests/regression/` into `scheduler/tests/`.
- `scheduler/package.json` now owns the scheduler npm scripts.
- Root `package.json` no longer declares `scheduler:debug` or `test:linear-scheduler`.
- Current reviewer-facing docs under `docs/linear-legion-scheduler/**` now describe the standalone `scheduler/` project.
- No scheduler data model, state machine, claim transaction, outbox, Linear/GitHub/OpenCode integration, or Legion workflow semantics were redesigned.

Historical WI-02 task evidence still references the old paths, which is acceptable because `.legion/tasks/linear-legion-scheduler-wi-02/**` is raw evidence from that completed task, not current project structure truth.

## Correctness / Maintainability

- The new project shape is simple and locally owned: `scheduler/package.json`, `scheduler/src/**`, `scheduler/tests/**`, and `scheduler/README.md`.
- Imports were updated to local project-relative paths.
- The debug CLI help now points to `npm run debug -- ...` rather than root `scripts/linear-scheduler.ts`.
- The scheduler test temp cache moved under `scheduler/.cache/regression`, preserving repo-local output and keeping it ignored by existing `.gitignore` patterns.
- Root package dry-run confirms the standalone scheduler project is not accidentally included in the root `lgmind` npm artifact.

## Verification Evidence Reviewed

From `docs/test-report.md`:

- `npm --prefix scheduler test` — PASS, 12 tests.
- `npm --prefix scheduler run health -- --db :memory:` — PASS.
- `npm run test:regression` — PASS, 18 tests.
- `npm run pack:dry-run` — PASS; root package file list does not include `scheduler/`.
- `git diff --check` — PASS.

These commands directly cover the migration claim, root-package boundary, and existing root regression surface.

## Security Lens

Security lens was considered but no security trigger is introduced by this change. The diff relocates existing local scheduler prototype code and updates npm/documentation boundaries; it does not add auth, permission, token, signing, webhook verification, tenant isolation, or new user-controlled privileged input paths.

## Non-blocking Suggestions

- If this scheduler project becomes long-lived, a future CI task should explicitly run `npm --prefix scheduler test` so root regression coverage and scheduler coverage remain visibly separate.
