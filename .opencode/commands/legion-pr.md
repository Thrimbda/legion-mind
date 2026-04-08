---
description: Legion Final Phase（本地可选）：提交→推送→创建 PR
agent: legion
---

> 说明：GitHub Action 场景通常会自动处理分支/提交/PR；只有在本地工作流中才需要此命令。

你必须先做：
1) `skill({ name: "legionmind" })`
2) 运行 `node --experimental-strip-types "${OPENCODE_HOME:-$HOME/.opencode}/skills/legionmind/scripts/legion.ts" status --format json` 获取当前任务状态
3) 从 `plan.md` / `config.json` / `<taskRoot>/docs/pr-body.md` 确认 scope 与 PR 描述（以 `plan.md` 为人类可读 scope 真源，`config.json` 仅作 mirror）

约束：
- 严格检查 scope，避免提交无关文件
- 若 `plan.md` 与 `config.json` scope 不一致，先修复漂移再提交
- 默认保留 `<taskRoot>/docs/pr-body.md` 的当前用户与 agent 的工作语言；除非仓库已有明确文档语言约定，不要在收尾阶段把 PR 描述强行改成英文
- commit 使用 Conventional Commits
- 默认分支：`legion/<task-id>-<slug>`

执行（可根据环境裁剪）：
1) `git status` / `git diff`
2) 创建分支
3) `git add`（仅 scope 内）
4) `git commit -m "<type>: <summary>"`
5) `git push -u origin <branch>`
6) 若有 `gh`：`gh pr create --fill --body-file <taskRoot>/docs/pr-body.md`

完成后输出：
```
✅ PR 创建/推送完成
branch: <branch>
PR URL: <url-if-any>
```
