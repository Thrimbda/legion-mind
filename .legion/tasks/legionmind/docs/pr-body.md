## Summary

- 统一 LegionMind 任务过程产物路径：默认写入 `.legion/tasks/<task-id>/docs/`，不再默认落盘到根目录 `docs/`。
- 更新命令/Agent/参考文档，使 `/legion`、`/legion-rfc-heavy`、`/legion-impl`、`/legion-pr` 与路径约定一致。
- 清理根目录临时产物，保留长期文档 `docs/legionmind-usage.md`。

## Why

- 根目录 `docs/` 同时承载长期文档与任务中间产物，降低可读性并造成“什么该提交、什么是过程证据”的混淆。
- 将任务产物收敛到 `<taskRoot>/docs/` 后，跨会话续跑、审计和回滚更清晰。

## Validation

- `.legion/tasks/legionmind/docs/test-report.md`：PASS。
- `.legion/tasks/legionmind/docs/review-code.md`：PASS（无 blocking）。
- `.legion/tasks/legionmind/docs/report-walkthrough.md`：已生成并对齐新路径约定。

## Risk / Rollback

- 风险等级：Low（文档规范调整，无运行时代码改动）。
- 残余风险：若后续命令模板演进而未同步文档，可能再次出现路径漂移。
- 回滚方式：回退本 PR 文档修改。

## Deliverables Checklist

- [x] `.legion/tasks/legionmind/docs/task-brief.md`
- [x] `.legion/tasks/legionmind/docs/test-report.md`
- [x] `.legion/tasks/legionmind/docs/review-code.md`
- [x] `.legion/tasks/legionmind/docs/report-walkthrough.md`
- [x] `.legion/tasks/legionmind/docs/pr-body.md`
- [x] `docs/legionmind-usage.md`（长期文档）
