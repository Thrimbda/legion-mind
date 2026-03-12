# 测试报告

## 执行命令
`git diff --check`

`rg -n "taskBriefPath|docs/task-brief\.md|task-brief:|基于 task-brief" "skills/legionmind" ".opencode/agents" ".opencode/commands" "docs" ".legion/config.json" ".legion/tasks/task-brief-plan/plan.md" ".legion/tasks/task-brief-plan/context.md" ".legion/tasks/task-brief-plan/tasks.md"`

`test -e ".legion/tasks/task-brief-plan/docs/task-brief.md"; printf "%s" $?`

## 结果
PASS

## 摘要
- `git diff --check` 通过，未发现空白错误或补丁格式问题。
- 在用户指定 scope 加上 `.legion/config.json` 的定向检索中，未发现 LegionMind 层标准契约仍把 `taskBriefPath`、`docs/task-brief.md`、`task-brief:` 或 `基于 task-brief` 作为正式输入/输出约定。
- `.legion/config.json` 中仅保留本任务迁移说明里的历史术语，用于描述“要移除的旧模型”，不构成当前标准契约依赖。
- 当前样例任务不存在 `.legion/tasks/task-brief-plan/docs/task-brief.md`，符合 plan-only 目标。
- 在当前任务的 `plan.md` / `context.md` 中检出的旧词均为迁移目标、防回归说明或验收条件；历史未触碰任务仍可保留旧术语，本次不视为失败。
- 仓库 CI 只运行 OpenCode agent，`package.json` 无 `test`/`lint` 脚本，根目录无 `Makefile`，因此采用 `git diff --check` + 定向术语检索作为最终 lightweight 验证。

## 失败项（如有）
- 无。

## 备注
- 选择这组命令，是因为本次改动主要是工作流契约、文档模板与 `.legion/config.json` 的口径收敛；它们能以最低成本覆盖格式正确性与旧契约回归风险。
- 备选方案包括对整个仓库做更宽范围的 `rg` 扫描，或新增自动 lint/contract check；本次按“轻量验证”约束，仅覆盖用户指定 scope、`.legion/config.json` 与当前样例任务。
- 历史未修改任务中仍存在旧术语属于已知情况；本次判断标准只看 LegionMind 当前标准层与本任务样例是否仍依赖旧 contract。
