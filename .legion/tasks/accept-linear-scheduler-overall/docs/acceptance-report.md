# Linear Scheduler 总体验收报告

> 任务：`accept-linear-scheduler-overall`
> 日期：2026-06-25
> 验收边界：**本地原型验收**（用户确认）
> 结论面向：技术负责人 / 上线决策者

## 1. 总结论

### 1.1 本地原型验收结论：PASS

在当前仓库范围内，`scheduler/` 作为 **Linear + Legion Scheduler 本地原型** 可以通过验收：

- 全量 scheduler 回归测试通过：`57/57 PASS`。
- 关键 CLI 本地 smoke 通过：health、scan fixture、dispatch fixture、delivery track fixture、project health。
- 设计文档、README 和测试覆盖的核心边界一致：Linear 是 presentation/control plane，Scheduler DB 是 machine truth，Legion / GitHub PR 仍分别负责单 WI 执行协议和交付终态。
- 本地证据覆盖了调度器最危险的错误类别：重复 claim、错误下游解锁、PR 未合并即 Done、缺失 Legion evidence、资源锁冲突、webhook 重放/重复、native stop、retry/stale recovery、admin 操作审计和 secret redaction。

### 1.2 生产上线结论：NOT ACCEPTED / BLOCKED

这次验收 **不能**批准它直接作为生产无人值守调度器使用。原因不是本地原型失败，而是验收范围没有也无法证明这些生产条件：

- 未做真实 Linear project dry-run / live scan。
- 未验证真实 Linear Native Agent API 写回：delegate、AgentSession、AgentActivities、Agent Plan、externalUrls、comments/state/labels。
- 未验证真实 GitHub REST / branch protection / required checks / review 的端到端行为。
- 未跑真实 OpenCode worker 端到端 PR lifecycle。
- README 明确当前仍是 local prototype，生产 native Linear API adapters 和 metrics dashboard/exporter 尚未实现。
- 生产 auth、权限、日志/数据保留、告警和运维 runbook 仍是上线阻塞项。

**推荐决策**：接受为“本地原型 / sandbox integration candidate”；拒绝作为“生产自动派活系统”直接上线。若这套系统真的影响几十个人的工作流，下一步必须走分阶段灰度，而不是直接全量自动执行。

## 2. 验收范围

### 2.1 本次覆盖

- 设计与交付文档：`docs/linear-legion-scheduler/**`
- 可执行原型：`scheduler/src/**`
- 回归测试：`scheduler/tests/**`
- CLI / admin smoke：`scheduler/src/cli.ts` 暴露的本地命令
- 本任务证据：`.legion/tasks/accept-linear-scheduler-overall/**`

### 2.2 本次不覆盖

- 真实 Linear API project scan。
- 真实 Linear Native Agent writeback side effects。
- 真实 GitHub PR REST adapter、token scope、rate limit、branch protection。
- 真实 OpenCode worker 长任务、取消、PR merge 完整闭环。
- 生产部署拓扑、HA、备份、监控、告警、SLO、数据保留。

## 3. 执行证据

详细命令、输出摘要和选择理由见 [`test-report.md`](test-report.md)。核心结果如下。

| 证据 | 命令 / 来源 | 结果 | 验证意义 |
|---|---|---:|---|
| 全量回归 | `npm --prefix scheduler test` | PASS, 57/57 | 覆盖所有 scheduler test files，是本地最强综合信号。 |
| DB/health | `npm --prefix scheduler run health -- --db :memory:` | PASS | 验证迁移、表集合、基础 service health。 |
| scanner fixture | `scan fixture` + task-local snapshot | PASS | 验证 ready/skipped 输出、manual done blocker、human gate、dependency blocked、native preview 和 redaction。 |
| dispatcher fixture | `dispatch fixture` + 同一 snapshot | PASS | 验证非冲突 WI claim、area lock 冲突等待、blocker waiting、DB run/lock/outbox 写入。 |
| runs list | `runs list` | PASS | 验证 dispatch 后 run 行可检查，字段 redaction 正常。 |
| PR tracker fixture | `delivery track` + `pr-open.json` | PASS | 验证 open PR + pending checks/review 只进入 `in_review`，不会错误标记 Done。 |
| project health | `project health` | PASS | 验证 admin health 能汇总 active runs、locks、pending outbox、recent waiting/skipped events。 |

一个非产品问题：第一次 `scan fixture` 用 repo-root 相对 fixture path 失败，因为 `npm --prefix scheduler` 会在 scheduler package context 下执行；改用绝对 repo-local path 后通过。这是命令调用细节，不是 scheduler 行为缺陷。若希望减少误用，后续可在 README 中提示 `--prefix` 下 fixture/db path 的相对目录。

## 4. 组件级验收

| 组件 | 主要文件 / 文档 | 本地结论 | 证据与说明 |
|---|---|---|---|
| WI contract / scheduling policy | `linear-wi-contract-policy.md`, `scanner.ts` | PASS | Ready 条件、label conflict、state mapping、blocker terminal policy 在文档中明确；scanner/test 覆盖 ready/skipped 与 blocker satisfaction。 |
| SQLite scheduler core | `sqlite-store.ts`, `state-machine.ts`, `scheduler-core-sqlite.md` | PASS | 迁移、active-run 唯一性、claim transaction、attempt、locks、events、outbox、terminal gate 都有回归测试。 |
| Linear graph scanner | `scanner.ts`, `linear-graph-scanner.md` | PASS for local | 覆盖 GraphQL pagination/mock、DAG 方向、cycle、snapshot persistence、manual Done fallback、skipped reasons。真实 Linear API 未验。 |
| Worker runner | `worker-runner.ts`, `task-id.ts`, `worker-runner.md` | PASS for local contract | Prompt 包含 Legion hard gates；parser/evidence verifier/identity checks/native startup/cancel paths 有测试。真实 OpenCode E2E 未验。 |
| PR delivery tracker | `pr-tracker.ts`, `delivery-pr-writeback.md` | PASS for fixture/local | open/pending、checks fail、changes requested、merged+evidence+lifecycle、missing evidence、closed-unmerged 有测试。真实 GitHub adapter 未验。 |
| Parallel dispatcher / locks | `dispatcher.ts`, `resource-locks.ts`, `parallel-dispatch-locks.md` | PASS | lock parser/conflict matrix、capacity wait、fairness、restart recovery、terminal release、stale lock hook、fixture CLI 均覆盖。 |
| Webhooks / retry / recovery | `webhook.ts`, `retry-policy.ts`, `recovery.ts`, `webhooks-retry-recovery.md` | PASS for local | raw-body HMAC、timestamp replay、dedupe、AgentSession stop、retry taxonomy、timeout retry、stale recovery 有测试。真实 webhook delivery 未验。 |
| Admin / observability / security | `admin.ts`, `observability.ts`, `operations-security.md`, `README.md` | PASS for local | pause/resume/retry/cancel/lock release reason/audit、project health、PermissionChange security block、secret redaction 有测试。生产 dashboard/exporter 与 retention 未实现。 |
| CLI surface | `cli.ts`, `README.md` | PASS for tested commands, doc drift noted | health / scan fixture / dispatch fixture / delivery track / project health 本地通过；真实 external modes 未验。README 示例引用不存在的 `scheduler/tests/fixtures/project.json`，见限制。 |

## 5. 关键 case matrix

### 5.1 Ready / skipped / dependency cases

| Case | 期望行为 | 本地结果 | 状态 |
|---|---|---|---|
| Candidate + `agent:ready` + `contract:stable` + repo/risk labels | 进入 ready candidate | fixture 中 `WI-READY-A/B/CONFLICT` ready | PASS |
| Human gate | `agent:needs-human` 阻止自动 dispatch | `WI-NEEDS-HUMAN` skipped `human_gate` | PASS |
| 非 candidate state | 不进入 ready | `WI-MANUAL` Done、`WI-UPSTREAM` In Progress 均 skipped `state_not_candidate` | PASS |
| Downstream blocked by incomplete upstream | 不 claim，不释放 downstream | `WI-BLOCKED` skipped / waiting for blocker | PASS |
| Manual Done fallback | 可作为 blocker satisfaction 输入，但不会自己被当 candidate | `WI-MANUAL` 使 downstream 可 ready，同时自身 skipped | PASS |
| Dependency cycle | 报告 cycle path | 回归测试覆盖 `dependency_cycle` | PASS |
| Stale snapshot | claim 前拒绝过期 snapshot | 回归测试覆盖 `stale_snapshot` | PASS |
| Contract conflict / missing contract | 不 auto-run | 回归测试覆盖 required skipped reasons；policy 明确 | PASS local |

### 5.2 Claim / DB / terminal state cases

| Case | 期望行为 | 本地结果 | 状态 |
|---|---|---|---|
| Duplicate claim | 同一 Linear issue/task 只能有一个 active run | SQLite 多连接 duplicate claim 测试通过 | PASS |
| Claim transaction | run、attempt、locks、event、outbox 同事务建立 | 回归测试通过；dispatch smoke 写入两条 queued runs | PASS |
| Non-success terminal | failed/cancelled/abandoned 不满足 blocker | 回归测试覆盖 | PASS |
| Done without delivery/evidence gate | 不满足 blocker | 回归测试覆盖 `done` 需 delivery/evidence passed | PASS |
| Admin override | 仅 audit/依赖计算用途，不把失败变成功 | policy 和 tests 覆盖非成功默认不解锁 | PASS local |
| Snapshot hash stability | object key order 不影响 hash | 回归测试通过 | PASS |

### 5.3 Worker / evidence cases

| Case | 期望行为 | 本地结果 | 状态 |
|---|---|---|---|
| Worker prompt hard gates | 强制 Legion workflow / brainstorm / git-worktree-pr | prompt renderer test 覆盖 | PASS |
| Missing/malformed result block | 不标 Done，进入失败/阻塞路径 | parser / worker dispatch tests 覆盖 | PASS |
| Result identity mismatch | 拒绝 tampered outbox/result identity | 回归测试覆盖 | PASS |
| PR-only result | evidence verifier 拒绝 | 回归测试覆盖 | PASS |
| High-risk evidence | 要求 RFC/review-rfc/test/report/wiki/lifecycle | evidence verifier test 覆盖 complete high-risk evidence | PASS local |
| Native startup prerequisite failed | worker 不启动 | tests 覆盖 | PASS |
| Native stop/cancel | 不满足 downstream，产生 final response | tests 覆盖 | PASS |

### 5.4 PR / delivery cases

| Case | 期望行为 | 本地结果 | 状态 |
|---|---|---|---|
| PR open / draft / pending checks / review required | run 进入 `in_review`，不 Done | delivery fixture smoke 返回 `in_review` | PASS |
| Checks failing | blocked / `pr_blocked` | 回归测试覆盖 | PASS |
| Review changes requested | blocked / `pr_blocked` | 回归测试覆盖 | PASS |
| Merged + evidence PASS + lifecycle complete | `done`, gates passed, locks released | 回归测试覆盖 | PASS local |
| Merged but missing Legion evidence | blocked / `legion_evidence_missing` | 回归测试覆盖 | PASS |
| Merged but lifecycle incomplete | blocked / `lifecycle_blocked` | 回归测试覆盖 | PASS |
| Closed unmerged | terminal non-success, downstream locked | 回归测试覆盖 | PASS |

### 5.5 Parallel dispatch / resource locks

| Case | 期望行为 | 本地结果 | 状态 |
|---|---|---|---|
| Non-conflicting parallel WIs | 可同时 claim | fixture claim `WI-READY-A/B` | PASS |
| Same area lock conflict | 后者 waiting_for_lock，不 claim | fixture `WI-CONFLICT` waiting_for_lock | PASS |
| Capacity limit | waiting_for_capacity，不占锁 | 回归测试覆盖 | PASS |
| Repo-wide vs area lock conflict matrix | repo lock 与 area lock 冲突 | 回归测试覆盖 | PASS |
| Stale lock TTL | 只报告，不自动 release | 回归测试覆盖 | PASS |
| Terminal lock release | terminal 后可释放并让后续 claim | 回归测试覆盖 | PASS |

### 5.6 Reliability / ops / security

| Case | 期望行为 | 本地结果 | 状态 |
|---|---|---|---|
| Webhook raw body signature | mutated body / wrong signature reject | 回归测试覆盖 | PASS local |
| Timestamp replay | 过期 webhook reject | 回归测试覆盖 | PASS |
| Webhook dedupe | duplicate no-op，不重复 enqueue | 回归测试覆盖 | PASS |
| AgentSession stopped | request native stop，不解锁 downstream | 回归测试覆盖 | PASS |
| Retry taxonomy | retryable/conditional/non-retry/control 分流 | 回归测试覆盖 | PASS |
| Worker timeout retry | bounded retry，不创建第二 active run | 回归测试覆盖 | PASS |
| Stale recovery | 先查 liveness，再 retry/terminal release | 回归测试覆盖 | PASS |
| Dangerous admin action | 必须 reason + audit | 回归测试覆盖 | PASS |
| Project pause/security block | 阻止新 dispatch/worker launch | 回归测试覆盖 | PASS |
| Secret redaction | token/header/signed URL/hash-like field redacted | 回归测试与 CLI smoke 覆盖 | PASS local |

## 6. 发现的问题与限制

### 6.1 本地原型范围内未发现阻塞缺陷

本轮没有发现必须阻止“本地原型验收”的代码级或测试级 blocker。关键路径的失败模式基本有防护，且测试不是只覆盖 happy path。

### 6.2 已核实的文档漂移 / 局部风险

这些问题不推翻本地原型验收，但会影响后续生产化或交接质量：

| 项目 | 现象 | 影响 | 建议 |
|---|---|---|---|
| README fixture 示例漂移 | `scheduler/README.md` 多处引用 `scheduler/tests/fixtures/project.json`，但当前 fixture 目录只有 `pr-open.json`。 | 按 README 复制命令会失败；本次验收已用 task-local fixture 代替。 | 增加真实 `project.json` fixture，或把 README 示例改成现存 fixture / 说明自备 snapshot。 |
| README 测试清单遗漏 | README 的 test layout 未列 `scheduler/tests/linear-admin-observability.test.ts`。 | 读者会低估 admin/observability/security 覆盖。 | README 增补该测试文件。 |
| Work item spec checklist 未回填 | WI-04 到 WI-08 work item markdown 仍有未勾选 acceptance checklist，但交付文档和 index 已声明 delivered。 | 容易造成“是否已交付”的阅读歧义。 | 在 work-item docs 中标注已由对应 delivery artifact 验收，或回填 checklist 状态。 |
| Manual Done audit 落点不完整 | Policy 要求 manual Linear Done satisfaction 记录 audit；`isBlockerSatisfied()` 返回 `manual_done`，但 predicate 本身不写 audit。 | 本地 dependency 判断可工作，但生产需要保证 audit 由 scanner/reconcile 调用层补写，不能只返回布尔结果。 | 在 production reconcile/scan-to-dispatch 边界显式写 `manual_blocker_satisfied` audit，或调整文档说明。 |
| Native stop 生产竞态 | `requestNativeStop()` 会把非 terminal run 立即转 `cancelled` 并 release locks；docs 描述应先 kill/cancel worker、cleanup，再 release。 | 对真实 worker，若进程仍在执行 side effects，过早释放 locks 可能让冲突 WI 提前启动。 | 生产化前引入 explicit `canceling`/cleanup gate，或确保 stop path 已确认 worker 停止后再 release locks。 |
| Linear state name hints | PR writeback outbox payload 含 `suggestedState: In Review/Done/In Progress/Canceled`。 | 如果 production adapter 直接硬编码，会与不同 Linear workspace workflow drift。 | 保持这些只是 hints；adapter 必须使用配置映射。 |

### 6.3 不能忽略的限制

1. **真实外部系统未验证**
   测试和 smoke 主要通过 fixture、mock 或本地 SQLite 证明逻辑边界。它们不能证明真实 Linear/GitHub/OpenCode 的权限、延迟、错误码、rate limit、分页边界和 API drift。

2. **生产 Linear Native Agent adapter 尚未证明**
   当前 outbox side-effect contract 有本地覆盖，但真正 create/find AgentSession、set delegate、write activities/plan/externalUrls/comments/state/labels 的 adapter 行为不在本次验收内。

3. **OpenCode worker 真实生命周期未完整 E2E**
   worker runner 的 prompt、parser、evidence、identity、native startup 和 fake launcher 路径有覆盖，但真实模型进程、长任务取消、stderr/stdout 边界、凭据 allowlist 和 PR lifecycle 完整闭环仍需 sandbox 验证。

4. **生产运维面不完整**
   README 仍声明 scheduler 是 local prototype；生产 native Linear API adapters、metrics dashboard/exporter、log/data retention policy 尚未完成。

5. **SQLite 是 local durable DB，不是生产部署结论**
   SQLite 对当前 prototype 和本地调试足够；若要长期运行多 worker / 多机器，需要明确是否迁移 Postgres/队列/worker 平台，并保持相同 machine-truth 边界。

6. **CLI path ergonomics 有小坑**
   `npm --prefix scheduler` 下相对 path 以 scheduler package context 解析。不是功能错误，但对手工验收/运维容易踩坑，建议 README 补一句。

7. **Worker isolation 仍是进程级假设**
   当前实现强调 env allowlist 和 repo-local artifacts，但没有容器/沙箱级隔离证明。生产环境若执行不可信或高权限任务，需要额外隔离策略。

## 7. 生产上线阻塞清单

如果目标是让它真实调度几十个人依赖的 Linear 队列，以下项目必须完成或被明确豁免：

1. **真实 Linear read-only dry-run**
   用目标 workspace/project 跑 `scan project`，确认 pagination、labels、states、relations、manual Done、human gate、cycles、skipped reasons 与团队实际 Linear 配置一致；不写 Linear。

2. **Linear Native Agent writeback adapter E2E**
   在 sandbox project 验证 delegate、AgentSession、activities、plan、externalUrls、state/label/comment writeback 的幂等性、权限失败、PermissionChange/security_blocked 行为。

3. **GitHub PR tracker live E2E**
   用 sandbox PR 验证 open/pending、checks fail、changes requested、merged、closed-unmerged、rate limit、token scope、branch protection 和 review decision 映射。

4. **OpenCode worker sandbox E2E**
   用低风险 no-op WI 完整跑：Linear ready -> claim -> worker -> Legion task -> worktree/PR -> checks/review/merge -> evidence verifier -> delivery tracker -> final writeback -> downstream unlock。

5. **Security posture**
   明确 OAuth/app actor 或 client credentials；最小 Linear/GitHub scopes；worker 不接收 scheduler DB superuser credentials；raw webhook payload 和 worker logs 的发布/保留规则。

6. **Observability / operations**
   建立 dashboard/exporter 或等价监控；告警 stale runs、pending outbox、retry storm、security_blocked、webhook failure、GitHub/Linear API failure；建立 pause/resume/cancel/retry/lock release runbook。

7. **Staged rollout policy**
   先 read-only scan，再 claim-only/no-worker，再单 repo/低风险 worker，再有限并发；每阶段要有 rollback 和人工 stop 条件。

8. **Stop/cancel lock-release hardening**
   在真实 worker 环境中，native stop/admin cancel 必须证明 worker 已停止 side effects 或 cleanup 已完成，才能释放冲突 locks。

## 8. 灰度建议

在进入任何真实团队项目之前，建议按以下顺序推进：

1. **Stage 0: 本地原型接受**（本报告完成）
   只证明代码边界和本地 fixture 行为。

2. **Stage 1: 真实 Linear read-only scan**
   只读取项目并输出 ready/skipped/cycles，不 claim、不写 Linear、不启动 worker。

3. **Stage 2: Sandbox writeback**
   在 sandbox project 验证 native outbox adapter 幂等和权限失败，不影响真实队列。

4. **Stage 3: Single low-risk WI E2E**
   选一个无依赖、低风险、可回滚 WI，全程人工 review，验证 PR lifecycle 和 final writeback。

5. **Stage 4: Limited parallelism**
   只开放一个 repo、低并发、明确 resource lock；所有 downstream unlock 保持审计可见。

6. **Stage 5: Production candidate**
   只有在监控、runbook、权限、retention 和 rollback 都到位后，再讨论扩大范围。

## 9. 最终建议

**批准：** 当前 `scheduler/` 可作为本地原型和下一阶段 sandbox integration 的基础。
**拒绝：** 当前状态不得被宣传或使用为生产无人值守自动调度器。
**下一步：** 先做真实 Linear read-only scan + sandbox native writeback + sandbox PR/OpenCode E2E，再重新做生产 readiness review。

如果这件事真的关系到几十个人的命运，最危险的不是“原型不够好”，而是“把原型通过误读成生产通过”。本轮证据支持前者，不支持后者。
