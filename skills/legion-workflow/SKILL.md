---
name: legion-workflow
description: 适用于 Legion 管理仓库中的多步骤、不确定、中高风险或跨模块工程工作；普通只读请求与明确低风险微操作不触发。
---

# legion-workflow

Legion 的入口门、三种模式与阶段链真源。CLI 只是文件工具；修改型 Legion 任务由 `git-worktree-pr` 包裹，它不是第四种模式。

默认中文交接和文档；命令、路径、字段、错误原文保持原样。

## 入口三层

先按请求本身分类，不以“先探索再判断”规避分类：

| 路径 | 条件 | 行为 |
|---|---|---|
| 普通路径 | 不改代码、运行时配置、协议/schema 或持久状态：回答、解释、总结、状态检查、只读审阅/诊断、给命令、不改变行为的文档整理 | 不加载本 skill，不创建 Legion task/worktree；直接完成；复杂只读工作可派生已命名的只读 subagent |
| 明确微操作 | 同时满足：目标与位置明确；无设计分叉；低风险；不涉及安全、数据、外部合约或跨模块；一个有界检查可验收 | 不启动 Legion；直接实施并验证。条件失效时停止并升级 |
| Legion 路径 | 改变代码/行为且多步骤；目标/scope/验收不稳；中高风险；跨模块；修改 workflow/schema；需要 RFC、多角色或 PR lifecycle | 任何探索、git、追问、写入或派生前先加载本 skill |

用户显式要求使用或 bypass Legion 始终优先；“快点”“直接改”“autopilot”不是 bypass。普通路径和明确微操作发生在 Legion 接管前，不是执行模式。

相邻边界：只整理安全政策文档的排版且不改含义，走普通路径；改变政策约束、数据处理规则或外部承诺，走 Legion 路径。

## SUBAGENT-STOP

被派生的阶段子代理不重跑入口、不递归派生 workflow，只按收到的 contract、scope、风险、设计和验收完成本阶段。信息缺失、不稳、越界或与设计门冲突时停止并升级；不得猜 task 或改写模式。

## 接管与恢复

1. 无明确 task id/path：加载或派生 `brainstorm` 收敛 contract。
2. 明确恢复：依次读 `plan.md -> docs/rfc.md -> log.md -> tasks.md`；contract 漂移则回 `brainstorm`。
3. contract 稳定后选恰好一种模式。修改型 Legion 任务先加载 `git-worktree-pr`，后续写入和阶段运行只在 worktree。
4. 每个阶段必须真实加载对应 skill 或派生对应子代理，不能凭记忆模拟。
5. 派生前必须运行 `scripts/subagent-name.mjs <role> --json --transport <codex|opencode|raw>`；`agentType` 选择已注册职责，prompt、日志和交接回显 `displayName`，仅当 transport 有独立实例标识字段时才传 `transportId`。命名失败不得派生。

## 三种模式

- **default implementation**
  - 低风险：`engineer -> verify-change -> review-change -> report-walkthrough -> legion-wiki`
  - 中高风险：`spec-rfc -> review-rfc -> engineer -> verify-change -> review-change -> report-walkthrough -> legion-wiki`
- **approved-design continuation**：`engineer -> verify-change -> review-change -> report-walkthrough -> legion-wiki`
- **heavy design-only**：`spec-rfc -> review-rfc -> report-walkthrough -> legion-wiki`

`bypass`、`restore`、`brainstorm` 是入口状态，不是模式。风险和设计门按需读取 `references/GUIDE_DESIGN_GATE.md`；运行时派生只认 `references/SUBAGENT_DISPATCH_MATRIX.md`。

回退：`review-rfc FAIL -> spec-rfc`；`verify-change FAIL/实现缺口 -> engineer`；`review-change FAIL -> engineer`；设计实现不一致则 `spec-rfc -> review-rfc`。attention 为 `decide` 时暂停这些普通回退。

## 阶段与证据

- `brainstorm`：contract；`spec-rfc/review-rfc`：设计门；`engineer`：有界实现。
- `verify-change`：验证；`review-change`：交付判断；`report-walkthrough`：评审摘要；`legion-wiki`：强制收口写回。
- 编排器维护 `plan.md`、`log.md`、`tasks.md`；阶段代理写 task `docs/`；wiki 阶段写 `.legion/wiki/**`。
- 完整判断、日志、diff 和证据落文件；会话与普通 subagent 交接只使用下述五字段格式，不复制 contract 或正文。

```text
结果: <displayName> · <stage> · <PASS|FAIL|BLOCKED|DONE> · attention:<level>
变化: <判断变化与关键发现合计最多三条>
风险: <仅当前阻塞项和残余风险；无则省略>
下一步: <一个自动动作；review/decide 时含唯一人类动作与停止点>
证据: <最多三个 repo-relative locator>
```

`review-rfc`、`verify-change`、`review-change` 先把完整 `## 会话注意力摘要` 写入各自证据，再按 `references/REF_HUMAN_ATTENTION.md` 唯一映射为五字段 handoff。投影冲突、风险无法无损收敛、`review/decide` 缺停止点或证据 locator 缺失时，不得推进。

## Attention 门

在下一阶段、普通回退或 PR 动作前先向用户投影 handoff：

- `none/skim`：按阶段结论继续或回退。
- `review`：可继续验证、review、walkthrough、wiki、commit、push、PR 和 checks；禁止 auto-merge、merge、cleanup、完成声明，直到复核落盘。
- `decide`：停止阶段转换、自动重试和受影响 lifecycle；等待唯一决定写入 `log.md` 并同步 `tasks.md`，再从声明阶段恢复。

四级定义、持久摘要与恢复规则只认 `REF_HUMAN_ATTENTION.md`；认知 claim 状态只认 `../verify-change/references/REF_COGNITIVE_VERIFICATION.md`。阶段 `Verdict: PASS/FAIL` 不得被 claim 状态替代。

## 修改型任务终态

进入 `git-worktree-pr` 后默认完成 commit、push 前 fetch/rebase、push、squash PR、auto-merge 尝试、checks/review、merge/closed/confirmed-abandoned 终态、worktree cleanup 与主工作区刷新；用户沉默不是停止条件。禁止直接提交或 push `master/main`，所有产物留在仓库内。

只有适用阶段证据和 wiki 已完成，且 PR 到终态、review/checks 已处理、worktree 已删除、主工作区已刷新，才可声明 done。PR created、blocked handoff、保留 worktree或跳过刷新都不是完成。

## 条件参考

- 派生矩阵与命名：`references/SUBAGENT_DISPATCH_MATRIX.md`
- 风险/design-lite/RFC：`references/GUIDE_DESIGN_GATE.md`
- attention/五字段映射：`references/REF_HUMAN_ATTENTION.md`
- autopilot/重型设计：`references/REF_AUTOPILOT.md`
- CLI 命令索引：`references/REF_TOOLS.md`；参数以 CLI `--help` 为准
