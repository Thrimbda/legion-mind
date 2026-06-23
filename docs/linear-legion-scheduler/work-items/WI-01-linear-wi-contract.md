# WI-01: Linear WI contract and scheduling policy

## 目标

定义 Linear Work Item 的自动调度规范：什么样的 issue 可以被 agent 调度、状态如何流转、labels / blocker / resource hints 如何表达、哪些情况必须人工介入。

## 背景

调度器不能只看到一个 Linear issue 就启动 agent。自动执行至少需要稳定 contract、明确 repo / area、可验证验收标准、风险提示和依赖关系。这个 WI 先把 Linear 侧协议定下来，后续 scanner、runner、writeback 都以它为输入。

## 范围

- Linear issue template。
- Label taxonomy。
- Scheduler eligibility policy。
- Linear state mapping 配置草案。
- Blocker / dependency 使用规则。
- Resource hint 规则：`repo:*`、`area:*`、`mutex:*`。
- 人工 gate 规则：`agent:needs-human`、`contract:needs-review`。

## 非目标

- 不实现 Linear API client。
- 不创建真实 Linear labels / statuses。
- 不实现 scheduler DB。
- 不决定所有产品优先级规则。

## 依赖

无。

## 设计要求

### Issue template

至少包含：

```md
## Goal
## Acceptance Criteria
## Scope
## Out of Scope
## Dependencies / Blockers
## Repo / Package
## Risk Level
## Verification
## Delivery Notes
```

### Required labels

- `agent:ready`
- `agent:queued`
- `agent:running`
- `agent:blocked`
- `agent:needs-human`
- `contract:stable`
- `contract:needs-review`
- `risk:low|medium|high`
- `repo:<name>`
- `area:<name>`
- `mutex:<name>`

### Eligibility rule

WI 可调度必须满足：

```text
candidate Linear state
AND agent:ready
AND contract:stable
AND no unresolved blockers
AND no agent:needs-human
AND repo mapping exists
AND not already active in scheduler DB
```

允许后续新增 brainstorm-only 模式，但 MVP 不应把 contract 补全和实现自动跑混在同一条路径里。

### Blocker terminal-satisfied rule

Downstream WI 不能只因为 blocker 在 Linear 中显示 Done 就启动。实现任务必须使用 scheduler 的 `isBlockerSatisfied()`：

- 有 scheduler run 的 blocker：只有 run `done` 且通过对应 delivery gate 才算满足。
- 无 scheduler run 的 blocker：Linear Done 可视作人工完成，但不能带有 `agent:queued` / `agent:running` / `agent:blocked` / `agent:needs-human`。
- Closed-unmerged / cancelled / duplicate 默认不满足，除非 admin 显式 ignore 并写 audit event + Linear comment。
- PR open / in review 不满足。

## 验收标准

- [ ] 有一份 Linear WI 模板，可直接复制到 Linear issue description。
- [ ] 有 label taxonomy，并说明每个 label 的 owner、添加时机、移除时机。
- [ ] 有 state mapping 配置草案，不硬编码某个 workspace 的状态名。
- [ ] 有 ready / skipped 判定表，覆盖 blocker、contract、repo、human gate、active run。
- [ ] 有 blocker terminal-satisfied 判定表，覆盖 scheduler-run、manual done、closed-unmerged、cancelled、inconsistent state。
- [ ] 有至少 5 个 example issue，说明哪些会被调度、哪些不会。

## 验证

- 文档 review：scanner implementer 能仅凭本 WI 写出 eligibility parser。
- 人工 walkthrough：拿一个 5-node Linear DAG 示例手算 ready / skipped 结果，与 policy 一致。

## 风险

- **过宽**: `agent:ready` 过于宽松会启动 contract 不完整的任务。缓解：MVP 必须要求 `contract:stable`。
- **过窄**: 过多必填项导致队列无法运行。缓解：用 skipped reason report 指导补字段。
- **workspace 耦合**: Linear state 名字可配置，不能写死。
