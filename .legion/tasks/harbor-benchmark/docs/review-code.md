# Code Review Report

## 结论
PASS

## Blocking Issues
- [ ] (none)

## 建议（非阻塞）
- `scripts/benchmark/lib.ts:153` - `sanitizeRunId` 允许 `.` 这类保留值，虽然 `resolveRunDir` 能阻断越界，但 `--run-id .` 仍会把运行文件直接写到输出根目录；建议显式拒绝 `.`/`..` 并限制首字符为字母数字，避免工件层级被污染。
- `scripts/benchmark/score.ts:75` - 评分权重来自“当前配置文件”而非运行时快照；若后续 profile 调整，历史 run 重算可能漂移。建议把权重快照写入 `run-meta.json` 并在 `computeScore` 优先读取快照，缺失时再回退当前配置。
- `scripts/benchmark/preflight.ts:109` - 目前并发仅做正整数解析，未做上限保护。建议增加合理上限（例如 16）并在 preflight 给出告警，降低资源耗尽风险。
- `docs/benchmark.md:64` - 已声明输出路径受 repo 约束，建议补一条对 `--write` 的同等约束说明（仅 repo 内可写），保持 CLI 行为与文档完全一致。

## 修复指导
1. 在 `sanitizeRunId` 增加保留值校验：`if (trimmed === '.' || trimmed === '..') throw ...`，并可选升级为 `^[A-Za-z0-9][A-Za-z0-9._-]*$`。
2. 在 `run.ts` 生成 `run-meta.json` 时落盘 `weightsSnapshot`（datasetVersion->weight），`score.ts` 读取该字段参与计算，确保历史可复算。
3. 在 preflight 增加 `BENCHMARK_CONCURRENCY` 上限检查项（`E_PREFLIGHT_CONCURRENCY_RANGE` 或 warning 字段）。
4. 在 `docs/benchmark.md` Troubleshooting 补充 `--write` 越界报错示例（`E_IO_OUTSIDE_REPO`）与修复方式。
