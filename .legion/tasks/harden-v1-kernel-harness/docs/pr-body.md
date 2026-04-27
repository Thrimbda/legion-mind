## Summary

- Converges current truth by deleting stale root `docs/` material and moving reviewer/user-facing references to README, `.legion/wiki`, skills, and `vibe-harness-bench/README.md`.
- Adds a runtime-agnostic shared setup core so OpenCode and OpenClaw share install/verify/rollback/uninstall semantics while keeping OpenClaw `openclaw.json` handling conservative.
- Adds focused regression coverage for setup lifecycle, OpenCode/OpenClaw skill surface, and thin Legion CLI filesystem invariants.

## Verification

- `npm run test:regression` — PASS, 10/10 tests.
- Static shared-core delegation check — PASS.
- Destructive rollback/uninstall regression coverage check — PASS.
- Repo-local regression temp-root check — PASS.
- Deleted-doc/current-truth stale-reference check — PASS.
- README runtime-boundary and thin-CLI static check — PASS.

See `.legion/tasks/harden-v1-kernel-harness/docs/test-report.md` for exact commands and output.

## Review evidence

- RFC review: `.legion/tasks/harden-v1-kernel-harness/docs/review-rfc.md` — PASS.
- Change review: `.legion/tasks/harden-v1-kernel-harness/docs/review-change.md` — PASS, no blocking findings.
- Walkthrough: `.legion/tasks/harden-v1-kernel-harness/docs/report-walkthrough.md`.

## Scope boundaries / non-goals

- CLI remains a thin filesystem tool; no runtime orchestrator or agent runtime adapter was introduced.
- No repo hygiene cleanup was performed.
- Runtime support was not expanded beyond OpenCode and OpenClaw.
- OpenClaw `openclaw.json` is not owned by rollback/uninstall; setup only appends compatibility config and verify treats that config path as warning-only.
