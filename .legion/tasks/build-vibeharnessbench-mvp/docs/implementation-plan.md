# Implementation Plan: VibeHarnessBench MVP

日期：2026-04-25  
来源 RFC：`.legion/tasks/build-vibeharnessbench-mvp/docs/rfc.md`  
推荐方案：runner + metadata + protected selfcheck MVP

## 1. 实施边界

允许新增/修改：

- `vibe-harness-bench/**`
- 本任务后续验证/报告产物（不包括 `plan.md`、`tasks.md`、`log.md`，除非由主流程另行要求）

不允许：

- 修改生产代码以外的现有 install scripts。
- 修改 root package scripts 来伪装 benchmark 入口。
- 把 oracle/verifier/negative controls 暴露给 HUT workspace。
- 把 starter 写成完整答案。

## 2. Milestone 1：项目骨架与 metadata

目标：建立独立项目目录和可加载的 suite/family/case metadata。

交付：

1. `vibe-harness-bench/README.md` 和 `pyproject.toml`。
2. `bench/cli.py` 命令入口骨架。
3. `bench/runner/schema.py` 定义 suite、family、case、adapter、result schema 的最小 dataclass/loader。
4. `bench/suites/{smoke-v1,core-v1,nightly-v1}.yaml`。
5. 三 family 四 case task pack 目录：
   - `pelican-bike-gif-v1`
   - `game-2048-v1`
   - `systems-go-v1/mr-full-v1`
   - `systems-go-v1/kvsrv-core-v1`

验收：

- suite loader 能解析三 suite。
- 每个 case 的 `task.yaml` 显式标注 `mvp_status`。
- protected 目录物理存在。

## 3. Milestone 2：隔离与 doctor

目标：先实现不可裁剪的 HUT 可见性规则。

交付：

1. `bench/runner/isolation.py`：
   - allowlist materialization。
   - 只 copy `starter/` 到 writable workspace。
   - 只暴露 `prompt.md` 与 `public/`。
   - protected paths 永不进入 adapter env。
2. `doctor`：
   - Python/runtime 检查。
   - suite/family/case reference 检查。
   - task pack 必需目录检查。
   - adapter schema 检查。
   - protected path leakage 检查。

验收命令：

```bash
python -m bench.cli doctor
```

## 4. Milestone 3：Runner、adapter 与 report

目标：让 noop HUT run 能完成并输出结构化失败报告。

交付：

1. `bench/adapters/examples/noop.yaml`。
2. `bench/runner/engine.py`：
   - selection：`--suite` / `--family` / `--case`。
   - seed 选择。
   - adapter subprocess 调用。
   - adapter summary 读取。
   - verdict 归一化。
3. `bench/runner/reporting.py`：
   - `run.json`。
   - `summary.md`。
4. `run` CLI。

验收命令：

```bash
python -m bench.cli run --suite smoke-v1 --adapter bench/adapters/examples/noop.yaml
```

期望：生成 `results/<run_id>/run.json` 与 `summary.md`；case 可失败，但不得是 runner 崩溃。

## 5. Milestone 4：Protected selfcheck MVP

目标：证明 oracle/negative controls 的保护路径真实可执行。

推荐先做 `kvsrv-core-v1` 的最小 selfcheck core：

- `oracle/`：一个最小正确 fixture 或实现样本。
- `negative_controls/retry-no-errmaybe/`：一个 known-bad fixture。
- `verifier/`：轻量 deterministic verifier，用于判定 oracle pass、negative fail。

交付：

1. `bench/runner/selfcheck.py`。
2. `selfcheck` CLI。
3. `task.yaml` 中声明 oracle/negative command。
4. selfcheck report 记录：expected verdict、actual verdict、infra_error。

验收命令：

```bash
python -m bench.cli selfcheck --suite core-v1
```

期望：至少一条真实 selfcheck 显示 oracle PASS、negative FAIL 且 `infra_error=false`；metadata-only case 被清楚标注为 MVP gap，不伪装为完整通过。

## 6. Milestone 5：Compare 与 smoke 证据

目标：完成 report 闭环。

交付：

1. `bench/runner/compare.py`。
2. `compare` CLI。
3. 对两个 smoke run 输出 case verdict diff、score diff、infra error diff。

验收命令：

```bash
python -m bench.cli compare results/<run_a> results/<run_b>
```

## 7. 最终验证计划

实现完成后按顺序执行并记录：

```bash
python -m compileall vibe-harness-bench/bench
python -m bench.cli doctor
python -m bench.cli selfcheck --suite core-v1
python -m bench.cli run --suite smoke-v1 --adapter bench/adapters/examples/noop.yaml
python -m bench.cli run --suite smoke-v1 --adapter bench/adapters/examples/noop.yaml
python -m bench.cli compare results/<run_a> results/<run_b>
```

若使用 `workdir=vibe-harness-bench`，命令可简化为 `python -m bench.cli ...`。

## 8. 回滚计划

由于本实现不改 existing install scripts，回滚只需：

1. 删除或隔离 `vibe-harness-bench/**`。
2. 删除或归档本任务 docs 中的设计产物。
3. 不需要恢复 root scripts、Legion CLI、setup-opencode 或 package manager 配置。

## 9. 后续 backlog

1. Docker pre-baked images：Node 22/pnpm/Playwright/ffmpeg 与 Go verifier images。
2. 高保真 `pelican-bike-gif-v1` verifier：GIF contract、pHash/SSIM、motion semantics。
3. 高保真 `game-2048-v1` verifier：Vitest、Playwright、replay determinism、edge-case merge rules。
4. 高保真 `systems-go-v1` verifier：MapReduce crash/reassign、KV ErrMaybe、linearizability。
5. Go/Node protected oracles：每 case 完整 oracle 与 multiple negative controls。
6. Clean-room systems derivation notes：记录与 MIT 6.5840 能力边界的关系、改写点和非 vendor 证明。
