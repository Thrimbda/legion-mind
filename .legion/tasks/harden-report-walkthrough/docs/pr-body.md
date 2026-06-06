# Harden report-walkthrough skill

> 本 PR body 只是 PR 创建/更新输入，不代表 checks/review/merge、auto-merge、worktree cleanup 或主工作区 refresh 已完成。

---

## 交付摘要

- 强化 `report-walkthrough`：从摘要生成提示升级为基于当前有效证据的 reviewer handoff 协议。
- 用 walkthrough profile 替代旧 `implementation mode` / `rfc-only mode` 术语，避免和 Legion execution mode 混淆。
- 增加 evidence matrix、health check、失败回退、固定 walkthrough schema 与 PR lifecycle disclaimer。
- 新增 implementation PR body 模板，并收敛 RFC-only 模板。

## 范围

**In scope**

- `skills/report-walkthrough/SKILL.md`
- `skills/report-walkthrough/references/TEMPLATE_PR_BODY_RFC_ONLY.md`
- `skills/report-walkthrough/references/TEMPLATE_PR_BODY_IMPLEMENTATION.md`
- `.legion/tasks/harden-report-walkthrough/**`

**Out of scope**

- 不修改 `legion-workflow` execution mode。
- 不新增大型 skill benchmark harness。
- 不同步修改用户主目录下已安装 skill。

## 主要改动

- `SKILL.md` 明确 `report-walkthrough` 只整理已有有效证据，不补设计、验证、review、wiki 或 PR lifecycle。
- profile 选择基于当前阶段链与证据，而不是 production code 是否变化。
- evidence health check 要求证据属于当前 task、非 stale、非 FAIL / blocked。
- 输出 schema 与 return conditions 明确化。
- PR body 模板分为 implementation 与 RFC-only 两类。

## 验证与审查

- 设计: `.legion/tasks/harden-report-walkthrough/docs/rfc.md`
- 设计审查: `.legion/tasks/harden-report-walkthrough/docs/review-rfc.md`（PASS）
- Skill TDD scenarios: `.legion/tasks/harden-report-walkthrough/docs/skill-tdd-scenarios.md`
- 验证: `.legion/tasks/harden-report-walkthrough/docs/test-report.md`（PASS）
- 变更审查: `.legion/tasks/harden-report-walkthrough/docs/review-change.md`（PASS）
- Walkthrough: `.legion/tasks/harden-report-walkthrough/docs/report-walkthrough.md`

## 风险与限制

- 新版 skill 对缺证据和失败证据更严格；这会增加回退频率，但符合 Legion 收口语义。
- 当前未新增自动 benchmark harness；本 PR 使用 pressure scenarios + 文本断言 + regression 测试验证。

## 评审重点

- [ ] profile 术语是否足够清楚，不会被理解成第四种 Legion execution mode？
- [ ] evidence health check 是否足以阻止 stale / FAIL / blocked evidence 被包装成交付摘要？
- [ ] docs/config-only implementation 是否能正确进入 implementation profile？
- [ ] PR body 模板是否清楚表达 lifecycle 边界？

## 证据链接

- plan: `.legion/tasks/harden-report-walkthrough/plan.md`
- rfc: `.legion/tasks/harden-report-walkthrough/docs/rfc.md`
- review-rfc: `.legion/tasks/harden-report-walkthrough/docs/review-rfc.md`
- skill-tdd-scenarios: `.legion/tasks/harden-report-walkthrough/docs/skill-tdd-scenarios.md`
- test-report: `.legion/tasks/harden-report-walkthrough/docs/test-report.md`
- review-change: `.legion/tasks/harden-report-walkthrough/docs/review-change.md`
- report-walkthrough: `.legion/tasks/harden-report-walkthrough/docs/report-walkthrough.md`
