# Linear Scheduler WI-01: Linear WI Contract and Scheduling Policy

## 目标

完成 `docs/linear-legion-scheduler/work-items/WI-01-linear-wi-contract.md`：把 RFC 中的 Linear Work Item 自动调度契约落成可直接给后续 scanner / runner / writeback 实现者使用的 policy 文档。

## 问题陈述

Linear + Legion scheduler 不能只凭一个 issue 存在就启动 agent。首个实现 WI 需要先定义 Linear 侧输入协议：issue description 必填结构、labels / states / blockers / resource hints 的职责边界、ready 与 skipped 判定、Linear Native Agent control-plane 对象与 Scheduler DB machine truth 的关系，以及 downstream blocker 何时算满足。若这层协议不清，后续 WI-02/03/04 会把状态机、scanner 和 worker prompt 建在隐含假设上。

## 验收标准

- [ ] 新增或更新 reviewer-facing policy 文档，提供可直接复制到 Linear issue description 的 WI 模板。
- [ ] 文档包含 label taxonomy，说明每个 label 的 owner、添加时机、移除时机，以及 labels 不是 scheduler truth。
- [ ] 文档包含可配置的 Linear state mapping 草案，不硬编码 workspace 状态名。
- [ ] 文档包含 ready / skipped 判定表，覆盖 blocker、contract、repo、human gate、active run、paused repo / project、resource conflict。
- [ ] 文档包含 blocker terminal-satisfied 判定表，覆盖 scheduler-run、manual done、closed-unmerged、cancelled / duplicate、inconsistent terminal state、admin override。
- [ ] 文档包含 Linear Native Agent 对象职责表，说明 `Issue.delegate`、AgentSession、Activities、Agent Plan、externalUrls、stop signal 与 Scheduler DB truth 的边界。
- [ ] 文档包含 terminal success / terminal non-success / blocker satisfied 术语表，明确非成功终态默认不解锁 downstream。
- [ ] 文档至少包含 5 个 example issue，说明哪些会被调度、哪些不会。
- [ ] `docs/linear-legion-scheduler/index.md` 能从入口链接到 WI-01 policy 成果。
- [ ] 留下 Legion 验证、review、walkthrough、wiki writeback 与 PR lifecycle 证据。

## 范围

- `.legion/tasks/linear-legion-scheduler-wi-01/plan.md`
- `.legion/tasks/linear-legion-scheduler-wi-01/tasks.md`
- `.legion/tasks/linear-legion-scheduler-wi-01/log.md`
- `.legion/tasks/linear-legion-scheduler-wi-01/docs/test-report.md`
- `.legion/tasks/linear-legion-scheduler-wi-01/docs/review-change.md`
- `.legion/tasks/linear-legion-scheduler-wi-01/docs/report-walkthrough.md`
- `.legion/tasks/linear-legion-scheduler-wi-01/docs/pr-body.md`
- `.legion/wiki/**`
- `docs/linear-legion-scheduler/**`

## 非目标

- 不实现 Linear API client、scheduler DB、scanner、worker runner、webhook server 或 GitHub integration 代码。
- 不创建真实 Linear labels、statuses、OAuth app、AgentSession 或 webhooks。
- 不改变已通过 review-rfc 的总体架构边界：Scheduler DB 是 machine truth；Linear Native Agent layer 只做 presentation/control plane。
- 不把 `contract:needs-review` 的 issue 自动送入 implementation worker；brainstorm-only run kind 仍是未来设计。
- 不修改 Legion workflow、git-worktree-pr envelope 或其他 WI 的执行顺序。

## 假设 / 约束 / 风险

- **假设**: `linear-legion-scheduler-rfc` 已通过 `review-rfc`，本任务属于 approved-design continuation mode，设计真源为 `docs/linear-legion-scheduler/rfc.md` 与 WI-01 文档。
- **假设**: 本 WI 的输出以 Markdown policy / template 为主，为后续 TypeScript 实现提供 contract，不引入运行时代码。
- **约束**: 修改型开发必须在 `.worktrees/linear-legion-scheduler-wi-01/` 内完成，并通过 PR lifecycle 收口。
- **约束**: 文档必须保持与 RFC 中 `contract:stable`、`isBlockerSatisfied()`、Legion evidence verifier、native agent control plane 的决策一致。
- **风险**: 过度产品化 issue 模板会让首版队列难以使用；本任务应保留 MVP 必填项与 optional hints 的边界。
- **风险**: labels / AgentSession 被误读为 truth；文档必须反复明确 coarse indexing / presentation-control 与 Scheduler DB truth 的差异。

## 设计摘要

- 采用 docs-only implementation：新增一份 WI-01 policy 成果文档，并从 index / WI-01 work item 链接。
- 模板使用 Markdown section 约束最小 contract，配合 label taxonomy 和 state mapping，供 Linear issue 创建者复制。
- Ready 算法以判定表呈现，明确每个 skip reason 和 owner，便于 WI-03 scanner 直接转为 parser / explain-skip 测试。
- Blocker satisfaction 以 Scheduler DB + delivery / evidence gate 为准，避免 PR open、Linear Done 或 AgentSession complete 误解锁 downstream。
- Native agent 对象只承担 delegate、session、activity、plan、externalUrls、stop signal 等人类可见控制面；所有 claim / attempt / lock / terminal 仍回到 Scheduler DB。

## 阶段拆分

1. **Contract / Envelope**: 进入 Legion workflow、收敛本 WI task contract、创建 worktree。
2. **Engineer**: 写入 WI-01 policy 文档，更新 index / work item 链接。
3. **Verify**: 做 Markdown / diff / acceptance checklist 验证。
4. **Review**: 执行 `review-change` 判断交付 readiness。
5. **Close**: 生成 walkthrough / PR body，执行 wiki writeback，完成 git-worktree-pr PR lifecycle。

## 设计来源

- `docs/linear-legion-scheduler/rfc.md`
- `docs/linear-legion-scheduler/work-items/WI-01-linear-wi-contract.md`
- `.legion/tasks/linear-legion-scheduler-rfc/docs/review-rfc.md`（PASS）

---
*Created: 2026-06-24*
