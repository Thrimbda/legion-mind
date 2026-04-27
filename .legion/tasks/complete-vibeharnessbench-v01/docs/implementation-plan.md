# Implementation Plan: Complete VibeHarnessBench v0.1

日期：2026-04-25  
来源：`docs/research.md` + `docs/rfc.md`  
范围：后续 engineer 阶段执行；本文件只描述计划。

## 1. Milestone 1 — Runner semantic verifier framework

### Deliverables

- Extend case metadata to define `visible_verify_cmd`, `hidden_verify_cmd`, runtime requirements, and selfcheck controls.
- Add command execution wrapper for verifier commands with timeout, cwd/env isolation, stdout/stderr capture, JSON result parsing or normalized exit-code mapping.
- Update `run.json` case schema with `visible`, `hidden`, and runtime blocker fields.
- Update `selfcheck` to run the same hidden verifier against oracle and negative controls.
- Update `doctor` to validate verifier command existence, protected path isolation, and `node`/`go` availability.

### Acceptance

- Existing MVP isolation behavior remains intact.
- Missing runtime reports `ERROR_INFRA`/blocker, never PASS.
- Contract verifier is no longer the only path to PASS.

## 2. Milestone 2 — Pelican local-first artifact verifier

### Deliverables

- Starter with TODO rendering/motion code and expected output paths.
- Node stdlib oracle that writes `scene_manifest.json` + deterministic `pelican.anim.json` and optionally `pelican.gif`.
- Visible verifier for output presence/schema/basic variation.
- Hidden verifier for dimensions, fps, frame count, keyframes, wheel/pedal sync, body/head motion, loop continuity.
- Negative controls: `static-scene`, `desync-motion`.
- Authoring notes documenting GIF boundary and deterministic artifact substitution if binary GIF is not high-fidelity offline.

### Acceptance

- Oracle PASS.
- Static/desync negatives FAIL_HIDDEN with non-infra reasons.
- No PASS path depends only on `contract.json` markers.

## 3. Milestone 3 — 2048 reducer/replay/persistence verifier

### Deliverables

- Starter with reducer/replay/storage/UI TODOs and stable `data-testid` contract.
- Node stdlib oracle implementing reducer, seeded spawn, replay import/export, one-step undo, persistence model.
- Visible verifier for basic reducer/replay smoke.
- Hidden verifier for double-merge, spawn-on-noop, score, deterministic replay, undo/RNG, persistence, UI/static DOM contract fallback.
- Negative controls: `double-merge-bug`, `spawn-on-noop`, `bad-undo`.

### Acceptance

- Oracle PASS.
- All three negatives FAIL_HIDDEN for intended semantic reasons.
- UI/data-testid fallback is diagnostic; core pass requires logic semantics.

## 4. Milestone 4 — `mr-full-v1` clean-room Go verifier

### Deliverables

- Clean-room Go starter with coordinator/worker interfaces and TODO implementation.
- Go stdlib oracle implementation.
- Deterministic simulator/test harness for map/reduce correctness, reassignment, late completion ignore, deterministic output, crash/early-exit recovery, parallelism signal.
- Negative controls: no reassignment, double commit/late pollution, serial-only or equivalent.
- Authoring notes explaining clean-room relationship to capability boundary.

### Acceptance

- `go test`/verifier passes oracle.
- Negatives fail without infra crash.
- No MIT official skeleton/tests are vendored.

## 5. Milestone 5 — `kvsrv-core-v1` clean-room Go verifier

### Deliverables

- Clean-room Go starter for client/server/types/rpc simulator.
- Go stdlib oracle implementation.
- Hidden verifier for versioned Put/Get, retries, ErrMaybe, delayed duplicate replies, simplified concurrent linearizable history.
- Negative controls: retry-no-errmaybe, non-linearizable, duplicate/leaky retry state or equivalent.
- Authoring notes documenting simplified linearizability model.

### Acceptance

- Oracle PASS.
- Negatives FAIL_HIDDEN for intended reasons.
- Runtime absence is explicit blocker in report.

## 6. Milestone 6 — Reporting, compare, and final validation

### Deliverables

- `summary.md` surfaces final/visible/hidden/selfcheck verdicts.
- `compare` supports new schema fields and remains tolerant of old MVP reports.
- README updated to remove “MVP contract verifier” as current completion path and document local-first v0.1 boundaries.
- Validation evidence captured in task docs by later verify/review stages.

### Validation matrix

1. `python -m compileall bench`
2. `python -m bench.cli doctor`
3. `python -m bench.cli selfcheck --suite core-v1`
4. `python -m bench.cli run --suite smoke-v1 --adapter bench/adapters/examples/noop.yaml`
5. Per-case oracle/negative direct selfcheck evidence for pelican, 2048, mr-full, kvsrv.
6. `python -m bench.cli compare <run_a> <run_b>`
7. Isolation probe showing protected paths absent from HUT cwd/env/visible inputs.

## 7. Sequencing notes

- Implement runner framework before task packs so every case uses one verdict model.
- Implement one Node case then one Go case early to expose runtime/report issues before duplicating patterns.
- Do not weaken hidden verifier to make oracle pass; fix oracle or verifier semantics instead.
- Do not commit or expose oracle/hidden verifier into HUT starter/public paths.

## 8. Rollback checkpoints

- After Milestone 1: revert runner schema/executor changes if visible/hidden execution breaks MVP smoke, keeping isolation code.
- After each case milestone: case-level rollback may remove that case from `core-v1` only as a temporary blocked state; never restore contract-only PASS for complete v0.1.
- Final rollback: revert `vibe-harness-bench/**` changes from this task; keep design docs as evidence unless explicitly superseded.
