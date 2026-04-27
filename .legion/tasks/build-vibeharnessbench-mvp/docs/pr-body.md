## Summary

- Add the `vibe-harness-bench` MVP benchmark project with CLI commands for `doctor`, `run`, `selfcheck`, and `compare`.
- Add suite/family/case metadata, protected task pack layout, deterministic MVP selfcheck, reporting outputs, and noop adapter smoke coverage.
- Fix the HUT isolation boundary so runtime materialization happens in an out-of-repo temp root and result copy-back only happens after adapter exit.

## Mode

implementation

## Key reviewer notes

- `benchmark-design.md` is user-provided input and is not treated as an implementation deliverable for this change.
- HUT runtime temp roots are outside the `vibe-harness-bench` repo; repo-internal execution roots are rejected.
- Adapter-visible env does not expose the case root, benchmark repo root, `verifier/`, `oracle/`, or `negative_controls/`.
- Copy-back of `workspace/`, `visible_inputs/`, and `artifacts/` happens only after the adapter exits, for reviewer artifacts under `results/`.

## Verification

- `python -m compileall bench` — PASS.
- `python -m bench.cli doctor` — PASS.
- `python -m bench.cli selfcheck --suite core-v1` — PASS; oracle paths pass, negative controls fail as `FAIL_HIDDEN`, `infra_error=False`.
- Two noop smoke runs — PASS; generated non-infra-crash `FAIL_HIDDEN` smoke reports.
- `python -m bench.cli compare ...` — PASS.
- Direct isolation probe — PASS.

## Review status

- `review-change`: PASS.
- Security lens applied.
- Blocking findings: 0.

## Known limitations / backlog

- The MVP contract verifier is not a high-fidelity semantic verifier.
- Docker, Node, Go, Playwright, Go RPC/concurrency verification, full oracles, and broader negative-control matrices remain backlog.
- Local subprocess isolation is MVP-level and not a full sandbox/container/chroot for arbitrary untrusted HUT code.
