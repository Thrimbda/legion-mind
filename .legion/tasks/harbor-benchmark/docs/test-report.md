# Test Report

## Command
`npm run benchmark:preflight -- --write ../../escape.json && npm run benchmark:smoke -- --dry-run --run-id ../../escape && npm run benchmark:score -- --run ../../escape`

## Result
PASS

## Summary
- Executed all three requested traversal safety checks (`preflight --write`, `smoke --run-id`, `score --run`).
- `preflight --write ../../escape.json` rejected path escape with `E_IO_OUTSIDE_REPO`.
- `smoke --run-id ../../escape` rejected invalid run id with `E_RUN_ID_INVALID` before benchmark execution.
- `score --run ../../escape` rejected invalid run id with `E_RUN_ID_INVALID`.

## Failures (if any)
- None; all checks failed in the expected safe way.

## Notes
- why this command: repository `package.json` exposes canonical benchmark entrypoints, and these three targeted invocations are the fastest way to validate traversal hardening without requiring Harbor/API credentials.
- alternatives considered: direct `node --experimental-strip-types ...` invocations (equivalent but bypasses script contract), and full benchmark run (`benchmark:smoke`/`benchmark:full`) which adds environment dependencies and cost without improving traversal-path coverage.
