# 基于 llm-wiki 创建新 skill - 上下文

## 会话进展 (2026-04-10)

### ✅ 已完成

- 将 `skills/llm-wiki/SKILL.md` 的 frontmatter description 改为 `Use when ...` 触发式文案，更贴近 `writing-skills` 的 discoverability 约束，同时保留 `llm-wiki.md` 中“持续积累而非每次重推导”的核心精神。
- 在 query 入口与 workflow 中补了“输出载体 ≠ wiki page type”的短句，明确 table / slide deck / chart / canvas 可以是 durable artifact，但是否写回仍受宿主 schema 门禁约束。
- 为 `references/workflows.md` 增加目录、统一多处“可写前提”短句模板，并在 `references/conventions.md` 补充安全 ID 示例，降低扫读成本与集成歧义。
- 重新执行最小验证：`quick_validate.py` PASS，`git diff --check -- "skills/llm-wiki" ".legion/tasks/llm-wiki-skill"` PASS。
- 按 `writing-skills` 的思路先做了一轮“无流程图基线测试”：发现 query 三岔路与 ingest 第一落点虽然文档正确，但在快速扫读时需要跨 `SKILL.md` / `workflows.md` / `page-types.md` 来回确认，最适合补小型流程图。
- 先在 `skills/llm-wiki/SKILL.md` 中补了 2 个流程图，随后根据用户要求将其从 DOT/graphviz 改为 Mermaid 状态机：分别覆盖 `query` 的 durable writeback 三岔路，以及 ingest 新 source 的第一落点判断。
- 做了加图后的后测：探索代理确认 query / ingest 的关键决策现在更容易“一眼扫出”，跨文件跳读显著减少；同时指出“用户是否明确授权沉淀”是最容易误判的自然语言边界，因此已在 `query` 状态机后补充显式说明。
- 完成 validate：`quick_validate.py` PASS，`git diff --check -- "skills/llm-wiki"` PASS；同时做了 Mermaid 代码块结构校验与前后场景对照验证。

### 🟡 进行中

(暂无)

### ⚠️ 阻塞/待定

- 当前环境缺少 Mermaid CLI / 渲染器，因此未做图形渲染级校验；已改用 Mermaid 代码块结构检查 + 前后场景对照作为本轮验证替代。

---

## 会话进展 (2026-04-09)

### ✅ 已完成

- 读取用户新反馈，确认当前 `llm-wiki` skill 的主要问题不是“错误”，而是“抽象度偏高、缺少可直接执行的细化 guidance”。
- 复读 `llm-wiki.md`，重新梳理其中尚未充分落到 skill 中的建议：首次接管 schema、页面家族、答案沉淀、lint 分类、图片/附件/搜索等可选增强。
- 更新 plan / RFC / review-rfc，将任务从“最小 baseline”升级为“更具体但仍允许宿主覆盖”的 refinement 迭代。
- 细化 `skills/llm-wiki/SKILL.md` 与 4 个 references：新增 `page-types.md`，并补齐 bootstrap、page families、决策矩阵、4 段式 query 输出、等价导航/日志机制的可写前提。
- 修复 review-code / review-security 暴露的边界问题：统一“宿主优先、baseline 补最小契约”的表述，收口 source summary 默认落点，并为等价导航/日志机制补齐“宿主显式声明 + 可写 scope + 允许字段/写法”三重约束。
- 重新执行验证、代码审查、安全审查并刷新 walkthrough / pr-body；最终 test-report PASS、review-code PASS、review-security PASS。

### 🟡 进行中

(暂无)

### ⚠️ 阻塞/待定

(暂无)

---

## 会话进展 (2026-04-08)

### ✅ 已完成

- 完成 llm-wiki.md 与 skill-creator 约束梳理，并将 plan.md 升级为完整任务契约。
- 生成并收敛 RFC / review-rfc，确认新 skill 采用 SKILL.md + 3 个 references、默认不新增 scripts。
- 实现 skills/llm-wiki/SKILL.md 与 references/architecture.md、workflows.md、conventions.md。
- 完成测试、代码评审与安全评审；最终 test-report PASS、review-code PASS、review-security PASS。
- 生成 report-walkthrough.md 与 pr-body.md，交付 review/PR 所需材料。

### 🟡 进行中

- 首轮交付已完成；现因用户反馈“skill 过于简单”而进入细化迭代。

### ⚠️ 阻塞/待定

(暂无)

---

## 关键文件

- `skills/llm-wiki/SKILL.md` - 主入口，需在保持精简的前提下补齐更具体的 bootstrap 与操作规则。
- `skills/llm-wiki/references/*.md` - 将承载本轮新增的页面类型、操作检查表与更具体约定。

---

## 关键决策

| 决策 | 原因 | 替代方案 | 日期 |
|------|------|----------|------|
| 本任务继续按 Medium 风险执行，并保留 `llm-wiki` 作为 skill 名称。 | 变更的仍是 public skill 契约；本轮是在现有契约上细化可执行性，而非改做某个具体业务 wiki。 | 退回 Low/design-lite：实现更快，但不足以约束“具体到什么程度”；改名会制造无谓漂移。 | 2026-04-09 |
| 细化方向采用“更具体的推荐 baseline + 宿主 schema 最终裁决”模型。 | 用户需要更具体，但 `llm-wiki.md` 本身强调实现要因域而异；因此应补 page types、workflow checklist、schema checklist，而不是硬编码唯一目录树。 | 直接强推单一目录模板：更具体，但会误伤不同宿主；继续维持抽象 baseline：无法回应用户反馈。 | 2026-04-09 |
| 将 query 写回继续维持“双重显式授权”模型，并把更具体 guidance 放到 workflow / conventions 中。 | 细化 skill 不能以牺牲写权限边界为代价；越具体越要明确哪些是默认只读、哪些是授权例外。 | 因追求“更具体”而放宽 query 写回：会带来越权与误写风险。 | 2026-04-09 |
| 本次仍默认不新增 scripts；优先用更具体的 references 提升执行稳定性。 | 当前问题是文档抽象度，不是机械步骤无法执行；先用 references 承载具体 page family / checklist，成本最低也最符合 skill-creator。 | 立即补脚本：可能过早把可选增强变成默认依赖。 | 2026-04-09 |
| `index.md` / `log.md` 的宿主等价机制只有在“宿主显式声明 + 位于 wiki 根或宿主声明的可写 scope + 允许字段/写法已定义”同时满足时才允许写回。 | review-security 指出仅允许“等价机制”但不限定可写白名单，会让 agent 误把任意宿主文件当成导航/日志落点，从而产生误写或越权写入风险。 | 只要求宿主显式声明：边界仍过宽；默认允许写任意等价文件：风险更高。 | 2026-04-09 |
| source summary 仍保留为 ingest 的 baseline 默认第一落点，但允许宿主用等价页型覆盖。 | review-code 指出若把 source summary 写成“只有宿主允许时才存在”，会让 schema 不完整时失去默认落点，回到抽象口号层。 | 完全依赖宿主显式允许：具体度不足；强制单一来源页实现：过度硬编码。 | 2026-04-09 |
| 流程图只补在 `SKILL.md` 的两个非显然决策点：query 三岔路与 ingest 第一落点。 | `writing-skills` 建议流程图只用于容易误判的决策点；基线测试显示这两处最需要“快速扫读”支持，而 lint 仍更适合保留文字规则。 | 给所有 workflow 都加图：会让入口膨胀；完全不加图：关键三岔路仍需跨文件跳读。 | 2026-04-10 |
| 为 agent 执行语义，流程图最终采用 Mermaid `stateDiagram-v2`，而不是 DOT/graphviz。 | 用户明确要求流程图不仅给人看，更要让执行 agent 把它当状态机读取；Mermaid 状态机语法更容易直接表达状态、守卫条件与终态动作。 | 保留 DOT：更偏结构图；改成普通 Mermaid flowchart：可读，但不如状态机语义直接。 | 2026-04-10 |
| 在当前环境缺少 Mermaid CLI / 渲染器时，使用“Mermaid 代码块提取 + 结构检查 + 前后场景对照”作为流程图 validate 替代。 | 本轮目标是验证状态机存在、结构合理且能提升实际可扫读性；环境限制无法做渲染，但仍可通过结构检查与前后使用测试验证效果。 | 阻塞等待安装 Mermaid 渲染器：会增加不必要的人类介入；完全不验证：不符合 writing-skills 的测试导向。 | 2026-04-10 |
| 本轮继续只做轻量 polish：description 改成 `Use when ...` 触发式文案，并用短句澄清“输出载体 ≠ wiki page type”。 | 用户要求直接执行最小改动清单，目标是提升 discoverability 与表达清晰度，而不是再次扩展 skill 设计。 | 连带重写更多 references / report：收益有限且超出本轮最小需求。 | 2026-04-10 |

---

## 快速交接

**下次继续从这里开始：**

1. 如需继续增强，可为宿主 schema 补一个最小声明模板（尤其是等价导航/日志机制与可写 scope）。
2. 若后续新增更多 durable outputs（如 slides / charts / canvas），继续保持“输出载体 ≠ wiki page type”的边界。
3. 任何后续改动都要同步检查 references 数量表述、可写前提短句与任务文档一致性。

**注意事项：**

- 不要为了“更具体”而把宿主 schema 的可配置项写成硬约束。
- 若 references 新增示例或模板，必须强调它们是默认基线而不是唯一实现。

---

*最后更新: 2026-04-10 by Claude*
