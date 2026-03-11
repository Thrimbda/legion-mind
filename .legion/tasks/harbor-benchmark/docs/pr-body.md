## What

This PR delivers the Harbor benchmark baseline implementation for `legion-mind` with one-command entrypoints and deterministic profile defaults.
It adds preflight/run/score scripts, standard artifact outputs, and benchmark documentation so teams can run and compare results consistently.
Traversal and path-boundary hardening is included to block out-of-repo writes and invalid run identifiers.

## Why

Before this change, the repo had no reproducible benchmark harness to answer whether orchestration changes actually improve task outcomes.
Manual command assembly made results hard to compare and easy to drift across machines/operators.
This baseline creates a stable, reviewable contract for execution, scoring, and artifacts.

## How

Added `benchmark:preflight`, `benchmark:smoke`, `benchmark:full`, and `benchmark:score` scripts in `package.json` and implemented the flow under `scripts/benchmark/*`.
Committed a deterministic default profile (`harbor-baseline-v1`) plus mode-specific sample set IDs and dataset/weight contracts.
Updated `docs/benchmark.md` and `README.md`, and ignored benchmark artifacts via `.gitignore`.
Closed traversal/security blockers with `sanitizeRunId` and strict repo-bound path resolution checks.

## Testing

See `.legion/tasks/harbor-benchmark/docs/test-report.md` (PASS).

Validated guardrail behavior with:

```bash
npm run benchmark:preflight -- --write ../../escape.json && npm run benchmark:smoke -- --dry-run --run-id ../../escape && npm run benchmark:score -- --run ../../escape
```

Expected-safe failures observed:
- `E_IO_OUTSIDE_REPO` for out-of-repo write target.
- `E_RUN_ID_INVALID` for invalid run IDs in run/score commands.

## Risk / Rollback

Risk is medium and mostly operational (local dependency readiness, benchmark runtime variance, future profile drift).
Security posture is improved via path boundary enforcement and input sanitization; code/security reviews both PASS.

Rollback:
- Revert benchmark script/config/docs entries (`scripts/benchmark/**`, `package.json`, `README.md`, `docs/benchmark.md`, `.gitignore`).
- Remove generated local artifacts by deleting `benchmark-runs/`.

## Links

- Task brief: `.legion/tasks/harbor-benchmark/docs/task-brief.md`
- RFC: `.legion/tasks/harbor-benchmark/docs/rfc.md`
- RFC review: `.legion/tasks/harbor-benchmark/docs/review-rfc.md`
- Code review: `.legion/tasks/harbor-benchmark/docs/review-code.md`
- Security review: `.legion/tasks/harbor-benchmark/docs/review-security.md`
- Walkthrough: `.legion/tasks/harbor-benchmark/docs/report-walkthrough.md`
