# Linear + Legion Scheduler RFC and Work Items

## 目标

为“Linear 作为 WI 队列与依赖图、Legion 作为单 WI 执行协议”的自动调度器产出一份可评审的总体 RFC，并把后续实现拆成不超过 10 个合理粒度的 Work Items，写入 `docs/linear-legion-scheduler/`。

## 问题陈述

用户希望认真建设一个调度器：当一个 Linear Work Item 完成后，系统自动扫描不被 blocker 阻塞、且工程资源不冲突的可并行 WI，启动 agent 执行，并持续推进直到项目完成。前一轮讨论已经明确了高层边界：Linear 管“哪个 WI 该跑”，Legion 管“这个 WI 如何正确完成”。当前缺口是把这个方向固化为详细技术设计，并把此前过细的 20 个 WI 合并成可执行、不过粗也不过细的实现任务集。

## 验收标准

- [ ] 新增总体 RFC，详细覆盖架构、状态机、数据模型、ready 计算、Legion 嵌入、PR lifecycle、并发锁、失败恢复、权限安全、可观测性、rollout / rollback 和实施里程碑。
- [ ] RFC 通过 `review-rfc` 对抗审查；若 FAIL，迭代 RFC 直到 PASS。
- [ ] 在 `docs/linear-legion-scheduler/work-items/` 下写入不超过 10 个 WI 文件，每个文件包含目标、范围、依赖、验收、验证、风险和非目标。
- [ ] `docs/linear-legion-scheduler/index.md` 能作为 reviewer 入口，链接总体 RFC 与全部 WI。
- [ ] `.legion/tasks/linear-legion-scheduler-rfc/**` 留下 plan、research、RFC、review、walkthrough、PR body 和 wiki writeback 证据。
- [ ] 本任务只交付设计与 WI 文档，不实现调度器运行时代码。

## 假设 / 约束 / 风险

- **假设**: 目标调度器首版以 TypeScript / Node.js 实现，使用 Linear GraphQL API / `@linear/sdk`、GitHub API / `gh` 或 SDK、Postgres 类持久化存储；具体依赖在实现阶段可通过 RFC 约束微调。
- **假设**: 每个 Linear WI 映射为一个独立 Legion task，并由 worker 进入 `legion-workflow`；scheduler 不直接替代 Legion 阶段链。
- **约束**: 本仓库已有模式说明根 `docs/` 不作为 LegionMind 当前真源；本任务按用户显式要求在 `docs/linear-legion-scheduler/` 创建 proposal/design 子目录，避免改写 README 当前真源叙事。
- **约束**: 本任务是重型仅设计模式，阶段链为 `spec-rfc -> review-rfc -> report-walkthrough -> legion-wiki`；不进入 `engineer` 实现调度器。
- **约束**: 因会写入仓库文档，必须在 `.worktrees/linear-legion-scheduler-rfc/` worktree 中完成并通过 PR lifecycle 交付。
- **风险**: 设计容易把 Linear、GitHub、Legion、scheduler DB 的职责混在一起；RFC 必须明确真源边界和幂等规则。
- **风险**: 过度自动化可能绕过 Legion contract / review / PR lifecycle；RFC 必须把“不直接让 scheduler 改代码”写成硬边界。

## 要点

- **Linear**: 队列、依赖、优先级、人机协作状态。
- **Scheduler DB**: run、attempt、lock、event、idempotency 的机器真源。
- **Legion**: 每个 WI 的 contract、设计门、实现、验证、review、walkthrough、wiki writeback。
- **GitHub PR**: 代码交付、checks、review、merge 终态。
- **Docs deliverable**: `docs/linear-legion-scheduler/` 作为本调度器提案的 reviewer-facing 文档目录。

## 范围

- `.legion/tasks/linear-legion-scheduler-rfc/plan.md`
- `.legion/tasks/linear-legion-scheduler-rfc/log.md`
- `.legion/tasks/linear-legion-scheduler-rfc/tasks.md`
- `.legion/tasks/linear-legion-scheduler-rfc/docs/research.md`
- `.legion/tasks/linear-legion-scheduler-rfc/docs/rfc.md`
- `.legion/tasks/linear-legion-scheduler-rfc/docs/review-rfc.md`
- `.legion/tasks/linear-legion-scheduler-rfc/docs/report-walkthrough.md`
- `.legion/tasks/linear-legion-scheduler-rfc/docs/pr-body.md`
- `.legion/wiki/**`
- `docs/linear-legion-scheduler/**`

## 非目标

- 不实现 scheduler 服务、worker、数据库 schema migration、Linear webhook server 或 GitHub integration 代码。
- 不创建真实 Linear labels、statuses、OAuth app 或 webhooks。
- 不把 root `docs/` 重新定位为 LegionMind 当前真源；这里只新增一个明确命名的调度器设计提案目录。
- 不承诺完全无人 review 自动 merge；设计只允许在仓库保护规则满足时跟进 auto-merge。
- 不修改 Legion workflow 的现有阶段规则或 git-worktree-pr envelope 语义。

## 设计索引 (Design Index)

> **Design Source of Truth**: [`docs/linear-legion-scheduler/rfc.md`](../../../docs/linear-legion-scheduler/rfc.md)；Legion 审查入口为 [`docs/rfc.md`](docs/rfc.md)。

**摘要**:
- Scheduler 通过 reconcile + webhook 构建 Linear WI dependency graph，找出 ready 且资源不冲突的 WI，claim 后启动独立 worker。
- Worker 的第一动作是恢复或创建对应 Legion task，进入 `legion-workflow`，并在需要改仓库时使用 `git-worktree-pr` envelope；scheduler 只追踪 run / PR / Linear writeback，不替代 Legion 阶段。
- 验证策略以文档审查为主：RFC heavy + review-rfc PASS + WI 文件人工可读检查 + diff 检查。

## 阶段概览

1. **Phase 1** - 任务契约物化、worktree envelope 准备、现状摸底。
2. **Phase 2** - 撰写总体 RFC 与 `docs/linear-legion-scheduler/work-items/` WI 文件。
3. **Phase 3** - 执行 `review-rfc`，按审查意见迭代至 PASS。
4. **Phase 4** - 生成 walkthrough / PR body，执行 wiki writeback，并通过 PR lifecycle 交付。

---
*Created: 2026-06-23 | Updated: 2026-06-23*
