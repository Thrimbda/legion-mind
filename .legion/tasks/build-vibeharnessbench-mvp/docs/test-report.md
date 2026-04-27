# Test Report: VibeHarnessBench MVP isolation blocking re-verification

日期：2026-04-25  
阶段：`verify-change` 复验  
验证范围：此前 `review-change` FAIL 后的 isolation blocking 工程修复，覆盖 `vibe-harness-bench/**` 中 HUT execution root、adapter env、run materialization/copy-back，以及原有 compile/doctor/selfcheck/run/compare 闭环。

## 结论

PASS。

本次是针对 isolation blocking 的复验。建议命令全部重新执行并通过；额外 isolation probe 证明：

- `materialize_hut_workspace` 会拒绝位于 benchmark repo 内的 execution root。
- HUT materialization 与 adapter-visible env 均使用 repo 外临时路径；adapter env 不包含 protected/repo path。
- `run` 执行期间使用 repo 外 temp execution root，adapter 完成后才复制 workspace、visible inputs、artifacts 回 `results/`。
- 原有 `compileall`、`doctor`、`selfcheck`、两次 `run`、`compare` 仍通过。

## 执行命令与结果

除特别说明外，workdir 均为 `vibe-harness-bench`。

| # | 命令 | 退出码 | 摘要 |
|---|---|---:|---|
| 1 | `python -m compileall bench` | 0 | Python package 语法编译通过。 |
| 2 | `python -m bench.cli doctor` | 0 | Python 3.12.12；加载 suites `core-v1, nightly-v1, smoke-v1`；加载 noop adapter；`doctor: PASS`。此轮 doctor 覆盖 out-of-tree execution root 与 adapter env 不泄露 protected/repo paths 的检查。 |
| 3 | `python -m bench.cli selfcheck --suite core-v1` | 0 | 四个 atomic case 均 PASS；oracle 均为 expected PASS / actual PASS；negative controls 均为 expected `FAIL_HIDDEN` / actual `FAIL_HIDDEN`；所有 `infra_error=False`。 |
| 4 | `python -m bench.cli run --suite smoke-v1 --adapter bench/adapters/examples/noop.yaml` | 0 | 生成 smoke run A；`kvsrv-core-v1` 为 `FAIL_HIDDEN`，`infra_error=False`，不是 infra crash。 |
| 5 | `python -m bench.cli run --suite smoke-v1 --adapter bench/adapters/examples/noop.yaml` | 0 | 生成 smoke run B；结果与 run A 一致，可用于 compare。 |
| 6 | `python -m bench.cli compare results/20260425T090357Z-edc4dceb results/20260425T090357Z-41192584` | 0 | compare 输出 `systems-go-v1/kvsrv-core-v1 | FAIL_HIDDEN -> FAIL_HIDDEN | 0.0 -> 0.0 | False -> False`。 |
| 7 | isolation probe：直接调用 `materialize_hut_workspace(case, ROOT / "results" / "doctor-in-repo", 1)` 并用 `tempfile.TemporaryDirectory(prefix="vbh-verify-hut-")` 验证 visible paths/env | 0 | repo 内 execution root 被拒绝；repo 外 temp visible paths/env 通过断言。输出 `isolation probe: PASS`。 |

> 注：一次把 compare 与 isolation probe 拼在同一个 `python -c` 的验证命令因 shell/python quoting 构造错误产生 `SyntaxError`；compare 已成功输出，probe 随后以等价 Python 代码单独重跑并通过。该失败不是实现缺口。

## 新 run dirs / artifacts

- Smoke run A：`vibe-harness-bench/results/20260425T090357Z-edc4dceb/`
  - `run.json`
  - `summary.md`
  - case artifacts：`cases/systems-go-v1/kvsrv-core-v1/artifacts/`
  - copied-back HUT workspace：`cases/systems-go-v1/kvsrv-core-v1/workspace/`
  - copied-back visible inputs：`cases/systems-go-v1/kvsrv-core-v1/visible_inputs/`
- Smoke run B：`vibe-harness-bench/results/20260425T090357Z-41192584/`
  - `run.json`
  - `summary.md`
  - case artifacts：`cases/systems-go-v1/kvsrv-core-v1/artifacts/`
  - copied-back HUT workspace：`cases/systems-go-v1/kvsrv-core-v1/workspace/`
  - copied-back visible inputs：`cases/systems-go-v1/kvsrv-core-v1/visible_inputs/`
- Selfcheck report：`vibe-harness-bench/results/selfcheck-last/selfcheck.json`

## Isolation blocking evidence

### Doctor

```text
python: 3.12.12
suites: core-v1, nightly-v1, smoke-v1
adapter: noop
doctor: PASS
```

`doctor` now exercises out-of-tree HUT materialization and rejects an in-repo execution root check path. It also validates adapter-visible env for protected/repo path leakage.

### Direct isolation probe

```text
isolation probe: PASS
execution_root=/var/folders/nt/__ctsqgj5m7_068vksf2kqk00000gn/T/vbh-verify-hut-n3_m1fxi
workspace=/var/folders/nt/__ctsqgj5m7_068vksf2kqk00000gn/T/vbh-verify-hut-n3_m1fxi/workspace
summary_out=/var/folders/nt/__ctsqgj5m7_068vksf2kqk00000gn/T/vbh-verify-hut-n3_m1fxi/artifacts/summary.json
```

Probe 断言内容：

- `materialize_hut_workspace(case, ROOT / "results" / "doctor-in-repo", 1)` 抛出 `RuntimeError`，错误信息包含 `outside benchmark project root`。
- `workspace`、`prompt`、`public`、`artifacts`、`budget`、`summary`、`trace` 均在 repo 外 temp execution root 下。
- adapter env 中所有 visible path 变量均不包含 benchmark repo root。

### Run materialization and copy-back

`bench.runner.engine._run_one` 在 `tempfile.TemporaryDirectory(prefix="vbh-hut-")` 中调用 `materialize_hut_workspace`，adapter 以该 temp `workspace` 为 cwd 运行；adapter 结束后才调用 `persist_hut_artifacts` 复制到 `results/<run_id>/cases/...`。

`run.json` 记录的是复制回 `results/` 后的 reviewer artifacts，例如：

```text
artifact_dir=/Users/c1/Work/legion-mind/vibe-harness-bench/results/20260425T090357Z-edc4dceb/cases/systems-go-v1/kvsrv-core-v1/artifacts
workspace_dir=/Users/c1/Work/legion-mind/vibe-harness-bench/results/20260425T090357Z-edc4dceb/cases/systems-go-v1/kvsrv-core-v1/workspace
visible_inputs.prompt=/Users/c1/Work/legion-mind/vibe-harness-bench/results/20260425T090357Z-edc4dceb/cases/systems-go-v1/kvsrv-core-v1/visible_inputs/prompt.md
```

这与运行时 temp probe 一起证明：adapter/HUT 运行时可见的是 repo 外 temp 路径，运行后才复制回 `results/` 供报告与审阅。

## Selfcheck evidence

```text
pelican-bike-gif-v1/pelican-bike-gif-v1: PASS
  oracle:oracle expected=PASS actual=PASS infra_error=False
  negative:missing-motion expected=FAIL_HIDDEN actual=FAIL_HIDDEN infra_error=False
game-2048-v1/game-2048-v1: PASS
  oracle:oracle expected=PASS actual=PASS infra_error=False
  negative:bad-merge expected=FAIL_HIDDEN actual=FAIL_HIDDEN infra_error=False
systems-go-v1/mr-full-v1: PASS
  oracle:oracle expected=PASS actual=PASS infra_error=False
  negative:no-retry expected=FAIL_HIDDEN actual=FAIL_HIDDEN infra_error=False
systems-go-v1/kvsrv-core-v1: PASS
  oracle:oracle expected=PASS actual=PASS infra_error=False
  negative:no-errmaybe expected=FAIL_HIDDEN actual=FAIL_HIDDEN infra_error=False
```

## Smoke run / compare evidence

Both new smoke runs produced `verdict_counts: {"FAIL_HIDDEN": 1}` with `infra_error=false` for `systems-go-v1/kvsrv-core-v1` seed `401`. The noop adapter intentionally did not solve the task and wrote `artifacts/summary.json`, after which the verifier normalized the missing contract to `FAIL_HIDDEN` rather than infra failure.

Compare output:

```text
left=20260425T090357Z-edc4dceb adapter=noop
right=20260425T090357Z-41192584 adapter=noop
case | verdict | score | infra_error
systems-go-v1/kvsrv-core-v1 | FAIL_HIDDEN -> FAIL_HIDDEN | 0.0 -> 0.0 | False -> False
```

## Why these commands were chosen

- `compileall` is the lowest-cost guard for syntax/importability of the Python runner package.
- `doctor` is the strongest single entrypoint for metadata/schema/isolation invariants, and now specifically checks out-of-tree HUT execution roots plus adapter env leakage.
- `selfcheck --suite core-v1` proves protected oracle/negative paths still behave correctly and that negative failures are benchmark verdicts, not infra crashes.
- Two smoke `run` executions prove the adapter/HUT path still executes end-to-end and produces reviewer artifacts.
- `compare` proves the report comparison loop still consumes generated run dirs.
- The direct isolation probe was added because the previous blocking issue was specifically about execution root and visible path isolation; it exercises the exact `materialize_hut_workspace` boundary rather than relying only on CLI exit codes.

## 未覆盖项 / 明确跳过项

- Docker pre-baked images、离线 Node/Go/Playwright/ffmpeg 环境仍未覆盖；RFC 明确列为 MVP 非目标/backlog。
- pelican/2048/systems 高保真 verifier、真实 Go RPC/concurrency verifier、GIF/image 语义 verifier、2048 browser/property verifier仍未覆盖；本轮验证的是 MVP deterministic contract verifier 与 isolation blocking 修复。
- 云调度、leaderboard、多机执行、人工审美打分、trace/snapshot 深比较仍为非目标。
- HUT `run` 仍只执行 smoke suite 的 `kvsrv-core-v1`；四 case protected 正负路径由 `selfcheck --suite core-v1` 覆盖。

## 失败 / 退回判断

- 实现失败项：无。
- 因实现缺口需要退回 `engineer`：无。
- 跳过项：仅限 RFC 明确的 MVP 非目标/backlog。
