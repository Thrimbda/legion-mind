# RFC：将 playbook 合并进统一 wiki 层，并收敛 README 术语说明

## 摘要 / 动机

当前仓库同时存在两套跨任务持久化概念：`.legion/playbook.md` 被描述为“操作者约定”，`.legion/wiki/**` 被描述为“跨任务当前知识”。这会让使用者在 README、usage、`legion-docs`、`legion-wiki` 与历史设计文档之间不断切换心智模型：到底“可复用约定”应该进 playbook，还是进 wiki。现状已经证明这种分裂会制造定义漂移，而不是带来清晰分层。

本 RFC 决定：**只保留一个统一的跨任务知识层 `.legion/wiki/**`**。原本 playbook 风格的 durable conventions 不再单独存放，而是根据性质进入 wiki 的 `decisions.md` 或 `patterns.md`。本次任务同时更新 README 叙事，把“设计门禁 / 分层验证 / 证据化汇报”改写成更直白的入口说明，并明确 raw task docs 与 cross-task wiki 的边界。

## 目标与非目标

### 目标

1. 消除 playbook 与 wiki 的并列持久化语义，只保留 `.legion/wiki/**` 作为跨任务知识层。
2. 明确 former playbook 条目的新归宿：硬性当前规则进 `decisions.md`，可复用工作方式/约定进 `patterns.md`。
3. 更新 README、usage、`legion-docs`、`legion-wiki`、agent 文案，使其对知识落点的说法一致。
4. 用直白语言解释“设计门禁 / 分层验证 / 证据化汇报”，让新读者无需先理解抽象术语。
5. 给出 `.legion/playbook.md` 的可执行迁移、验证与回滚方案。

### 非目标

1. **不**改变 `init` 行为；`init` 仍只保证 `.legion/tasks/` 存在，不预建 wiki skeleton。
2. **不**把 `.legion/tasks/**` 重新定义为 wiki；raw task docs 与 wiki 继续分层。
3. **不**在本任务中引入新的持久化介质、注册表或 CLI 状态机。
4. **不**对历史全部任务执行大规模 wiki 补录；仅定义归宿、页面职责与本轮需要的最小迁移。

## 定义

- **raw task docs**：`.legion/tasks/<task-id>/**`。保存单任务契约、日志、状态板、RFC、评审、测试、报告等原始证据。
- **wiki 层**：`.legion/wiki/**`。保存跨任务仍然有效、便于查询的当前知识总结。
- **schema 层**：`skills/**` + `.opencode/**`。保存工作流规则、技能边界、代理入口等现行规则真源。
- **设计门禁**：不是“先写很多文档”，而是**中高风险改动先把方案、边界、风险、回滚讲清楚，再进入实现**。
- **分层验证**：不是“一条命令证明一切”，而是**按安装/文档一致性/任务证据等层次分别验证**。
- **证据化汇报**：不是口头说“做完了”，而是**带着变更点、验证结果、剩余风险、可追溯文档去汇报**。

## 方案设计

### 1. 总体决策

将 `.legion/playbook.md` 退役为现行 durable 概念，统一由 `.legion/wiki/**` 承担跨任务知识沉淀。以后仓库里不再出现“playbook 记录约定、wiki 记录知识”这类双层描述；统一改为：

- `.legion/tasks/**` = raw evidence
- `.legion/wiki/**` = cross-task current knowledge
- `skills/**` + `.opencode/**` = schema / runtime rules

### 2. former playbook 条目的落点规则

原 playbook 条目不再按“来源是约定”单独存放，而是按内容属性分类：

- **`decisions.md`**：当前有效、跨任务生效、需要被当作规则使用的结论。
- **`patterns.md`**：可复用实践、工作方式、经验性约定、常见陷阱与最小示例。
- **`maintenance.md`**：尚未完成迁移、归类不确定、需要后续补充证据或清理的项目。
- **`tasks/<task-id>.md`**：任务级综合摘要，说明某个任务产出了哪些 durable 结论，并链接 raw docs。

本次已知唯一 playbook 条目“CLI should stay thin”应迁移到 **`.legion/wiki/patterns.md`**，而不是 `decisions.md`：

- 它表达的是一种跨任务复用的实现/架构惯例；
- 它包含适用边界、陷阱与最小示例，符合 pattern 形态；
- 它虽然稳定，但不是所有层面都要当作高优先级规则重复宣告的 schema 条款。

若未来出现“所有 orchestrator 必须如何做”之类更硬的当前规则，再进入 `decisions.md`。

### 3. wiki 页面职责更新

统一后的页职责如下：

| 页面 | 职责 | former playbook 内容是否可进入 |
|---|---|---|
| `.legion/wiki/index.md` | 总导航、查询入口、说明读法 | 否，只做导航与入口说明 |
| `.legion/wiki/log.md` | wiki 层更新记录 | 否 |
| `.legion/wiki/decisions.md` | 当前有效的跨任务决策 | 是，若条目本质是硬性当前规则 |
| `.legion/wiki/patterns.md` | 可复用模式、约定、常见坑 | **是，默认落点** |
| `.legion/wiki/maintenance.md` | 迁移债务、遗留清理、待确认项 | 是，若暂时无法确定落点 |
| `.legion/wiki/tasks/<task-id>.md` | 任务综合摘要与 raw docs 链接 | 间接记录来源，不直接替代 decisions/patterns |

本任务的**最小完成态**必须固定为：

- **必须存在**：`.legion/wiki/index.md`、`.legion/wiki/patterns.md`
- **按触发条件创建，默认可缺省**：`.legion/wiki/decisions.md`、`.legion/wiki/maintenance.md`、`.legion/wiki/log.md`、`.legion/wiki/tasks/<task-id>.md`
- **本任务显式不要求创建**：若没有对应内容，不得为了“凑齐布局”生成空的 `decisions.md` / `maintenance.md` / `log.md` / `tasks/<task-id>.md`

选择这个最小完成态的原因：

- 当前已知唯一 former playbook durable 条目是 pattern，不需要人为制造空 decision 页面；
- 仍保留 `.legion/wiki/**` 的统一入口与后续按需扩展空间；
- 避免把“统一知识层”任务扩大成“预建全量 wiki skeleton”任务。

### 4. README 的文案策略

README 不再只把“设计门禁 / 分层验证 / 证据化汇报”当标语出现，而要在首次出现处直接给出 plain-language 解释：

- **设计门禁**：先把为什么这么改、会影响什么、怎么回滚说清楚，再让智能体大规模动手。
- **分层验证**：把“能不能安装、文档是否一致、任务证据是否完整”分开验证，而不是靠一句“测过了”。
- **证据化汇报**：汇报时附上变更文件、验证结果、剩余风险和文档入口，让 reviewer 能低成本复核。

README 里的表达应满足两点：

1. 先讲人能听懂的话，再给术语名；
2. 术语必须能映射到仓库里的真实产物（如 `plan.md`、`docs/rfc.md`、`test-report.md`、`report-walkthrough.md`、`.legion/wiki/**`），不能停留在口号层。

为了避免 README 只是在措辞层“看起来更通俗”，每个术语还必须满足最小检查项：

- **设计门禁**：读者能直接看出“为什么不能先写代码后补设计”，并知道对应产物是 `plan.md` / `docs/rfc.md`
- **分层验证**：读者能直接看出“不是一条命令证明一切”，并知道至少对应安装校验与任务级验证证据两层
- **证据化汇报**：读者能直接看出“汇报必须带证据入口”，并知道对应产物是 `test-report.md` / `report-walkthrough.md` / `pr-body.md`

### 5. 文档与 skill 口径更新

- `README.md`、`docs/legionmind-usage.md`：去掉 playbook 与 wiki 并列的持久层描述，改成“跨任务知识统一进 wiki”。
- `skills/legion-docs/SKILL.md` 与 `references/REF_SCHEMAS.md`：不再把跨任务复用规则路由到 `.legion/playbook.md`；统一改路由到 `.legion/wiki/decisions.md` / `patterns.md` / `maintenance.md`。
- `skills/legion-wiki/SKILL.md` 与 references：明确声明其拥有 former playbook-style writeback 的收口职责，并补充如何分类到 decisions/patterns/maintenance。
- `skills/spec-rfc/references/TEMPLATE_RESEARCH.md`：将“证据可来自 `.legion/playbook.md`”改为“证据可来自 `.legion/wiki/**` 的当前知识页”，避免模板继续暗示旧概念。
- `.opencode/agents/legion.md`：保持 agent 壳性质，但若提及 wiki，应只承认 unified wiki layer，不再并提 playbook。

### 6. `.legion/playbook.md` 迁移策略

本 RFC 的目标状态是：**仓库不再把 `.legion/playbook.md` 当成 durable current concept 使用**。

执行上采用一次性收敛：

1. 在 `.legion/wiki/` 下建立最小需要的页面（至少 `index.md`、`patterns.md`，按实现需要补 `decisions.md`、`maintenance.md`、`log.md`）。
2. 将现有 `.legion/playbook.md` 的“CLI should stay thin”迁入 `.legion/wiki/patterns.md`，保留来源任务与边界说明。
3. 全仓文档与 skill 统一改口径，去除把 playbook 当成现行知识层的描述。
4. 删除 `.legion/playbook.md`，避免继续保留平行 durable 概念。

如果实施阶段发现必须短暂保留兼容提示，允许在同一提交中使用一个**非 durable 的迁移说明**替代直接删除，但该说明不能继续被任何文档声明为知识层真源，且必须附带明确删除时机。默认优先直接删除。

## 数据模型 / 接口

### 1. 统一 wiki 的最小接口约定

`legion-wiki` 写回时，跨任务 durable 结论按以下接口落点：

| 输入结论类型 | 输出页面 | 最小字段 / 结构 |
|---|---|---|
| 当前有效规则 | `decisions.md` | 结论、原因、适用范围、来源任务 / 文档 |
| 可复用约定 / 模式 | `patterns.md` | 模式名、背景、做法、适用边界、陷阱、来源 |
| 迁移债务 / 不确定项 | `maintenance.md` | 项目、现状、缺口、后续动作、责任来源 |
| 任务级综合结果 | `tasks/<task-id>.md` | metadata、outcome summary、reusable decisions、raw links |

### 2. former playbook 条目映射约束

- 若条目含“适用边界 / 陷阱 / 最小示例”，默认按 pattern 存储。
- 若条目含“必须 / 禁止 / 当前规则”，默认按 decision 存储。
- 若无法稳定判定，先进入 maintenance，再由后续任务补分类；不要为了迁移而制造错误结论。

### 2.5 本任务的 residual `playbook` 允许矩阵

为避免验证阶段出现“删太少 / 删太多”的主观判断，本任务按文件类别定义允许矩阵：

| 文件类别 | 允许继续出现 `playbook` 吗 | 允许语义 |
|---|---|---|
| 当前真源文档：`README.md`、`docs/legionmind-usage.md`、`skills/legion-docs/**`、`skills/legion-wiki/**`、`skills/spec-rfc/references/TEMPLATE_RESEARCH.md`、`.opencode/agents/legion.md`、新建 `.legion/wiki/**` | **否** | 不得再把 `playbook` 写成 Legion 的现行 durable artifact / 路径 / writeback 目标 |
| 当前任务 raw docs：`.legion/tasks/merge-playbook-into-wiki/**` | **是** | 允许作为迁移对象、历史术语、RFC / review / report 上下文 |
| 历史任务 raw docs：`.legion/tasks/**`（不含当前任务） | **是** | 允许保留历史事实，不要求本任务全量改写 |
| 历史研究 / 设计讨论文档：`docs/skill-split-plan.md`、`docs/legion-context-management-raw-wiki-schema.md` | **是** | 允许描述历史方案比较或旧设计讨论 |
| 与 Legion durable artifact 无关的泛化英文用法 | **是** | 例如“debug playbook”这类普通表达，但不得指向 `.legion/playbook.md` |

因此，本任务的验证目标不是“仓库中完全没有 playbook 这个词”，而是**当前真源不再把 playbook 当作活跃概念**。

### 3. 兼容策略

- **文档兼容**：允许历史设计文档继续提到 playbook，前提是它们明确标注为历史说明，不被当作当前真源。
- **路径兼容**：不为 `.legion/playbook.md` 提供长期兼容路径；当前任务目标就是取消该 durable 概念。
- **init 兼容**：`init` 行为不变；wiki 页面仍由后续 writeback 按需建立。

## 错误语义

本任务是文档/知识层迁移，不涉及运行时重试协议，但需要定义实施期的失败处理：

1. **分类不确定**：如果某条 former playbook 内容无法确定应进 decisions 还是 patterns，视为可恢复错误；先写入 `maintenance.md`，不要删除源条目之前的证据引用。
2. **口径未收敛**：如果 README、usage、skills 仍存在互相矛盾的说法，视为阻塞错误；任务不可算完成。
3. **wiki 页面缺失**：若迁移目标页不存在，允许在本任务内创建最小页面；这不是 `init` 变更。
4. **删除过早**：若 `.legion/playbook.md` 已删但 wiki 未承接原内容，视为不可接受错误，需要在同一轮修复或回滚。

总体策略是 **fail closed**：宁可暂时把不确定项放进 `maintenance.md`，也不制造第二套模糊真源。

## 安全性考虑

虽然本任务主要是文档与知识层语义收敛，仍需考虑以下安全/稳健性：

1. **输入校验**：wiki 只接收来自已验证任务文档或明确当前规则的结论，避免把临时讨论、未审设计直接提升为 durable knowledge。
2. **权限边界**：schema 规则继续在 `skills/**` + `.opencode/**`；wiki 只保存总结，不复制规则全文，避免形成可被误读的第二套授权边界。
3. **滥用风险**：若任何任务都可随意把局部经验写成“全局规则”，会污染 wiki。应通过 `decisions vs patterns vs maintenance` 分类降低误提升风险。
4. **资源耗尽**：README 与 wiki 页面应保持摘要密度，不粘贴大段 raw docs 或代码，避免文档膨胀后再次失去查询价值。

## 向后兼容、发布与回滚

### 向后兼容

- 历史文档里出现 playbook 字样可以保留为历史事实，但现行 README、usage、skills、agent 文案不得继续把它当作活跃概念。
- 不承诺 `.legion/playbook.md` 的长期兼容存在；这是一次有意识的概念收敛。

### 发布 / Rollout

建议按一个提交序列完成：

1. 更新 RFC 所定义的页面职责与 README 解释策略。
2. 创建 `.legion/wiki/index.md` 与 `.legion/wiki/patterns.md` 这两个本任务必需页；其余页只有在触发条件满足时才创建。
3. 将 existing playbook 内容迁入 `patterns.md`，并在 `index.md` 提供查询入口。
4. 更新 README、usage、`legion-docs`、`legion-wiki`、`TEMPLATE_RESEARCH.md`、agent 口径。
5. 删除 `.legion/playbook.md`。
6. 执行 repo 级验证，确认没有现行文档继续把 playbook 当 durable 概念。

### 回滚

若统一 wiki 方案在实施中造成明显理解退化或遗漏，可按以下顺序回滚：

1. 恢复 `.legion/playbook.md` 内容与路径；
2. 撤回 README / usage / `legion-docs` / `legion-wiki` / `TEMPLATE_RESEARCH.md` / agent 对 unified wiki 的表述；
3. 删除或降级本次新增的 wiki 迁移产物：至少移除 `index.md` 中新增的 playbook-migration 导航、从 `patterns.md` 删除迁入条目；若创建了 `decisions.md` / `maintenance.md` / `log.md` / `tasks/<task-id>.md` 且其中内容仅服务本次迁移，也一并删除或改为明确非权威状态；
4. 确保仓库不会同时保留“恢复后的 `.legion/playbook.md`”和“仍被 README / skill 当成现行唯一真源的迁移 wiki 条目”，避免回滚后出现双 active truth；
5. 重新回到 RFC 评审阶段，而不是带着半收敛状态继续实现。

回滚触发条件：

- former playbook 关键内容未被 wiki 承接；
- repo 中仍大量残留现行 playbook 路由；
- reviewer 认为 README 新叙事仍无法解释三术语的实际含义。

## 备选方案

### 方案 A：继续保留 playbook 与 wiki 分离

放弃原因：

- 需要持续解释“约定”和“知识”的区别，认知成本高；
- `legion-docs` 与 `legion-wiki` 仍会争夺跨任务条目归属；
- 实际条目常同时带有“惯例 + 当前结论”属性，边界很难稳定执行。

### 方案 B：强化 playbook，放弃 `.legion/wiki/**`

放弃原因：

- 仓库已为 wiki 定义 `index/log/decisions/patterns/maintenance/tasks/<id>` 的布局；
- 用单文件 playbook 承载导航、决策、模式、维护债务和任务摘要，会再次退化成难查询的大杂烩；
- 用户已明确选择“保留一个统一 wiki layer”，不是“把 wiki 改名回 playbook”。

### 方案 C（采纳）：只保留 unified wiki layer

采纳原因：

- 与现有 `legion-wiki` 布局和 writeback 规则一致；
- 能把 former playbook 条目按 `decisions/patterns/maintenance` 明确归类；
- 最符合“raw docs vs cross-task knowledge-layer boundary explicit”的约束。

## 验证计划

以下关键行为都必须映射到可检查结果：

1. **当前真源去双轨**
   - 验证：`README.md`、`docs/legionmind-usage.md`、`skills/legion-docs/**`、`skills/legion-wiki/**`、`skills/spec-rfc/references/TEMPLATE_RESEARCH.md`、`.opencode/agents/legion.md`、新建 `.legion/wiki/**` 中，不再出现把 playbook 当 Legion durable artifact / 路径 / writeback 目标的表述。
2. **历史材料保留边界**
   - 验证：`.legion/tasks/**` 历史任务与 `docs/skill-split-plan.md`、`docs/legion-context-management-raw-wiki-schema.md` 可保留 playbook 作为历史术语；验证脚本不得把这些文件算作失败。
3. **边界清晰**
   - 验证：现行文档仍明确 `.legion/tasks/**` 是 raw evidence，而 `.legion/wiki/**` 是跨任务知识层。
4. **README 可读性提升**
   - 验证：README 首次出现“设计门禁 / 分层验证 / 证据化汇报”时，均附 plain-language 解释与仓库产物映射，并满足第 4 节的最小检查项。
5. **最小 wiki 完成态落地**
   - 验证：`.legion/wiki/index.md` 与 `.legion/wiki/patterns.md` 存在；`decisions.md` / `maintenance.md` / `log.md` / `tasks/<task-id>.md` 仅在有内容触发时存在，不能因为布局模板被动生成空文件。
6. **former playbook 内容迁移成功**
   - 验证：`CLI should stay thin` 已进入 `.legion/wiki/patterns.md`，包含来源、边界、陷阱或等价摘要，并可从 `index.md` 导航到。
7. **不改 init 行为**
   - 验证：相关文档仍说明 `init` 只保证 `.legion/tasks/` 存在，wiki 由后续 writeback 按需建立。
8. **不保留双 durable 概念**
   - 验证：`.legion/playbook.md` 被删除，或仅保留非 durable 迁移说明且未被任何现行文档当真源引用。
9. **回滚可执行且对称**
   - 验证：RFC 中的 rollback 步骤明确涵盖恢复 `.legion/playbook.md`、撤回当前真源文案，以及删除/降级本次迁移产生的 wiki 条目与导航。

## 未决问题

1. `.legion/wiki/log.md` 是否在本次最小迁移中一并创建，还是只在首次真实 writeback 时创建？建议由实现阶段按最小必要性决定，不影响核心收敛。
2. `.legion/playbook.md` 是直接删除，还是保留一次性重定向说明文件再下一轮删除？默认建议直接删除；若 reviewer 更偏向温和迁移，可接受短期说明文件，但必须禁止其继续被定义为 durable 概念。

## 落地计划

### 文件变更点

1. `README.md`
   - 改写 playbook/wiki 描述为 unified wiki
   - 用直白语言解释三个术语，并映射到真实产物
2. `docs/legionmind-usage.md`
   - 统一路径与职责说法，删除 playbook 并列概念
3. `skills/legion-docs/SKILL.md`
   - 将跨任务复用规则落点从 `.legion/playbook.md` 改为 `.legion/wiki/**`
4. `skills/legion-docs/references/REF_SCHEMAS.md`
   - 更新目录结构、路由表与 playbook 段落，统一为 wiki
5. `skills/legion-wiki/SKILL.md`
   - 明确 former playbook-style conventions 归本 skill 收口
6. `skills/legion-wiki/references/*.md`
    - 补强页职责与 writeback 规则，使其覆盖 former playbook 的落点分类
7. `skills/spec-rfc/references/TEMPLATE_RESEARCH.md`
   - 把可引用证据路径从 `.legion/playbook.md` 改成 `.legion/wiki/**`
8. `.opencode/agents/legion.md`
    - 保持精简，但不再引用 playbook 作为现行层
9. `.legion/wiki/**`
    - 创建最小目标页并写入迁移后的 durable 内容
10. `.legion/playbook.md`
    - 删除，或在评审批准下改为一次性非 durable 迁移说明

### 验证步骤

1. repo 级检查现行文档中是否仍存在“playbook 与 wiki 并列”的定义。
2. 检查 README 是否在首次出现三术语时给出 plain-language 解释。
3. 检查 `legion-docs` 与 `legion-wiki` 的路由是否一致，不再互相矛盾。
4. 检查 `.legion/wiki/patterns.md` 是否承接了现有 playbook 的唯一 durable 条目。
5. 检查 `init` 叙事未被误改成预建 wiki skeleton。
6. 检查 `.legion/playbook.md` 不再被当前文档声明为知识层真源。
