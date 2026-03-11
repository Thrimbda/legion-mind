# Harbor Benchmark Baseline

This runbook defines the one-command Harbor benchmark baseline for `legion-mind`.

## Commands

```bash
npm run benchmark:preflight
npm run benchmark:smoke
npm run benchmark:full
npm run benchmark:score -- --run <RUN_ID>
npm run benchmark:report -- --run <RUN_ID>
```

- `benchmark:preflight`: checks Docker, Harbor CLI + Harbor health, model auth, and output path safety.
- `benchmark:smoke`: runs baseline in `smoke` mode.
- `benchmark:full`: runs baseline in `full` mode.
- `benchmark:score`: recomputes `scorecard.json` for an existing run.
- `benchmark:report`: generates a human-readable `report.md` for an existing run and highlights scorecard/raw-log mismatches.

## Nix-darwin Quick Start

If you use `nix-darwin`, this repo provides `shell.nix` with a Harbor wrapper command.

```bash
nix-shell --run "harbor --version"
nix-shell --run "npm run benchmark:preflight -- --json"
```

`shell.nix` uses `uv tool run --from harbor harbor ...`, so Harbor does not need to be preinstalled globally.

## Deterministic Profile Contract

Profile file: `scripts/benchmark/config.default.json`

- `profileId`: `harbor-baseline-v1`
- `sampleSetId(smoke)`: `smoke-v1`
- `sampleSetId(full)`: `full-v1`

Datasets:

- `terminal-bench@2.0` (required in smoke/full)
- `swebenchpro` (optional in smoke, required in full)
- `project-interview` (optional extension, disabled by default)

## Environment Variables

Required (one of):

- Provider key in env (`ANTHROPIC_API_KEY` or `OPENAI_API_KEY`), or
- A working local OpenCode auth path so `opencode run --model <BENCHMARK_MODEL>` succeeds

Optional:

- `BENCHMARK_OUT_DIR` (default `benchmark-runs`)
- `BENCHMARK_CONCURRENCY` (default `1`)
- `BENCHMARK_MODEL` (default from committed profile)
- `BENCHMARK_ENABLE_PROJECT_INTERVIEW=1` (enable optional extension dataset)

## Artifact Contract

Each run writes under:

`benchmark-runs/<RUN_ID>/`

Mandatory files:

- `run-meta.json`
- `preflight.json`
- `datasets/<dataset>/summary.json`
- `datasets/<dataset>/raw/*` (for `status=ok/error`; `status=skipped` may only keep `summary.json`)
- `scorecard.json`
- `report.md`
- `stdout.log`

Security constraints:

- Output path is resolved under repo root only.
- API key values are not persisted into artifacts (logs are redacted).

## Scoring Rules

`scorecard.json` uses `schemaVersion: "v1"`.

- `datasetScore = passRate * 100` when `status=ok`
- `status=skipped`: excluded from denominator
- `status=error`: forced score `0`, included in denominator
- `overallScore = Σ(score_i * weight_i) / Σ(weight_i_in_denominator)`

Default weights:

- `terminal-bench@2.0`: `0.5`
- `swebenchpro`: `0.5`
- `project-interview`: `0` (not counted unless profile is updated)

## Typical Workflow

1. Run `npm run benchmark:preflight`.
2. Run `npm run benchmark:smoke` for quick validation.
3. Read generated `runId` from output JSON and inspect artifacts.
4. Recompute score if needed:
   - `npm run benchmark:score -- --run <RUN_ID>`
5. Generate human-readable report:
   - `npm run benchmark:report -- --run <RUN_ID>`
6. For heavier comparison, run `npm run benchmark:full`.

## Troubleshooting

- `E_PREFLIGHT_DOCKER_MISSING`
  - Install Docker CLI/desktop and rerun preflight.
- `E_PREFLIGHT_DOCKER_UNAVAILABLE`
  - Docker CLI exists but daemon is unreachable; start Docker Desktop and verify `docker info` succeeds.
- `E_PREFLIGHT_HARBOR_MISSING`
  - Install Harbor CLI (`uv tool install harbor` or `pip install harbor`).
- `E_PREFLIGHT_HARBOR_UNAVAILABLE`
  - Harbor CLI exists but health probe failed; verify network/account access.
- `E_PREFLIGHT_MODEL_AUTH`
  - Either export provider key env vars or verify `opencode run --model <BENCHMARK_MODEL>` works locally.
- `E_IO_OUTSIDE_REPO`
  - `BENCHMARK_OUT_DIR` escaped repo root; set an in-repo path.
- dataset `status=error` with `normalizationReason=empty_or_error` or `missing_summary`
  - `empty_or_error`: command succeeded but no parseable pass/fail summary was detected.
  - `missing_summary`: dataset was enabled in run-meta but summary artifact is missing/corrupted.
  - Inspect `datasets/<dataset>/raw/*` and rerun the benchmark command.

## Extension Hook: project-interview

Set:

```bash
export BENCHMARK_ENABLE_PROJECT_INTERVIEW=1
```

Then rerun benchmark commands. The dataset is still weight `0` by default, so it is tracked but not included in overall score unless profile weights are explicitly updated.
