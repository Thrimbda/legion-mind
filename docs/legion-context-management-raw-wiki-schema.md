# Legion 上下文管理：基于 raw / wiki / schema 三层模型的改进建议

> 历史设计说明：本文件不是当前真源。
> 当前工作流真源位于 `skills/legion-workflow/SKILL.md` 与 `skills/legion-workflow/references/SUBAGENT_DISPATCH_MATRIX.md`。

## 背景

本文整理对当前 Legion 上下文管理方式的观察，重点回答两个问题：

1. `plan.md` / `context.md`（更准确地说是 log）/ `tasks.md` 与 `legion.md`、`rfc.md`、`review-*`、`report-walkthrough.md`、`pr-body.md` 等文档之间是否存在重复；
2. 若借用 `llm-wiki` skill 的 `raw sources / wiki / schema` 三层模型来审视 `.legion/tasks/`，当前结构还有哪些可以改进的地方。

本文是**改进建议**，不是立即执行的迁移方案。

---

## 一、对当前结构的总体判断

当前 Legion 的上下文管理并不是“设计错了”，而是已经自然形成了三类不同信息载体，但它们的层级边界还不够清楚：

- `.legion/tasks/<task-id>/**` 在保存任务级原始证据；
- `skills/legionmind/**`、`.opencode/agents/legion.md`、命令说明等在定义规则与流程；
- 但缺少一个真正的 **wiki / synthesis 层**，把跨任务的结论、当前有效规范、历史演进关系整理出来。

结果就是：

- 任务目录更像 archive，而不是可查询知识库；
- 当前规范与历史规范混在一起；
- `plan/log/tasks` 与 RFC / report / prompt 之间出现“有意重复 + 无意漂移”的混合状态；
- 回答“当前 Legion 是怎么工作的”时，容易被历史任务污染。

---

## 二、`plan / context / tasks` 与 RFC / agent docs 的重复，应该如何理解

我认为这里不该先按“文件名”来切，而应先按“面向什么角色”来切。

在这个体系里，人类默认不是实现者，而更像一个技术小组的 **tech lead**：

- 把握产品方向与技术方向；
- 关心目标、边界、取舍、风险、回滚与当前状态；
- 不希望被迫长期埋在实现细节、逐行 diff 或过程噪音里。

而 agent 才是主要执行者，它需要：

- 更细的流程约束；
- 更高频的状态同步；
- 更完整的设计与验证材料；
- 更适合 handoff / audit / rerun 的工作记录。

从这个角度看，重复不能只按“内容是否重复”判断，而要看：

> **是不是在为不同角色提供不同层级的信息。**

## 2.1 角色分层：哪些文件主要给 tech lead 看，哪些主要给 agent 看

| 文档 | 主要读者 | 应提供的密度 |
|---|---|---|
| `plan.md` | 人类 tech lead + agent | 高层契约：目标、问题、验收、范围、关键风险、设计入口 |
| `docs/rfc.md` | agent + 需要下钻的 tech lead | 第二层材料：方案细节、取舍、接口、迁移、回滚、验证 |
| `context.md`（建议改名 `log.md`） | agent 为主，人类次要 | 时间序列记录：发生了什么、为什么、下一步是什么 |
| `tasks.md` | agent 为主，人类只需快速扫进度 | 当前阶段、当前任务、完成状态 |
| `review-*` / `test-report.md` | agent + reviewer | 验证证据，不应充当主契约 |
| `report-walkthrough.md` / `pr-body.md` | 人类 tech lead / reviewer | 面向评审的摘要与决策入口 |
| `legion.md` | agent | 执行期操作守则与调度入口 |

如果按这个角色分层来理解，就会发现：

- `plan.md` 不是 mini-RFC，而是 **tech lead first 的任务契约**；
- `rfc.md` 不是重复 plan，而是 **进一步细化的设计材料**；
- `context.md` 如果继续保留这个名字，容易被误解成“什么都能往里塞的上下文袋子”；它实际上更像 **append-only log**；
- `tasks.md` 更像 agent 的状态板，而不是给人类做详细阅读的主文档。

## 2.2 合理重复：为不同角色服务的薄摘要

以下重复是合理的，但应该保持很薄：

- `plan.md`：给 tech lead 和 agent 共享的高层任务契约
- `rfc.md`：给 agent 实施、也给需要下钻的 tech lead 的细化设计真源
- `context.md`（建议改名 `log.md`）：给 agent 的过程日志、关键决策与 handoff
- `tasks.md`：给 agent 的当前执行状态机
- `review-*` / `test-report.md`：验证证据
- `report-walkthrough.md` / `pr-body.md`：重新面向人类 reviewer / tech lead 的交付摘要
- `legion.md`：orchestrator 执行时的 agent 操作守则

这类重复的健康形式是：

- `plan.md` 只保留 tech lead 需要持续把握的契约信息，并给出 Design Index 指向 `rfc.md`
- `rfc.md` 只展开 plan 不该承载的设计细节，而不重新承担“任务定义”职责
- `context.md` / `log.md` 只记录“本轮发生了什么 / 为什么 / 下一步是什么”
- `pr-body.md` 只复述 reviewer 需要知道的最小结论

也就是说，允许多个文件**薄引用同一个结论**，但不应多处各自展开同样的正文。

## 2.3 不合理重复：不同角色文档却在同一层重新展开同样内容

当前更大的问题是这些：

### 1. `plan.md`、`rfc.md`、`pr-body.md`、`report-walkthrough.md` 同时重写“任务故事”

例如 `task-brief-plan` 一类任务中，“plan-only”、“移除 task-brief”、“plan.md 是唯一任务契约”等结论，不仅存在于：

- `plan.md`
- `docs/rfc.md`
- `context.md`
- `report-walkthrough.md`
- `pr-body.md`

而且很多地方都写得比较重。这样的问题不是“多写了一份摘要”，而是：

- 面向 tech lead 的文档和面向 agent 的文档没有拉开层级；
- 原本应该在 RFC 中展开的东西，又回流到 plan / report / PR body；
- 原本只是交付摘要的文档，又重新讲了一遍详细背景。

更理想的状态是：

- `plan.md` 讲“为什么做、做到什么算完成、风险边界是什么”；
- `rfc.md` 讲“具体怎么做、为什么选这个方案、不选什么、怎么回滚”；
- `pr-body.md` 讲“请 reviewer 看什么、为什么值得看”；
- `report-walkthrough.md` 讲“这次任务实际交付了什么、如何验证”。

### 2. `legion.md` 和 skill references 同时在定义 agent 规则

当前 `legion.md` 既在说执行流程，也在说：

- 任务初始化 / 恢复顺序
- 风险分级
- 设计门禁
- subagent handoff 约束
- `.legion` 写回责任

而这些内容本质上也出现在 skill reference 或相关 schema 文档里。这样 `legion.md` 就容易变成第二套规则真源。

从角色上看，`legion.md` 的职责应该更窄：

- 它是 **agent 的运行时摘要**；
- 不是再完整解释一遍 schema、三文件职责与全部门禁细节。

### 3. 历史任务中的旧模型仍然高可见

仓库里仍能找到：

- `docs/task-brief.md`
- `Task Brief:` 链接
- 对 `taskBriefPath` 或旧 task-brief 模型的残留引用

这类内容作为**历史证据**存在没问题，但如果没有明确标成 historical / superseded，就容易被误读为现行模型。

## 2.4 关于 `context.md`：更准确的名字也许是 `log.md`

我认为这是一个值得认真考虑的命名问题。

`context.md` 这个名字的问题在于，它很容易让人和 agent 觉得：

- 这里可以放一切“也许以后有用”的上下文；
- 它像一个无边界的补充说明袋子；
- 它承担的是“记忆容器”而不是“时间序列记录”。

但从实际用途看，它更像：

- append-only 的任务日志；
- 记录每一轮做了什么、为什么、下一步是什么；
- 为 agent handoff、审计与续跑服务；
- 供人类在需要时快速扫最近进展，而不是长期精读。

因此，如果未来要进一步收紧职责，我会建议把概念甚至文件名向 `log.md` 靠拢。

### 若采用 `log.md` 这个名称，职责会更清楚

- `plan.md`：给 tech lead 的任务契约
- `rfc.md`：给 agent / 深度评审的详细设计材料
- `log.md`：给 agent 的过程日志与 handoff
- `tasks.md`：给 agent 的状态机与 checklist

这样比 `context.md` 更不容易误导人把它写成“大杂烩背景文档”。

## 2.5 我建议这四类核心文档分别长什么样

如果按“tech lead 看契约与方向，agent 看执行与细节”来设计，我会建议四个核心文档长成下面这样。

### A. `plan.md`：短、稳、面向 tech lead 的任务契约

**角色定位**：

- 第一读者：tech lead
- 第二读者：agent

**应该回答的问题**：

- 为什么做这件事？
- 做到什么算完成？
- 范围边界是什么？
- 主要风险和非目标是什么？
- 如果要下钻，看哪份 RFC？

**不应该承载**：

- 大段接口字段表
- 迁移步骤细节
- 测试矩阵
- 长篇方案比较
- 过程性噪音

**建议长度感**：

- 尽量控制在一屏到两屏内
- 让 tech lead 能快速读完并做方向判断

**示例**：

```markdown
# 将 Legion 收敛为 plan-only 模型

## 目标
将 `plan.md` 定义为唯一任务契约，移除 `task-brief.md` 的现行地位。

## 问题
当前任务契约分散在 `task-brief.md` 与 `plan.md` 两处，导致续跑和评审时反复切换真源。

## 验收标准
- [ ] 新任务不再依赖 `task-brief.md`
- [ ] `plan.md` 成为唯一人类可读契约
- [ ] 相关 prompts / commands / docs 口径一致

## 范围
- `skills/legionmind/**`
- `.opencode/agents/**`
- `.opencode/commands/**`

## 风险 / 非目标
- 风险：历史任务仍可能残留旧引用
- 非目标：本轮不做历史任务批量迁移脚本

## 设计入口
- RFC: `.legion/tasks/task-brief-plan/docs/rfc.md`

## 阶段
1. 设计收敛
2. 文档与 prompt 同步
3. 验证与交付
```

### B. `docs/rfc.md`：细化设计材料，给 agent 和需要下钻的 tech lead 看

**角色定位**：

- 第一读者：agent
- 第二读者：需要深入把关技术方案的 tech lead / reviewer

**应该回答的问题**：

- 具体怎么做？
- 为什么选这个方案？
- 不选什么，为什么？
- 风险怎么控？
- 怎么 rollout / rollback / validate？

**不应该承载**：

- 任务管理状态
- 每轮执行日志
- 过于操作化的 checklist（那是 `tasks.md` 的事）

**建议长度感**：

- 比 `plan.md` 明显更长
- 但仍应该是“可评审文档”，而不是实现手册全集

**示例**：

```markdown
# RFC：Plan-only 任务契约模型

## 背景
Legion 当前同时维护 `task-brief.md` 与 `plan.md`，造成双真源与提示词漂移。

## 决策
将 `plan.md` 升级为唯一任务契约；`rfc.md` 只在中高风险任务下承载详细设计。

## Alternatives
### Option A：继续保留 task-brief + plan
- 优点：迁移成本低
- 缺点：持续双真源

### Option B：直接 plan-only
- 优点：单入口、认知负担更低
- 缺点：需要同步 prompts / commands / docs

## 详细设计
- `plan.md` 固定问题、验收、范围、风险、设计入口
- `tasks.md` 只保留状态机
- `context.md`（未来可改名 `log.md`）只保留日志与 handoff

## Rollout / Rollback
- Rollout：先改 schema 与 prompts，再改 usage docs
- Rollback：恢复旧字段与旧文案引用

## 验证
- 检查 repo 中不再出现 `taskBriefPath`
- 检查新任务只以 `plan.md` 为契约入口
```

### C. `log.md`（当前 `context.md`）：append-only 的过程日志

**角色定位**：

- 第一读者：agent
- 第二读者：想快速知道“最近发生了什么”的 tech lead

**应该回答的问题**：

- 这轮做了什么？
- 为什么这么做？
- 现在卡在哪？
- 下一步是什么？

**不应该承载**：

- 任务定义
- 详细方案设计
- 长篇 reviewer 摘要
- 机器可读任务状态

**建议长度感**：

- 按日期追加
- 每次记录尽量短，突出动作 / 原因 / next
- 更像日志，不像综述

**示例**：

```markdown
# plan-only 改造 - Log

## 2026-04-13

### 已完成
- 更新 `skills/legionmind/**`，移除 `task-brief.md` 的标准入口地位
- 同步调整 `.opencode/agents/**` 与 `.opencode/commands/**`

### 决策
- 决定不为 `task-brief.md` 做向后兼容
  - 原因：双真源会继续放大漂移

### 阻塞 / 风险
- 历史任务目录仍可能残留旧引用，但本轮不批量清理

### 下一步
- 跑 repo 级检索，确认 `taskBriefPath` 已清零
- 刷新 PR body 与 walkthrough
```

### D. `tasks.md`：给 agent 的状态板，而不是给人类的长文档

**角色定位**：

- 第一读者：agent
- 第二读者：只想快速确认“现在做到哪”的 tech lead

**应该回答的问题**：

- 当前阶段是什么？
- 当前任务是什么？
- 哪些已完成，哪些待办？

**不应该承载**：

- 长解释
- 设计理由
- 长段背景

**建议长度感**：

- 结构化、稀疏、可扫读
- 像状态板，不像项目说明书

**示例**：

```markdown
# plan-only 改造 - Tasks

## 快速恢复
**当前阶段**: 阶段 2 - 实现与同步
**当前任务**: 更新 commands 与 agent prompts
**进度**: 3/6 任务完成

## 阶段 1: 设计 ✅ COMPLETE
- [x] 收敛 plan-only 方向
- [x] 完成 RFC 与 review-rfc

## 阶段 2: 实现 🟡 IN PROGRESS
- [x] 更新 schema 文档
- [ ] 更新 commands 与 agents ← CURRENT
- [ ] 更新 usage docs

## 阶段 3: 验证 ⏳ NOT STARTED
- [ ] repo 级检索旧字段
- [ ] 刷新 report / pr-body
```

## 2.6 一个更清楚的阅读路径示例

### tech lead 的最小阅读路径

通常只需要：

1. `plan.md`
2. `pr-body.md` 或 `report-walkthrough.md`
3. 如风险较高，再下钻 `docs/rfc.md`
4. 如对验证有疑问，再看 `review-*` / `test-report.md`

### agent 的最小阅读路径

通常需要：

1. `plan.md`
2. `docs/rfc.md`（若有）
3. `context.md` / `log.md`
4. `tasks.md`
5. `review-*` / `test-report.md`（按需）

如果按照这条阅读路径来反推文档职责，就更不容易把四类文件写成同一个密度。

---

## 三、用 llm-wiki 视角重画 Legion 的三层模型

## 3.1 Raw Sources（原始证据层）

建议明确把以下内容视为 raw sources：

- `.legion/tasks/<task-id>/plan.md`
- `.legion/tasks/<task-id>/context.md`（建议未来考虑重命名为 `log.md`）
- `.legion/tasks/<task-id>/tasks.md`
- `.legion/tasks/<task-id>/docs/*.md`

它们的职责是：

- 保留任务现场
- 保留设计 / 审查 / 测试 / 报告证据
- 保留当时的术语、判断与边界

它们**不必天然适合快速回答“现在 Legion 应该怎么做”**。

## 3.2 Schema（规则层）

建议明确把以下内容视为 schema：

- `skills/legionmind/**`
- `.opencode/agents/legion.md`
- `.opencode/commands/legion*.md`
- 与 Legion 流程直接耦合的校验脚本与说明

这一层只负责定义：

- 当前规则是什么
- 哪些路径是标准入口
- 哪些字段 / 文件是 source of truth
- 什么时候允许写回、升级、越界、追问

schema 层不应该反复从历史任务中抽取事实；它应该是**当前有效规范**。

## 3.3 Wiki（综合知识层）

这是当前最弱的一层。

理想上，这一层应该负责：

- 总结跨任务可复用的结论
- 标记哪些规范已经 superseded
- 提供跨任务导航
- 给出“当前真相”的入口

目前 `.legion/playbook.md` 承担了一小部分这种职责，但还不够系统。

---

## 四、从 wiki 视角看当前 `.legion/tasks/` 的主要问题

## 4.1 任务目录更像 archive，而不像可查询知识库

当前 task 目录非常适合存证，但不太适合快速回答问题，例如：

- 哪个任务真正定义了 plan-only？
- 哪个任务引入了 subagent envelope？
- 哪个任务说明了旧 `task-brief` 已被淘汰？
- 哪些任务还属于旧 schema generation？

这些问题现在通常需要 grep 多个任务目录。

换句话说：

> 当前 `.legion/tasks/**` 更像 raw archive，而不是 index-first 的 wiki。

## 4.2 缺少“当前真相”和“历史真相”的显式分隔

例如：

- `task-brief-plan` 已经明确了 plan-only 是当前模型；
- 但历史任务中仍可看到 `task-brief.md`、Task Brief 链接、旧产物引用。

这本身不是问题，问题在于缺少明确标记：

- `historical`
- `superseded by`
- `schema-version`
- `current baseline`

没有这些状态字段，历史任务很容易污染“当前回答”。

## 4.3 任务之间缺少互链与关系字段

当前 task 目录更像彼此独立的文件夹，缺少跨任务关系：

- `related tasks`
- `supersedes / superseded by`
- `derived from`
- `affects`
- `status`

这会让跨任务查询成本很高。

## 4.4 task 内部虽然已有页型，但缺少统一摘要页

从 wiki 角度看，一个 task 目录里其实已经有多种页面类型：

- 契约页：`plan.md`
- 过程页：`context.md` / `log.md`
- 状态页：`tasks.md`
- 设计页：`docs/rfc.md`
- 证据页：`review-*` / `test-report.md`
- 交付页：`pr-body.md` / `report-walkthrough.md`

但缺少一个稳定的 **task summary / source summary**，把这些页面串起来。

因此理解一个 task 时，通常仍需要手工拼装。

---

## 五、建议的改进方向

## 5.1 不要再让 `.legion/tasks/**` 兼任 wiki

建议正式承认：

- `.legion/tasks/**` = raw sources
- 它负责存证
- 它不负责成为最佳查询入口

这能显著减少对 task 目录“既要详细又要好查”的双重压力。

## 5.2 补一个真正的 wiki / synthesis 层

最小建议有两种：

### 方案 A：强化 `.legion/playbook.md`

让它从“经验沉淀页”升级为更完整的 wiki 入口。

### 方案 B：新增 `.legion/wiki/`

建议结构：

```text
.legion/
  wiki/
    index.md
    log.md
    decisions.md
    patterns.md
    maintenance.md
    tasks/
      task-brief-plan.md
      llm-wiki-skill.md
      legionmind.md
```

含义：

- `index.md`：总导航
- `log.md`：新增 / 更新记录
- `decisions.md`：跨任务生效的当前决策
- `patterns.md`：可复用工作模式
- `maintenance.md`：待迁移 / 待清理 / 待确认事项
- `tasks/<id>.md`：每个任务的综合摘要页，链接回 raw sources

如果只做一件事，我最推荐补这一层。

## 5.3 为每个 task 增加一个稳定的 summary 页

这个 summary 页不应替代 raw docs，而应像 llm-wiki 的 source summary：

- task id
- 当前状态
- 风险级别
- schema generation / 模型代际
- 一段 outcome summary
- 关键可复用决策
- supersedes / superseded by
- 指向 `plan/context/tasks/rfc/review/report` 的链接

这样后续回答问题时可以走：

1. 先读 task summary
2. 再决定是否下钻 raw docs

而不需要每次直接读全套任务文件。

## 5.4 给历史任务加显式状态标记

建议至少为旧任务加一类轻量 metadata：

- `historical: true`
- `schema-version: pre-plan-only`
- `superseded-by: task-brief-plan`

不要求重写历史任务正文，但需要给 query 路径一个清晰信号：

> 这是历史快照，不是当前规范。

## 5.5 把“当前规范”从历史 task 中抽离出来

不应再依赖历史任务来回答“现在 Legion 应该怎么做”。

建议职责明确为：

- schema 层：定义规则
- wiki 层：总结当前有效结论
- raw 层：保存任务级证据

也就是说：

- `skills/legionmind/**` 负责规则真源
- `.legion/wiki/**` 或增强后的 playbook 负责当前知识总结
- `.legion/tasks/**` 只作为证据源

## 5.6 加 lint，而不是只靠记忆

从 llm-wiki 的 `lint` 思路看，可以加几类非常有价值的检查：

- 新任务是否缺少 summary 页
- 历史任务是否缺少 `historical / superseded` 标记
- `plan.md` 是否缺关键 section
- `tasks.md` 是否已完成但 phase 仍显示 in progress
- live schema / docs 是否重新引用旧 `task-brief`
- 某个重要决策是否只存在于 task raw docs，但没有进入 wiki/playbook

这些 lint 会比人工记忆可靠得多。

---

## 六、对重复问题的具体收口建议

## 6.1 建议保留的 source-of-truth 分工

| 信息类型 | 建议真源 | 其它位置允许出现的内容 |
|---|---|---|
| 当前 Legion 规则 | `skills/legionmind/**` + `legion.md` 的运行时摘要 | 只允许薄引用，不重复定义 |
| 面向 tech lead 的任务契约 | `plan.md` | PR/report 只保留高层摘要 |
| 详细设计 | `docs/rfc.md` | `plan.md` 只保留 Design Index |
| 面向 agent 的过程日志与决策 | `context.md`（建议未来改为 `log.md`） | PR/report 只摘结论 |
| 面向 agent 的状态与 current task | `tasks.md` | 其它地方只可引用进度摘要 |
| 测试 / 评审证据 | `docs/review-*` / `docs/test-report.md` | `log.md` / `context.md` 只记结论 |
| 跨任务当前有效知识 | `.legion/wiki/**` 或增强后的 playbook | task raw docs 不再承担该职责 |

## 6.2 `legion.md` 应更像运行时摘要，而不是第二套 schema

建议将其角色限制为：

- 执行入口
- 子 agent 调度顺序
- 调用约束
- 指向 skill references 的索引

尽量避免在 `legion.md` 中再次详细展开：

- schema 定义
- plan/context/tasks 结构规则
- subagent 协议全文
- RFC 档位细节全文

否则它会继续成为第二套 source of truth。

---

## 七、建议的查询路径

若未来补齐 wiki 层，推荐查询路径为：

1. **先看 schema**：当前规则是什么；
2. **再看 wiki index / decisions / patterns**：当前有效结论和相关任务入口；
3. **再看 task summary**：这个任务和当前问题的关系；
4. **最后按需下钻 raw docs**：`plan/log/tasks/rfc/review/report`（当前仓库文件名仍为 `context.md`）。

即：

```text
schema -> wiki index -> task summary -> raw task docs
```

而不是现在常见的：

```text
grep 全部 task 目录 -> 拼装结论 -> 再回忆哪份才是当前规范
```

---

## 八、建议的渐进式落地顺序

如果后续真要做，我建议按最小收益比推进：

### Phase 1：最小元数据化

- 给任务引入 `historical / superseded-by / schema-version` 这类轻量标记
- 把旧任务明确标成历史快照

### Phase 2：补 task summary

- 为任务建立规范化摘要页
- 让后续查询先读摘要，不直接读原始任务文档

### Phase 3：补 wiki 层

- 增强 `.legion/playbook.md`，或建立 `.legion/wiki/**`
- 统一沉淀 decisions / patterns / maintenance / index

### Phase 4：加 lint

- 检查 schema 漂移
- 检查旧模型回流
- 检查任务状态和 summary 缺失
- 检查关键结论是否已提升到 wiki

---

## 九、最终结论

当前 Legion 的主要问题不是 `plan/context/tasks` 这套机制本身，而是：

1. 缺少 **wiki / synthesis 层**；
2. 导致 `.legion/tasks/**` 同时承担 raw archive 与知识入口，查询成本过高；
3. 历史任务与当前规范混在一起，容易产生漂移和误读；
4. `legion.md` 与 skill references 之间存在部分规则重叠。

因此最值得做的改进不是继续给 task 目录加更多字段，而是：

- 明确 raw / wiki / schema 三层职责；
- 让 `.legion/tasks/**` 回归 raw sources；
- 给跨任务知识补一个真正的 wiki 层；
- 用 summary、状态标记和 lint，把历史证据与当前规范区分开。

这会比继续在 task 目录内部叠更多文档，更能降低查询成本与长期漂移。
