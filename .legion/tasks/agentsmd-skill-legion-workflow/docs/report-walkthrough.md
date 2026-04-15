# 交付 Walkthrough

## 目标与范围

- 目标：把仓库根部 `AGENTS.md` 的入口规则提炼为可复用 skill，并让 `legion-workflow` 显式吸收这层 repo-specific 入口规则，同时补齐运行时 allowlist / installer 接线。
- 范围绑定：`AGENTS.md`、`skills/agent-entry/**`、`skills/legion-workflow/**`、`.opencode/agents/legion.md`、`scripts/setup-opencode.ts`，以及本任务下的交付文档。
- 风险等级：Low Risk；仅涉及 skill / workflow 文档与入口说明，不触及生产代码、外部接口或数据迁移。

## 设计摘要

- 设计来源：design-lite，见 [plan.md](../plan.md)；本任务未单开 RFC。
- 核心决策：
  - `AGENTS.md` 收敛为最小入口 shim，只保留运行时入口钩子与硬约束。
  - 新增 `skills/agent-entry/SKILL.md` 承接仓库级入口纪律。
  - `skills/legion-workflow/SKILL.md` 明确 `agent-entry` 是 subordinate 的 repo-specific overlay，不是平行主流程，也不替代 `legion-workflow` 的第一道门角色。

## 改动清单

### `AGENTS.md`
- 收敛为 reviewer-friendly 的最小入口文案。
- 明确顺序：先加载 `legion-workflow`，再应用 `agent-entry`。
- 保留底线约束：不要先 patch、不要忽略 `.legion`、稳定 contract 前不要启动 `engineer`。

### `skills/agent-entry/SKILL.md`
- 新增 repo-specific entry skill。
- 把原先散落在 `AGENTS.md` 中的仓库级硬门禁整理为可复用 skill。
- 明确职责边界：只补仓库级入口规则，不替代 `legion-workflow`，不扩张为通用 workflow。

### `skills/legion-workflow/SKILL.md`
- 显式纳入 repo-specific entry skill 的接入点。
- 多处强调 `agent-entry` 从属关系，避免两者被理解成并列主入口。
- 保持 `legion-workflow` 继续作为第一道门与主路由真源。

### `.opencode/agents/legion.md`
- 将 `permission.skill` 收敛为 `"*": allow`。
- 避免新增 repo-specific skill 后再次因静态 allowlist 漏配导致入口链断裂。

### `scripts/setup-opencode.ts`
- 将 `agent-entry` 纳入 `INSTALLED_SKILLS`。
- 使 installer 在新环境下会同步安装 repo-specific entry skill，而不只是在仓库内声明它。

### 交付文档
- 新增本 walkthrough，供 reviewer 快速理解目标、范围、验证与回滚方式。
- PR 描述另见 [pr-body.md](./pr-body.md)。

## 如何验证

验证依据见 [test-report.md](./test-report.md)。

### 命令
- `python3 "/Users/c1/.opencode/skills/skill-creator/scripts/quick_validate.py" "skills/agent-entry"`
- `python3 "/Users/c1/.opencode/skills/skill-creator/scripts/quick_validate.py" "skills/legion-workflow"`
- `git diff --check -- AGENTS.md "skills/agent-entry" "skills/legion-workflow"`
- `git diff --check -- .opencode/agents/legion.md scripts/setup-opencode.ts`
- `node --experimental-strip-types scripts/setup-opencode.ts install --dry-run --json`

### 预期结果
- `skill-creator` 的 `quick_validate` 对两个 skill 均返回通过，说明结构与 frontmatter 有效。
- `git diff --check` 无输出，说明未引入空白错误或冲突标记。
- 人工 scoped diff 核对后，三处入口规则表述一致：`AGENTS.md` 为最小 shim，`agent-entry` 从属于 `legion-workflow`。
- installer dry-run 会同步 `agent-entry`，且最终返回 `OK_INSTALL` / `failures: 0`。

另见审查结论：[review-code.md](./review-code.md)。

## 风险与回滚

### 风险
- 低风险术语漂移：`load` / `read` / `apply` 在个别位置混用，后续若继续扩写，可能造成“读取文件”与“按 skill 加载”的理解差异。
- 文档分层若未来继续膨胀，可能再次出现 AGENTS / workflow / repo skill 三处规则漂移。

### 回滚
- 直接回滚 `AGENTS.md`、`skills/agent-entry/SKILL.md`、`skills/legion-workflow/SKILL.md`、`.opencode/agents/legion.md`、`scripts/setup-opencode.ts` 的本次变更即可。
- 因无生产代码、无 schema/data migration、无外部合约改动，回滚成本低且影响面可控。

## 未决项与下一步

- 非阻塞收口：统一 `load` / `apply` / `read` 的入口术语，减少后续理解差异。
- 若后续新增更多 repo-specific entry skill，继续保持：`legion-workflow` 定义主框架，repo skill 只定义仓库补丁。
- commands 已按用户要求视为 legacy，本轮不再做 `.opencode/commands/**` 适配；若要处理，应单开退场任务。
- 当前任务交付面已满足低风险 docs/skill 变更要求，可进入常规 reviewer 审阅。
