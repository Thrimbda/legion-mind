# Test Report: Complete VibeHarnessBench v0.1

Date: 2026-04-25  
Phase: `verify-change` re-run after hidden-test leak fix  
Workdir for benchmark commands: `vibe-harness-bench`  
Runtime note: Go-dependent validation was executed with `nix-shell -p go --run "..."`; `go version` reported `go version go1.25.5 darwin/arm64`.

## Verification conclusion

PASS. The RFC local-first v0.1 verification matrix was re-run, and the `review-change` blocking hidden-test leak is verified fixed.

The Go hidden verifiers now run injected `vbh_semantics_test.go` from verifier-owned temp copies instead of writing the injected test into `VBH_WORKSPACE_DIR`. Current and checked historical result workspaces do not contain leaked `vbh_semantics_test.go` files.

## Commands executed

| # | Command | Result | Evidence |
|---|---|---|---|
| 1 | `nix-shell -p go --run "python -m compileall bench"` | PASS | `bench` package compiled, including `bench/runner/verifier_exec.py`. |
| 2 | `nix-shell -p go --run "python -m bench.cli doctor"` | PASS | Reported `python: 3.12.12`, suites `core-v1, nightly-v1, smoke-v1`, adapter `noop`, and `doctor: PASS`. |
| 3 | `nix-shell -p go --run "python -m bench.cli selfcheck --suite core-v1"` | PASS | All four atomic cases PASS; all oracle controls passed and all negative controls returned expected `FAIL_HIDDEN` with `infra_error=False`. |
| 4 | `nix-shell -p go --run "python -m bench.cli run --suite smoke-v1 --adapter bench/adapters/examples/noop.yaml"` | PASS / expected semantic failures | Created `results/20260425T094837Z-5f553b44`; verdict counts `{'FAIL_VISIBLE': 3, 'FAIL_HIDDEN': 1}`. |
| 5 | `nix-shell -p go --run "python -m bench.cli run --suite core-v1 --adapter bench/adapters/examples/noop.yaml"` | PASS / expected semantic failures | Created `results/20260425T094845Z-d33551c0`; verdict counts `{'FAIL_VISIBLE': 3, 'FAIL_HIDDEN': 1}`. |
| 6 | second smoke run: `nix-shell -p go --run "python -m bench.cli run --suite smoke-v1 --adapter bench/adapters/examples/noop.yaml"` | PASS / expected semantic failures | Created `results/20260425T094850Z-98948464`; verdict counts `{'FAIL_VISIBLE': 3, 'FAIL_HIDDEN': 1}`. |
| 7 | `nix-shell -p go --run "python -m bench.cli compare /Users/c1/Work/legion-mind/vibe-harness-bench/results/20260425T094837Z-5f553b44 /Users/c1/Work/legion-mind/vibe-harness-bench/results/20260425T094850Z-98948464"` | PASS | Compare printed stable per-case final/visible/hidden/score/`infra_error` deltas without schema crash. |
| 8 | Direct isolation probe via `nix-shell -p go --run "python - <<'PY' ... PY"` | PASS | In-repo execution root rejected; out-of-tree temp root accepted; adapter env exposed only `BENCH_*` visible paths and did not contain repo/protected paths. |
| 9 | `glob results/20260425T094716Z-b96387bf/cases/systems-go-v1/*/workspace/vbh_semantics_test.go` | PASS | No files found in the latest reviewed core run specified by the user. |
| 10 | `glob results/*/cases/systems-go-v1/*/workspace/vbh_semantics_test.go` | PASS | No leaked injected Go hidden-test files found in any current result workspace. |

These commands were chosen because they directly prove the accepted RFC validation matrix and the specific fixed claim: Go hidden verifier injection no longer mutates HUT workspaces or persisted result workspaces, while doctor/selfcheck/noop/compare still exercise the semantic verifier paths end to end.

## Hidden-test leak fix verification

`review-change` previously found that Systems Go hidden verifiers wrote `vbh_semantics_test.go` into the HUT workspace and that `persist_hut_artifacts(...)` copied it into `results/**/workspace`. The re-verification confirms the fix:

- Latest reviewed core run requested by the user, `results/20260425T094716Z-b96387bf`, has no `cases/systems-go-v1/*/workspace/vbh_semantics_test.go` files.
- Newly generated core run `results/20260425T094845Z-d33551c0` also has no `cases/systems-go-v1/*/workspace/vbh_semantics_test.go` files.
- Repository-wide current result check `results/*/cases/systems-go-v1/*/workspace/vbh_semantics_test.go` returned no files, confirming old leaked result files were removed and no current result workspace persists the injected tests.
- Noop Systems Go failures remain semantic verifier failures, not API mismatch or infra crashes: both `mr-full-v1` and `kvsrv-core-v1` report `hidden=FAIL_HIDDEN`, `infra_error=False`.

## Selfcheck evidence

`nix-shell -p go --run "python -m bench.cli selfcheck --suite core-v1"` covered all four atomic cases:

- `pelican-bike-gif-v1`: oracle `PASS`; negatives `static-scene`, `desync-motion` all expected/actual `FAIL_HIDDEN`; every negative `infra_error=False`.
- `game-2048-v1`: oracle `PASS`; negatives `double-merge-bug`, `spawn-on-noop`, `bad-undo` all expected/actual `FAIL_HIDDEN`; every negative `infra_error=False`.
- `systems-go-v1/mr-full-v1`: oracle `PASS`; negatives `no-reassign`, `double-commit`, `serial-only` all expected/actual `FAIL_HIDDEN`; every negative `infra_error=False`.
- `systems-go-v1/kvsrv-core-v1`: oracle `PASS`; negatives `retry-no-errmaybe`, `non-linearizable`, `duplicate-state` all expected/actual `FAIL_HIDDEN`; every negative `infra_error=False`.

## Noop run/report evidence

The noop smoke/core runs completed normally and produced structured semantic failure reports rather than runner crashes:

- Smoke run `20260425T094837Z-5f553b44`: verdict counts `{'FAIL_VISIBLE': 3, 'FAIL_HIDDEN': 1}`.
- Core run `20260425T094845Z-d33551c0`: verdict counts `{'FAIL_VISIBLE': 3, 'FAIL_HIDDEN': 1}`.
- Second smoke run `20260425T094850Z-98948464`: verdict counts `{'FAIL_VISIBLE': 3, 'FAIL_HIDDEN': 1}`.

Examples from core run `20260425T094845Z-d33551c0`:

- `pelican-bike-gif-v1`: final `FAIL_VISIBLE`, visible `FAIL_VISIBLE`, hidden `FAIL_HIDDEN`, `infra_error=False`.
- `game-2048-v1`: final `FAIL_HIDDEN`, visible `PASS`, hidden `FAIL_HIDDEN`, `infra_error=False`.
- `systems-go-v1/mr-full-v1`: final `FAIL_VISIBLE`, visible `FAIL_VISIBLE`, hidden `FAIL_HIDDEN`, `infra_error=False`; semantic Go test failures only.
- `systems-go-v1/kvsrv-core-v1`: final `FAIL_VISIBLE`, visible `FAIL_VISIBLE`, hidden `FAIL_HIDDEN`, `infra_error=False`; semantic Go test failures only.

## Isolation evidence

Direct probe result:

- `repo_root_execution_root_rejected=True` with reason `HUT execution root must be outside benchmark project root`.
- Out-of-tree execution root under `/private/tmp/...` had `execution_root_inside_repo=False`.
- Adapter env keys were only `BENCH_ARTIFACT_DIR`, `BENCH_BUDGET_FILE`, `BENCH_CASE_ID`, `BENCH_PROMPT_FILE`, `BENCH_PUBLIC_DIR`, `BENCH_SUMMARY_OUT`, `BENCH_TASK_FAMILY_ID`, `BENCH_TASK_SEED`, `BENCH_TRACE_OUT`, and `BENCH_WORKSPACE_DIR`.
- `adapter_env_contains_repo_or_protected=False` for repo root, case root, verifier, oracle, and negative-control paths.

## Skipped / explicitly uncovered boundaries

Skipped items are limited to RFC-declared non-blocking boundaries:

- Docker-faithful full stack / pre-baked images.
- Binary GIF pHash/SSIM high-fidelity validation; v0.1 uses deterministic animation artifacts for pelican semantics.
- Real RPC process harnesses for systems tasks; v0.1 uses clean-room deterministic Go simulator/verifier semantics.
- External dependency/browser/ffmpeg/Playwright full-stack checks.

## Return-to-engineer assessment

No return to `engineer` is required. The hidden-test leak blocker has direct negative evidence across current results, including the user-specified core run and the newly generated core run. No command failure indicated an implementation gap in the accepted local-first v0.1 scope; observed noop failures are expected semantic verdicts with `infra_error=False`.
