# Walkthrough Report - LegionMind 文档路径重构

## 1. 目标与范围

- 目标：清理根目录临时产物，统一任务过程文档路径，避免 `docs/` 混入执行中间文件。
- 范围：`README.md`、`docs/legionmind-usage.md`、`.opencode/**`、`skills/legionmind/references/**`、`.legion/tasks/legionmind/docs/**`。
- 风险等级：Low（文档规范调整，无运行时代码变更）。

## 2. 变更内容

- 统一约定：任务过程产物默认落盘到 `.legion/tasks/<task-id>/docs/`。
- 调整命令文档：`/legion`、`/legion-rfc-heavy`、`/legion-impl`、`/legion-pr` 全部改为 `<taskRoot>/docs/*`。
- 调整 Agent 与参考文档：将旧 `docs/*.md` 过程产物路径改为任务目录路径。
- 清理根目录：删除 `docs/task-brief.md`、`docs/test-report.md`、`docs/review-code.md`、`docs/report-walkthrough.md`、`docs/pr-body.md`。
- 保留长期文档：`docs/legionmind-usage.md` 作为长期使用说明。

## 3. 验证与评审

- 测试报告：`.legion/tasks/legionmind/docs/test-report.md`（PASS）。
- 代码评审：`.legion/tasks/legionmind/docs/review-code.md`（PASS，无 blocking）。
- 安全评审：N/A（非安全改动）。

## 4. 风险与回滚

- 风险：未来命令模板更新时，若未同步参考文档，可能再次产生路径漂移。
- 回滚：回退本次文档变更即可，不影响运行时逻辑与数据。

## 5. 下一步

1. 直接使用 `.legion/tasks/legionmind/docs/pr-body.md` 作为 PR 描述。
2. 后续可为文档增加 CI（markdownlint + link checker）。
