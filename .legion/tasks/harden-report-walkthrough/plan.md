# Harden report-walkthrough skill

## 目标

优化 `skills/report-walkthrough`，使它明确成为 Legion 收口链中的 reviewer-facing evidence translator：只把已有、当前有效且通过前置阶段的证据整理成 `report-walkthrough.md` 与 `pr-body.md`，不补设计、不补验证、不替代 review、wiki writeback 或 PR lifecycle。

## 问题陈述

当前 `report-walkthrough` 的方向正确，但规则过薄：它把 reviewer 视角称为 `implementation mode` / `rfc-only mode`，容易和 `legion-workflow` 的三种执行模式混淆；它用 “Production code changed?” 判断分支，容易误判 docs/config/test/script-only 的实现交付；它没有明确验证前置证据是否属于当前 task、是否对应当前 diff、是否 PASS；也没有给出稳定输出结构和 implementation PR body 模板。这会让 agent 在证据缺失、失败或过期时仍包装出交付摘要，削弱 Legion 的证据闭环。

## 验收标准

- [ ] `skills/report-walkthrough/SKILL.md` 将 reviewer 输出视角改写为 walkthrough profile，而不是新增或混用 Legion execution mode。
- [ ] skill 明确基于当前阶段链和前置证据选择 profile，不再用 production code 是否变化作为主要判断。
- [ ] skill 增加 entry evidence matrix，并要求证据属于当前 task、对应当前交付状态且结论不是 FAIL / blocked / stale。
- [ ] implementation profile 能在存在 RFC / review-rfc 时强制引用设计一致性证据。
- [ ] skill 明确失败、阻塞、过期证据的回退路径，禁止把失败证据包装成交付摘要。
- [ ] `report-walkthrough.md` 与 `pr-body.md` 输出 schema 明确、可审阅，并保持中文文档输出要求。
- [ ] 增加 implementation PR body 模板，保留并收敛 RFC-only 模板。
- [ ] 使用 skill-creator / writing-skills 的 TDD 思路记录 pressure scenarios、旧版失败模式、改进断言与验证结果。
- [ ] 产出 `docs/rfc.md`、`docs/review-rfc.md`、`docs/test-report.md`、`docs/review-change.md`、`docs/report-walkthrough.md`、`docs/pr-body.md` 与 wiki writeback。

## 假设 / 约束 / 风险

- **假设**: 用户要求“做完为止”允许在稳定假设下延迟批准，不再额外追问；新增明确约束是所有落地文档使用中文。
- **约束**: 不改变 `legion-workflow` 的三种 execution mode；`report-walkthrough` 只能定义 reviewer 输出 profile。
- **约束**: 不在 `report-walkthrough` 阶段补测试、补设计、补 review 或完成 PR lifecycle。
- **约束**: 所有持久化输出留在当前仓库；开发与交付改动只在 `.worktrees/harden-report-walkthrough/` 内进行。
- **约束**: skill 文档应保持可扫读，不把完整测试流程塞成冗长操作手册。
- **风险**: 规则过硬可能让正常的 RFC-only 或 docs-only implementation 交付被误退；需要用 scenarios 覆盖这些边界。
- **风险**: 如果 description 总结太多流程，模型可能只读 description 而跳过 skill body；description 应偏触发条件，正文承载协议。

## 范围

- `skills/report-walkthrough/SKILL.md`
- `skills/report-walkthrough/references/TEMPLATE_PR_BODY_RFC_ONLY.md`
- `skills/report-walkthrough/references/TEMPLATE_PR_BODY_IMPLEMENTATION.md`（新增）
- `.legion/tasks/harden-report-walkthrough/**`
- `.legion/wiki/**`

## 非目标

- 不修改 `legion-workflow` 的阶段链或 execution mode 定义。
- 不新增自动运行 skill eval 的大型 harness；本任务只记录并验证当前关键 pressure scenarios 与文本断言。
- 不改变 `verify-change`、`review-change`、`review-rfc` 的职责边界。
- 不把 `pr-body.md` 等同于 PR 已创建、checks 已通过或 lifecycle 已完成。
- 不更新用户主目录下已安装 skill；本次只修改仓库内 skill 源文件，后续由安装流程同步。

## 设计摘要

- 将 `implementation mode` / `rfc-only mode` 改为 `implementation walkthrough profile` / `rfc-only walkthrough profile`，避免与 Legion 主流程模式冲突。
- 以“当前阶段链 + 前置证据”选择 profile；docs/config/test/script-only 的实现交付仍可进入 implementation profile。
- 增加证据健康检查：current task、current delivery state、PASS / non-blocked、非 stale、claim 必须有引用。
- 固定 reviewer-facing 输出 schema：profile、摘要、scope、evidence map、changed/decided、verification/review status、risks、reviewer checklist、next stage。
- 增加 PR body 双模板：implementation 与 RFC-only 都要求链接证据，同时声明 PR body 只是 lifecycle 输入，不代表 PR 完成。

## 阶段概览

1. **Phase 1** - 契约物化与 RFC 设计
2. **Phase 2** - skill TDD scenarios 与实现
3. **Phase 3** - 验证、review、walkthrough、wiki 与 PR lifecycle

---

*创建于: 2026-06-06*
