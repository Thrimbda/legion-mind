## Summary

- Upgrades VibeHarnessBench from MVP contract-verifier behavior to the RFC-approved local-first semantic v0.1 path with runner visible/hidden verifier verdicts, protected selfcheck, and report/compare support.
- Adds semantic task-pack coverage for pelican, 2048, MapReduce, and KV server cases, including oracle and negative-control selfchecks.
- Fixes the Systems Go verifier temp-copy boundary so injected hidden tests are not written into HUT workspaces or persisted result workspaces.

## Mode

implementation

## Verification

- PASS: `python -m compileall bench`
- PASS: `python -m bench.cli doctor`
- PASS: `python -m bench.cli selfcheck --suite core-v1`
- PASS: noop smoke/core harness runs completed with expected semantic failures, not runner crashes
- PASS: `python -m bench.cli compare ...`
- PASS: direct isolation probe
- PASS: hidden-test leak check for `vbh_semantics_test.go`

## Review

- `review-change`: PASS
- Blocking findings: 0
- Security lens: applied; no remaining blocker found

## Known boundaries

- Docker-faithful full stack remains out of local-first v0.1 scope.
- Binary GIF pHash/SSIM validation is not implemented; pelican uses deterministic animation artifacts.
- Real RPC process harnesses are not required for v0.1; systems tasks use clean-room Go simulator/verifier semantics.
- Browser, ffmpeg, and Playwright full-stack validation remains an RFC non-blocking boundary.
