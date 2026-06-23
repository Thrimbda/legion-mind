# Research Notes: Linear + Legion Scheduler

> 目标：用最短路径回答“当前仓库有哪些 workflow 真源、这个 scheduler 设计必须尊重哪些边界”。

---

## 1. Problem Restatement

- 一句话复述：需要设计一个以 Linear 为 WI 队列 / 依赖图、以 Legion workflow 为单 WI 执行协议的自动调度器，能够在 WI 完成后扫描 ready work、并行调度 agent，直到项目闭环。
- 影响范围：当前任务只影响设计文档和 WI 拆解；未来实现会影响 Linear API、scheduler 服务、worker runner、GitHub PR tracking、Legion task materialization 与运维工具。

## 2. Relevant Code / Entry Points

- `README.md:41-78` — 描述 LegionMind 系统模型、任务记忆 / wiki 记忆 / 规则层，以及 `legion-workflow`、`spec-rfc`、`review-rfc`、`engineer`、`verify-change`、`review-change`、`report-walkthrough`、`legion-wiki` 的职责边界。
- `README.md:61-63` — 明确 Legion-managed 仓库入口门与 `git-worktree-pr` envelope 完成条件。
- `skills/legion-workflow/SKILL.md` — 入口门、三种执行模式、阶段链和 done 语义真源。
- `skills/legion-workflow/references/SUBAGENT_DISPATCH_MATRIX.md:31-35` — 重型仅设计模式阶段链：`spec-rfc -> review-rfc -> report-walkthrough -> legion-wiki`。
- `skills/git-worktree-pr/SKILL.md` — 修改型开发任务的 worktree / PR lifecycle envelope。
- `.legion/wiki/patterns.md:31-38` — 当前有效模式：开发任务使用 Git worktree + PR lifecycle envelope。
- `.legion/wiki/patterns.md:111-116` — 根 `docs/` 已退出 LegionMind current truth；本任务新增 root docs 子目录必须被视为 scheduler proposal artifact，而非替代 README/wiki 的当前真源。

## 3. Existing Conventions

- `.legion/tasks/**` 是 raw task evidence；`plan.md` 管契约，`docs/rfc.md` 管设计，`docs/review-rfc.md` 管审查结果。
- `.legion/wiki/**` 只沉淀跨任务当前知识，不复制 raw RFC 正文。
- 阶段技能必须真实加载或派生，不能凭记忆模拟 `spec-rfc` / `review-rfc` / `report-walkthrough` / `legion-wiki`。
- 对会修改仓库文件的任务，默认基于 `origin/master` 创建 `.worktrees/<task-id>/`，PR lifecycle 不是可选动作。

## 4. Historical Decisions

- `add-git-worktree-pr-envelope`：把 worktree + PR lifecycle 定义为 Legion 修改型开发任务的强制外壳，且不是第四种执行模式。
- `harden-legion-workflow-gate`：明确 Legion 入口门禁先于探索、实现和子代理派生。
- `harden-v1-kernel-harness`：根 `docs/` 退出 LegionMind 当前真源，当前真源收敛到 README、wiki、skills、benchmark README。

## 5. Constraints & Non-goals

- 设计必须把 Linear、scheduler DB、Legion task docs、GitHub PR 的真源边界拆开。
- Scheduler 不应直接让 agent 改代码；它只能启动 worker，并要求 worker 进入 Legion workflow。
- 每个 WI 应独立映射 Legion task、worktree、branch、PR，避免一个长会话连续吞多个 WI 造成 contract 漂移。
- 本任务不实现 runtime；只交付可评审 RFC 与 WI 文件。

## 6. Risks & Pitfalls

- **职责混淆**: 如果 scheduler 自己判定 contract 稳定并跳过 Legion，会破坏当前 workflow 内核。缓解：把“worker 第一动作必须进入 `legion-workflow`”列为硬接口。
- **幂等缺失**: Webhook、定时 reconcile、worker retry 都可能重复触发同一 WI。缓解：scheduler DB 需要 run / attempt / idempotency key。
- **Linear dependency 不足**: blocked-by 只表达业务依赖，不表达工程资源冲突。缓解：加入 resource locks 与 label-based mutex。
- **PR 创建被误判为完成**: 违反 `git-worktree-pr` 完成条件。缓解：scheduler run 的 success gate 绑定 PR merged / closed-with-reason + Legion closing evidence。
- **根 docs 语义漂移**: 新增 root `docs/` 子目录可能和当前 truth 约定冲突。缓解：命名为 `docs/linear-legion-scheduler/`，作为该 scheduler proposal 文档，不更新 README current truth。

## 7. Unknowns

- [ ] 未来实现是否优先接入 Linear Agent Sessions API，还是先用普通 app actor + comments / labels；RFC 应给出推荐和分阶段策略。
- [ ] Agent worker runtime 具体使用 OpenCode、OpenClaw、Codex CLI 或抽象 runner；RFC 应定义 runner interface，避免绑定单一 runtime。
- [ ] 是否使用 Temporal / BullMQ / 自研 DB poller；RFC 应比较方案并给首版推荐。

## 8. References

- Task plan: `.legion/tasks/linear-legion-scheduler-rfc/plan.md`
- User request: “使用 legion workflow 完成任务：1. 做详细技术设计写一个总体的 rfc，使用 legion 流程 review 通过为止 2. 把你这几个 wi 别拆这么细，合并成不超过 10 个，写入 docs 目录下的子目录，每个wi写个文件”
- Prior discussion facts: Linear 官方提供 GraphQL API、TypeScript SDK、webhooks、MCP 与 Developer Preview Agents API；第三方 `schpet/linear-cli` 适合本地辅助但不建议作为生产调度核心。
