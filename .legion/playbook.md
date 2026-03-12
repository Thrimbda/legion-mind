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

## [Convention] Plan Owns Task Contract

- Date: 2026-03-12
- Source Task: `task-brief-plan`
- Rule: `plan.md` 是唯一的人类可读任务契约，固定问题定义、验收、假设、约束、风险、目标、要点、范围、设计索引、阶段概览；`rfc.md` 只承载详细设计。
- Why: 删除双真源后，初始化、续跑、评审都只需从 `plan.md` 起步，同时保持 `plan.md` 摘要级、`rfc.md` 细节级的清晰边界。

## [Convention] Task Docs Follow Working Language

- Date: 2026-03-12
- Source Task: `task-brief-plan`
- Rule: LegionMind 任务文档默认使用当前用户与 agent 的工作语言；只有仓库已有明确文档语言约定时才覆盖这一默认值。
- Why: 模板里偶尔出现英文标题不代表英文是默认语言；跟随真实工作语言能减少理解成本和 Review 噪音。
