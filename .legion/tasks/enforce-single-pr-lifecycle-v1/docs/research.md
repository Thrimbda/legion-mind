# 单 PR 生命周期现状摸底

## 1. 问题复述

同一 Legion task 当前会先通过一个 PR 交付实现，再通过第二个 docs-only PR 把第一个 PR 的 merge、worktree cleanup、主工作区 refresh 与 task/wiki `completed` 状态写回仓库。用户要求把“每个 task 最多一个 PR”设为绝对约束，发布、部署和失败恢复也不能自动产生第二 PR。

## 2. 当前入口与关键模块

- `skills/legion-workflow/SKILL.md`
  - 修改型任务只有在 PR 终态、checks/review、cleanup 与 refresh 都完成后才允许声明 done。
  - 同时要求产物留在仓库内，但没有说明 post-merge 终态不得回写。
- `skills/git-worktree-pr/SKILL.md`
  - 生命周期主体使用单数 PR，但没有显式 PR 数量上限，也没有禁止 terminal 后重新建 branch/PR。
- `skills/legion-docs/references/REF_BEST_PRACTICES.md`
  - 当前把 PR lifecycle 状态变化列为 `log.md` 更新事件，直接诱导 merge 后仓库写回。
- `skills/legion-wiki/references/TEMPLATE_TASK_SUMMARY.md`
  - 只有 `active | completed | historical | archived`，缺少“仓库证据已完成、外部 delivery 尚未终态”的稳定状态。
- `scheduler/src/sqlite-store.ts`
  - `runs.pr_url` 是单值字段，但 `updateRunMetadata()` 可用不同 URL 覆盖，未形成 write-once 身份门。
- `scheduler/src/worker-runner.ts`
  - worker prompt 要求每个 WI 有独立 PR，却未写“恰好最多一个”。
  - lifecycle evidence 固定在 `.legion/tasks/<task-id>/docs/git-worktree-lifecycle.json`，把 post-merge cleanup/refresh 证据放回可提交 task 路径。
- `scheduler/src/pr-tracker.ts`
  - tracker 可接受调用者传入不同 PR URL 并更新 `runs.pr_url`，因此同一 run 能被重新绑定到第二 PR。

## 3. 已发生模式

- 实现 PR `#55` 合并后，PR `#56` 只更新 `.legion/tasks/workflow-profiles-model-routing-v1/**` 与对应 wiki 状态。
- 实现 PR `#50` 合并后，PR `#51` 采用同一 docs-only 收口模式。
- 版本 PR `#57` 合并并发布后，PR `#58` 回写发布结果。
- 这些实例证明第二 PR 不是 GitHub 重复，而是“只有 terminal 后才能 completed”与“terminal 变化必须回写仓库”共同产生的结果。

## 4. 当前可保留的安全门

- PR 创建前 contract、RFC、验证、独立 review 与条件化 walkthrough/wiki 仍可全部进入唯一 PR。
- checks、review、merge/closed 状态由 GitHub 直接观测，不需要提交回仓库。
- worktree cleanup 与主工作区 refresh 可由当前执行会话完成；Scheduler-managed task 可直接观察 Git/worktree 状态，结果进入 Scheduler event/final response，不需要提交回仓库。
- Scheduler 已有单值 `pr_url`、GitHub snapshot、terminal event 与 final response，可作为外部 delivery 真源。

## 5. 约束与非目标

- 不降低 squash、branch protection、checks、review、worktree isolation、cleanup 或安全 refresh 要求。
- 不批量改写历史 `.legion/tasks/**` 与 `.legion/wiki/**` 中已经发生的双 PR 记录。
- 不新增 bot 或 direct-push 通道来绕开第二 PR。
- 用户未来明确发起的新任务不属于原 task 的第二 PR；它有独立 task id 与自己的单 PR 配额。

## 6. 风险与陷阱

- 只改 skill 文案而不锁定 Scheduler `pr_url`，自动调度仍可把同一 run 改绑第二 PR。
- 只禁止“closeout”词而不改变发布结果语义，agent 仍可能用 `publish-result` 或 `wiki-only` 名义创建第二 PR。
- 在唯一 PR 中预写“已 merge/已 cleanup”会伪造未来事实。
- 把 cleanup/refresh 从完成门删除会减少第二 PR，但同时削弱安全闭环，不可接受。
- post-merge 失败若自动开修复 PR，仍违反单 PR；必须终止原 task 并等待用户另行创建新任务。

## 7. Unknowns

- 无阻塞 unknown。用户已经明确选择绝对单 PR 约束；当前 GitHub/Scheduler/会话终态面足以承载 post-merge 事实。

## 8. 证据索引

- Contract：`.legion/tasks/enforce-single-pr-lifecycle-v1/plan.md`
- 当前规则：`skills/legion-workflow/SKILL.md`、`skills/git-worktree-pr/SKILL.md`
- 文档写回规则：`skills/legion-docs/references/REF_BEST_PRACTICES.md`
- Scheduler：`scheduler/src/sqlite-store.ts`、`scheduler/src/worker-runner.ts`、`scheduler/src/pr-tracker.ts`
- 历史实例：commit `6522c03 -> c9bed3d`、`df90d72 -> 3f71e5a`、`11890ac -> bfddacb`
