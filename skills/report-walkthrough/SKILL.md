---
name: report-walkthrough
description: 在 RFC 审查或实现审查已有有效证据后，用单一 report-data.json 生成 HTML、Markdown 与 PR body 交付材料。
---

# report-walkthrough

## 职责

把当前 task 已通过前置阶段的证据整理成 reviewer 可扫读的交付材料。它不补设计、验证或审查，不发布预览，不替代 `legion-wiki` 与 PR lifecycle。

所有正文默认使用中文；路径、命令、schema key、状态和错误原文保持可识别。

## 入口门

- `implementation`：必须有当前 `plan.md`、实际变更或实现交接、`docs/test-report.md`、`docs/review-change.md`；存在设计门时还要有 RFC 及 review-rfc。
- `rfc-only`：必须有当前 `plan.md`、`docs/rfc.md`、`docs/review-rfc.md`，且本次只交付设计。
- 所依赖 review 必须为 PASS，证据不能 stale、blocked 或与当前 diff 冲突。
- 上游 `## 会话注意力摘要`、claim 状态与领域 verifier 记录必须互相一致；语义分别服从 `../legion-workflow/references/REF_HUMAN_ATTENTION.md` 与 `../verify-change/references/REF_COGNITIVE_VERIFICATION.md`。
- 任一完成性主张必须能回到当前 task 的 repo-relative evidence locator。

证据缺失或冲突时，退回生成该证据的 `review-rfc`、`verify-change` 或 `review-change`，不得在本阶段补写结论。

## 唯一生成流程

1. 只从已审查证据提取事实，不重跑命令、不重算 verifier、不重新判定 attention。
2. 填写 `docs/report-data.json`，其结构只认 `references/report-data.schema.json`。
3. 执行：

```bash
node skills/report-walkthrough/scripts/render-report.mjs \
  --input .legion/tasks/<task-id>/docs/report-data.json
```

4. 脚本一次生成同目录下的：
   - `report-walkthrough.html`
   - `report-walkthrough.md`
   - `pr-body.md`
5. PR-backed HTML 交给 `pr-html-render` 获取预览路径或记录显式 bypass/blocker；随后进入 `legion-wiki`。

Agent 禁止手写或局部修补上述三个生成产物。要改变内容，修改 `report-data.json` 后重新运行脚本；要改变布局，维护共享模板并重新生成。

## 数据要求

- 页面靠前呈现 profile、阶段结论、最高 attention、当前唯一人类动作、停止点和最终状态。
- `INCONCLUSIVE`、`DEFERRED`、`RECOMMENDATION` 必须填写各自状态专属字段。
- `domain` / `authority` claim 必须附带 verifier、provenance、独立性、未证明范围与残余不确定性。
- evidence locator 必须是无 `..` 的 repo-relative 路径；预览 URL 只允许 `https:`。
- PR body 必须明确：它只是 PR 输入，不证明 checks、review、merge、cleanup 或主工作区刷新已完成。

## 输出与停止条件

- 输出真源：`docs/report-data.json`。
- reviewer artifacts：`docs/report-walkthrough.html`、`docs/report-walkthrough.md`、`docs/pr-body.md`。
- schema、模板、转义、确定性与事务写入由脚本统一执行；任一失败时不得留下混合版本。
- attention 为 `review` 时不得越过 merge；为 `decide` 时不得越过阶段转换。
- HTML 生成后才可进入 `pr-html-render`；walkthrough 完成后才可进入 `legion-wiki`。

## 禁止

- 不手写 HTML/CSS、Markdown walkthrough 或 PR body。
- 不把 FAIL、blocked、stale 或未验证 claim 包装成可交付结论。
- 不让 reviewer 为理解当前动作、关键不确定性或 verifier 边界而必须遍历原始文件。
- 不把生成 artifact、PR body 或 preview URL 当作 PR lifecycle 完成。

## 按需资源

- 数据契约：`references/report-data.schema.json`
- 固定 HTML 模板：`templates/report-walkthrough.html`
- 生成器：`scripts/render-report.mjs --help`
- 预览发布：`pr-html-render`
