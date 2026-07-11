# 人类注意力交接与认知验证路由交付审阅

## 交付视角

- **交付类型**：实现交付
- **当前结论**：`review-rfc`、`verify-change`、`review-change` 均为 `PASS`
- **聚合注意力等级**：`skim`
- **当前唯一人类动作**：快速浏览本报告或 PR 摘要，确认它覆盖“把必要审计意见直接带回会话”和“按认知原因选择验证方式”这两个目标；无需打开原始证据，也不阻塞自动合并。
- **动作完成前的 lifecycle 边界**：没有 `review` 或 `decide` 级硬门禁，允许继续 PR checks、auto-merge、cleanup 与主工作区刷新。

## 审阅结论

本次变更建立了两层协议：第一层把 RFC 审查、验证和变更审查的关键结论压缩成中文 `会话注意力摘要`，由 orchestrator 在阶段切换前主动投影到 chat session；第二层把验证拆为主张性质、验证时机和专业门槛三个正交维度，并用 `PASS`、`FAIL`、`INCONCLUSIVE`、`DEFERRED`、`RECOMMENDATION` 表达真实认知状态。阶段级 `Verdict: PASS / FAIL` 继续作为 scheduler 兼容门禁。

实现审查已确认范围、相对 locator、阶段交接、provenance、authority 正负路径与 scheduler 兼容性均符合 RFC，可以进入 PR lifecycle。

## 人类注意力与当前动作

三个最终阶段摘要的最高注意力等级均为 `skim`：

| 阶段 | 结论 | 注意力 | 对人类判断最重要的信息 |
|---|---|---|---|
| `review-rfc` | `PASS` | `skim` | 设计门禁、主张字段、可核验 provenance 与 authority 正向路径已经闭合。 |
| `verify-change` | `PASS` | `skim` | 协议单测 7/7、根回归 25/25、scheduler 回归 57/57，静态检查通过。 |
| `review-change` | `PASS` | `skim` | provenance 与 authority fixture 会实际重开证据、重算摘要并导出规定状态。 |

当前唯一人类动作是快速浏览本页或 PR 摘要。完整摘要分别位于 `docs/review-rfc.md`、`docs/test-report.md` 与 `docs/review-change.md`。

## 未解决的认知状态

无。三个登记主张 `HAVR-FORMAL-001`、`HAVR-OBJECTIVE-002`、`HAVR-OBJECTIVE-003` 均为 `PASS`；没有 `INCONCLUSIVE`、`DEFERRED` 或 `RECOMMENDATION` 主张需要人类接管。

## 领域验证摘要

本任务的三个主张均为 `routine`，可通过静态约束、文件读取和现有回归直接验证，因此领域 verifier 与 authority evidence 均为不适用。测试中的 provenance 与 authority fixture 只证明协议判定语义，不冒充真实专家服务、生产 verifier registry 或现实世界权威证据。

## 范围

**范围内**

- 为 `review-rfc`、`verify-change`、`review-change` 定义低噪音中文会话摘要。
- 定义 `none | skim | review | decide` 注意力等级、最多三条关键发现和 lifecycle 边界。
- 定义主张性质、验证时机、专业门槛三轴及五种 claim 状态。
- 要求领域 verifier 被真实发现、加载并记录可核验 provenance。
- 为延后、判断性与权威主张定义诚实的证据和升级规则。
- 更新 walkthrough、PR body 模板和协议回归。

**范围外**

- 不实现新的 scheduler 运行时注意力队列。
- 不接入真实外部专家服务或权威机构接口。
- 不声称已经测得生产会话中的注意力节省幅度。
- 不启用本仓库 GitHub Pages 预览 workflow。

## 证据地图

| 交付主张 | 直接证据 | 状态 |
|---|---|---|
| 注意力与认知验证协议完整且可解析 | `docs/rfc.md`、`docs/review-rfc.md`、`tests/regression/attention-verification-protocol.test.ts` | `PASS` |
| 变更保持根仓库与 scheduler 兼容 | `docs/test-report.md`、`docs/review-change.md` | `PASS` |
| 新增和改写的人类可读内容使用中文 | 当前 diff、中文测试名称与本交付报告 | `PASS` |
| provenance 与 authority 失败路径不会伪造通过 | 协议测试中的正例及各七个负例 | `PASS` |

## 交付路径

`plan.md` 稳定任务契约 → `docs/rfc.md` 设计协议 → `docs/review-rfc.md` 设计门禁 → skill、reference、模板与回归实现 → `docs/test-report.md` 验证 → `docs/review-change.md` 只读审查 → 本 walkthrough → wiki writeback → PR checks、auto-merge、cleanup 与主工作区刷新。

## 变更与决定

- 新增 `REF_HUMAN_ATTENTION.md` 作为注意力摘要与 lifecycle 边界的单一协议来源。
- 新增 `REF_COGNITIVE_VERIFICATION.md` 作为三轴、五状态、领域 verifier provenance、延后与判断性验证的单一协议来源。
- 各阶段只保留各自的 `Verdict: PASS / FAIL`，claim 级状态不能替代 scheduler 阶段门。
- orchestrator 必须在进入下一阶段或回滚前，把阶段摘要直接呈现给用户，不能只返回文件路径。
- `review` 阻止自动合并和合并，`decide` 还阻止普通阶段切换；当前交付最高为 `skim`，没有硬门禁。

## 验证与审查状态

- 新增协议单测：7/7 通过。
- 根仓库 regression：25/25 通过。
- scheduler regression：57/57 通过。
- `git diff --check`：通过。
- 跨 skill 相对 locator：12/12 可读取。
- 旧“路径 + 一句话摘要”规则：无残留匹配。
- 最终 `review-change`：`PASS`，无阻塞项。

## 风险与限制

- 当前 fixture 证明协议判定语义，不等同于真实领域 verifier、外部权威服务或生产 registry。
- 当前验证不度量真实生产会话中的人工介入次数、审阅耗时或协议遵循率。
- 未来若引入真实 `domain` 或 `authority` claim，仍需按协议加载对应 verifier 或权威证据，不能复用本任务的 routine 结论。

## 渲染交接

- **HTML artifact**：`.legion/tasks/human-attention-verification-routing/docs/report-walkthrough.html`
- **入口文件**：`report-walkthrough.html`
- **状态**：artifact-only / local fallback
- **原因**：当前仓库没有启用 PR Pages preview workflow，本任务也不扩大到仓库托管设置。
- **审阅方式**：从 PR 文件视图下载或在本地浏览器直接打开该 standalone HTML。
- **恢复条件**：若后续需要稳定 rendered URL，由仓库维护者另开任务确认 Pages 可见性、environment、同仓库 PR 信任边界和敏感信息策略后，再启用 `pr-html-render` workflow。

## 审阅清单

- [ ] 会话摘要是否真正减少了打开原始文件的需要？
- [ ] `review` 与 `decide` 的 lifecycle 边界是否符合预期？
- [ ] 三轴和五状态是否足以区分当前不可验证、知识不足和判断性观点？
- [ ] provenance 与 authority 的负例是否都保持 `INCONCLUSIVE`？
- [ ] 阶段 `Verdict` 是否继续独立于 claim 状态？

## 最终状态与下一阶段

实现、验证与审查均已完成且无阻塞。下一阶段是 wiki writeback 与 PR lifecycle；当前没有需要人类先行决定的硬门禁。
