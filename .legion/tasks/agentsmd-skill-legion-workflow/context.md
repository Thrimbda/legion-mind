# 把 AGENTS.md 提炼为 skill 并纳入 legion-workflow - 上下文

## 会话进展 (2026-04-15)

### ✅ 已完成

- 完成 design-lite：明确新 skill 名为 `agent-entry`，保留 `AGENTS.md` 作为最小入口钩子，并让 `legion-workflow` 显式纳入 repo-specific entry skill。
- 新增 `skills/agent-entry/SKILL.md`，将原本散落在 `AGENTS.md` 的仓库级入口规则沉淀为 repo-specific skill。
- 更新 `AGENTS.md`，将其收敛为最小入口 shim：先加载 `legion-workflow`，再 load/apply `agent-entry`。
- 更新 `skills/legion-workflow/SKILL.md`，明确 `agent-entry` 是 subordinate 的 repo-specific overlay，不替代第一道门。
- 更新 `.opencode/agents/legion.md`，将 skill allowlist 改为 `"*": allow`，避免 repo-specific 入口 skill 再次因权限漏配而失效。
- 更新 `scripts/setup-opencode.ts`，将 `agent-entry` 纳入 `INSTALLED_SKILLS`，确保新环境安装后具备完整入口链路。
- 运行 `skill-creator` quick_validate 校验 `skills/agent-entry` 与 `skills/legion-workflow`，均通过。
- 运行 `git diff --check -- AGENTS.md "skills/agent-entry" "skills/legion-workflow" ".legion/tasks/agentsmd-skill-legion-workflow/docs"`，未发现格式错误或冲突标记。
- 运行 `git diff --check -- .opencode/agents/legion.md scripts/setup-opencode.ts`，未发现格式错误或冲突标记。
- 运行 `node --experimental-strip-types scripts/setup-opencode.ts install --dry-run --json`，确认 dry-run 会同步 `agent-entry`；本地仅出现 unmanaged-existing 的安全跳过警告，不影响安装清单验证。
- 修正 `skills/legion-wiki/references/TEMPLATE_TASK_SUMMARY.md`：缺失的 raw source 直接省略，不再为 pre-migration task 引入 `context.md` 兼容说明。
- 修正 `.legion/wiki/tasks/legion-schema-skills-logmd.md`：移除指向不存在 `log.md` 的死链，保持 forward-only schema。
- 生成并落盘 `test-report.md`、`review-code.md`、`report-walkthrough.md`、`pr-body.md`。
- 更新 `.legion/playbook.md`，沉淀“AGENTS 保持最小 shim，repo 规则进入 skill”约定。
- 记录用户新增决策：active task 的 `context.md` 不做回填治理，只要求未来新 task 继续使用 `log.md`；命令体系视为 legacy，不再为 commands 增补入口适配。

### 🟡 进行中

(暂无)


### ⚠️ 阻塞/待定

(暂无)


---

## 关键文件

- `skills/agent-entry/SKILL.md` [completed]
  - 作用: 承载仓库级 Legion 入口规则的 repo-specific skill。
- `skills/legion-workflow/SKILL.md` [completed]
  - 作用: 显式纳入 `agent-entry`，并维持其 subordinate overlay 定位。
- `AGENTS.md` [completed]
  - 作用: 作为最小入口 shim，只保留加载顺序与底线门禁。
- `.opencode/agents/legion.md` [completed]
  - 作用: 让 orchestrator 对 skill 采用通配符放行，避免入口链继续受静态 allowlist 限制。
- `scripts/setup-opencode.ts` [completed]
  - 作用: 让 installer 默认同步安装 `agent-entry`。
- `skills/legion-wiki/references/TEMPLATE_TASK_SUMMARY.md` [completed]
  - 作用: 约束 task summary 只引用当前 schema 下存在的 raw source，不制造死链，也不引入 legacy 命名兼容。
- `.legion/wiki/tasks/legion-schema-skills-logmd.md` [completed]
  - 作用: 修正现有 wiki summary 的 raw source 链接，移除不存在的 `log.md` 引用。
- `.legion/tasks/agentsmd-skill-legion-workflow/docs/test-report.md` [completed]
  - 作用: 记录 quick_validate 与 diff 校验结果。
- `.legion/tasks/agentsmd-skill-legion-workflow/docs/review-code.md` [completed]
  - 作用: 记录低风险文档/skill 改动的审查结论。
- `.legion/tasks/agentsmd-skill-legion-workflow/docs/report-walkthrough.md` [completed]
  - 作用: 提供 reviewer walkthrough 与交付摘要。
- `.legion/tasks/agentsmd-skill-legion-workflow/docs/pr-body.md` [completed]
  - 作用: 提供可直接复用的 PR 描述。
- `.legion/playbook.md` [completed]
  - 作用: 沉淀 AGENTS 最小化与 repo rules skill 化约定。

---

## 关键决策

| 决策 | 原因 | 替代方案 | 日期 |
|------|------|----------|------|
| 本任务按 Low Risk + design-lite 执行，不单开 RFC | 仅涉及仓库内 skill 与入口文案重构，可回滚、无外部合约与基础设施风险 | 按 Medium Risk 额外生成 RFC；未采用，因为设计分叉有限且实现面较小 | 2026-04-14 |
| AGENTS.md 降为最小入口 shim，新规则正文转移到 `skills/agent-entry/SKILL.md` | 保留运行时入口钩子，同时避免 AGENTS 与 skill 正文长期双真源 | 继续把完整规则保留在 AGENTS.md；未采用，因为难以被 workflow 显式复用和验证 | 2026-04-14 |
| `agent-entry` 只作为 repo-specific overlay，由 `legion-workflow` 显式吸收 | 避免把仓库级规则做成另一条平行主流程，维持 `legion-workflow` 第一入口的稳定性 | 让 `agent-entry` 直接替代或并列于 `legion-workflow`；未采用，因为会制造入口双真源 | 2026-04-14 |
| `legion` orchestrator 的 skill 权限改为 `"*": allow` | repo-specific entry overlay 可能继续演进；若每次都维护静态 allowlist，会再次出现“规则已要求但运行时无权限”的断链 | 继续逐个 skill 白名单；未采用，因为容易再次漏配 `agent-entry` 这类新增入口 skill | 2026-04-15 |
| 不回填当前 active task 的 `context.md -> log.md` 差异 | 用户明确表示 active task 现状不用管，只要求未来新 task 保持 `log.md`；现有 CLI 已按 `log.md` 创建新 task | 立即批量修正当前/历史 raw task docs；未采用，因为超出用户当前意图且会扩大改动面 | 2026-04-15 |
| `.opencode/commands/**` 本轮不追加 `agent-entry` 入口适配 | 用户已明确命令体系后续废弃，不希望再继续投资 commands | 同步修改全部 command 文案；未采用，因为与用户的废弃方向冲突 | 2026-04-15 |
| 不为 wiki task summary 增加 `context.md` 向后兼容 | 用户明确要求不要做向后兼容；forward-only schema 应继续以 `log.md` 为标准，而不是把 legacy 命名重新写回模板 | 模板支持 `log.md/context.md` 双路径；未采用，因为会把 legacy 命名重新固化进现行 schema | 2026-04-15 |

---

## 快速交接

**下次继续从这里开始：**

1. 若需要提交，可直接使用 `.legion/tasks/agentsmd-skill-legion-workflow/docs/pr-body.md` 作为 PR 描述。
2. 若要继续优化，可统一 `load` / `apply` / `read` 术语，并在后续单开任务处理 commands 退场策略。

**注意事项：**

- 当前任务已经完成，验证结论为 PASS。
- 本次属于低风险 docs/skill / installer 接线变更，无需额外安全审查；若后续继续扩展入口体系，优先保持 `legion-workflow` 为主入口真源。
- 未来新 task 继续以 `log.md` 为标准 raw log 文件名；当前 active task 的 `context.md` 不做本轮治理。
- wiki task summary 对不存在的 raw source 直接省略，不通过 `context.md` 兼容来修补历史任务。

---

*最后更新: 2026-04-15 09:53 by Claude*
