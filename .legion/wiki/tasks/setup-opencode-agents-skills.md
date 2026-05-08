# setup-opencode-agents-skills

## 任务摘要

- 目标：把 `scripts/setup-opencode.ts` 的默认 skill 复制目标从 OpenCode home 改为 agents skill home。
- 风险级别：Low；单脚本默认路径调整，保留显式 override 与现有 lifecycle 逻辑。
- 生产代码范围：`scripts/setup-opencode.ts`；相关用户文档范围：`README.md`。

## 当前结论

- `setup-opencode.ts` 默认仍使用 `~/.config/opencode` 管理 `.opencode/agents` 与 managed state。
- Legion skill 文件默认安装到 `~/.agents/skills/<skill>`，因为脚本默认 home 改为 `~/.agents` 且既有同步逻辑继续追加 `skills/<skill>`。
- `--opencode-home` 仍作为兼容 override 保留；显式传入时仍可把 skill tree 安装到指定 home 下的 `skills/<skill>`。

## 证据入口

- Plan：`.legion/tasks/setup-opencode-agents-skills/plan.md`
- Test Report：`.legion/tasks/setup-opencode-agents-skills/docs/test-report.md`
- Change Review：`.legion/tasks/setup-opencode-agents-skills/docs/review-change.md`
- Walkthrough：`.legion/tasks/setup-opencode-agents-skills/docs/report-walkthrough.md`
- PR Body：`.legion/tasks/setup-opencode-agents-skills/docs/pr-body.md`

## 后续注意

- `--opencode-home` 命名现在偏历史兼容；若要改名或新增 `--agents-home` alias，应单独设计并覆盖 backwards compatibility。
