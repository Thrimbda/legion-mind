# Summary

## What

本 PR 将 LegionMind 的默认执行面从 `legion_*` MCP 工具切换为 **scripts-first CLI**，交付 `skills/legionmind/scripts/legion.ts` 及配套验证脚本、skill references、commands、README 与 setup verify 改造。

这是一次 **scripts-first 替代 LegionMind MCP** 的交付，不再把 `mcp.legionmind` 作为仓库默认前提；MCP 仅保留为历史兼容提示。

## Why

现有 LegionMind skill 过度绑定外部 MCP server，与 skill-creator 强调的“SKILL.md 精简、确定性动作下沉到 scripts、细节放 references”不一致，也降低了 skill 的可移植性与自包含性。

本次改造目标是让仓库在没有 LegionMind MCP server 的前提下，仍能完成 `.legion/` 生命周期管理、Review 闭环与审计/验证流程。

## How

- 以 `skills/legionmind/scripts/legion.ts` 统一承接 init / propose / approve / update / review / dashboard / ledger 等能力。
- 补齐参考 MCP 实现中的 schema 缺口（如 `addFile`、`addConstraint`、`addTask`），并采用 section 级 markdown 更新以保留 Review block。
- 将 `SKILL.md`、references、agent/commands、`scripts/setup-opencode.ts`、`README.md` 全部切到 CLI-first；新增 smoke 与 no-default-mcp 扫描脚本固定验证入口。

# Verification

- `node --experimental-strip-types scripts/legionmind/smoke.ts`
- `node --experimental-strip-types scripts/legionmind/check-no-default-mcp.ts`
- `npm run legionmind:smoke`
- `npm run legionmind:check-no-default-mcp`
- `python3 "/Users/c1/Work/agents/.claude/skills/skill-creator/scripts/package_skill.py" "/Users/c1/Work/legion-mind/skills/legionmind"`

结果：**PASS**。详见 [`test-report.md`](./test-report.md)。

补充评审：

- RFC review：**PASS WITH CHANGES**（[`review-rfc.md`](./review-rfc.md)）
- Code review：**PASS**（[`review-code.md`](./review-code.md)）
- Security review：**PASS WITH CHANGES**（[`review-security.md`](./review-security.md)）

# Risks

- 这是仓库默认工作流入口的替换，若 CLI parity 或文案切换不完整，可能导致新旧流程混用。
- `ledger query` 当前仍为整文件读取后过滤，后续需要继续优化资源使用。
- `dashboard generate --output` 的默认边界还能进一步收紧。

# Follow-ups

- 将 `ledger query` 优化为流式/窗口化读取。
- 收紧 dashboard 输出默认路径边界。
- 为 `check-no-default-mcp.ts` 增加 fixture 级正反样例。

# Links

- Plan: [`plan.md`](../plan.md)
- Research: [`research.md`](./research.md)
- RFC: [`rfc.md`](./rfc.md)
- Review RFC: [`review-rfc.md`](./review-rfc.md)
- Test Report: [`test-report.md`](./test-report.md)
- Code Review: [`review-code.md`](./review-code.md)
- Security Review: [`review-security.md`](./review-security.md)
- Walkthrough: [`report-walkthrough.md`](./report-walkthrough.md)
