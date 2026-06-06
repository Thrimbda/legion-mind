# Task Summary: harden-report-walkthrough

## 当前结论

`report-walkthrough` 已从轻量摘要提示强化为基于当前有效证据的 reviewer handoff 协议。它现在使用 walkthrough profile，不再使用容易与 `legion-workflow` execution mode 混淆的 mode 术语；profile 选择基于当前阶段链和证据，而不是 production code 是否变化。

## 主要变更

- `skills/report-walkthrough/SKILL.md` 增加 walkthrough profiles、entry evidence matrix、evidence health check、return conditions、固定 walkthrough 输出 schema 与 PR lifecycle 边界。
- `skills/report-walkthrough/references/TEMPLATE_PR_BODY_IMPLEMENTATION.md` 新增 implementation PR body 模板。
- `skills/report-walkthrough/references/TEMPLATE_PR_BODY_RFC_ONLY.md` 收敛为中文设计-only 模板，并声明 PR body 不代表 PR lifecycle 完成。
- `.legion/tasks/harden-report-walkthrough/docs/skill-tdd-scenarios.md` 记录 5 个 pressure scenarios：缺测试报告、FAIL review、设计一致性、RFC-only、docs/config-only implementation。

## 验证与审查

- `docs/review-rfc.md`: PASS，无 blocking findings。
- `docs/test-report.md`: 文本断言 PASS、`git diff --check` PASS、`npm run test:regression` 10/10 PASS。
- `docs/review-change.md`: PASS，无 blocking findings，安全视角未触发。
- `docs/report-walkthrough.md` 与 `docs/pr-body.md`: 已生成中文 reviewer-facing 交付证据。

## 可复用模式

后续所有 `report-walkthrough` 阶段都应先检查证据健康，再生成 reviewer-facing 输出：

- 当前 task 证据存在且对应当前交付状态。
- review evidence 是 PASS 或 PASS with non-blocking suggestions。
- verification evidence 不是 skipped-only，也没有未处理实现缺口。
- FAIL / blocked / stale evidence 必须回退对应前置阶段，不能包装成摘要。
- docs/config/test/script-only implementation 只要走过实现、验证、review-change，就仍是 implementation profile。

## Raw evidence

- plan: `.legion/tasks/harden-report-walkthrough/plan.md`
- rfc: `.legion/tasks/harden-report-walkthrough/docs/rfc.md`
- review-rfc: `.legion/tasks/harden-report-walkthrough/docs/review-rfc.md`
- scenarios: `.legion/tasks/harden-report-walkthrough/docs/skill-tdd-scenarios.md`
- test-report: `.legion/tasks/harden-report-walkthrough/docs/test-report.md`
- review-change: `.legion/tasks/harden-report-walkthrough/docs/review-change.md`
- walkthrough: `.legion/tasks/harden-report-walkthrough/docs/report-walkthrough.md`
- pr-body: `.legion/tasks/harden-report-walkthrough/docs/pr-body.md`
