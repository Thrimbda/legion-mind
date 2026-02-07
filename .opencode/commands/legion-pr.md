---
description: Legion Final Phase：提交→推送→创建PR
agent: legion
---

你必须先做：

1. `skill("legionmind")` 加载指南
2. `legion_get_status` 获取当前任务状态
3. 从 `plan.md` 或 `context.md` 确认 Scope

约束：

- 严格检查 Scope，防止意外提交无关文件
- 使用 Task 目录下的 `docs/pr-body.md` 作为 PR 描述
- Commit 遵循 Conventional Commits
- 如果用户有其他要求，以用户要求为准

执行：

1. `git status` / `git diff` 检查变更
2. 创建特性分支 (如 `legion/feature-xxx`)
3. `git add` (仅限 Scope 内文件)
4. `git commit`
5. `git push`
6. `gh pr create`

完成后必须输出：

```
✅ PR 创建完成
PR URL: <url>
```
