## What

- 将 `task create` 的任务草稿物化流程改为 **staging 目录写入完成后再整体 rename**，确保 success 时最终任务目录以完整状态出现。
- 改动限定在 `skills/legion-workflow/scripts/lib/cli.ts`，未扩展到 task schema、`status`、`task list` 或其他命令路径。

## Why

- 曾观测到一次 one-off 的 partial materialization：CLI 看起来成功，但任务目录只出现了部分内容。
- 该异常**未能稳定复现**，所以本次修复不是宣称找到唯一根因，而是做一次**不变量加固**：避免“成功返回但最终目录仍可能半成品”的结构性风险。

## How

- `writeTaskDraft()` 现在先创建 sibling staging root，在其中写完 `docs/`、`plan.md`、`log.md`、`tasks.md` 后，再 `renameSync` 到最终任务目录。
- 新增 staging root 创建与 best-effort cleanup helper，把逻辑收敛在任务创建路径内。

## Testing

- 见 [`test-report.md`](./test-report.md)
- 已验证真实 smoke 路径：隔离 repo 中执行 `init -> task create -> status -> task list`，并直接检查最终任务目录完整性。
- **Caveat**：本轮未做 failure injection，因此中途写入失败与最终 rename 失败场景暂无执行级证据，只能由代码审查与设计约束支撑。

## Risk / Rollback

- 风险较低但影响所有新任务创建路径；若 staging/rename 在真实环境暴露兼容性问题，可回退到原直接写入策略。
- 回滚时如有需要，可同时手动清理 `.legion/tasks/` 下遗留的 `.tmp-*` 目录。

## Links

- Plan: [`../plan.md`](../plan.md)
- RFC: [`./rfc.md`](./rfc.md)
- RFC Review: [`./review-rfc.md`](./review-rfc.md)
- Change Review: [`./review-change.md`](./review-change.md)
- Test Report: [`./test-report.md`](./test-report.md)
- Walkthrough: [`./report-walkthrough.md`](./report-walkthrough.md)
