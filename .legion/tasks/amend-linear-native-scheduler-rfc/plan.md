# Amend Linear scheduler RFC with native agent gates

## 目标

把外部 review 中的 blocking points 纳入 Linear + Legion scheduler 设计，使 RFC 和 8 个 WI 在实现前明确 Linear Native Agent 交互层、成功/非成功终态、stop/cancel、session 幂等和 claim-time snapshot revalidation。

## 问题陈述

现有设计的四层真源边界总体正确，但仍把 Linear native agent 能力留成 open question，并且 Done gate 中 closed/abandoned wording 可能让实现者把 terminal non-success 误判为成功完成，导致下游错误解锁。

## 验收标准

- [ ] RFC 明确 Linear Native Agent layer 是 presentation/control plane，不是 scheduler truth plane，并覆盖 Issue.delegate、AgentSession、AgentActivities、Agent Plan、externalUrls、stop signal 与 app actor/permission 边界。
- [ ] RFC 将 run_terminal_success 与 run_terminal_non_success 拆开；Done 只代表成功，abandoned/canceled/closed-unmerged 默认不解锁 downstream。
- [ ] RFC 的 Scheduler data model 与 claim/outbox 协议补入 AgentSession 幂等映射、activity cursor、native stop、prompt context hash 和 claim-time snapshot revalidation。
- [ ] 8 个 WI 文档按现有拆分吸收 native agent、terminal gate、stop/cancel、lock waiting visibility、security/permission changes 等要求，不新增 WI-09。
- [ ] OpenCode-only worker runtime 与 Legion/git-worktree-pr hard gates 保持不变；修改后不重新引入多 runtime adapter。
- [ ] 完成设计验证、review、walkthrough 与 wiki writeback，并通过 PR 交付。

## 假设 / 约束 / 风险

- **假设**: 用户已认可外部 review 的方向，并授权按 Legion workflow 开始修改。
- **假设**: 本任务只修正文档/设计产物，不实现 scheduler runtime。
- **假设**: Linear Agent API/AgentSession 仍按 preview 能力建模，因此 RFC 需要把 native layer 做薄、可替换、可降级。
- **假设**: 已创建的 Linear issues 后续可按合并后的文档单独同步；本任务先确保 repo 内设计真源正确。
- **约束**: 开发必须在 .worktrees/amend-linear-native-scheduler-rfc 内完成，并走 PR lifecycle。
- **约束**: 文档以中文为主，保留技术 token / API 名 / 字段名。
- **约束**: 首版 worker runtime 固定 OpenCode-only。
- **约束**: Scheduler DB 仍是 machine truth，Linear native layer 不能替代 claim/attempt/lock/evidence/terminal gate。
- **约束**: 下游解锁必须通过 isBlockerSatisfied() 与 Legion evidence verifier。
- **风险**: Linear Agent API preview 未来变化导致字段名或行为调整；缓解：RFC 只固定语义与最小映射，具体 SDK 细节留给实现期验证。
- **风险**: native agent 范围膨胀拖慢 MVP；缓解：不新增 WI-09，只把最小 session/activity/control-plane 要求切入现有 WI。
- **风险**: 终态词汇再次混淆；缓解：统一使用 terminal_success / terminal_non_success / blocker_satisfied 三层术语。

## 要点

- 这不是重做 scheduler 架构，而是在已通过的四层边界上补强两个 reviewer 指出的硬点：Linear Native Agent 层与成功/非成功终态语义。
- Linear Native Agent 层只承载人类可见 delegation、session、activity、plan、external URL 与 stop/cancel 控制；Scheduler DB 继续承载 claim、attempt、lock、idempotency、evidence 与 terminal gate。
- `Done` 只允许表示 `run_terminal_success`；`abandoned`、`canceled`、`closed-unmerged`、`superseded` 等属于 `run_terminal_non_success`，默认不得释放 downstream。
- AgentSession / AgentActivities 必须通过 outbox 管理为幂等 side effect，避免 webhook handler 或 reconcile 重跑时创建重复 session / activity。
- Claim 前必须重新校验当前 issue / blockers / labels / contract snapshot，避免 scanner 用旧 snapshot 判定 ready 后启动错误 worker。

## 范围

- docs/linear-legion-scheduler/rfc.md
- docs/linear-legion-scheduler/index.md 如需调整推荐顺序/闭环说明
- docs/linear-legion-scheduler/work-items/WI-01..WI-08
- .legion/tasks/amend-linear-native-scheduler-rfc/** 任务证据
- .legion/wiki/** 收口更新

## 非目标

- 不实现 scheduler runtime、Linear API client、OpenCode launcher 或 GitHub PR tracker。
- 不新增第 9 个 WI；native agent 要求按 reviewer 建议切回现有 8 个 WI。
- 不把 Linear AgentSession 设计成 machine truth；它只能是 presentation/control plane。
- 不把 comments / labels / status 完全移除；它们仍可作为 coarse indexing 与兼容降级手段。
- 不恢复 OpenClaw / Codex / custom runtime adapter；首版仍是 OpenCode-only。
- 不在本任务中直接重写已创建 Linear issue descriptions；合并后如需同步，作为外部 writeback 跟进。

## 设计索引 (Design Index)

> **Design Source of Truth**: default implementation mode with design amendment; medium/high risk docs change requiring spec-rfc/review-rfc before final delivery

**摘要**:
- 保留四层真源边界，在 Linear 侧新增 native presentation/control plane。
- 把 PR/worker 终态拆成成功与非成功，只有成功或显式 admin override 解锁下游。
- 把 AgentSession/session activity/stop 作为 DB-outbox 管理的幂等 side effect，而不是 webhook handler 或 comment-only 副作用。
- claim 前重新校验 snapshot/current issue，避免基于过时 ready 结果启动 worker。

## 阶段概览

1. **brainstorm** - 物化稳定 task contract
2. **spec-rfc** - 修订 RFC 与 WI 设计
3. **review-rfc** - 审查修订后的设计
4. **verify-change** - 验证文档一致性与关键术语
5. **review-change** - 做交付前代码/文档 readiness review
6. **report-walkthrough** - 生成 reviewer-facing walkthrough
7. **legion-wiki** - 更新 wiki current truth

---

*创建于: 2026-06-23 | 最后更新: 2026-06-23*
