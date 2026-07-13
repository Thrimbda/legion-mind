---
name: report-walkthrough
description: 在 RFC 审查或实现审查已有有效证据后，用单一 report-data.json 生成 HTML、Markdown 与 PR body 交付材料。
---

# report-walkthrough

## 职责

把当前 task 已通过前置阶段的证据整理成 reviewer 可扫读的交付材料。它不补设计、验证或审查，不发布预览，不替代 `legion-wiki` 与 PR lifecycle。

所有正文默认使用中文；路径、命令、schema key、状态和错误原文保持可识别。

## 入口门

- `implementation`：`risk=low` 必须有当前 `docs/test-report.md`、`docs/review-change.md`；`risk=medium|high` 还必须有当前 `docs/rfc.md`、`docs/review-rfc.md`。
- `rfc-only`：无论风险等级都必须有当前 `docs/rfc.md`、`docs/review-rfc.md`，且本次只交付设计。
- 只认唯一 `## Verdict` 后的精确 `PASS`；缺失、重复、非精确、当前 `FAIL` 或历史文字冒充当前结论都拒绝。
- 上游 `## 会话注意力摘要`、claim 状态与领域 verifier 记录必须互相一致；语义分别服从 `../legion-workflow/references/REF_HUMAN_ATTENTION.md` 与 `../verify-change/references/REF_COGNITIVE_VERIFICATION.md`。
- 任一完成性主张必须能回到当前 task 的 repo-relative evidence locator。

证据缺失或冲突时，退回生成该证据的 `review-rfc`、`verify-change` 或 `review-change`，不得在本阶段补写结论。

## 唯一生成流程

1. 只从已审查证据提取事实，不重跑命令、不重算 verifier、不重新判定 attention。
2. 填写 `docs/report-data.json`。它只认 `references/report-data.schema.json` 的 v1.1；v1.0 仅为历史 artifact，必须按当前证据重建，不能重渲染。
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

- 顶层 `risk` 必须为 `low|medium|high`，与 profile 一起决定上述当前阶段门；必需 evidence 必须以 `PASS` 精确指向当前 task 的 locator。
- `evidence.status` 与 `verification.status` 只允许 `PASS|INFO`；claim 只允许 `INCONCLUSIVE|DEFERRED|RECOMMENDATION`，不得把 FAIL/BLOCKED 包装成 PASS 报告。
- 页面靠前并列呈现 profile、risk、阶段结论、最高 attention、当前唯一人类动作、停止点和最终状态。
- `INCONCLUSIVE`、`DEFERRED`、`RECOMMENDATION` 必须填写各自状态专属字段。
- `domain` / `authority` claim 可以没有真实 verifier，且每个缺失 verifier 的 claim 都必须在详细产物中明确显示“未获得 verifier”，不得补造 provenance。只有其中状态为 `INCONCLUSIVE|DEFERRED` 的未决项才额外要求至少 `review` attention、唯一人类动作、停止点，以及每个 claim 的 evidence locator 映射；`RECOMMENDATION` 不因缺 verifier 自动进入这个 attention 集合。`INCONCLUSIVE` 必填证据缺口和升级路径；`DEFERRED` 必填完整触发、所需数据、停止条件、后续任务及 `onPass/onFail` 协议。
- 若提供 `domain` / `authority` verifier，仍必须完整校验 kind、provenance、独立性、未证明范围与残余不确定性；不得伪造。
- evidence locator 必须是无 `..` 的 repo-relative 路径；预览 URL 只允许 `https:`。
- PR body 必须明确：它只是 PR 输入，不证明 checks、review、merge、cleanup 或主工作区刷新已完成。

## 输出与停止条件

- 输出真源：`docs/report-data.json`。
- reviewer artifacts：`docs/report-walkthrough.html`、`docs/report-walkthrough.md`、`docs/pr-body.md`。
- schema、当前阶段 Verdict、taskId、evidence locator、模板、转义、确定性与事务写入由脚本统一执行；任一失败时不得留下混合版本。
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
