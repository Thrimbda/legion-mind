# 任务摘要：add-sandbox-acceptance-checklist

## 状态

- 日期：2026-07-07
- 结果：PASS
- Raw evidence：`.legion/tasks/add-sandbox-acceptance-checklist/`

## 摘要

新增 operator-facing 的 Linear + Legion Scheduler sandbox 验收逐步 checkbox 文档：

- `scheduler/docs/sandbox-acceptance-checklist.md`

并在现有入口中加入链接：

- `scheduler/docs/production-acceptance-checklist.md`

## 当前有效结论

- 操作者需要逐步执行 sandbox 验收时，优先使用 `scheduler/docs/sandbox-acceptance-checklist.md`。
- 原 runbook / checklist 仍是背景和准备包入口；新文档是可勾选执行版。
- 文档继续保持 sandbox-only、安全 stop conditions、Stage 5 worker gating 和 production blockers，不声明 production-ready。

## 验证

- `git diff --check`：PASS。
- Checkbox 结构检查：PASS。
- 入口链接检查：PASS。
- `review-change`：PASS。
