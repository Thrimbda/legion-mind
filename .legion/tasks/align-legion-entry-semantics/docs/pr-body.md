## What

本 PR 对齐 Legion 入口相关语义，统一 README、AGENTS、usage、workflow/brainstorm skills 与 reference 的说法。重点是把 `active task` 明确定义为“当前请求恢复的既有任务目录”，并去掉对持久化 current-task、CLI 默认入口、以及 `init` 自动建 wiki skeleton 的旧暗示。

## Why

仓库已移除 CLI 的持久化 current-task 状态，但文档与 skill 仍混用旧术语，容易让用户误解真实行为。此次收敛让工作流真源、CLI 适配层与最小初始化行为重新一致，降低入口认知成本与后续语义漂移风险。

## How

- 统一 active task / restore / continue 的语义边界。
- 明确 `legion-workflow` 是工作流入口真源，`skills/legion-workflow/scripts/legion.ts` 只是本地 CLI 调用入口。
- 文档改为追随实现：`init` 只保证 `.legion/tasks/` 存在，wiki 由后续 writeback 按需建立。
- 把 CLI `status` 输出字段从 `currentTask` 改为 `currentChecklistItem`，彻底去掉最后一处旧语义残留。

## Testing

- PASS — 见 [`test-report.md`](./test-report.md)
- 定向检查 in-scope 文件，确认旧语义已移除。
- 真实运行 `init` smoke test，确认仅创建 `.legion/tasks/`，未创建 `.legion/wiki/`。

## Risk / Rollback

- 风险：后续文档再次引入旧措辞，重新混淆“会话态恢复”与“持久化状态”。
- 风险：外部调用若依赖 `status.data.currentTask`，需要同步改读 `currentChecklistItem`。
- 回滚：直接回退本次文档 / skill / reference 修改；不要恢复旧的 current-task 或 wiki skeleton 叙事。

## Links

- Plan: [`../plan.md`](../plan.md)
- RFC: [`./rfc.md`](./rfc.md)
- Review RFC: [`./review-rfc.md`](./review-rfc.md)
- Review Code: [`./review-code.md`](./review-code.md)
- Test Report: [`./test-report.md`](./test-report.md)
- Walkthrough: [`./report-walkthrough.md`](./report-walkthrough.md)
