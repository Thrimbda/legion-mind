# VibeHarnessBench v0.1

This is a local-first semantic benchmark harness for the four v0.1 atomic cases. It supports command adapters, out-of-tree HUT workspace materialization, per-case visible and hidden verifier commands, protected oracle/negative-control selfcheck, JSON/Markdown reports, and run comparison.

This README is the current truth for the benchmark harness. The benchmark requires Python, Node for the 2048 verifier, and Go for the systems verifiers; use a local toolchain or nix/dev-shell equivalent that provides those commands.

## Commands

Run from this directory:

```bash
python -m bench.cli doctor
python -m bench.cli run --suite smoke-v1 --adapter bench/adapters/examples/noop.yaml
python -m bench.cli selfcheck --suite core-v1
python -m bench.cli compare results/<run_a> results/<run_b>
```

`run` prints the generated run directory. Reports are written to `results/<run_id>/run.json` and `results/<run_id>/summary.md`.

## Isolation model

For a normal HUT run, the runner uses an allowlist:

- copies only `starter/` into the writable workspace;
- copies `prompt.md` and `public/` into run-owned visible input paths;
- exposes only prompt/public/workspace/artifact/budget/summary/trace paths plus case metadata through environment variables.

For local subprocess execution, those HUT-visible paths are materialized under an out-of-tree temporary execution root, not under this benchmark repository. The adapter runs with that temporary workspace as `cwd` and receives only temporary visible paths. After the adapter exits, the runner copies `workspace/`, `visible_inputs/`, and `artifacts/` back into `results/<run_id>/cases/...` as persistent report artifacts.

The adapter never receives the case root, `verifier/`, `oracle/`, or `negative_controls/` paths. This is a local subprocess isolation model, not a full sandbox/container/chroot for untrusted code.

## Task pack status

The MVP includes three families and four atomic cases:

- `pelican-bike-gif-v1/cases/pelican-bike-gif-v1`
- `game-2048-v1/cases/game-2048-v1`
- `systems-go-v1/cases/mr-full-v1`
- `systems-go-v1/cases/kvsrv-core-v1`

Each case has the required physical directories. Starters contain TODOs/incomplete skeletons only, not complete answers.

## Semantic verifier boundaries

`contract.json` compatibility remains in runner code only for legacy packs; it is not the v0.1 completion path. Current task packs use `visible_verify_cmd` and `hidden_verify_cmd` from `task.yaml`, and `PASS` requires the hidden verifier to pass.

- Pelican uses deterministic `pelican.anim.json` plus `scene_manifest.json` as the authoritative offline artifact; a binary GIF is optional if present.
- 2048 uses Node stdlib logic/replay/persistence checks plus static `data-testid` contract checks.
- MR and KV use clean-room Go stdlib verifier programs with deterministic simulator-style semantic signals; no MIT official skeletons/tests are vendored.
