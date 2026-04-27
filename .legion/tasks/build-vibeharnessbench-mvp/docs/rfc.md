# RFC: VibeHarnessBench MVP

状态：Draft for review  
日期：2026-04-25  
范围：设计 VibeHarnessBench MVP；不修改生产代码  
设计档位：standard/heavy 之间偏 heavy

## 1. 为什么需要 RFC

任务 contract 已稳定，但实现前仍有真实设计不确定性：

- `benchmark-design.md` 的完整 Done Definition 覆盖 runner、adapter、Docker、三个 task family、四个 atomic case、高保真 verifier、oracle、negative controls 与报告系统；一次性实现风险过高。
- 最核心风险不是“命令能不能跑”，而是 HUT 隔离边界是否正确：HUT 绝不能看到 verifier、oracle、negative controls 或 hidden seeds。
- 当前仓库没有活动 benchmark harness，新增项目边界、CLI 命令、结果格式和验证证据需要先固定。
- 需要明确 MVP 与完整 benchmark 的差距，避免把 scaffold 误报为完成完整 benchmark。

因此 RFC 的目的，是把可实现的 MVP 切片、不可破坏的隔离规则、验证计划和回滚路径写成工程入口协议。

## 2. 目标与非目标

### 2.1 MVP 目标

交付一个可运行、可自检、可回滚的最小 benchmark 系统：

1. 新增独立项目目录 `vibe-harness-bench/**`。
2. Python runner CLI 支持：`doctor`、`run`、`selfcheck`、`compare`。
3. 支持 suite/family/case metadata，包含三 family 四 atomic case。
4. 支持 adapter command schema，至少提供 `noop` adapter。
5. Task pack 物理区分 `starter/`、`public/`、`verifier/`、`oracle/`、`negative_controls/`。
6. HUT workspace 只由 `starter/` copy、`prompt.md`、`public/` 构成。
7. 至少建立一条 protected selfcheck 核心路径，证明 oracle pass、negative fail，且失败不是 infra crash。
8. 输出 `run.json` 与 `summary.md`，并支持 compare smoke outputs。

### 2.2 非目标

- 不一次性完成 pelican/2048/systems 的高保真 verifier。
- 不建设 Docker pre-baked images 体系。
- 不把 root install scripts、Legion CLI 或现有 setup-opencode 流程改成 benchmark 入口。
- 不 vendor MIT 6.5840 官方分发包、测试或 skeleton。
- 不建设 leaderboard、云调度、多机执行或人工审美打分。

## 3. MVP 与完整 Done Definition 的差距

| 完整 Done Definition | MVP 承诺 | 差距处理 |
|---|---|---|
| `bench doctor` 成功 | `doctor` 检查 Python 版本、目录、suite/case metadata、adapter schema、隔离白名单 | Docker/Node/Go 镜像检查只提示 backlog，不作为 MVP fatal |
| `bench selfcheck --suite core-v1` 全通过 | `selfcheck core-v1` 能遍历四 case metadata；至少 `kvsrv-core-v1` 或等价 core path 有真实 oracle pass 与 negative fail | 其余高保真 oracle/verifier 进入 backlog，metadata 标注 `mvp_status` |
| noop adapter 完整跑完并输出失败报告 | `run --suite smoke-v1 --adapter noop` 生成失败报告，verdict 不应是 `ERROR_INFRA` | 不要求真实 HUT 完成任务 |
| 每 case oracle pass | MVP 保留 protected oracle 目录和 schema；至少一条可执行证明 | 完整四 case oracle 后续补齐 |
| 每 case negative fail | MVP 保留 negative_controls 目录和 schema；至少一条可执行证明 | 完整 known-bad matrix 后续补齐 |
| `core-v1` Docker 离线运行 | schema 预留 executor/docker 字段；本地命令模式可跑 | Docker pre-baked images 进入 backlog |
| HUT 看不到 hidden verifier/oracle | MVP 必须实现白名单 workspace materialization，并用 selfcheck/doctor 检查 protected paths 不进入 HUT workspace | 这是 MVP 不可裁剪项 |
| family 与 atomic case 报告 | `run.json` 和 `summary.md` 同时输出 suite/family/case 层级 | 趋势图、trace、snapshot 可延期 |

## 4. 推荐目录

```text
vibe-harness-bench/
  README.md
  pyproject.toml
  bench/
    __init__.py
    cli.py
    runner/
      __init__.py
      engine.py
      isolation.py
      reporting.py
      selfcheck.py
      compare.py
      schema.py
    adapters/
      examples/
        noop.yaml
      schema.md
    suites/
      smoke-v1.yaml
      core-v1.yaml
      nightly-v1.yaml
  tasks/
    pelican-bike-gif-v1/
      family.yaml
      cases/pelican-bike-gif-v1/{task.yaml,prompt.md,starter/,public/,verifier/,oracle/,negative_controls/,docs/}
    game-2048-v1/
      family.yaml
      cases/game-2048-v1/{task.yaml,prompt.md,starter/,public/,verifier/,oracle/,negative_controls/,docs/}
    systems-go-v1/
      family.yaml
      cases/mr-full-v1/{task.yaml,prompt.md,starter/,public/,verifier/,oracle/,negative_controls/,docs/}
      cases/kvsrv-core-v1/{task.yaml,prompt.md,starter/,public/,verifier/,oracle/,negative_controls/,docs/}
  results/
    .gitkeep
```

目录原则：

- `bench/runner/**` 是 runner 核心，不读取 task protected paths 给 HUT。
- `tasks/**/cases/**` 是 task pack；case root 不能整体暴露给 HUT。
- `results/**` 是生成物目录；实现时可默认 gitignore，MVP 只需保留 layout。

## 5. 最小架构

### 5.1 Runner

Runner 职责：

1. 解析 CLI 参数与 suite/family/case selection。
2. 加载 suite、family、case metadata。
3. 为每个 case 创建 run workspace：只 copy `starter/`，并以只读输入提供 `prompt.md` 和 `public/`。
4. 调用 adapter command。
5. 调用 protected verifier/selfcheck 路径。
6. 归一化 verdict：`PASS`、`FAIL_VISIBLE`、`FAIL_HIDDEN`、`ERROR_AGENT`、`ERROR_INFRA`。
7. 生成 `run.json` 与 `summary.md`。

MVP 可先使用本地 subprocess executor；接口保留 `executor: local | docker`，但 Docker 不作为本轮必须实现。

### 5.2 Adapter

Adapter 最小形态是 YAML command adapter：

```yaml
id: noop
mode: command
command: ["python", "-c", "import json, os; json.dump({'status':'completed','notes':'noop'}, open(os.environ['BENCH_SUMMARY_OUT'], 'w'))"]
timeout_grace_sec: 5
supports_metrics: false
```

Runner 注入环境变量：

- `BENCH_TASK_FAMILY_ID`
- `BENCH_CASE_ID`
- `BENCH_TASK_SEED`
- `BENCH_PROMPT_FILE`
- `BENCH_PUBLIC_DIR`
- `BENCH_WORKSPACE_DIR`
- `BENCH_ARTIFACT_DIR`
- `BENCH_BUDGET_FILE`
- `BENCH_SUMMARY_OUT`
- `BENCH_TRACE_OUT`

Adapter 输出 `summary.json`。缺失或异常退出为 `ERROR_AGENT`，不得崩成 `ERROR_INFRA`。

### 5.3 Task pack

每个 atomic case 必须存在：

```text
task.yaml
prompt.md
starter/
public/
verifier/
oracle/
negative_controls/
docs/
```

`task.yaml` MVP 字段：

- `id`
- `family_id`
- `kind`
- `language_stack`
- `mvp_status`: `metadata-only | selfcheck-core | full`
- `starter_dir`
- `public_dir`
- `protected_verifier_dir`
- `protected_oracle_dir`
- `protected_negative_controls_dir`
- `budgets.wall_time_sec`
- `gate_seeds`
- `nightly_seeds`
- `verifier.command`（可为空但必须显式标注 reason）
- `selfcheck.oracle.command`
- `selfcheck.negative_controls[].command`

### 5.4 Report

`run.json` 最小结构：

```json
{
  "schema_version": "vbh.run.v1",
  "suite_id": "smoke-v1",
  "adapter_id": "noop",
  "started_at": "...",
  "ended_at": "...",
  "verdict_counts": {"PASS": 0, "FAIL_HIDDEN": 4},
  "family_results": [
    {
      "family_id": "systems-go-v1",
      "score": 0.0,
      "cases": [
        {"case_id": "kvsrv-core-v1", "seed": 11, "verdict": "FAIL_HIDDEN", "infra_error": false}
      ]
    }
  ]
}
```

`summary.md` 面向 reviewer：列 suite、adapter、每个 family/case verdict、artifact 路径、infra error 摘要。

### 5.5 Selfcheck

Selfcheck 不经过 HUT adapter；它直接用 protected oracle 与 negative controls 验证 benchmark 自身：

- oracle workspace：由 `oracle/` materialize，只给 verifier/selfcheck 使用。
- negative workspace：由 `negative_controls/<id>/` materialize，只给 verifier/selfcheck 使用。
- oracle 期望：PASS。
- negative 期望：FAIL，且 `infra_error=false`。

MVP 中至少一条 case 的 oracle/negative 必须真实执行；建议选择 `kvsrv-core-v1` 的小型 Python/metadata verifier 或 clean-room minimal fixture，避免 Node/Go/Docker 重环境阻塞。其余 case 可先 metadata-only，但必须在 report 中显示未达到完整 Done Definition。

## 6. 隔离规则（不可裁剪）

HUT 只能拿：

1. `starter/` 的一次性 copy，作为可写 workspace。
2. `prompt.md` 的只读 copy 或只读路径。
3. `public/` 的只读 copy 或只读路径。

HUT 不能拿：

- `verifier/`
- `oracle/`
- `negative_controls/`
- hidden seeds
- golden outputs
- case root 的整体路径
- selfcheck 生成的 protected workspace

实现要求：

- workspace materialization 使用 allowlist，不使用 denylist。
- `doctor` 检查 case root 中 protected 目录存在且未配置进 adapter-visible paths。
- `selfcheck` 与 `run` 的工作目录分离。
- `run.json` 记录 materialized visible inputs 的路径与 checksum；不记录 protected 文件内容。

## 7. CLI 命令

### 7.1 `doctor`

用途：检查项目可运行性与元数据一致性。

示例：

```bash
python -m bench.cli doctor
```

检查：

- Python 版本。
- suites 可加载。
- family/case id 引用完整。
- 每个 case 有 task pack 必需目录。
- adapter YAML schema 合法。
- protected paths 未出现在 HUT visible allowlist。

### 7.2 `run`

用途：执行 HUT benchmark run。

示例：

```bash
python -m bench.cli run --suite smoke-v1 --adapter bench/adapters/examples/noop.yaml
python -m bench.cli run --case kvsrv-core-v1 --adapter bench/adapters/examples/noop.yaml --seed 11
```

输出：`results/<run_id>/run.json`、`summary.md`。

### 7.3 `selfcheck`

用途：验证 benchmark 自身，不经过 HUT。

示例：

```bash
python -m bench.cli selfcheck --suite core-v1
python -m bench.cli selfcheck --case kvsrv-core-v1
```

期望：oracle pass、negative fail；negative fail 不得是 infra crash。

### 7.4 `compare`

用途：比较两个 run outputs。

示例：

```bash
python -m bench.cli compare results/run_a results/run_b
```

MVP 输出 case verdict diff、score diff、infra error diff。

## 8. 设计选项比较

### 选项 A：全量一次性实现

内容：按 `benchmark-design.md` 完整实现 Docker、pelican、2048、systems、所有 verifier/oracle/negative controls。

优点：最贴近完整 Done Definition。  
缺点：范围巨大；Node/Go/Docker 环境风险高；hidden verifier 容易半成品；review 难判断问题属于 harness、task 还是环境。  
结论：不推荐作为 MVP。

### 选项 B：只做 runner scaffold

内容：仅实现 CLI、suite loader、report skeleton，不做真实 protected selfcheck。

优点：最快；代码量小。  
缺点：无法验证 benchmark 最核心的 oracle/negative 与隔离风险；容易产生“命令能跑但 benchmark 无效”的假完成。  
结论：不推荐，除非任务降级为纯 scaffold。

### 选项 C：runner + metadata + protected selfcheck MVP（推荐）

内容：实现 runner/adapter/report 基线，建齐三 family 四 case metadata 与物理隔离目录，并至少实现一条 protected selfcheck 核心路径。

优点：覆盖核心架构和最高风险隔离边界；验证证据可重复；为后续高保真 verifier 留清晰扩展点；回滚简单。  
缺点：不等于完整 benchmark；需要在 docs/report 明确 metadata-only case 的缺口。  
结论：推荐。

## 9. 验证计划

实现阶段至少记录以下证据：

1. Python compile：
   - `python -m compileall vibe-harness-bench/bench`
2. Doctor：
   - `python -m bench.cli doctor`
3. Selfcheck core-v1：
   - `python -m bench.cli selfcheck --suite core-v1`
   - 证据需显示 oracle pass、negative fail，且 negative 不是 infra crash。
4. Noop run smoke-v1：
   - `python -m bench.cli run --suite smoke-v1 --adapter bench/adapters/examples/noop.yaml`
   - 期望生成失败报告，而非 infra crash。
5. Compare smoke outputs：
   - 至少生成两个 smoke run，并执行 `compare`。

## 10. 回滚路径

本设计要求所有实现隔离在 `vibe-harness-bench/**`，本阶段产物隔离在本任务 docs。若需要回滚：

1. 删除或隔离 `vibe-harness-bench/**`。
2. 删除或归档 `.legion/tasks/build-vibeharnessbench-mvp/docs/{research.md,rfc.md,implementation-plan.md}`。
3. 不需要修改 existing install scripts、Legion CLI、setup-opencode 或 root package scripts。

## 11. 风险登记与 backlog

| 风险 / 后续项 | 影响 | 处理 |
|---|---|---|
| Docker pre-baked images | 完整离线运行无法在 MVP 证明 | 后续独立任务建设 Node/Go/verifier images |
| 高保真 pelican verifier | 需要 GIF decode、pHash/SSIM、motion semantics | 后续 task 专项实现 |
| 高保真 2048 verifier | 需要 Playwright/Vitest、replay/property cases | 后续 task 专项实现 |
| 高保真 systems verifier | 需要 Go RPC/concurrency tests 与线性一致性检查 | 后续 task 专项实现 |
| Go/Node oracles | 完整正确解工程量高且需 protected | 分 family 补齐，并强制 selfcheck |
| clean-room systems derivation | 法务/原创性与测试质量风险 | 不 vendor 官方 6.5840；写 authoring notes 说明能力边界来源与改写点 |
| 过弱 MVP verifier | Benchmark 区分度不足 | 在 report 中暴露 `mvp_status`，不得宣称完整 benchmark |
| 隔离实现错误 | 泄露 hidden verifier/oracle | allowlist materialization + doctor/selfcheck 双重检查 |

## 12. 推荐裁决

采用选项 C：`runner + metadata + protected selfcheck MVP`。实现应从隔离白名单、metadata schema、CLI 闭环和一条真实 protected selfcheck 开始，而不是先写完整 task 解或 Docker 镜像体系。
