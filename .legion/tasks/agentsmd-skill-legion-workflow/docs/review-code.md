# 代码审查报告

## 结论
PASS

## Overall verdict
- 本次改动满足任务目标：`AGENTS.md` 已收敛为最小入口 shim，`skills/agent-entry/SKILL.md` 承接仓库级规则，`skills/legion-workflow/SKILL.md` 明确把 `agent-entry` 定位为 repo-specific 补丁层而非平行主流程。
- follow-up 中已补齐两个真实接线点：`legion` agent 的 skill 权限已放宽为通配符，installer 也已安装 `agent-entry`；此前 review 提到的两处高优先级断链风险已解除。
- 就已审阅范围看，未发现 correctness / maintainability / drift risk 方面的阻塞问题。

## Findings by severity

### Blocking
- none

### Medium
- none

### Low
- `AGENTS.md:7-8` / `skills/legion-workflow/SKILL.md:12,57,179` / `skills/agent-entry/SKILL.md:35-38` - 术语在 `load` / `read` / `apply` 之间切换，语义大体一致，但后续继续扩写时容易形成“是只读文件，还是按 skill 加载”的理解差异。当前不构成阻塞，建议后续统一成一套措辞。
- `.opencode/commands/**` - 入口文案没有补 `agent-entry`，但这是用户显式接受的方向性结果：commands 已被定为 legacy，不再继续投入。当前不视为 bug。

## 阻塞问题
- [x] 无

## 建议（非阻塞）
- `AGENTS.md:7-8` - 可考虑把“Then read `skills/agent-entry/SKILL.md`”统一为更贴近 skill 体系的表述，例如“load/apply repo-specific entry skill (`agent-entry`)”，减少与 workflow 文档术语漂移。
- `skills/agent-entry/SKILL.md:30-31` - “纯只读、单轮、无需持久任务状态的普通查询”这条边界写得合理；若后续 repo 再增加例外场景，建议只在 `legion-workflow` 维护判定真源，`agent-entry` 仅做 repo-specific 补充，避免双边扩张。
- `skills/legion-workflow/SKILL.md:12,119,179,201,221` - 已多处强调 `agent-entry` 从属关系，这是正确方向；后续若新增更多 repo-specific entry skill，建议继续维持“主 workflow 只定义框架，repo skill 只定义仓库补丁”的分层，不要把通用门禁回流到 repo skill。

## Specific note: AGENTS.md 是否已缩减为最小 shim
- 是。`AGENTS.md` 已明显降为最小入口钩子，只保留三件关键事：先加载 `legion-workflow`、再读取/应用 `agent-entry`、用户指令优先。
- 同时它没有丢失关键安全门禁：`AGENTS.md:11` 仍保留“不先 patch、不忽略 `.legion`、稳定 contract 前不启动 `engineer`”这一层硬约束；而更完整的恢复 active task / `brainstorm` / contract gate 细节已转移到两个 skill 中承接。
- 因此，这次收敛实现了“最小 shim”目标，且没有明显削弱安全边界。

## 修复指导
- 本轮无需阻塞性修复。
- 若要做一次低成本收口，优先统一入口术语：
  1. 在 `AGENTS.md` 与两个 skill 中统一使用 `load` / `apply` 其中一组主术语；
  2. 保持 `legion-workflow` 负责“是否接管 + 如何路由”；
  3. 保持 `agent-entry` 只补 repo-specific gate，不新增通用 workflow 规则。

## Handoff
[Handoff]
summary:
  - 审阅了 `AGENTS.md`、`skills/agent-entry/SKILL.md`、`skills/legion-workflow/SKILL.md` 与任务 plan。
  - 额外审阅了 `.opencode/agents/legion.md` 与 `scripts/setup-opencode.ts` 的 follow-up 修复。
  - 结论为 PASS；此前 review 中的两处高优先级接线问题已修复。
  - `AGENTS.md` 已成功降为最小 shim，且未丢失关键安全门禁。
decisions:
  - commands 已按用户要求视为 legacy，本轮不再做入口链适配。
risks:
  - 低风险术语漂移：`read` / `load` / `apply` 混用，后续扩写时可能带来理解差异。
files_touched:
  - path: /Users/c1/Work/legion-mind/.legion/tasks/agentsmd-skill-legion-workflow/docs/review-code.md
commands:
  - (none)
next:
  - 如需进一步收口，可统一三处入口文案的 skill 动词表述，并单开任务处理 commands 退场。
open_questions:
  - (none)
