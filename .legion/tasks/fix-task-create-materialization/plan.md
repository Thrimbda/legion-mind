# Fix task create materialization reliability

## 目标

修复 `task create` 的任务物化路径，确保 CLI 返回 success 时一定能可靠落盘 `plan.md`、`log.md`、`tasks.md`。

## 问题陈述

在 `tighten-cli-doc-drift` 任务启动时，`task create` 返回了 success，但任务目录最初只出现了 `docs/`，缺少 `plan.md`、`log.md` 与 `tasks.md`。这会让新任务直接以 `TASK_CORRUPTED` 状态起步，破坏 Legion 的 raw evidence 链。如果这个现象可复现，就说明 `createTask` / `writeTaskDraft` 的物化路径存在可靠性问题。

## 验收标准

- [ ] 能稳定复现或解释此前观测到的 partial materialization 现象
- [ ] 修复后，`task create` 在干净目录中总能同时创建 `plan.md`、`log.md`、`tasks.md` 与 `docs/`
- [ ] `status` / `task list` 能立即读取新创建的任务，不再触发 `TASK_CORRUPTED`
- [ ] 改动范围限制在 Legion CLI 任务物化路径及对应任务文档

## 假设 / 约束 / 风险

- **风险等级**: **Medium**。理由：会修改 Legion CLI 的任务创建路径；如果写盘顺序或路径校验处理不当，可能影响所有新任务初始化。
- **假设**: 问题在 `skills/legion-workflow/scripts/lib/cli.ts` 的 `createTask` / `writeTaskDraft` 物化路径或其调用时序，而不是上层 workflow 技能文案。
- **约束**: 不顺手改 phase enforcement、dashboard、review 流程或无关 CLI 命令。
- **约束**: 优先做最小修复，并用 focused verification 证明可靠性。
- **风险**: 如果现象难以稳定复现，可能只能先做 defensive hardening，而不是拿到唯一明确根因。

## 要点

- 先复现，再修
- 修物化可靠性，不扩 Scope
- 用新建任务后的 `status` / `task list` 立即验证

## 范围

- `skills/legion-workflow/scripts/legion.ts`
- `skills/legion-workflow/scripts/lib/cli.ts`
- `.legion/tasks/fix-task-create-materialization/**`

## 设计索引 (Design Index)

> **Design Source of Truth**: design-lite in `plan.md`

**摘要**:
- 核心流程: 在隔离目录和当前仓库中复现 `task create`，定位 `createTask` / `writeTaskDraft` 的物化异常，再用最小代码修复并立即用 `status` / `task list` 验证。
- 验证策略: 新建临时 repo 执行 `init -> task create -> status -> task list`，并直接检查任务目录是否同时包含 `plan.md`、`log.md`、`tasks.md` 与 `docs/`。

## 阶段概览

1. **Phase 1** - 复现 partial materialization 并确认根因边界
2. **Phase 2** - 实施最小修复并验证任务创建可靠性
3. **Phase 3** - 生成验证、review 与 walkthrough 产物，必要时写回 wiki

---

*创建于: 2026-04-23 | 最后更新: 2026-04-23*
