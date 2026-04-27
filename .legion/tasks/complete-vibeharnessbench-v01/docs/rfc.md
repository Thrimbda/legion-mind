# RFC: Complete VibeHarnessBench v0.1

状态：Draft for review  
日期：2026-04-25  
范围：设计完整 v0.1；不修改生产代码  
设计档位：heavy

## 1. 决策摘要

推荐采用 **local-first semantic verifiers**：在保留 MVP 隔离模型的基础上，为四个 atomic case 补齐真实 workspace outputs、visible verifier、hidden verifier、oracle 与 negative controls。完整 v0.1 不再接受 `contract.json` 作为唯一 verifier；`contract.json` 只能作为可选 metadata，不得决定 PASS。

## 2. 目标与非目标

### 2.1 目标

1. Runner 支持 visible verifier、hidden verifier、oracle/negative selfcheck，并在 `run.json` 记录 visible/hidden/selfcheck verdict。
2. `bench doctor` 检查 task pack 完整性、隔离、verifier 可执行性、本地 Node/Go runtime 能力。
3. `bench selfcheck --suite core-v1` 对四个 atomic case 均要求 oracle PASS，所有 negative controls FAIL，且 negative fail 不能是 infra crash。
4. 每个 case 有真实 workspace outputs 与 semantic verifier。
5. 核心验证 local-first/offline：Node tasks 用 Node stdlib；Go tasks 用 Go stdlib；缺 runtime 时报告 blocker。
6. 保持 HUT 不可见 verifier/oracle/negative_controls/hidden seeds/golden outputs。

### 2.2 非目标

- 不在 v0.1 强制完成 Docker pre-baked full stack；Docker 可作为兼容执行器或后续增强。
- 不引入联网安装依赖作为核心验证路径。
- 不建设 leaderboard、云调度、多机执行或人工审美评分。
- 不 vendor MIT 6.5840 官方 skeleton/tests/distribution。

## 3. 方案比较

| 方案 | 内容 | 优点 | 缺点 | 结论 |
|---|---|---|---|---|
| A. Docker-faithful full stack | 按原设计实现 Docker agent/verifier image、Node 22/pnpm/Playwright/ffmpeg、Go 1.22、真实进程/RPC | 最贴近原始文档；隔离边界强；未来评测不可信 HUT 更可靠 | 当前仓库和本机环境不确定；镜像构建/依赖预烘焙成本高；易被 Docker/ffmpeg/Playwright 阻塞；联网风险高 | 不作为本任务推荐主路径，可保留执行器接口与后续 backlog |
| B. Local-first semantic verifiers | 本地 subprocess + out-of-tree HUT root；Node/Go stdlib case-specific verifier；semantic artifact/model checks | 离线可跑；实现范围可控；比 contract markers 有真实区分度；延续 MVP 隔离修复；适合当前仓库交付 | sandbox 不等价 Docker；pelican GIF 二进制高保真有限；systems 可用 simulator 代替真实 RPC，需说明边界 | **推荐** |
| C. 继续 MVP contract verifier | 保留 `contract.json` markers，扩展 report 文案 | 最快；风险低；无需 Node/Go | 不能评测任务语义；negative controls 可被 marker 游戏化；与完整 v0.1 验收冲突 | 明确拒绝作为完整 v0.1 |

## 4. Runner 改造设计

### 4.1 Metadata schema

`task.yaml` 从 `verifier.command` 空命令升级为显式命令组：

```json
{
  "visible_verify_cmd": ["node", "public/run_visible.mjs"],
  "hidden_verify_cmd": ["node", "verifier/run_hidden.mjs"],
  "runtime": {"requires": ["node"]},
  "selfcheck": {
    "oracle": {"workspace_dir": "oracle"},
    "negative_controls": [{"id": "static-scene", "workspace_dir": "negative_controls/static-scene"}]
  }
}
```

Go cases use `go test` or a verifier wrapper under `verifier/` that copies/points to workspace and runs stdlib tests.

### 4.2 Execution phases

For each HUT case run:

1. Materialize HUT workspace from starter only, preserving MVP out-of-tree execution root.
2. Run adapter.
3. Run visible verifier against final workspace/artifacts/public-visible fixtures.
4. Run hidden verifier in protected context against final workspace/artifacts.
5. Produce final verdict:
   - `ERROR_AGENT` if adapter fails.
   - `FAIL_VISIBLE` if visible verifier fails functionally.
   - `FAIL_HIDDEN` if visible passes/was skipped but hidden fails.
   - `PASS` only if hidden passes.
   - `ERROR_INFRA` for verifier command crash, missing runtime, unreadable metadata, timeout caused by infra.

Visible failure should be recorded even if hidden still runs for diagnostic mode; gate default may short-circuit hidden after visible fail, but `run.json` must show whether hidden was skipped.

### 4.3 `run.json` additions

Each case result records:

```json
{
  "case_id": "game-2048-v1",
  "verdict": "FAIL_HIDDEN",
  "visible": {"verdict": "PASS", "reason": "logic smoke passed", "duration_ms": 123},
  "hidden": {"verdict": "FAIL_HIDDEN", "reason": "double merge bug", "duration_ms": 321},
  "selfcheck": null,
  "runtime": {"node": "v22.x", "go": null, "blocked": false}
}
```

`bench selfcheck` writes `results/selfcheck-last/selfcheck.json` with per control verdict:

```json
{
  "case_id": "pelican-bike-gif-v1",
  "oracle": {"verdict": "PASS"},
  "negative_controls": [{"id": "static-scene", "verdict": "FAIL_HIDDEN", "infra_error": false}]
}
```

### 4.4 Runtime blocker semantics

- `doctor` must check `node --version` for Node cases and `go version` for Go cases.
- If runtime missing, `doctor` fails with actionable blocker.
- If a run/selfcheck is attempted anyway, affected cases report `ERROR_INFRA` with reason `missing runtime: node` or `missing runtime: go`.
- Missing runtime is never a PASS and never a semantic FAIL.

## 5. Task pack semantic design

### 5.1 `pelican-bike-gif-v1`

#### Required outputs

- `artifacts/scene_manifest.json`
- `artifacts/pelican.anim.json` as executable deterministic animation artifact
- Optional `artifacts/pelican.gif` if implemented without nonlocal dependencies

If high-fidelity binary GIF generation/decoding cannot be supported offline, v0.1 accepts the deterministic animation artifact as the authoritative artifact. This boundary must be stated in task docs/report. The verifier still checks real animation semantics and must not only check contract markers.

#### Manifest/artifact contract

- width/height: `512x512`
- fps: `24`
- duration: `4s`
- frame_count: `96`
- loop: frame 0 and frame 96-equivalent continuous within tolerance
- objects: sky, sea, road, bicycle, wheel(s), pelican body/head
- frame records include wheel angle, pedal angle, body y, head angle, normalized keypoint positions, optional frame hash/color summary

#### Hidden verifier

Node stdlib verifier checks:

- JSON schema, dimensions, fps, frame_count, seed.
- Keyframes `0/24/48/72/95` exist and are deterministic.
- Wheel angle progresses continuously and wraps modulo 360.
- Pedal angle stays synchronized with wheel angle within tolerance.
- Pelican body bob amplitude is nonzero and bounded.
- Head secondary motion has distinct phase/amplitude.
- Loop continuity across first/last frame.
- Static frames fail by checking variation over frame summaries/keypoints.

#### Controls

- Oracle: generates full manifest + deterministic animation artifact; optional GIF-like artifact.
- Negative controls:
  - `static-scene`: no frame-to-frame motion; must fail hidden motion variation.
  - `desync-motion`: wheel/pedal phase mismatch; must fail synchronization.

### 5.2 `game-2048-v1`

#### Required outputs/workspace semantics

- Starter contains real TODOs in reducer/replay/storage/UI glue; not a complete solution.
- Core verifier targets pure logic first: reducer, deterministic RNG/spawn, replay import/export, persistence model.
- UI/data-testid can be checked by static source/DOM contract fallback local to Node stdlib.

#### Hidden verifier

Node stdlib harness loads the implemented reducer/replay/storage modules or a defined CLI adapter and checks:

- Single sweep merge: `[2,2,2,0]` left => `[4,2,0,0]`.
- No new spawn on no-op moves.
- Score increments exactly with merges.
- Seed + move sequence deterministic terminal board.
- Replay export/import reconstructs terminal board.
- One-step undo restores board, score, RNG/spawn state; new branch after undo does not retain stale redo.
- Persistence model serializes/restores equivalent state.
- Static UI fallback checks `data-testid` contract: `board`, `cell-r-c`, `score-value`, direction buttons, new/undo/export/import, win/gameover overlays.

#### Controls

- Oracle: complete reducer/replay/persistence/UI contract implementation.
- Negative controls:
  - `double-merge-bug`
  - `spawn-on-noop`
  - `bad-undo`

### 5.3 `systems-go-v1 / mr-full-v1`

#### Clean-room stance

Do not vendor MIT 6.5840 files. The task may preserve the capability boundary—coordinator/worker, map/reduce phases, reassignment, late completion handling, deterministic output—but code, package names, fixtures, tests, and harness are clean-room.

#### Verifier form

Preferred local-first verifier: Go stdlib deterministic simulator/test harness. It may directly instantiate coordinator/worker interfaces and simulate leases, crashes, slow workers, and late completions instead of spawning true RPC processes. True RPC process mode is an optional compatibility enhancement, not required for v0.1 if simulator covers semantics.

#### Hidden coverage

- Map and reduce correctness over clean-room fixtures.
- Reassignment after lease timeout.
- Late completion from original worker ignored after reassignment.
- Deterministic output naming/sorting/content across repeated runs.
- Crashy/early-exit worker does not hang job.
- Parallelism/concurrency observable via simulator events or worker scheduling.

#### Controls

- Oracle: clean-room working implementation/harness.
- Negative controls:
  - `no-reassign`
  - `double-commit` / late completion corrupts output
  - `serial-only` or equivalent parallelism failure

### 5.4 `systems-go-v1 / kvsrv-core-v1`

#### Verifier form

Go stdlib clean-room implementation/verifier for versioned key/value semantics. It may use deterministic in-process network simulator rather than real RPC processes.

#### Hidden coverage

- `Get` missing key returns `ErrNoKey`.
- `Put(key,value,version=0)` creates key; matching version updates and increments.
- Version mismatch returns `ErrVersion`.
- Dropped/delayed replies trigger retries.
- Ambiguous retried Put maps to `ErrMaybe`, not plain `ErrVersion`.
- Concurrent simplified histories satisfy a deterministic linearizability checker or serializability model over externally observed operations.
- Delayed duplicates do not corrupt state.

#### Controls

- Oracle: clean-room server/client/harness passing all cases.
- Negative controls:
  - `retry-no-errmaybe`
  - `non-linearizable`
  - `leaky-or-duplicate-state` or equivalent retry/duplicate bug

## 6. Validation matrix

| Command / Check | Expected |
|---|---|
| `python -m compileall bench` | runner imports compile |
| `python -m bench.cli doctor` | PASS only if metadata, isolation, task dirs, verifier commands, Node/Go runtimes are valid |
| `python -m bench.cli selfcheck --suite core-v1` | all four oracles PASS; every negative control FAIL_HIDDEN; no negative `infra_error=true` |
| `python -m bench.cli run --suite smoke-v1 --adapter bench/adapters/examples/noop.yaml` | completes report with case failures, not runner crash |
| `python -m bench.cli run --case pelican-bike-gif-v1 --adapter ...` | visible/hidden verdict recorded; no contract-only pass |
| `python -m bench.cli run --case game-2048-v1 --adapter ...` | reducer/replay/persistence semantics checked |
| `python -m bench.cli run --case mr-full-v1 --adapter ...` | Go semantic harness checks MR controls |
| `python -m bench.cli run --case kvsrv-core-v1 --adapter ...` | Go semantic harness checks KV controls |
| `python -m bench.cli compare <run_a> <run_b>` | compares final + visible/hidden verdicts without schema crash |
| Direct isolation probe | protected paths absent from HUT cwd/env/visible inputs |

## 7. Rollback plan

Implementation should be isolated to `vibe-harness-bench/**` plus task docs/evidence under `.legion/tasks/complete-vibeharnessbench-v01/docs/**`.

Rollback steps:

1. Revert runner changes that introduce visible/hidden/selfcheck command execution.
2. Revert task pack semantic files under `vibe-harness-bench/tasks/**` to MVP state if necessary.
3. Preserve MVP isolation fix unless it is directly implicated; it was already reviewed as PASS and remains useful.
4. If only one case verifier is faulty, disable that case in suite metadata only as an emergency rollback and mark validation blocked; do not re-enable contract-only PASS.
5. Do not modify root install scripts, Legion workflow, or `.legion/tasks/complete-vibeharnessbench-v01/{plan.md,tasks.md,log.md}` as part of rollback.

## 8. Recommended裁决

Adopt local-first semantic verifiers. This is the only compared option that satisfies complete v0.1 semantics without making Docker/联网 dependencies the critical path. The design is honest about boundaries: pelican may use deterministic animation artifacts rather than binary GIF pHash/SSIM, and systems may use deterministic simulator harnesses rather than real RPC processes, but every case must verify real task semantics and must be guarded by oracle/negative selfcheck.
