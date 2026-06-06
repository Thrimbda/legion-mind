# Report Walkthrough: Harden report-walkthrough skill

## Profile

implementation。

本任务修改的是 skill 文档与 PR body 模板，不是生产业务代码；但它走过实现、验证与 `review-change`，因此按 implementation walkthrough profile 生成 reviewer-facing 交付摘要，而不是 RFC-only。

## Reviewer Summary

- 将 `report-walkthrough` 从轻量摘要提示强化为基于当前有效证据的 reviewer handoff 协议。
- 用 walkthrough profile 替代旧的 `implementation mode` / `rfc-only mode` 说法，避免与 `legion-workflow` execution mode 混淆。
- 增加 entry evidence matrix、evidence health check、失败回退、固定输出 schema 和 PR lifecycle 边界。
- 新增 implementation PR body 模板，并收敛 RFC-only 模板。
- 验证结果：文本断言 PASS、`git diff --check` PASS、`npm run test:regression` 10/10 PASS；`review-change` PASS。

## Scope

### In scope

- `skills/report-walkthrough/SKILL.md`
- `skills/report-walkthrough/references/TEMPLATE_PR_BODY_RFC_ONLY.md`
- `skills/report-walkthrough/references/TEMPLATE_PR_BODY_IMPLEMENTATION.md`
- `.legion/tasks/harden-report-walkthrough/**`

### Out of scope

- 不修改 `legion-workflow` 的三种 execution mode。
- 不新增大型自动 skill benchmark harness。
- 不修改 `verify-change`、`review-change`、`review-rfc` 职责。
- 不把 `pr-body.md` 当作 PR lifecycle 完成证据。
- 不同步修改用户主目录下已安装 skill。

## Evidence Map

| Claim | Evidence | Status |
|---|---|---|
| 任务契约稳定，且用户要求文档中文 | `plan.md`、`tasks.md`、`log.md` | PASS |
| 设计明确且可实现、可验证、可回滚 | `docs/rfc.md` | PASS |
| 设计门已通过 | `docs/review-rfc.md` | PASS |
| 旧版失败模式和 pressure scenarios 已记录 | `docs/skill-tdd-scenarios.md` | PASS |
| skill 已引入 profile、evidence matrix、health check、return conditions 和输出 schema | `skills/report-walkthrough/SKILL.md` | PASS |
| implementation 与 RFC-only PR body 模板均存在且声明 lifecycle 边界 | `skills/report-walkthrough/references/*.md` | PASS |
| 验证覆盖核心断言与 regression | `docs/test-report.md` | PASS |
| 只读交付审查无阻塞 | `docs/review-change.md` | PASS |

## What Changed / What Was Decided

- **术语收敛**: reviewer 文档输出分支改称 walkthrough profile；明确 profile 不是 Legion execution mode。
- **选择规则修正**: 不再以 production code 是否变化作为主判断，而以当前阶段链和证据类型选择 profile。
- **证据健康检查**: 要求证据属于当前 task、对应当前交付状态、结论非 FAIL / blocked / stale，并且完成性 claim 必须有证据来源。
- **失败回退**: 缺 test-report、缺 review-change、review FAIL、review-rfc FAIL、证据 stale 等情况都明确回退到对应前置阶段。
- **输出结构**: 固定 `report-walkthrough.md` 最小结构，防止漂亮总结替代证据索引。
- **PR body 边界**: 两个模板都声明 PR body 只是 PR 创建/更新输入，不代表 checks/review/merge 或 lifecycle 完成。

## Verification / Review Status

- `python` 文本断言：PASS。
- `git diff --check`：PASS。
- `npm run test:regression`：PASS，10/10 tests passed。
- `review-rfc`：PASS，无 blocking findings。
- `review-change`：PASS，无 blocking findings，安全视角未触发。

## Risks and Limits

- 新版 skill 会更早拒绝缺证据或失败证据的 walkthrough 请求；这是预期行为。
- 本任务未建立大型自动 benchmark；使用 task-local pressure scenarios 与文本断言覆盖关键风险。
- 仓库源文件更新后，用户主目录已安装 skill 仍需通过既有安装流程同步。

## Reviewer Checklist

- [ ] `report-walkthrough` 是否清楚表达它只重组证据、不补前置阶段？
- [ ] walkthrough profile 是否避免了和 `legion-workflow` execution mode 混淆？
- [ ] docs/config/test/script-only implementation 是否不会被误判为 RFC-only？
- [ ] FAIL / blocked / stale evidence 是否会阻止生成 reviewer-facing 输出？
- [ ] PR body 模板是否明确不代表 PR lifecycle 完成？

## Next Stage

交给 `legion-wiki` 做 durable writeback。随后继续 `git-worktree-pr` lifecycle：commit、rebase、push、创建/更新 PR、跟进 checks/review、终态、cleanup 与主工作区 refresh。
