## What

- 本 PR 将根部 `AGENTS.md` 的仓库入口规则提炼为独立 skill，并把它接入 `legion-workflow` 的入口链路。
- `AGENTS.md` 现在是最小 shim；完整的 repo-specific 规则迁移到 `skills/agent-entry/SKILL.md`。

## Why

- 之前入口纪律主要停留在顶层提示文件中，可读但不够可复用，也不容易像其他 workflow skill 一样被显式引用和验证。
- 这次收敛后，`legion-workflow` 仍是第一道门，`agent-entry` 只作为 subordinate 的仓库级补丁层，减少规则漂移风险。

## How

- 新增 `skills/agent-entry/SKILL.md`，承接 repo-specific hard gate。
- 更新 `skills/legion-workflow/SKILL.md`，明确在主 workflow 之后应用 `agent-entry`，并强调其非平行主流程身份。
- 将 `AGENTS.md` 缩减为最小入口文案，只保留关键顺序与底线约束。
- 将 `.opencode/agents/legion.md` 的 skill 权限改为 `"*": allow`，避免新增入口 skill 时再次漏配。
- 将 `agent-entry` 加入 `scripts/setup-opencode.ts` 的 `INSTALLED_SKILLS`，确保新环境会安装它。

## Testing

- PASS：见 [test-report.md](./test-report.md)
- 已通过 `skill-creator` `quick_validate`：`skills/agent-entry`、`skills/legion-workflow`
- 已通过 `git diff --check -- AGENTS.md "skills/agent-entry" "skills/legion-workflow"`
- 已通过 `git diff --check -- .opencode/agents/legion.md scripts/setup-opencode.ts`
- 已通过 `node --experimental-strip-types scripts/setup-opencode.ts install --dry-run --json`

## Risk / Rollback

- Low Risk：仅涉及 skill / workflow 文档与入口说明，无生产代码或外部合约变更。
- 如需回滚，直接撤销 `AGENTS.md`、`skills/agent-entry/SKILL.md`、`skills/legion-workflow/SKILL.md`、`.opencode/agents/legion.md`、`scripts/setup-opencode.ts` 的本次变更即可。

## Links

- Plan: [plan.md](../plan.md)
- Review: [review-code.md](./review-code.md)
- Test report: [test-report.md](./test-report.md)
- Walkthrough: [report-walkthrough.md](./report-walkthrough.md)
