# 人类注意力交接与认知验证路由

> 本 PR body 只是 PR 创建和更新输入，不代表 checks、review、merge、auto-merge、worktree cleanup 或主工作区 refresh 已完成。

## 人类注意力与当前动作

- 聚合注意力等级：`skim`
- 当前唯一人类动作：快速浏览本摘要，确认它覆盖“必要审计意见直接回到会话”和“按认知原因选择验证方式”两个目标；无需打开原始文件，也不阻塞自动合并。
- 动作完成前的 lifecycle 边界：没有 `review` 或 `decide` 级硬门禁，允许继续 checks、auto-merge、cleanup 与主工作区刷新。
- 阶段摘要来源：`docs/review-rfc.md`、`docs/test-report.md`、`docs/review-change.md`

## 交付摘要

- RFC 审查、验证和变更审查现在必须产出最多三条关键发现的中文 `会话注意力摘要`，orchestrator 在阶段切换前直接投影到 chat session。
- 验证按主张性质、验证时机、专业门槛三轴分类，并使用 `PASS`、`FAIL`、`INCONCLUSIVE`、`DEFERRED`、`RECOMMENDATION` 表达 claim 级认知状态。
- 领域 verifier 必须真实加载并留下可核验 provenance；缺少 verifier 或权威证据时不能伪造专业结论。
- scheduler 继续只依赖独立的阶段级 `Verdict: PASS / FAIL`。

## 未解决的认知状态

无。`HAVR-FORMAL-001`、`HAVR-OBJECTIVE-002`、`HAVR-OBJECTIVE-003` 均为 `PASS`；没有 `INCONCLUSIVE`、`DEFERRED` 或 `RECOMMENDATION` 主张。

## 领域验证摘要

不适用。本任务的三个主张均为 `routine`，由静态检查、文件读取和回归测试直接验证。测试中的 provenance 与 authority fixture 只证明协议判定语义，不代表真实领域 verifier、外部权威服务或生产 registry。

## 范围

**范围内**

- 注意力摘要、四级注意力与 lifecycle 边界。
- 三轴验证分类、五种 claim 状态与诚实升级规则。
- 领域 verifier provenance、authority、延后和判断性主张协议。
- workflow、审查、验证、walkthrough、文档归属与回归测试更新。

**范围外**

- 新增 scheduler 运行时注意力队列。
- 接入真实外部专家服务或权威机构接口。
- 量化生产会话注意力节省。
- 启用本仓库 GitHub Pages 预览 workflow。

## 主要改动

- 新增 `skills/legion-workflow/references/REF_HUMAN_ATTENTION.md`。
- 新增 `skills/verify-change/references/REF_COGNITIVE_VERIFICATION.md`。
- 更新 `brainstorm`、`legion-docs`、`legion-workflow`、`spec-rfc`、`review-rfc`、`verify-change`、`review-change` 与 `report-walkthrough`。
- 更新 walkthrough 与 PR body 模板。
- 新增 `tests/regression/attention-verification-protocol.test.ts`，覆盖注意力、lifecycle、三轴五状态、阶段 handoff、scheduler 独立 Verdict、provenance 与 authority 正负路径。

## 验证与审查

- 新增协议单测：7/7 通过。
- 根仓库 regression：25/25 通过。
- scheduler regression：57/57 通过。
- `git diff --check`：通过。
- RFC 审查：`PASS`。
- 变更审查：`PASS`，无阻塞项。

## 风险与限制

- fixture 不等同于真实领域 verifier、外部权威服务或生产 registry。
- 尚未度量真实生产会话中的注意力节省和协议遵循率。
- walkthrough 使用 artifact-only / local fallback；本 PR 不启用 Pages rendered URL。

## 评审重点

- [ ] 会话摘要是否足以让用户无需遍历原始文件？
- [ ] `review` 与 `decide` 的 lifecycle 边界是否清楚？
- [ ] 三轴和五状态是否诚实区分不同的不可验证原因？
- [ ] 缺少 verifier 或 authority 时是否保持 `INCONCLUSIVE`？
- [ ] claim 状态是否没有污染 scheduler 独立阶段 Verdict？

## 证据链接

- plan：`.legion/tasks/human-attention-verification-routing/plan.md`
- RFC：`.legion/tasks/human-attention-verification-routing/docs/rfc.md`
- RFC 审查：`.legion/tasks/human-attention-verification-routing/docs/review-rfc.md`
- 验证：`.legion/tasks/human-attention-verification-routing/docs/test-report.md`
- 变更审查：`.legion/tasks/human-attention-verification-routing/docs/review-change.md`
- walkthrough：`.legion/tasks/human-attention-verification-routing/docs/report-walkthrough.html`
