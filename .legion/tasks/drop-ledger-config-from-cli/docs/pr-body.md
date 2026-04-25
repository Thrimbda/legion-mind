## What

- 移除了 Legion CLI 对 `.legion/config.json` 与 `.legion/ledger.csv` 的运行时依赖。
- CLI 现在基于 `.legion/tasks/*` 发现任务，单任务命令统一要求显式 `--task-id` / `taskId`。
- 同步删除 proposal/approval、task switch/archive、ledger query 等旧命令面，并更新 README / references / docs。

## Why

- 旧 CLI 继续依赖 config/ledger，会与 `.legion/tasks/<task-id>/...` 形成双真源。
- 隐式 current task 不利于可重放、自动化和文档收敛。
- 本次收敛让 CLI 回到“薄工具层”定位，减少历史包袱与维护面。

## How

- 在 `skills/legion-workflow/scripts/**` 中删除 config/ledger 读写、隐式 active task 逻辑和已废弃命令入口。
- 在 `skills/legion-workflow/references/**`、`skills/legion-docs/references/**`、`docs/**` 与 `README.md` 中同步更新 CLI 契约。
- 保留主干命令，并为已删除命令提供稳定的 `UNSUPPORTED_COMMAND` 错误语义。

## Testing

- 见 [`docs/test-report.md`](./test-report.md)
- 已覆盖：`task list`、`status --task-id`、已删除命令 `ledger query`、损坏任务目录 `TASK_CORRUPTED`、`install + verify --strict`
- 结果：PASS

## Risk / Rollback

- 风险：现有脚本若仍依赖旧命令或隐式 active task，会受到 breaking change 影响。
- 回滚：直接回滚本次提交；若需恢复旧 CLI 且仓库中无旧文件，可按 RFC 提供的最小 stub 补回 `config.json` / `ledger.csv`。

## Links

- Plan: [`plan.md`](../plan.md)
- RFC: [`docs/rfc.md`](./rfc.md)
- RFC Review: [`docs/review-rfc.md`](./review-rfc.md)
- Code Review: [`docs/review-code.md`](./review-code.md)
- Test Report: [`docs/test-report.md`](./test-report.md)
- Walkthrough: [`docs/report-walkthrough.md`](./report-walkthrough.md)
