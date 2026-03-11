# Harbor Benchmark Baseline - Implementation Walkthrough

## 目标与范围

- 目标：交付 Harbor benchmark 一键启动基线，实现可复现（deterministic profile）、可比较（固定评分口径）、可回滚（仅脚本/文档增量）。
- 范围绑定（scope）：`README.md`、`docs/**`、`scripts/**`、`package.json`、`.gitignore`、`.legion/tasks/harbor-benchmark/**`。
- 结果：新增 benchmark preflight/run/score 全链路，默认 profile 已落盘，文档与入口命令已对齐。

## 设计摘要

- 设计依据：RFC `.legion/tasks/harbor-benchmark/docs/rfc.md`（standard，review-rfc PASS）。
- 核心设计：`benchmark:preflight -> benchmark:smoke|full -> benchmark:score`，统一 run artifact 合约与 scorecard 语义。
- 一致性约束：固定 `profileId=harbor-baseline-v1`，`sampleSetId(smoke/full)` 固化，命令参数白名单渲染，避免“同命令多解释”。
- 安全约束：输出路径限定 repo 内，`runId` 与写入目标均做边界校验，日志脱敏，不落盘 API key。

## 改动清单（按模块/文件）

### 入口与项目配置

- `package.json`
  - 新增脚本：`benchmark:preflight`、`benchmark:smoke`、`benchmark:full`、`benchmark:score`。
- `.gitignore`
  - 新增 `benchmark-runs/`，避免运行工件污染版本库。

### Benchmark 脚本实现

- `scripts/benchmark/config.default.json`
  - 固化 baseline v1 profile（mode、dataset、权重、默认模型/并发等配置来源）。
- `scripts/benchmark/lib.ts`
  - 抽离共享工具：参数解析、路径解析、边界判断、脱敏与通用 I/O/执行辅助。
  - 增加 `sanitizeRunId` + 路径边界检查，修复 traversal/越界写入类阻塞问题。
- `scripts/benchmark/preflight.ts`
  - 实现 Docker、Harbor CLI/可用性、API key、输出路径安全等前置检查。
  - 支持输出机器可读结果并返回可用于 gate 的退出码语义。
- `scripts/benchmark/run.ts`
  - 实现 smoke/full 编排执行，按数据集顺序落盘运行工件。
  - 生成 `run-meta.json`、`preflight.json`、dataset summary/raw、`stdout.log`。
- `scripts/benchmark/score.ts`
  - 基于工件重算 `scorecard.json`，落实 `ok/skipped/error` 的分母/计分语义。

### 文档与使用说明

- `docs/benchmark.md`
  - 补全执行命令、环境变量、artifact contract、评分规则、排障与扩展说明。
- `README.md`
  - 新增 benchmark 快速入口与文档链接，确保主入口可发现。
- `.legion/tasks/harbor-benchmark/docs/*`
  - 产出 task-brief、RFC、review-rfc、test-report、review-code、review-security 等任务交付文档。

## 如何验证

- 参考报告：`.legion/tasks/harbor-benchmark/docs/test-report.md`（结论：PASS）。
- 已执行验证命令：

```bash
npm run benchmark:preflight -- --write ../../escape.json && npm run benchmark:smoke -- --dry-run --run-id ../../escape && npm run benchmark:score -- --run ../../escape
```

- 预期结果（与报告一致）：
  - `preflight --write ../../escape.json` 返回 `E_IO_OUTSIDE_REPO`（拒绝越界写入）。
  - `smoke --run-id ../../escape` 返回 `E_RUN_ID_INVALID`（拒绝非法 run id）。
  - `score --run ../../escape` 返回 `E_RUN_ID_INVALID`（拒绝非法 run id）。
  - 三项均以“预期的安全失败”通过，未出现绕过。
- 评审状态：
  - 代码评审 PASS：`.legion/tasks/harbor-benchmark/docs/review-code.md`
  - 安全评审 PASS：`.legion/tasks/harbor-benchmark/docs/review-security.md`

## 风险与回滚

- 主要风险：
  - 本地环境依赖（Docker/Harbor/API key）导致可运行性波动。
  - profile/权重未来调整可能影响跨时间比较口径。
  - 长时 benchmark 的资源消耗与失败重试成本。
- 已做缓解：
  - preflight 前置拦截 + 结构化错误码。
  - deterministic profile + 明确 mode 边界（同 mode 比较）。
  - 路径与 run-id 校验、防穿越与越界写入。
- 回滚策略：
  - 代码回滚：移除 `scripts/benchmark/**`、`package.json` benchmark scripts、文档入口相关改动。
  - 运行回滚：删除 `benchmark-runs/` 工件目录，不影响业务逻辑与安装链路。

## 未决项与下一步

- 未决项：
  - `project-interview` 首版样本清单是否固定，当前仍保留为可选扩展位。
- 建议下一步：
  1. 增补真实 Harbor/API 环境下的 smoke/full 实跑报告（含耗时与波动区间）。
  2. 为日志脱敏规则、run-id/path 负向输入补充回归测试。
  3. 评估将权重快照写入 `run-meta.json`，保证历史 run 重算不漂移。
