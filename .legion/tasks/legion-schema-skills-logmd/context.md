# 拆分 Legion schema skills 并改用 log.md - 上下文

## 会话进展 (2026-04-13)

### ✅ 已完成

- 完成 schema skills 拆分：新增 legion-docs / legion-workflow 与 7 个 subagent skills
- 将 .opencode agents 瘦身为权限 + skill 加载壳
- 将现行 CLI / commands / docs / smoke 流切换到 log.md 与新 skill 路径
- 运行 `npm run legion:smoke` 与 `npm run legion:check-no-default-mcp` 验证新入口
- 通过 repo 级 grep 确认 `.opencode/**`、`skills/**`、`scripts/**`、`README.md`、`docs/legionmind-usage.md` 不再把 `skills/legionmind` / `context.md` 作为现行入口
- 通过 `npm run legion:smoke` 验证新 CLI 的 `log.md` 文件名、`log read/update` 命令、stable reviewId 与 `legion_update_log` 审计动作
- 通过 `node --experimental-strip-types scripts/setup-opencode.ts install --dry-run --json ...` 验证 installer 会同步全部新 skills 与 commands/agents
- 使用 writing-skills 准则收紧 9 个新建 skill 的 metadata 与正文结构：description 改为纯触发条件导向，并统一加入 Overview / When to Use / Quick Reference 等扫描结构
- 通过 repo 级 grep 验证新建 skills 的 description 以 `Use when` 开头，且均具备更稳定的可扫描段落结构
- 完成两组 RED-phase baseline：未读取 skill 时，`legion-docs` 场景把 rollback 细节误放到 walkthrough、把 task-local 决策误放到 RFC；`legion-workflow` 场景虽大体正确，但没有显式体现何时切到 `legion-docs`，且对 security review 触发边界存在犹豫
- 严格流程下完成多组 RED/GREEN/REFACTOR 检查：`legion-docs` 出现真实 baseline 失败，经过 REFACTOR 后重测通过；`legion-workflow` 在带 skill 后补齐了 `legion-docs` 加载时机与恢复顺序
- 对 `engineer`、`run-tests`、`report-walkthrough`、`spec-rfc`、`review-rfc`、`review-code`、`review-security` 运行代表性场景，baseline 已与目标行为基本一致，因此本轮主要做 discoverability / structure / mermaid 优化
- 根据用户指出的问题修正 `skills/engineer/SKILL.md`：engineer 现已明确为“只要存在 RFC / design source，就必须先读再编码”
- 补齐 `legion-workflow` 的 subagent dispatch 真源：新增 `SUBAGENT_DISPATCH_MATRIX.md`，并明确 orchestrator MUST dispatch subagents
- 将 `/legion`、`/legion-impl`、`/legion-rfc-heavy` 收紧为只声明 mode，dispatch 顺序统一引用 matrix
- 在 `REF_AUTOPILOT.md` 中补写“subagent 派生是强制流程”
- 按方案 2 新增 `skills/legion-wiki`，正式把 `.legion/wiki/**` 设为 Legion 的 wiki / synthesis 层
- 创建 `.legion/wiki/` 基础结构：`index.md`、`log.md`、`decisions.md`、`patterns.md`、`maintenance.md`、`tasks/legion-schema-skills-logmd.md`
- 将 `legion-workflow`、`legion` agent、`legion-bootstrap`、`evolve`、README、usage docs、installer 接到 `legion-wiki`


### 🟡 进行中

(暂无)


### ⚠️ 阻塞/待定

(暂无)


---

## 关键文件

(暂无)

---

## 关键决策

| 决策 | 原因 | 替代方案 | 日期 |
|------|------|----------|------|
| 本轮优先重构 schema 层与现行入口，不批量改写历史 task raw docs | 用户要求立即开始且禁止兼容层；先把 skills、agents、commands、CLI、安装脚本与现行文档切到新模型，历史 raw docs 后续可按 historical/superseded 标记治理 | 同时重写所有历史 .legion/tasks/** 为 log.md；成本高且会放大当前任务 scope | 2026-04-13 |
| 本轮不创建 `.legion/wiki/**` 骨架，先完成 schema 层切换并把 wiki/lint 作为后续 workstream | 用户当前明确要求先开始 skill/agent/log 模型改造；先完成 skills、agents、commands、CLI、安装脚本与现行文档切换，避免 scope 膨胀 | 同步创建 wiki 目录与 task summary/lint；能补查询层，但会显著扩大本轮改动面 | 2026-04-13 |
| 现行入口的残留检查仅针对 schema / commands / docs / scripts；历史分析文档与 raw task docs 允许保留旧名作为历史证据 | 本轮目标是切换当前有效规范，避免把历史任务归档与分析文档重写纳入同一改动面 | 全仓逐条清理所有旧名；会把历史证据与现行规范混为一体，且超出本轮主目标 | 2026-04-13 |
| 安装器继续保留 `.legionmind/` 作为本地安装状态目录，不纳入本轮 skill 拆分重命名范围 | 本轮用户要求聚焦 skill/agent/log 模型拆分；安装状态目录名不影响现行 schema 入口，改动它会扩大兼容性与迁移面 | 同步把安装状态目录也改名；更一致，但会引入额外迁移与回滚成本 | 2026-04-13 |
| 本轮 skill 优化以 writing-skills 的发现性与精炼性准则为主，不额外扩写 workflow 细节 | 用户要求优化所有新建 skill；当前最明显问题是 description 过于解释用途/产物、正文结构偏薄但还可更像可扫描 reference，需要统一收敛 | 保持现状；虽可用，但搜索触发与长期维护质量较弱 | 2026-04-13 |
| 本轮 skill 优化主要采用 writing-skills 的 CSO 与结构化扫描准则，不补做完整 pressure-scenario TDD | 用户当前要求是优化已写好的 skills；先提升触发描述与正文可读性/可发现性收益最高，完整 baseline/pressure 测试可后续单开任务做严格化 | 立即为每个 skill 补 RED/GREEN/REFACTOR 压力测试；更完整，但会显著扩大本轮范围 | 2026-04-13 |
| mermaid 流程图优先加在 decision-heavy skills，而不是所有 skills 一视同仁铺开 | writing-skills 明确建议只在非显而易见的决策点使用流程图；当前 baseline 失败集中在文档归属、流程分流、模式选择与命令推断 | 每个 skill 都加图；一致性更强，但会徒增 token 和视觉噪音 | 2026-04-13 |
| 严格流程的行为测试重点放在 decision-heavy skills；其余 skills 若 baseline 已达标，则只做结构与可发现性优化，并用代表性场景确认无回退 | writing-skills 的核心价值在于发现非直觉决策失败点。当前真实失败集中在 `legion-docs` 和部分 workflow 入口判断；其他 subagent skills 的现有行为已较稳定，继续硬凹失败样本收益低 | 为每个 skill 强行制造失败样本后再改写；形式更整齐，但不一定产生真实改进 | 2026-04-13 |
| 对 engineer 而言，RFC 不是 optional context，而是存在时必须读取的设计真源 | 用户明确指出 engineer 的核心职责就是按设计实现；把 RFC 表述成“必要时再读”会弱化 design source of truth | 保留“必要时再读 RFC”；会鼓励跳过设计直接实现，违背 Legion 的设计门禁 | 2026-04-13 |
| subagent dispatch 的强规则落在 `legion-workflow`，commands 只保留 mode 选择与入口约束 | 用户指出 agent 壳已清空后，如果 workflow 层不明确写 MUST dispatch，就只剩 command 文案和模型推断在维持流程；必须把 dispatch 真源回收到 workflow skill | 继续让 commands 分别内联派生顺序；会形成多处真源并再次漂移 | 2026-04-13 |
| 采用方案 2：新增 `legion-wiki`，而不是直接让通用 `llm-wiki` 充当 Legion wiki owner | 用户明确选择方案 2；Legion 需要专属的 `.legion/tasks/** -> .legion/wiki/**` 提升规则、task summary 模板与路径约束，不能只靠通用 wiki skill 暗含实现 | 直接把 `llm-wiki` 绑定为 owner；可复用通用能力，但 Legion 专属 layout / metadata / workflow 约束不够显式 | 2026-04-14 |

---

## 快速交接

**下次继续从这里开始：**

1. 如需继续推进，可补更多历史 task summaries 与 historical/superseded 元数据
2. 可进一步把 `/legion` 结束阶段的 wiki 提升动作做成更明确的 workflow 规则或命令

**注意事项：**

- 此前“本轮不创建 `.legion/wiki/**`”的阶段性决策，已被用户新指令覆盖

---

*最后更新: 2026-04-14 22:32 by Claude*
