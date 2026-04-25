# RFC：对齐 Legion 入口语义

## 摘要 / 动机

当前仓库已经移除 CLI 的持久化 current-task 状态，但 README、AGENTS、usage、workflow skill 与 CLI 参考仍混用“活跃任务”“默认入口”“init 生成 wiki 索引”等旧语义。本文收敛一套可执行定义，使文档、skill 真源与最小实现预期重新一致，并避免再次把本地 CLI 误写成工作流真源。

## 目标与非目标

### 目标

- 统一 active task 的定义与恢复语义。
- 明确 `init` 是否负责创建 `.legion/wiki/` skeleton，并优先选择最小复杂度方案。
- 明确 `legion-workflow` 与 `skills/legion-workflow/scripts/legion.ts` 的主从关系。
- 为 README / usage 给出一句稳定的 playbook vs wiki 定义。

### 非目标

- 不重新引入 `config.json`、`ledger.csv` 或任何全局 current-task 注册表。
- 不把本 RFC 扩展为新的工作流模式改造。
- 不要求在本任务内重做 `.legion/wiki/**` 全量布局或新增复杂自动化。

## 第一原则

文档必须追随真实行为；不要为了保留旧措辞而扩展实现。

只有当某个实现改动能消除明确的运行时歧义，且比修正文档更小、更稳时，才允许修改运行时。

## 定义

- **active task**：当前请求明确恢复并继续推进的 `.legion/tasks/<task-id>/` 任务目录；它是会话态语义，不是仓库级持久单例。
- **playbook**：面向操作者的工作流说明与约定，描述“应该怎么做”。
- **wiki**：面向仓库当前真相的综合知识层，描述“当前系统是什么状态”。
- **入口包装层**：`legion.ts` 这类本地 CLI，仅暴露文件系统操作，不拥有工作流解释权。

## 方案设计

### 1. active task 语义

决策：移除 CLI current-task 状态后，`active task` 只按以下顺序判定：

1. 请求显式给出 `taskId` / `taskRoot` / 等价恢复上下文时，恢复该任务。
2. 当前请求被上游编排器明确标记为“恢复某个已有任务”且能唯一映射到某个 `.legion/tasks/<task-id>/` 目录时，恢复该任务。
3. 其余情况一律视为“当前请求没有可恢复任务”；不得隐式选择 task，应进入 `brainstorm` 或要求显式指定任务。

约束：任何文档都不得再把 active task 写成“CLI 自动记住的当前任务”或“仓库里天然存在的唯一活跃任务”。

禁用措辞：

- “CLI 自动记住当前任务”
- “仓库天然存在唯一 active task”
- “没有显式输入也可以 continue 到正确任务”

### 2. `init` 与 wiki skeleton

决策：本任务**不修改 `init` 实现**；`init` 继续只保证 `.legion/tasks/` 存在。README / usage / references 必须改写为真实行为，不再宣称 `init` 会生成 wiki skeleton。

原因：

- 当前没有证据表明运行时必须在 `init` 时依赖 `.legion/wiki/index.md`。
- 让 README 跟随真实行为比扩展 `init` 更小、更稳。
- 这避免把“入口语义收敛”任务扩成“wiki 初始化协议”任务。

保留信息：

- `.legion/wiki/**` 仍是目标布局与 writeback 落点。
- 若未来证明 `init` 预建最小 skeleton 有必要，应以独立任务重新设计，并显式说明幂等性与补齐策略。

### 3. `legion-workflow` 与 `legion.ts` 的关系

决策：`legion-workflow` 是入口门禁与阶段语义真源；`skills/legion-workflow/scripts/legion.ts` 是本地 CLI 适配器，只负责对 `.legion/**` 做初始化、读取和有限更新。

文档表达必须满足：

- 可以说 `legion.ts` 是 **本地管理命令入口**。
- 不可以说 `legion.ts` 是 **默认工作流入口**、**唯一主干真源** 或 **active task 注册表**。
- README / usage / `REF_TOOLS.md` 必须把“工作流入口语义”和“本地命令调用方式”拆开写。

推荐表达：

- `legion-workflow`：工作流入口门禁 / 阶段语义真源
- `skills/legion-workflow/scripts/legion.ts`：本地 CLI 调用方式 / 文件工具

### 4. playbook vs wiki 稳定定义

决策：README / usage 使用同一句定义——**playbook 记录操作者应遵循的工作流约定，wiki 记录跨任务仍然生效的当前仓库知识。**

## 备选方案

### 方案 A：保留“自动推断 active task”的模糊说法

不选原因：会继续让用户误以为 CLI 或仓库仍维护某种全局 current-task 状态，且无法给测试提供可验证判据。

### 方案 B：`init` 一次性生成完整 wiki 页面集

不选原因：与“最小初始化”目标冲突，会制造空文档噪音，也会把 `legion-wiki` 的按需写回价值前置到初始化阶段。

## 数据模型 / 接口

### 语义接口

- `init`
  - 输入：仓库根目录。
  - 输出约束：保证 `.legion/tasks/` 存在。
- `status --task-id <id>` / `log read --task-id <id>` / `tasks read --task-id <id>`
  - 兼容策略：继续以显式 `taskId` 为主；文档不得暗示存在隐式全局 current-task 回退。
- `legion-workflow`
  - 语义输入：用户请求、仓库状态、是否显式给出恢复目标。
  - 语义输出：对外只保留 `bypass` / `restore` / `brainstorm` 三种可观察路径。

### 文档兼容策略

- 原有“恢复活跃任务”表述保留，但统一解释为“恢复当前请求指向的既有任务目录”。
- 原有“init 生成 wiki 索引”表述必须删除或改写为“wiki 由后续 writeback 按需建立”。

## 错误语义

- 未显式给出任务且无法唯一判定恢复目标：视为可恢复错误；不进入隐式继续路径，转 `brainstorm` 或要求补充 `taskId`。
- `.legion/wiki/index.md` 缺失但仓库已初始化：不视为 `init` 错误；由后续 writeback 或单独 wiki 建设流程补齐。
- 文档仍宣称存在持久化 current-task：视为语义错误；通过文档 review 修正，不通过运行时兼容“兜底解释”。
- 任一路径写出 repo / `.legion` 边界：保持现有 `OUT_OF_SCOPE` 错误语义。

## 安全考虑

- `taskId`、`taskRoot` 与 wiki 路径说明必须强调边界校验，避免路径穿越。
- 不新增全局状态文件，避免隐藏状态被误用、污染或伪造。
- `init` 仅创建最小骨架，降低无意义文件扩张与批量写盘风险。
- 文档必须明确“显式任务优先”，减少误操作到错误任务目录的风险。

## 向后兼容、发布与回滚

- **向后兼容**：保留 `restore / active task` 两个术语，但重写定义；优先减少术语数量，不再对外突出 `continue`。
- **发布顺序**：先更新 RFC -> 再同步 README、AGENTS、usage、workflow/brainstorm skill、`REF_TOOLS.md`、wiki layout 参考；本任务不要求改 `init`。
- **回滚策略**：若文档收敛引起歧义，可直接回滚相关文档提交；不得回滚到“存在持久化 current-task”或“init 必然建 wiki”这两种旧说法。

## 验证计划

- **active task**：README、AGENTS、usage、`skills/legion-workflow/SKILL.md`、`skills/brainstorm/SKILL.md` 不再把 active task 写成持久化注册表状态。
- **init / wiki**：README、usage、`REF_TOOLS.md` 与实现行为一致；不再宣称 `init` 自动生成 wiki 索引。
- **入口关系**：README、usage、`REF_TOOLS.md`、`skills/legion-workflow/SKILL.md` 明确区分 workflow 真源与 CLI 调用入口。
- **playbook vs wiki**：README 与 usage 各至少出现一次完全一致的一句话定义。
- **禁用措辞**：关键文档 grep 不再出现“默认入口”指代 CLI、“CLI 自动记住当前任务”、“init 生成 wiki 索引”这类旧语义。

## 未决问题

- 无；本 RFC 已将最小复杂度方案定为“收敛文档与 workflow 语义，不扩展 init 实现”。

## 落地计划

### 变更点

- `README.md`：收敛 active task、init、CLI 与 playbook/wiki 表述。
- `AGENTS.md`：把“没有活跃任务”改写为不依赖持久状态的入口判定语义。
- `docs/legionmind-usage.md`：统一模式说明与最小初始化说明。
- `skills/legion-workflow/SKILL.md`：重写 restore / active task / 入口真源描述。
- `skills/brainstorm/SKILL.md`：把“没有 active task”解释为“当前请求未恢复到既有任务目录”。
- `skills/legion-workflow/references/REF_TOOLS.md`：去掉“默认入口”措辞，改成“本地 CLI 调用方式”；同步 `init` 真实行为说明。
- `skills/legion-wiki/references/REF_WIKI_LAYOUT.md`：补一句“这是目标布局，不等于 init 默认落盘集合”。

### 验证步骤

1. 逐文件检查关键术语是否收敛：active task、restore、default entry、init、playbook、wiki。
2. 运行 `init` 并确认实现仍只创建 `.legion/tasks/`，且文档不再声称更多行为。
3. 人工复核 README 与 usage：同一概念不得出现两套定义。
