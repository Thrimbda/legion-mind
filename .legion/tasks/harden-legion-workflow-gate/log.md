# Harden legion-workflow gate - 日志

## 会话进展 (2026-04-25)

### ✅ 已完成

- 复核 `using-superpowers` 的强制 skill 检查协议：1% 阈值、先 skill 后行动、子代理停止门、process-before-implementation、rationalization table。
- 复核当前 `legion-workflow`：已有入口门、阶段顺序、编排器边界、强制 wiki writeback，但缺少足够硬的行为塑形语句。
- 收敛本任务 contract：强化 skill 与入口文档，不改变 CLI 状态模型或新增执行模式。
- 使用 `explore` 子代理完成 RED baseline 评估，覆盖先探索、小改动、恢复不明确、自动推进误读、收口省略和子代理递归接管六类压力。
- 强化 `skills/legion-workflow/SKILL.md`：新增 1% 入口阈值、`SUBAGENT-STOP`、用户指令优先级、机械 Entry Checklist、三种执行模式 / 三种入口运行状态分离、真实加载阶段 skill 要求与 rationalization table。
- 澄清 references：矩阵只适用于 stable contract 之后；autopilot 只减少打扰不跳过阶段 / 证据 / 写回；low-risk / design-lite / fast track 仍需稳定 contract 与最小设计记录。
- 同步 `README.md`、`AGENTS.md`、`.opencode/agents/legion.md`：Legion-managed 多步骤工程工作在代码 / git / 文件探索、实现、追问或子代理派生前必须先过 `legion-workflow` mandatory first gate。
- 完成 targeted 一致性检查：搜索 `EXTREMELY IMPORTANT`、`SUBAGENT-STOP`、`Entry Checklist`、`mandatory first gate`、执行模式 / 入口运行状态等关键术语，无发现新增执行模式。
- 首轮 `verify-change` 发现第二执行模式命名不一致；已统一为 `已批准设计后的续跑模式` 并重新验证通过。
- 完成 `verify-change`、`review-change`、`report-walkthrough`，产出 `test-report.md`、`review-change.md`、`report-walkthrough.md` 与 `pr-body.md`。
- 完成 `legion-wiki` closing writeback：新增 task summary，并把“入口门禁先于探索”提升为 durable workflow pattern。
- 按验证反馈完成最小命名对齐：将 `SUBAGENT_DISPATCH_MATRIX.md` 与 `REF_AUTOPILOT.md` 中第二执行模式统一为 `已批准设计后的续跑模式`。
- 根据后续 review 反馈补强 `skills/legion-workflow/SKILL.md` 图示：将简单入口图扩展为入口状态机，补充 `mode selector`，新增阶段链与回退图，并写明风险选择、completion 条件、阻塞回退和 evidence 要求。

### 🟡 进行中

- 无。

### ⚠️ 阻塞/待定

- 无阻塞；用户已要求“动手更改”。本轮按延迟批准继续推进。

---

## 关键文件

- **`skills/legion-workflow/SKILL.md`** [completed]
  - 作用: Legion 工作流入口门禁与阶段语义真源
  - 备注: 已增强为 using-superpowers 风格强制门禁，并补充入口状态机 / mode selector / 阶段链与回退图
- **`.legion/tasks/harden-legion-workflow-gate/docs/eval-entry-gate.md`** [completed]
  - 作用: pressure baseline 与 after 预期记录
  - 备注: 区分三种执行模式与三种入口运行状态
- **`skills/legion-workflow/references/SUBAGENT_DISPATCH_MATRIX.md`** [completed]
  - 作用: 阶段派生顺序真源
  - 备注: 已澄清 stable contract 后适用，入口 runtime states 不是执行模式
- **`skills/legion-workflow/references/REF_AUTOPILOT.md`** [completed]
  - 作用: 自动推进语义
  - 备注: 已明确自动推进不等于跳过门禁 / 阶段 / 证据 / 写回
- **`skills/legion-workflow/references/GUIDE_DESIGN_GATE.md`** [completed]
  - 作用: 设计门禁风险分级
  - 备注: 已明确 low-risk/design-lite/fast track 仍需 stable contract 与最小设计记录
- **`README.md` / `AGENTS.md` / `.opencode/agents/legion.md`** [completed]
  - 作用: 入口叙事与安装后行为期望
  - 备注: 已同步 mandatory first gate 语义
- **`.legion/wiki/patterns.md` / `.legion/wiki/tasks/harden-legion-workflow-gate.md`** [completed]
  - 作用: closing writeback 的 durable workflow pattern 与任务摘要
  - 备注: 已记录三种执行模式与三种入口运行状态的区分

---

## 关键决策

| 决策 | 原因 | 替代方案 | 日期 |
|------|------|----------|------|
| 保留三种执行模式，不新增模式 | 当前问题是门禁强度，不是阶段链缺失 | 新增“强制门禁模式”会混淆入口状态与执行模式 | 2026-04-25 |
| 将 `bypass / restore / brainstorm` 定义为入口运行状态而非执行模式 | 它们发生在稳定 contract 前，不能与阶段工作流混为一谈 | 继续把所有路径都叫 mode | 2026-04-25 |
| 本轮不改 CLI | CLI 是薄工具层，不拥有 workflow 解释权 | 为门禁修改 CLI 命令 | 2026-04-25 |

---

## 快速交接

**下次继续从这里开始：**
1. 若继续修改此任务，先读 `docs/test-report.md` 中的命名一致性断言，避免重新引入模式名称漂移。
2. 若准备交付，使用 `docs/pr-body.md` 作为 PR 摘要起点。
3. 若后续新增自动化 pressure harness，把它链接回 `docs/eval-entry-gate.md` 的 baseline 场景。
4. 若后续继续修改图示，保持 Mermaid 简单语法，并继续区分入口运行状态与执行模式。

**注意事项：**
- 不要把三种入口运行状态误写成三种执行模式。
- 不要让自动推进语义削弱 contract-first / design gate / review / wiki writeback。
- 当前执行模式仍为三种：默认实现模式、已批准设计后的续跑模式、重型仅设计模式。
- 当前入口运行状态仍为三种：`bypass`、`restore`、`brainstorm`。

---

*最后更新: 2026-04-25 by Legion orchestrator*
