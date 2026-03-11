# RFC: Harbor Benchmark 一键启动基线（standard）

## Abstract / Motivation

`legion-mind` 当前缺少统一、可复现、可比较的 benchmark 入口，导致无法稳定回答“Agent 编排是否提升任务完成质量”。本 RFC 定义一个以 Harbor 为 harness 的本地基线方案：通过一条命令触发 preflight、执行评测、生成标准化工件与评分汇总，支持 `terminal-bench@2.0` 与 `swebenchpro` 两个核心数据集，并为可选的 `project-interview` 扩展保留接口。

该方案优先“约定大于配置”：默认目录结构、默认评分权重、默认输出文件名固定，减少手工拼装成本，保障 A/B 对比可操作。

## Goals & Non-Goals

### Goals

- 提供 one-command UX：`npm run benchmark:smoke` / `npm run benchmark:full`。
- 增加 preflight 检查：Docker、Harbor CLI、Node 版本、API Key、输出目录可写。
- 固化输出工件契约：每次运行都落盘完整元数据、原始日志、评分汇总。
- 固化评分契约：跨数据集可加权聚合，可复算，可比较。
- 文档化执行、排障、扩展流程，支持后续增量接入 `project-interview`。

### Non-Goals

- 不改 Harbor 上游代码或评测平台实现。
- 不在本任务内执行 SWE-bench Pro 全量长跑。
- 不构建远端调度平台、Web 仪表盘或数据库服务。
- 不自动 push/发 PR。

## Definitions

- **Harbor Harness**：调用 Harbor CLI 运行评测任务的本地统一入口。
- **Run ID**：单次 benchmark 运行唯一标识（格式：`YYYYMMDD-HHMMSS-<mode>`）。
- **Smoke**：最小样本集，用于快速校验链路可用性。
- **Full**：较高覆盖集，用于对比评估。
- **Artifact Bundle**：单次运行输出目录中的全部标准化文件集合。

## Proposed Design

### End-to-End Flow

1. 用户执行 `npm run benchmark:smoke`（或 `benchmark:full`）。
2. `scripts/benchmark/preflight` 执行环境检查并输出机器可读结果。
3. `scripts/benchmark/run` 根据 mode 与固定配置文件组装 Harbor 命令，依次运行：
   - `terminal-bench@2.0`
   - `swebenchpro`
   - （可选）`project-interview`（仅当配置开启）
4. 每个数据集运行日志与 Harbor 原始结果落盘到同一 Run ID 目录。
5. `scripts/benchmark/score` 汇总各数据集结果，输出统一 `scorecard.json` 与可读摘要。
6. CLI 输出最终摘要（总分、各数据集分、失败数、工件路径）。

### Deterministic Command Mapping (MUST)

为避免“同命令不同结果”，首版必须在仓库内固化 `benchmark profile`（如 `scripts/benchmark/config.default.json`），并写入版本号：

- `profileId`: `harbor-baseline-v1`
- `mode=smoke` 对应 `sampleSetId`: `smoke-v1`
- `mode=full` 对应 `sampleSetId`: `full-v1`

固定命令映射（v1）：

| mode | datasetKey | datasetVersion | commandTemplate | required |
|---|---|---|---|---|
| smoke | terminal-bench | terminal-bench@2.0 | `harbor run -d terminal-bench@2.0 -a opencode -m <model> --n-concurrent <n>` | yes |
| smoke | swebenchpro | swebenchpro | `harbor jobs start -d swebenchpro -a opencode -m <model>` | no (默认关闭) |
| full | terminal-bench | terminal-bench@2.0 | `harbor run -d terminal-bench@2.0 -a opencode -m <model> --n-concurrent <n>` | yes |
| full | swebenchpro | swebenchpro | `harbor jobs start -d swebenchpro -a opencode -m <model>` | yes |

补充约束：

- 不允许运行时“临时拼 shell 片段”；仅允许从 profile 内白名单参数渲染。
- 若未来接入数据集子集过滤参数，必须同时更新 `sampleSetId`（例如 `smoke-v2`）并记录在 `run-meta.json`。

### Component Boundaries

- `scripts/benchmark/preflight.*`：只做依赖可用性判断与错误码返回；不触发 benchmark。
- `scripts/benchmark/run.*`：负责编排命令、运行顺序、超时与重试；不做复杂评分。
- `scripts/benchmark/score.*`：仅读取已有结果文件，计算并产出评分工件。
- `docs/benchmark.md`：用户入口文档（命令、配置、排障、扩展）。
- `README.md`：仅新增入口链接与最小示例。

边界约束：不引入后台服务，不改变现有 orchestrator 语义。

## Alternatives

### 方案 A（采纳）：Harbor 统一 harness + 本地脚本编排

- 优点：与用户既定方向一致；复用 Harbor 能力；实现快；可回滚。
- 缺点：依赖本机 Docker/网络条件；不同机器性能波动较大。

### 方案 B（不采纳）：自建 Node 原生 benchmark runner 直连各数据集

- 放弃原因：重复实现 Harbor 已有能力，维护面扩大；短期难保障一致性。

### 方案 C（不采纳）：仅文档化手工命令，不提供脚本入口

- 放弃原因：无法形成稳定可复现工件，A/B 对比与 CI 接入成本高。

## Data Model / Interfaces

### One-Command UX Contract

- `npm run benchmark:preflight`：仅检查环境，退出码可用于 CI gate。
- `npm run benchmark:smoke`：执行小规模样本，目标 10-30 分钟（依机器而变）。
- `npm run benchmark:full`：执行高覆盖样本，时长不设硬上限。
- `npm run benchmark:score -- --run <RUN_ID>`：对已有工件重算评分。

模式可比性约束：

- `smoke` 与 `full` 只能做“同 mode 横向比较”，禁止跨 mode 直接比较总分。
- 报告中必须包含 `mode/profileId/sampleSetId` 三元组。

### Environment Variables（约定）

- 必需其一：`ANTHROPIC_API_KEY` 或 `OPENAI_API_KEY`。
- 可选：
  - `BENCHMARK_OUT_DIR`（默认 `benchmark-runs/`）
  - `BENCHMARK_ENABLE_PROJECT_INTERVIEW=1`（默认关闭）
  - `BENCHMARK_CONCURRENCY`（默认 `1`，防止资源打爆）

### Artifact Contract

单次运行目录：`benchmark-runs/<RUN_ID>/`

必须产出：

- `run-meta.json`
  - `runId`, `mode`, `profileId`, `sampleSetId`, `startedAt`, `endedAt`, `gitCommit`, `datasets[]`, `model`, `concurrency`
- `preflight.json`
  - 每项检查 `name`, `ok`, `detail`, `suggestedFix`
- `datasets/<dataset>/raw/`（Harbor 原始输出，保持上游格式）
- `datasets/<dataset>/summary.json`
  - `dataset`, `datasetVersion`, `status`, `casesTotal`, `casesPassed`, `casesFailed`, `passRate`, `durationSec`, `normalizationReason`
- `scorecard.json`
  - `schemaVersion`, `overallScore`, `datasetScores[]`, `weights`, `normalization`, `generatedAt`
- `stdout.log`（主流程日志）

兼容策略：`scorecard.json` 使用显式 `schemaVersion`；后续字段新增不破坏旧字段。

### Scoring Contract

默认归一化：各数据集分数映射到 `[0,100]`。

- `datasetScore = passRate * 100`（仅当 `status=ok` 时）
- 默认权重：
  - `terminal-bench@2.0`: `0.5`
  - `swebenchpro`: `0.5`
  - `project-interview`: 默认不计入总分；启用后可通过配置显式赋权
- `overallScore = Σ(datasetScore_i * weight_i) / Σ(weight_i)`

评分要求：

- `status` 为必填枚举：`ok | skipped | error`。
- 若某数据集未执行（配置关闭）：`status=skipped`，不参与分母。
- 若某数据集执行失败：`status=error`，强制 `casesTotal=0`、`passRate=0`、`datasetScore=0`，且其权重计入分母（防止“跳过即提分”）。
- 若某数据集执行成功但无可解析样本：`status=error`，`normalizationReason=empty_or_error`，同样按 0 分处理。

## Error Semantics

- `E_PREFLIGHT_*`：前置依赖缺失（可恢复，用户修复后重试）。
- `E_PREFLIGHT_HARBOR_UNAVAILABLE`：Harbor health check 失败（CLI 可执行但不可用）。
- `E_DATASET_RUN_*`：单数据集执行失败（可部分恢复；其余数据集继续，最终整体非 0 退出）。
- `E_SCORE_*`：评分阶段失败（可通过 `benchmark:score` 重试）。
- `E_IO_*`：工件写入失败（可恢复，修复磁盘权限/空间后重跑）。

重试语义：

- preflight 失败：立即终止，不进入运行阶段。
- 数据集运行失败：记录错误并继续后续数据集，最终汇总为失败运行。
- 评分失败：保留原始数据，允许离线重算。

## Security Considerations

- API Key 仅从环境变量读取，不写入任何 artifact。
- 日志脱敏：匹配常见 token 模式并替换为 `***`。
- 命令参数白名单化，禁止拼接用户任意 shell 片段。
- preflight 限制并发默认值，避免 CPU/RAM 资源耗尽。
- 输出目录限定在仓库内（默认 `benchmark-runs/`），防止路径逃逸。

## Backward Compatibility & Rollout

### Compatibility

- 不影响现有 `opencode:*` 命令。
- 新增命令为增量能力；未配置 API Key 时仅 benchmark 命令失败，不影响其他功能。

### Rollout

1. 先落地 `benchmark:preflight` 与 `benchmark:smoke`。
2. 验证 artifact + scorecard 稳定后开放 `benchmark:full`。
3. 文档标注 `project-interview` 为 optional extension（默认关闭）。

### Rollback

- 代码回滚：移除 `scripts/benchmark/**`、`package.json` benchmark scripts、文档入口。
- 运行回滚：删除实际输出根目录（必须位于 repoRoot 下，默认 `benchmark-runs/`）即可，不影响业务与安装链路。
- 若评分口径争议：保留旧 `schemaVersion` 并回切默认权重到前一版本。

## Verification Plan

关键行为与本地可执行验证命令映射如下：

- One-command UX 存在：
  - `npm run benchmark:preflight`
  - `npm run benchmark:smoke`
- Preflight 检查可阻断：
  - 在缺失 `ANTHROPIC_API_KEY/OPENAI_API_KEY` 环境下运行 `npm run benchmark:preflight`，应返回非 0 与修复建议。
- Harbor 可用性可前置判断：
  - `npm run benchmark:preflight` 内部执行轻量 health check（优先 `harbor datasets list`，不可用时退化到 `harbor run --help` + 关键字校验）；失败应返回 `E_PREFLIGHT_HARBOR_UNAVAILABLE`。
- Artifact 合约完整：
  - `npm run benchmark:smoke` 后检查 `benchmark-runs/<RUN_ID>/` 必需文件是否齐全。
- Scoring 可复算：
  - `npm run benchmark:score -- --run <RUN_ID>` 生成同 schema 的 `scorecard.json`。
- 失败语义正确：
  - 人为让某数据集命令失败，确认其余数据集继续执行，最终退出非 0 且 `scorecard.json` 标记错误。
- 文档可用性：
  - 按 `docs/benchmark.md` 从零执行，命令与文件路径可对上。

## Open Questions

- `project-interview` 首版是否提供固定最小样本清单，还是完全依赖用户自定义配置？

## Plan

### File Change Plan（bounded to scope）

- `package.json`：新增 benchmark scripts（preflight/smoke/full/score）。
- `scripts/benchmark/preflight.ts`：实现依赖检查与错误码。
- `scripts/benchmark/run.ts`：实现 mode 编排、Harbor 调用、日志落盘。
- `scripts/benchmark/score.ts`：实现评分汇总与 `scorecard.json`。
- `docs/benchmark.md`：新增使用说明、评分口径、排障、扩展方式。
- `README.md`：新增 benchmark 快速入口与链接。
- `.gitignore`：忽略 `benchmark-runs/`。
- `.legion/tasks/harbor-benchmark/docs/`：保留本 RFC 与后续评审文档。

### Execution Checklist

1. 定义脚本参数与环境变量约定（先文档后实现）。
2. 落地 preflight（确保可独立运行）。
3. 落地 smoke run + artifact 目录结构。
4. 落地评分汇总与 schemaVersion。
5. 接入 full 模式与可选 `project-interview` 开关。
6. 更新 README/docs 并完成本地命令验证。
