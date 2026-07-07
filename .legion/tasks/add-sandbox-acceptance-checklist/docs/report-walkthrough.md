# 交付说明：Sandbox 验收 Checkbox 文档

## 模式

Implementation / docs-only。未修改 runtime code。

## 改动内容

- 新增 `scheduler/docs/sandbox-acceptance-checklist.md`。
- 在 `scheduler/docs/production-acceptance-checklist.md` 顶部加入逐步执行版 checklist 入口。
- 新增 task-local Legion evidence：plan、tasks、log、test-report、review。

## 文档覆盖范围

- 验收目标。
- 前置准备。
- Linear sandbox。
- GitHub sandbox。
- encrypted secret。
- Stage 0 本地基线。
- Stage 2 Linear live scan。
- Stage 3 fixture dispatch baseline。
- Stage 4 GitHub PR tracking。
- Stage 5 可选 worker E2E。
- evidence、停止条件、最终结论和 production blockers。

## 验证

- `git diff --check` — PASS。
- Checkbox 结构检查 — PASS。
- 入口链接检查 — PASS。
- `review-change` — PASS。

## Reviewer 关注点

1. 每个 operator action 是否都是 checkbox。
2. 命令、路径、env var 和 labels 是否保持可复制。
3. 是否明确 sandbox-only 和 stop conditions。
4. 是否没有暗示 production-ready。
