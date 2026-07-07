# 新增 Sandbox 验收 Checkbox 文档

## 契约

- **Name**: 新增 Sandbox 验收 Checkbox 文档
- **Task ID**: `add-sandbox-acceptance-checklist`
- **Goal**: 将用户要求的 sandbox 验收步骤写成可逐项勾选的 Markdown 文件，并提交到仓库。
- **Problem**: 现有 runbook/checklist 偏准备包和证据模板，用户需要一份可直接操作的 checkbox 步骤指导，用于从 sandbox 准备到最终结论的逐项验收。

## 验收标准

1. 新增一份中文 Markdown checkbox 文档，覆盖 sandbox 验收目标、前置准备、Linear/GitHub sandbox、secret、本地基线、Linear live scan、fixture dispatch、GitHub PR tracking、可选 worker E2E、evidence、停止条件和最终结论。
2. 每个可执行/核对步骤使用 `- [ ]` checkbox。
3. 保留命令、路径、env var、状态枚举、label、产品名等机器 token 原文。
4. 在现有 scheduler production acceptance checklist 中加入新文档入口链接。
5. 不修改 runtime code，不提交真实 secrets，不执行 live acceptance。

## 范围

- `scheduler/docs/sandbox-acceptance-checklist.md`
- `scheduler/docs/production-acceptance-checklist.md`
- `.legion/tasks/add-sandbox-acceptance-checklist/**`
- `.legion/wiki/tasks/add-sandbox-acceptance-checklist.md` 和必要 wiki 索引/日志

## 非目标

- 不运行验收命令。
- 不创建 Linear/GitHub sandbox resources。
- 不创建或提交 `secrets/linear-scheduler.sops.yaml`。
- 不改变 scheduler runtime behavior。

## 假设

- 新文档应作为 operator-facing checklist，而不是替代现有 runbook。
- 用户要求“使用 legion workflow 提交”，因此本任务走 worktree + PR lifecycle。

## 风险

- 过度简化可能弱化安全边界；文档必须明确 sandbox-only、stop conditions 和 production blockers。
- 过度翻译机器字段会破坏命令可用性；必须保留 token 原文。

## 阶段

1. 创建 worktree 与 task docs。
2. 写入 checkbox Markdown 并加入口链接。
3. 运行文档 diff 检查。
4. 产出 review、walkthrough、wiki writeback。
5. 提交并完成 PR lifecycle。
