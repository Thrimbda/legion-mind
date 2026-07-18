---
name: legion-workflow
description: 适用于 Legion 管理仓库中的多步骤、不确定、中高风险或跨模块工程工作；普通只读请求与明确低风险微操作不触发。
---

# legion-workflow

Legion 的入口门、三档 profile 与阶段路由真源。CLI 只是文件工具；修改型 Legion 任务由 `git-worktree-pr` 包裹，它不是第四档 profile。

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

1. 无明确 task id/path：派生 `brainstorm` 收敛 contract。
2. 明确恢复：依次读 `plan.md -> docs/rfc.md -> log.md -> tasks.md`；contract 漂移则回 `brainstorm`。
3. contract 稳定后选恰好一种模式。修改型 Legion 任务先加载 `git-worktree-pr`，后续写入和阶段运行只在 worktree。
4. 阶段是能力与证据边界，不等同于必须创建 Agent。Lite 默认由当前执行者连续完成；Standard/Strict 的直接作者与直接 reviewer 必须分离，可使用新会话、内置 review 或独立 Agent。真正可独立并行的工作才派生子代理。
5. `spec-rfc -> review-rfc`、`engineer -> review-change` 的直接作者与 reviewer 不得复用同一判断上下文；Strict 的 verifier 也必须与实现判断分离。作者修订或验证重跑后必须重新执行本轮 reviewer，FAIL 按既有链回退。
6. 一旦派生，先运行 `scripts/subagent-name.mjs <role> --json --transport <codex|opencode|raw>`；`agentType` 选择职责，prompt、日志和交接回显 `displayName`。命名或实例 id 只作排障线索，不是身份 attestation。

## 三档 profile

`risk:low/medium/high` 默认映射 Lite/Standard/Strict；`profile:*` 或 `workflow:*` 只能向上覆盖。安全/权限、持久数据/schema、外部协议兼容、秘密/签名、破坏性动作、困难回滚必须先升级风险，不能用 LOC、文件数、持续时间或执行者自报降级。

- **Lite**：`engineer -> verify-change`；仅在真实设计分叉时补短 RFC，不强制独立 Agent。
- **Standard**：`engineer -> verify-change -> review-change`；公共配置/API、跨模块取舍或回滚歧义时前置 `spec-rfc -> review-rfc`，review 与作者判断分离。
- **Strict**：`spec-rfc -> review-rfc -> engineer -> verify-change -> review-change`；设计、验证和 review 均保留独立性与安全/数据视角。

`design_only` 的 Standard/Strict 为 `spec-rfc -> review-rfc`；Lite 可只交付稳定 contract。`bypass`、`restore`、`brainstorm` 是入口状态。代码判定以 `scripts/profile-policy.mjs` 为真源，阶段/独立性说明见 `references/SUBAGENT_DISPATCH_MATRIX.md`。

回退：`review-rfc FAIL -> spec-rfc`；`verify-change FAIL/实现缺口 -> engineer`；`review-change FAIL -> engineer`；设计实现不一致则 `spec-rfc -> review-rfc`。attention 为 `decide` 时暂停这些普通回退。

## 阶段与证据

- `brainstorm`：contract；`spec-rfc/review-rfc`：设计门；`engineer`：有界实现。
- `verify-change`：验证；`review-change`：交付判断；`report-walkthrough`：条件化评审摘要；`legion-wiki`：条件化长期真相写回。
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

只有适用阶段证据、delivery/wiki disposition 已满足，且 PR 到终态、review/checks 已处理、worktree 已删除、主工作区已刷新，才可声明 done。`summary`/`no-change` 是明确判定，不要求占位 walkthrough/Wiki。PR created、blocked handoff、保留 worktree或跳过刷新都不是完成。

## 条件参考

- 派生矩阵与命名：`references/SUBAGENT_DISPATCH_MATRIX.md`
- 风险/design-lite/RFC：`references/GUIDE_DESIGN_GATE.md`
- attention/五字段映射：`references/REF_HUMAN_ATTENTION.md`
- autopilot/重型设计：`references/REF_AUTOPILOT.md`
- CLI 命令索引：`references/REF_TOOLS.md`；参数以 CLI `--help` 为准
