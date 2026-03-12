## 变更内容

本 PR 将 LegionMind 最终收敛为 plan-only 工作流：`plan.md` 成为唯一的人类可读任务契约与执行索引，`task-brief.md` / `taskBriefPath` 从核心流程中移除，且不在 LegionMind 层提供向后兼容。

同时统一更新 schema、skill、agent prompts、commands、usage docs、playbook 与当前任务样例，使 `context.md`、`tasks.md`、`rfc.md`、`config.json` 的职责边界与新模型一致。

## 变更原因

此前 `task-brief.md` 与 `plan.md` 并行存在，导致初始化重复写、续跑重复读，也让 schema、prompt、commands 与 usage docs 容易长期漂移。

这次改造的目标是删除双真源、固定读取顺序、统一 scope 真源与语言规则，并让评审、验证、交付都围绕同一份任务 contract 展开。

## 实现方式

- 将 `plan.md` 定义为唯一人类可读 contract，覆盖问题陈述、验收、假设/约束/风险、目标、要点、范围、设计索引与阶段概览。
- 保持 `context.md` 仅负责 progress / decisions / handoff，`tasks.md` 仅负责 machine-readable checklist，`rfc.md` 仅负责 Medium / High risk 任务的详细设计，`config.json` 仅作为可选 scope mirror。
- 更新 `skills/legionmind/**`、`.opencode/agents/**`、`.opencode/commands/**`、`docs/**` 与 `.legion/**` 中的相关说明，并将当前任务样例迁移为 plan-only，删除 `docs/task-brief.md`。

## 验证

- PASS - `./test-report.md`
- 使用 `git diff --check` 与定向 `rg` 检查，确认指定 scope 内不再把 `taskBriefPath` 或 `docs/task-brief.md` 作为现行正式契约，且当前样例任务已删除 `docs/task-brief.md`。
- PASS - `./review-code.md`
- PASS - `./review-security.md`

## 风险与回滚

- 主要风险是后续模板、prompt 或文档重新引入旧字段，或让 `plan.md` 与 `config.json` 的 scope mirror 再次漂移。
- 本 PR 仅涉及文档、prompt、命令说明与任务交付物；如需回滚，整体回退相关文件即可，不涉及数据迁移。

## 相关文档

- Plan: `../plan.md`
- RFC: `./rfc.md`
- RFC Review: `./review-rfc.md`
- Test Report: `./test-report.md`
- Code Review: `./review-code.md`
- Security Review: `./review-security.md`
- Walkthrough: `./report-walkthrough.md`
