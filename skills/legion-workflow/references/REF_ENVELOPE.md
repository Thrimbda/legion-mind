# Legion 调用封套（子代理调用封套）

> 编排器到子代理的作用域受限交接契约。

## 必填字段

- `taskId`：稳定任务 ID。
- `repoRoot`：仓库根目录路径。
- `taskRoot`：`.legion/tasks/<task-id>/` 路径。
- `docsDir`：`<taskRoot>/docs/` 路径。
- `scope`：本次运行允许修改的文件/目录范围。
- `planPath`：唯一任务契约 `plan.md` 的路径。
- `constraints`：执行约束，例如 `autopilot`、`token_budget`、`context_sync`。

## 可选字段

- `rfcPath`：存在 design-lite / RFC 时，指向 `rfc.md`。
- `changeSummary`：已有变更的简短摘要。
- `knownClues`：用于减少重复阅读的线索。
- `git`：修改型开发任务的 Git lifecycle 状态；read-only 或显式 bypass 任务可省略。

## 字段语义

- `plan.md` 是唯一的人类可读任务契约，负责问题定义、验收、假设/约束/风险、短目标、要点、允许 Scope、设计索引、阶段概览。
- `plan.md` 是人类可读 Scope 的真源。
- `rfc.md` 若存在，是设计真源。
- `git.lifecycle: git-worktree-pr` 表示阶段链在 Git/PR envelope 内运行；它不改变 Legion 执行模式。

## Git lifecycle 字段

修改型开发任务打开 envelope 后，编排器应在 handoff 中携带已知 Git 状态：

```yaml
git:
  lifecycle: git-worktree-pr
  baseRef: origin/master
  branch: legion/<task-id>-<slug>
  worktreePath: /repo/.worktrees/<task-id>
  prUrl: null
  prState: not_created
  checksState: unknown
  reviewState: unknown
  cleanupState: pending
  mainWorkspaceRefresh: pending
```

字段枚举：

- `prState`: `not_created | draft | open | merged | closed | blocked | superseded`
- `checksState`: `unknown | pending | passing | failing | blocked | skipped`
- `reviewState`: `unknown | pending | approved | changes_requested | blocked | skipped`
- `cleanupState`: `pending | completed | kept_with_reason | blocked`
- `mainWorkspaceRefresh`: `pending | completed | skipped_with_reason | blocked`

`baseRef` 默认 `origin/master`，除非用户或仓库规则覆盖。`worktreePath` 必须使用仓库内 `.worktrees/<task-id>/`。

Completion 只在 `cleanupState: completed` 且 `mainWorkspaceRefresh: completed` 时成立。`blocked`、`kept_with_reason`、`skipped_with_reason` 只能表示 blocked handoff 或未完成状态，不能写成开发任务完成。

## 文档语言约定

- 通过封套生成的任务文档默认使用当前用户与 agent 的工作语言。
- 若仓库已有明确文档语言约定，则遵循仓库约定。
- 不要因为模板示例或历史段落名曾使用英文，就把新文档默认写成英文。

## 必须遵守的行为

1. 先读 `planPath`。
2. 用 `plan.md` 恢复问题、验收、允许 Scope 与设计入口。
3. 只有在提供 `rfcPath` 或 `plan.md` 指向设计文档时，才读 `rfc.md`。
4. 把 `scope` 当作硬边界；任何越界修改都不得直接执行。若最小越界编辑不可避免，必须先升级给 orchestrator / 人类决策并获确认，随后才能执行，且仍需在最终交接的 `risks` 中说明理由。
5. 不要擅自推断其他输出路径；产物只能写到 envelope 提供的位置，或仓库内已定义的固定约定路径。
6. 子代理不得改写 `.legion/tasks/<task-id>/plan.md`、`log.md`、`tasks.md`；这些文件仅由 orchestrator 统一写回。

## 最小示例

```yaml
taskId: task-brief-plan
repoRoot: /repo
taskRoot: /repo/.legion/tasks/task-brief-plan
docsDir: /repo/.legion/tasks/task-brief-plan/docs
scope:
  - skills/legion-workflow/**
  - .opencode/agents/**
  - scripts/**
  - docs/**
planPath: /repo/.legion/tasks/task-brief-plan/plan.md
rfcPath: /repo/.legion/tasks/task-brief-plan/docs/rfc.md
constraints:
  autopilot: true
  token_budget: keep reads focused
  context_sync: orchestrator owns .legion plan/log/tasks updates
git:
  lifecycle: git-worktree-pr
  baseRef: origin/master
  branch: legion/task-brief-plan-docs
  worktreePath: /repo/.worktrees/task-brief-plan
  prState: not_created
  checksState: unknown
  reviewState: unknown
  cleanupState: pending
  mainWorkspaceRefresh: pending
```

## 输出提醒

子代理应只返回最小 `[Handoff]` 包：`summary`、`decisions`、`risks`、`files_touched`、`commands`、`next`、`open_questions`。
