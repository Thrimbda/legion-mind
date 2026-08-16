# Review: RFC「Legion 迁移至 Pi 控制平面架构的评估、决策与路线图」

> **Reviewer**: review-rfc-sunny-penguin（独立 RFC 评审子代理）
> **评审日期**: 2026-08-16
> **评审对象**: `.legion/tasks/evaluate-pi-control-plane/docs/rfc.md`
> **对照基准**: `.legion/tasks/evaluate-pi-control-plane/plan.md`（契约）、`.legion/tasks/evaluate-pi-control-plane/docs/research.md`（证据底座）
> **评审性质**: 对抗审查；只评审，不改 rfc.md / research.md 正文

---

## Verdict: PASS

无 blocker 级 finding。本 RFC 的交付物是 design-only 的"评估 + 决策 + 路线图"，其 GO 决策的可逆性高（OpenCode 冻结线全程为可用退路，M3 前无新持久状态），且用户点名的四类候选阻塞风险（审批机制 doc-level、控制平面工程量、上游漂移、扩展共存 fail-closed）均已被 RFC 显式识别并绑定到对应阶段的设计门 / PoC，未构成"实现不可行、不可验证、不可回滚"。

3 条 major finding 为文档级缺陷（内部不一致 / 未核实 claim / 架构张力未调和），必须在进入 M3 / M4 各自设计门**之前**修正，但它们影响的是后续阶段的输入质量，而非本 GO 决策本身的成立性。4 条 minor 为措辞与颗粒度建议。

---

## Findings

### F1 [major] M3 退出条件引用了 M5 才存在的 API 层，验收入口未定义

- **位置**: rfc.md §8.2 路线图表 M3 行（退出条件："`POST /goals` 跑完全程"） vs M5 行（scope："Legion 自有 HTTP/SSE versioned API"）
- **理由**: M3 的 scope 为 Goal/Run 状态机 + SQLite store + SessionActor + 事件规范化 + 审批闸 + evidence ledger + attention queue，不含任何 HTTP/RPC API 层；versioned API 明确划在 M5。但 M3 退出条件要求 `POST /goals` 跑完全程——该端点在 M3 交付物中不存在。这造成两处后果：(a) M3 验收时"由什么调用"无定义，退出条件不可直接验收；(b) 暴露了隐藏的阶段间耦合——要么 M3 实际需要一个最小入口（CLI/裸 HTTP），要么部分 M5 scope 实质前置到 M3，而依赖表（M5 依赖 M3）没有反映这一点。
- **建议**: 二选一并写清——(a) M3 scope 增加"最小调用入口（CLI 或 loopback-only HTTP，非 versioned API）"，退出条件改为经该入口触发 goal 全程；或 (b) 退出条件改写为不依赖 HTTP 的形式（如"经进程内调用 / CLI 提交 goal"）。同时在 §8.2 注明 M5 versioned API 与 M3 最小入口的演进关系。

### F2 [major] 审批闸引用 `ctx.ui.confirm`，证据底座中无此 API —— 失真修正过程引入的未核实新 claim

- **位置**: rfc.md §6.2 审批闸（"extension `pi.on('tool_call')` 返回 `{block:true}` + `ctx.ui.confirm` / RPC `extension_ui_request/response` 桥"）
- **理由**: research.md §4.1 核实确认的只有 `pi.on('tool_call')` 可 `{block:true}` 与 RPC 的 `extension_ui_request/response` 桥；`ctx.ui.confirm` 这一具体 extension UI API 在 research 全文中不存在，属于 RFC 写作时引入的未经一手核实的 API 名。审批闸是整个安全模型（§10 权限分级）的唯一承载机制，在关键机制段写入未核实 API 名，会使 M3 设计门基于可能不存在的表面做工程量估算——这正是本任务立项时要消灭的"提案失真"在自身产物中的复现。不定为 blocker 的原因：审批机制整体已诚实标注 doc-level，且 RPC `extension_ui_request/response` 桥（已核实）单独即可支撑审批回路，机制成立性不依赖 `ctx.ui.confirm` 存在。
- **建议**: 删除或标注 `ctx.ui.confirm` 为"待 M3 设计门核实"；将审批闸表述收敛到已核实原语（`tool_call` block + RPC UI 桥），或显式写"extension 侧 UI 确认 API 表面待核实"。

### F3 [major] 「Legion 拥有 subagent 拓扑与预算」与 M4 以 pi-subagents 为第一版 backend 存在未调和的架构张力

- **位置**: rfc.md §6.1 职责边界（"Legion 拥有：……subagent 拓扑与预算"） vs §8.2 M4（"pi-subagents 作第一版 backend"）
- **理由**: pi-subagents 的拓扑与预算实际由 runtime 侧 extension 的 config（depth / spawns 上限）与 child 独立进程执行（research §4.3、S7），控制平面只能下发 config 并事后读取 `subagent-artifacts/`；spawn/wait 以 tool call 形式进入父 session 事件流（S7），但 child 内部事件不对控制平面可见。这与 §6.1 "裁决性分层"中 Legion 拥有 subagent 拓扑/预算/观测的强表述有出入。RFC 用"第一版 backend"暗示过渡，但未写：(a) 长期 backend 是什么（控制平面经 SDK/`AgentSessionRuntime` 自派生 child session？）；(b) 从第一版切换到长期版的判据或决策点。若 M4 设计门沿用了错误默认（把 pi-subagents 当终态），§6.1 分层即被架空。
- **建议**: 在 §6.1 或 M4 行显式注明：pi-subagents 为过渡 backend，其 config 即 Legion 下发的预算裁决；长期 backend 选项与切换判据列入 M4 设计门（或 M4 之后的独立任务）；M4 退出条件补充"父 session 事件流中 spawn/wait/结果回传三点可关联到 run/task id"。

### F4 [minor] 「M1/M2 没有未知技术风险」全称断言超出冒烟覆盖面

- **位置**: rfc.md §5.2 smoke-proven 段末
- **理由**: 冒烟仅覆盖 deepseek 单一 provider（research §5 注明 kimi 凭证未就绪）、Linux headless 单一环境、以及七项指定路径。"没有未知技术风险"严格成立范围是"已冒烟覆盖的面"。其他 provider 行为差异、非 headless 环境并未覆盖（RFC 自己在 §5.2 unknown 段也承认 macOS/Wayland 未验证）。措辞过强会削弱全文诚实分级的公信力。
- **建议**: 改为"在已冒烟覆盖的面上（deepseek provider、Linux headless、S1–S7 路径）未发现未解技术风险；其余面按 doc-level/unknown 分级"。

### F5 [minor] M3 单阶段七组件，颗粒度显著大于其余阶段且位于关键路径

- **位置**: rfc.md §8.2 M3 行
- **理由**: M3 含 Goal/Run 状态机、SQLite store、SessionActor、事件规范化、审批闸、evidence ledger、attention queue 七个组件，工程量比 M1/M2 大一个数量级，且 M4/M5/M6 全部依赖 M3——是关键路径上最粗的一粒。RFC 自身规则是"每阶段独立 Legion 任务、各自过设计门"，M3 任务的契约阶段自然可以再拆，因此不阻塞本 RFC；但路线图若不给拆分指引，M3 设计门将面对一次巨型 RFC，降低可审查性。
- **建议**: 在 §8.2 加一句指引：M3 任务契约阶段建议拆为 M3a（store + 状态机 + 事件规范化 + SessionActor）与 M3b（审批闸 + attention queue + evidence ledger），M4/M5 依赖点相应细化。

### F6 [minor] M5 切换 GitHub Actions 入口后，冻结的 OpenCode workflow 处置未明示

- **位置**: rfc.md §8.2 M5（"GitHub Actions 入口从 OpenCode action 切到 Pi"）、§14（"M5 完成前它仍是 GitHub Actions 入口的承载"）、§8.3（"OpenCode 冻结线全程保持可用"）
- **理由**: 切换入口后 `.github/workflows/opencode.yml` 是保留冻结（并存双入口）、停用、还是删除，未写明。结合 §8.3"全程可用退路"应推断为保留，但回滚步骤未给出该场景的显式动作（revert workflow 文件）。一句话即可消除歧义。
- **建议**: M5 scope 或 §8.3 补一句：切换以新增 Pi workflow + 保留 OpenCode workflow 冻结原样的方式进行，回滚 = revert 新增/改动文件。

### F7 [minor] 「M3 起增加 24h 无人值守」指标的归属模糊

- **位置**: rfc.md §8.2 验收指标段
- **理由**: "M3 起增加'无人值守连续运行 24h 无人工干预完成 ≥1 个真实 goal'作为稳定性信号"——"M3 起"既可读为 M3 退出条件的一部分（则 M3 验收需先跑 24h，与 §11 M3 测试项未列此项不一致），也可读为 M3 之后所有阶段的持续指标。两种读法对 M3 退出条件的影响差异大。
- **建议**: 明确归属：建议写成"M3 退出后、M4 启动前须满足"或"自 M3 起每阶段验收均须维持该信号"。

---

## 已评估、判定不构成 blocker 的候选风险（对抗检查记录）

| 候选阻塞风险 | RFC 处置 | 判定 |
|---|---|---|
| 审批机制完全 doc-level | 标注 doc-level；M1/M2（非交互 worker 与人工交互回路）不依赖审批闸；审批闸集中在 M3 且 M3 有独立设计门；§13 列为 Open Question | 不阻塞 GO。机制原语（`{block:true}` + RPC UI 桥）已核实存在，残余是工程量问题，属设计门范畴 |
| 控制平面工程量（M3 七组件） | 见 F5 | 颗粒度问题，可在 M3 契约阶段拆分，不使路线图不可行 |
| 上游漂移 | pin 版本 + CHANGELOG 复核（§4、§14 pin 清单含快照日期） | 处置与 research §6 风险一致，充分 |
| 扩展共存 fail-closed | 启动矩阵测试列为 M4 scope 与 §11 测试项 | 处置具体可验收，充分 |

## 契约 acceptance 对照（plan.md §验收标准）

| Acceptance | 状态 | 说明 |
|---|---|---|
| claims 逐一核实 + 对照表 + 出入显式记录 | 满足 | research §4 逐条核实，失真修正显式记录 |
| 隔离冒烟（skill 加载 / print-JSON / SDK 或 RPC / subagent 派生）+ 留档 | 满足 | S1–S7，命令、日志路径、关键输出摘录齐备；HOME/XDG/npm prefix 重定向 |
| 耦合清单四耦合点映射 | 满足（超额） | C1–C5，较契约多识别出 C5（repo 级 runtime 配置 / permission 语义 gap） |
| 三性结论 + 可行性三级分级 | 满足 | §5，分级与 research 证据一致（除 F4 措辞外） |
| 路线图分阶段 + scope/依赖/退出条件 + 与冻结线/scheduler 关系 | 基本满足 | 见 F1 / F3 / F5 / F6 |
| Legion 证据链（review-rfc / walkthrough / wiki / PR） | 待后续阶段 | 非本 RFC 内容范畴 |

## Alternatives / Rollback / 一致性核查（均通过）

- **Alternatives**: A（停留冻结线）、B（big-bang）、C（分阶段，选择）、D（oh-my-pi fork）、E（pi-web 内部 API 作 backend）共五项；D/E 为有 research 一手证据支撑的真实选项（route breaking、插件窄接口、fork 治理），非稻草人。
- **Rollback**: 有触发器、分阶段步骤、数据一致性边界（M3 前无新持久状态；M3 起新 store 独立可废弃），非只有标题；M5 场景补充见 F6。
- **既有决策一致性**: 与 `lock-scheduler-worker-opencode`（本 RFC 即其要求的独立设计门，M2 再过一次门）、「CLI 保持薄层」（控制平面走 scheduler 类独立项目路径）、「外部调度器只编排」（§5.1 哲学互补同构引用）一致；未发现冲突。

## Return Condition

PASS —— 交回 `legion-workflow`。建议作者在本任务的 walkthrough / PR 阶段之前以一次小修订消化 F1–F7（均为文档级修改，不改动评估结论与路线图骨架）；F1–F3 最迟必须在 M3 / M4 各自设计门启动前完成修正。
