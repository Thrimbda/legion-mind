# LegionMind Playbook

## [Convention] Benchmark Outputs Stay In-Repo

- Date: 2026-03-05
- Source Task: `harbor-benchmark`
- Rule: benchmark 输出目录必须位于仓库根目录内；所有写入路径统一走 `resolve + isWithin` 校验。
- Why: 防止 `--run-id` / `--write` / `--run` 参数触发路径穿越与越界写入。

## [Convention] Deterministic Benchmark Profile First

- Date: 2026-03-05
- Source Task: `harbor-benchmark`
- Rule: benchmark 先落盘固定 profile（`profileId + sampleSetId + datasetVersion + weight`），再实现执行脚本。
- Why: 避免“同命令不同结果”，保证 A/B 对比可复现。

## [Pitfall] Missing Summary Must Count as Error

- Date: 2026-03-05
- Source Task: `harbor-benchmark`
- Symptom: 只遍历现有 `summary.json` 会静默缩小分母，导致总分虚高。
- Fix: 评分时按 `run-meta` 期望数据集对账；缺失 summary 记 `status=error`、`score=0`，并计入分母。
