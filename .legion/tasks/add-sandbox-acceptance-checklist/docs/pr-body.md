## 摘要

- 新增 `scheduler/docs/sandbox-acceptance-checklist.md`，把 sandbox 验收步骤整理成逐项 checkbox Markdown。
- 在 `scheduler/docs/production-acceptance-checklist.md` 顶部加入新文档入口链接。
- 保留 sandbox-only、secret handling、Stage 5 worker gating、stop conditions 和 production blockers。

## 验证

- `git diff --check` — PASS
- Checkbox 结构检查 — PASS
- 入口链接检查 — PASS

## 说明

- 未修改 runtime code。
- 未运行 live acceptance。
- 未新增或提交真实 secrets。
