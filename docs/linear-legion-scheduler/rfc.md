# RFC: Linear + Legion 自动调度器

> **Profile**: RFC Heavy / Design-only  
> **Status**: Draft for `review-rfc`  
> **Owner**: Legion agent / user  
> **Created**: 2026-06-23  
> **Last Updated**: 2026-06-23

---

## Executive Summary

- **Problem**: 用户希望让 Linear 中的 Work Items 形成可自动推进的项目 DAG：一个 WI 完成后，调度器自动扫描不被 blocker 阻塞、且工程资源不冲突的 WI，并行启动 agent 执行，直到项目完成。
- **Decision**: 采用“Linear 管队列与依赖，Scheduler 管机器状态与并发，Legion 管单 WI 执行协议，GitHub PR 管交付终态”的四层架构。
- **Key rule**: Scheduler 不直接改代码、不替代 Legion 阶段链；每个 WI worker 的第一动作必须进入 `legion-workflow`，修改仓库时必须使用 `git-worktree-pr` envelope。
- **MVP path**: 先实现 project-scoped reconcile + DB run/lock + Linear graph + 单 worker happy path，再扩展 PR tracking、并行 dispatcher、webhook、retry、admin / observability / security。
- **Work item split**: 后续实现合并为 8 个 WI，分别覆盖规范、scheduler core、Linear graph、Legion runner、delivery tracking、parallel dispatch、reliability、operations/security。
- **Primary risks**: 幂等、重复调度、资源锁表达不足、PR 状态误判、agent 逃逸 Legion workflow、凭 Linear 描述误判 contract 稳定。
- **Rollback**: 每个实现阶段都可通过暂停 scheduler、释放 DB locks、撤销 Linear agent labels / comments、关闭或保留 PR、恢复 Legion task docs 来回滚；MVP 不应自动改变历史数据。

---

## 1. Background / Motivation

Linear 已经天然具备项目、issue、blocked-by relation、labels、comments、状态流转和 webhook；LegionMind 已经具备 task contract、设计门禁、实现、验证、review、report、wiki writeback 与 `git-worktree-pr` PR lifecycle。缺的不是“让一个 agent 看懂一个 issue”，而是一个可靠的调度层：它知道哪些 WI 可以跑、哪些 WI 不能跑、如何 claim、如何并行、如何恢复失败、如何把 agent 运行证据回写到 Linear。

调度器的核心价值是把人从“盯着队列派活”中解放出来，同时不放弃 Legion 的可靠性边界：

- Linear 提供人类可见的项目队列和依赖图；
- Scheduler 提供机器可恢复的运行状态、锁与幂等；
- Legion 提供每个 WI 的执行协议与证据闭环；
- GitHub PR 提供代码交付、checks、review 与 merge 终态。

如果这几层边界不清，调度器很容易退化为“发现 issue 后直接喊 agent 去改代码”，从而绕过 contract、设计门、验证、review 和 PR lifecycle。这个 RFC 的主要设计目标就是防止这种退化。

---

## 2. Goals

1. 定义一个可实现的 Linear + Legion scheduler 架构，支持从 Linear project 自动发现 ready WI 并启动 agent worker。
2. 明确 ready 判断：Linear blocker、contract eligibility、active run、resource lock、项目暂停、人工 gate 都必须进入判断。
3. 明确每个 WI 如何映射到 Legion task、worktree、branch、PR 和 Linear writeback。
4. 定义 scheduler 的持久化模型：runs、attempts、snapshots、locks、events、webhook dedupe、PR links。
5. 支持从单 worker happy path 逐步升级到并行 dispatcher、webhook ingestion、retry / recovery 和运维工具。
6. 保留人类 review 与仓库保护规则：PR 创建不是完成，merge / close-with-reason 才是交付终态。

## 3. Non-goals

- 不在 scheduler 中重新实现 Legion workflow、contract review、RFC review 或 PR lifecycle。
- 不让 scheduler 根据 Linear 描述自行判定 contract 已稳定并跳过 `brainstorm`。
- 不在第一版实现自动拆分大 issue、自动生成产品需求、自动决定优先级或完全无人 review merge。
- 不依赖第三方 `linear-cli` 作为生产调度核心；CLI 可作为本地辅助，但核心应走官方 API / SDK。
- 不在 MVP 支持多组织、多租户、多 repo 跨组织统一调度；先做单 workspace / 单 project / 可配置 repo mapping。
- 不绕过 GitHub branch protection、required checks、人类 review 或 Linear 权限模型。

---

## 4. Core Principles

### 4.1 Source-of-truth boundaries

| 层 | 负责什么 | 不负责什么 |
|---|---|---|
| Linear | WI、项目状态、依赖关系、优先级、人机协作状态 | 机器锁、agent attempt、PR checks 真相 |
| Scheduler DB | run lifecycle、attempt、resource lock、idempotency、event log、stale recovery | 任务 contract 内容、设计批准、代码交付 review |
| Legion task docs | 单 WI contract、设计、实现证据、验证、review、walkthrough、wiki writeback | 全局队列调度、跨 WI 并发锁 |
| GitHub PR | branch diff、checks、review、merge / close 终态 | Linear dependency graph、Legion contract 稳定性 |

### 4.2 Scheduler is an orchestrator, not an engineer

Scheduler 只做：扫描、claim、锁、启动 worker、记录状态、跟踪 PR、写回 Linear、恢复失败。它不写生产代码，不生成最终实现 diff，不跳过 Legion 阶段。

Worker prompt 的硬约束：

```text
你正在执行 Linear WI <KEY>。
第一步：进入或恢复 .legion/tasks/<task-id>/。
必须先运行 legion-workflow。
contract 不稳定则进入 brainstorm。
需要修改仓库时必须使用 git-worktree-pr。
完成条件包括 Legion 阶段链、PR lifecycle、wiki writeback。
```

### 4.3 Reconcile first, webhook second

Webhook 用于降低延迟，不作为唯一真源。Scheduler 应始终有 project-scoped periodic reconcile：

```text
webhook event -> enqueue reconcile(project)
timer tick    -> enqueue reconcile(project)
manual CLI    -> enqueue reconcile(project)
```

这样能处理 webhook 丢失、重复、乱序、Linear API transient failure 和 scheduler restart。

---

## 5. High-level Architecture

```text
Linear Project / Issues / Relations / Webhooks
        │
        ▼
Linear Connector
        │
        ▼
Reconcile Engine ──► Dependency Graph Builder ──► Ready Candidate Selector
        │                                      │
        │                                      ▼
        │                              Resource Lock Manager
        │                                      │
        ▼                                      ▼
Scheduler DB ◄──── Claim / Run / Attempt / Event / Lock State
        │
        ▼
Dispatcher ──► Agent Worker Launcher ──► Legion Workflow Adapter
        │                                │
        │                                ▼
        │                         .legion task + worktree + PR
        │                                │
        ▼                                ▼
GitHub PR Tracker ◄────────────── PR URL / checks / review / merge
        │
        ▼
Linear Writeback / Admin CLI / Observability
```

### 5.1 Components

- **Linear Connector**: 封装 Linear GraphQL / SDK 查询与 mutation。负责 project issues、relations、labels、states、comments、webhook event parsing。
- **Reconcile Engine**: project-scoped 调度循环。读取 Linear snapshot、构建 DAG、计算 ready candidate、发起 claim。
- **Scheduler DB**: 保存 run、attempt、resource lock、webhook dedupe、event log、PR link；是恢复和幂等真源。
- **Dispatcher**: 根据全局并发、per-repo 并发、resource locks 和 priority 启动 worker。
- **Agent Worker Launcher**: 以隔离进程 / job 启动 agent，注入 Linear context、repo path、taskId、prompt contract、timeout。
- **Legion Workflow Adapter**: 不是独立运行时，而是 worker prompt + exit contract + evidence parser；它确保 worker 按 Legion workflow 执行。
- **GitHub PR Tracker**: 查询 PR 状态、checks、review、merge/close；决定 run 是否进入 In Review、Done、Blocked、Failed。
- **Linear Writeback**: 用 comments / labels / state changes 向人类展示运行状态，避免 scheduler DB 成为黑盒。
- **Admin CLI**: pause、resume、inspect、retry、cancel、release stale lock、force reconcile。
- **Observability**: structured logs、metrics、trace id、run timeline、skipped reason report。

---

## 6. Linear Modeling

### 6.1 Required issue shape

首版只自动执行满足最低 contract 的 WI。推荐 Linear issue template：

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

### 6.2 Labels

Recommended labels:

| Label | Meaning |
|---|---|
| `agent:ready` | 可被 scheduler 选择 |
| `agent:queued` | 已进入候选队列但未启动 |
| `agent:running` | 有 active run |
| `agent:blocked` | agent / scheduler 判定阻塞 |
| `agent:needs-human` | 需要人工决策 |
| `contract:stable` | Linear 描述足够启动 Legion task；不代表可跳过 Legion |
| `contract:needs-review` | 需要人工或 brainstorm 补 contract |
| `risk:low|medium|high` | 指导 Legion 设计门强度 |
| `repo:<name>` | 目标仓库或 package |
| `area:<name>` | 模块区域锁 |
| `mutex:<name>` | 互斥资源，如 `db-migration`、`api-schema` |

### 6.3 State mapping

Linear workflow state 不同团队可配置，因此 scheduler 不应硬编码状态名，而应配置 state type / name mapping：

| Scheduler state | Linear example | Meaning |
|---|---|---|
| `candidate` | Ready / Backlog + `agent:ready` | 可扫描 |
| `claimed` | Queued | scheduler 已 claim |
| `running` | In Progress | worker 正在跑 |
| `in_review` | In Review | PR 已创建，等待 checks/review/merge |
| `done` | Done | PR merged 或设计任务完成且 PR merged |
| `blocked` | Blocked | blocker / review / infra / human gate |
| `failed` | Failed | 达到 retry 上限或不可恢复失败 |

Linear status 是人类界面；scheduler DB 中的 run state 是机器真源。两者需要同步，但冲突时以 DB + event log 决定恢复动作，再回写 Linear。

---

## 7. Scheduler Data Model

以下是逻辑模型，具体 ORM / SQL 在实现 WI 中细化。

### 7.1 Tables

#### `work_item_snapshots`

保存每次 reconcile 读取到的 Linear issue 摘要，用于 diff、debug、skipped reason。

| Field | Notes |
|---|---|
| `id` | internal uuid |
| `linear_issue_id` | Linear UUID |
| `linear_identifier` | e.g. `ENG-123` |
| `project_id` | Linear project |
| `title` | snapshot title |
| `state` | Linear state name/type |
| `labels` | normalized labels |
| `relations` | blockers / blocked issues summary |
| `repo_key` | from label/config |
| `risk` | low/medium/high |
| `contract_state` | stable / needs-review / unknown |
| `snapshot_hash` | idempotency / diff |
| `created_at` / `observed_at` | timestamps |

#### `runs`

One active or historical execution for one WI.

| Field | Notes |
|---|---|
| `id` | run uuid |
| `linear_issue_id` / `linear_identifier` | target WI |
| `task_id` | Legion task id, e.g. `linear-eng-123` |
| `state` | queued / running / in_review / done / blocked / failed / cancelled |
| `run_kind` | implementation / design_only / future brainstorm_only |
| `claim_key` | unique active claim key |
| `priority` | derived from Linear priority + config |
| `repo_key` | repo mapping |
| `branch` / `worktree_path` | expected git-worktree-pr identifiers |
| `pr_url` | nullable until PR exists |
| `delivery_gate_status` | pending / passed / blocked / failed |
| `evidence_status` | unknown / pending / passed / missing / stale |
| `failure_type` | taxonomy |
| `failure_reason` | human-readable |
| `started_at` / `finished_at` / `heartbeat_at` | lifecycle |

Unique constraints:

- one active run per `linear_issue_id`;
- one active run per `task_id`;
- `claim_key` unique for idempotent claim.

#### `run_attempts`

每次 worker 启动一个 attempt，支持 retry 和恢复。

| Field | Notes |
|---|---|
| `run_id` | parent run |
| `attempt_number` | increasing |
| `worker_runtime` | opencode / openclaw / codex / custom |
| `prompt_hash` | reproducibility |
| `exit_code` | process result |
| `result_kind` | success / blocked / failed / timeout |
| `log_uri` | repo-local or artifact link |
| `started_at` / `ended_at` | timestamps |

#### `resource_locks`

| Field | Notes |
|---|---|
| `lock_key` | e.g. `repo:frontend`, `mutex:db-migration` |
| `run_id` | owner |
| `state` | held / released / stale |
| `expires_at` | stale recovery |
| `metadata` | reason/source labels |

#### `scheduler_events`

Append-only audit log.

| Field | Notes |
|---|---|
| `run_id` | nullable for project events |
| `event_type` | discovered / skipped / claimed / started / pr_created / blocked / done |
| `actor` | scheduler / worker / webhook / admin |
| `payload` | structured JSON |
| `created_at` | timestamp |

#### `webhook_events`

用于验签、去重和重放。

| Field | Notes |
|---|---|
| `linear_webhook_id` / `delivery_id` | if available |
| `signature_hash` | dedupe fallback |
| `resource_type` | Issue / Comment / Project |
| `action` | create / update / remove |
| `processed_at` | nullable until done |
| `raw_payload_uri` | optional sanitized artifact |

---

## 8. Ready Candidate Algorithm

### 8.1 Eligibility

A WI is eligible for **implementation execution** only if all conditions hold:

```text
issue is in candidate state
AND has label agent:ready
AND has contract:stable
AND not Done / Canceled
AND all blockers are terminal-satisfied by scheduler policy
AND no active run for issue
AND target repo is configured and not paused
AND required resource locks are available
AND issue does not have agent:needs-human
AND project concurrency limit has capacity
```

MVP 不支持把 `contract:needs-review` 的 WI 自动送进实现 worker。未来可以增加 **brainstorm-only run kind**，但它必须有独立状态、锁策略、完成语义和人工 review gate；不能和 implementation-ready 混用。

### 8.2 Dependency graph

Graph direction:

```text
blocker -> blocked
```

An issue is dependency-ready when all incoming blockers are **terminal-satisfied**. Scheduler must not use Linear `Done` alone as the unlock signal.

Cycle detection must run on every project reconcile. If a cycle is detected, scheduler does not auto-break it; it writes a Linear comment and marks affected WIs `agent:needs-human` or project-level blocked.

### 8.2.1 Blocker terminal-satisfied policy

`isBlockerSatisfied(blocker)` is the only function allowed to unlock downstream WI.

Default policy:

1. **Blocker has an active or historical scheduler run**
   - `run.state = done` is satisfied only if the run passed the delivery gate for its run kind.
   - `queued | running | in_review | blocked | failed | cancelled` are not satisfied.
   - If DB says `done` but GitHub PR is not merged / terminal as required, mark `inconsistent_terminal_state` and do not unlock.
2. **Blocker has no scheduler run**
   - Linear state mapped to Done is treated as manual completion only when the issue has no `agent:queued`, `agent:running`, `agent:blocked`, or `agent:needs-human` labels.
   - Manual completion should write an audit event in `scheduler_events` when first observed.
   - Linear Canceled / Duplicate is not satisfied by default; project policy may ignore it only with explicit audit event and Linear comment.
3. **Design-only blockers**
   - Satisfied only after the design PR is merged or explicitly accepted by configured policy. Draft/open design PR does not unlock downstream implementation by default.
4. **Abandoned / closed-unmerged PR**
   - Not satisfied unless a human/admin explicitly marks the blocker ignored with reason. That action must write `scheduler_events` and a Linear comment.

This policy prevents a downstream WI from starting merely because a blocker has a PR open or a stale Linear state.

### 8.3 Candidate selection pseudo-code

```ts
async function reconcileProject(projectKey: string) {
  const snapshot = await linear.fetchProjectSnapshot(projectKey)
  const graph = buildDependencyGraph(snapshot.issues)
  const cycles = graph.detectCycles()
  if (cycles.length) return blockCycles(cycles)

  const candidates = []
  for (const issue of graph.nodes) {
    const skipReason = explainSkip(issue, graph, schedulerDb)
    await recordSkipOrCandidate(issue, skipReason)
    if (!skipReason) candidates.push(issue)
  }

  const sorted = sortByPriorityAgeAndFairness(candidates)
  for (const issue of sorted) {
    await claimAndDispatch(issue)
  }
}
```

`explainSkip` 是一等产物。Admin 和 Linear comment 都应能回答：“为什么这个 WI 没跑？”

### 8.4 Claim transaction and outbox

Claim 必须是 DB transaction：

1. read issue snapshot;
2. check no active run;
3. acquire resource locks;
4. create run + attempt;
5. write scheduler event;
6. write a transactional outbox job for worker dispatch;
7. write Linear label/comment best-effort。

Linear writeback 失败不能回滚 DB claim，但必须记录 event 并进入 retry queue；否则会因为 Linear transient failure 重复启动 worker。

Worker enqueue should be driven from the DB-backed outbox. This avoids split-brain states such as “DB claim succeeded but process crashed before enqueue” or “worker launched but claim transaction rolled back”.

---

## 9. Legion Embedding

### 9.1 Mapping

| Linear | Legion / Git |
|---|---|
| `ENG-123` | taskId `linear-eng-123` |
| issue URL | task `plan.md` / `log.md` reference |
| project / milestone | task context / Linear writeback |
| labels `risk:*` | Legion design gate hint, not override |
| issue status | scheduler run state + Linear writeback |
| PR URL | run `pr_url`, Linear comment, Legion walkthrough |

Mapping must be deterministic. Retrying the same WI must restore `.legion/tasks/linear-eng-123/` instead of creating a new task.

### 9.2 Worker prompt contract

Worker prompt is a protocol, not ad hoc prose. Minimum fields:

```yaml
linear:
  issueIdentifier: ENG-123
  issueUrl: https://linear.app/...
  project: ...
  title: ...
  description: ...
  labels: [...]
  blockers: [...]
legion:
  taskId: linear-eng-123
  requiredEntry: legion-workflow
  ifContractUnstable: brainstorm
  ifRepoModification: git-worktree-pr
git:
  baseRef: origin/master
  branchPrefix: legion/linear-eng-123-
delivery:
  requiredEvidence:
    - plan.md
    - docs/rfc.md when risk medium/high
    - docs/test-report.md when implementation exists
    - docs/review-change.md when implementation exists
    - docs/report-walkthrough.md
    - legion-wiki writeback
  successRequiresPrTerminalState: true
```

### 9.3 Worker result contract

Worker must end with a machine-parseable result block or artifact:

```json
{
  "runResult": "in_review|done|blocked|failed",
  "linearIssue": "ENG-123",
  "taskId": "linear-eng-123",
  "prUrl": "https://github.com/.../pull/123",
  "legionEvidence": {
    "plan": ".legion/tasks/linear-eng-123/plan.md",
    "report": ".legion/tasks/linear-eng-123/docs/report-walkthrough.md",
    "wiki": ".legion/wiki/tasks/linear-eng-123.md"
  },
  "blocker": null,
  "nextStep": "wait_for_pr_checks"
}
```

Scheduler should treat this as claimed output, but still verify PR status via GitHub before marking Done.

### 9.4 Legion evidence verifier

Prompt compliance is not enough. Scheduler must verify a minimum evidence contract before it can mark a run `done` or unlock downstream WI.

Required evidence by run kind:

| Run kind | Required evidence |
|---|---|
| implementation / low risk | `plan.md`, `tasks.md`, `log.md`, `docs/test-report.md`, `docs/review-change.md` with PASS, `docs/report-walkthrough.md`, wiki task summary or writeback pointer, PR URL |
| implementation / medium-high risk | all low-risk evidence plus `docs/rfc.md` and `docs/review-rfc.md` with PASS |
| design-only | `plan.md`, `docs/research.md` when heavy, `docs/rfc.md`, `docs/review-rfc.md` with PASS, `docs/report-walkthrough.md`, wiki writeback pointer, PR URL |

Verifier behavior:

1. Parse worker result for expected evidence paths.
2. Confirm paths exist in the PR branch / worktree artifact before terminal cleanup, or in a trusted artifact bundle.
3. Confirm review documents carry PASS where required.
4. Confirm PR terminal state via GitHub, not worker output.
5. If required evidence is missing or stale, set failure type `legion_evidence_missing`, keep downstream locked, and write Linear blocked comment.

Scheduler is not expected to fully re-run Legion phases, but it must reject “PR URL only” results.

---

## 10. PR Lifecycle Integration

Scheduler should not duplicate `git-worktree-pr`, but it must observe its terminal states.

### 10.1 PR states

| PR state | Scheduler interpretation |
|---|---|
| no PR yet, worker running | `running` |
| PR open/draft | `in_review` |
| checks failing | `blocked` or worker-fix retry if scope allows |
| changes requested | `blocked` until worker/human resolves |
| merged | candidate for `done`; release locks and trigger reconcile only after §10.2 done gate / evidence verifier passes |
| closed unmerged with reason | terminal non-success; mark blocked/failed/abandoned per reason |

### 10.2 Done gate

An implementation WI is Done only when:

- Legion stage chain complete;
- Scheduler-side Legion evidence verifier passes;
- PR merged, or closed / confirmed abandoned with reason;
- required checks/review resolved;
- worktree cleanup and main workspace refresh were completed by worker or recorded as explicit blocker;
- Linear writeback has final summary.

Scheduler may mark a run `in_review` before merge, but must not unlock downstream WI until `done` unless project policy explicitly allows “review-ready unblocks downstream” for design-only tasks.

If PR merged but required Legion evidence is missing, the run becomes `blocked` with failure type `legion_evidence_missing`; downstream remains locked until evidence is repaired or an admin records an explicit override with reason.

---

## 11. Failure Taxonomy and Recovery

| Failure type | Examples | Retry? | Linear writeback |
|---|---|---|---|
| `contract_missing` | no acceptance/scope, no `contract:stable` | no automatic implementation retry | `contract:needs-review`, comment with missing fields |
| `dependency_blocked` | blocker not done, cycle detected | no | comment/skipped reason |
| `resource_blocked` | lock conflict, repo paused | later | no spam; visible in admin report |
| `agent_failed` | worker process nonzero | bounded retry | comment after threshold |
| `verification_failed` | tests/checks fail | retry if scope-local | link failing evidence |
| `pr_blocked` | review required, branch protection, merge conflict | maybe worker fix / human | In Review / Blocked with owner |
| `infra_failed` | Linear/GitHub API transient, DB unavailable | yes with backoff | delayed writeback |
| `security_blocked` | token scope, webhook signature, secret handling issue | no until human | `agent:needs-human` |
| `legion_evidence_missing` | PR exists/merged but required Legion evidence is absent or not PASS | retry/repair if branch still available; otherwise human | blocked comment with missing evidence |

Stale recovery:

- If run heartbeat is older than timeout and worker is gone, mark attempt stale.
- Keep run active while deciding retry; do not release locks until retry or terminal state.
- If retrying, reuse same Legion taskId and branch strategy; do not create duplicate task directories.

---

## 12. Security & Permissions

### 12.1 Linear auth

Preferred production path:

- OAuth app actor / client credentials where appropriate;
- least-privilege scopes: read issues/projects, write comments/labels/state only where needed;
- app actor identity for comments so users can distinguish automation from humans.

Personal API keys are acceptable for local prototype only.

### 12.2 Webhooks

- Verify Linear signature over raw request body.
- Deduplicate by delivery id or payload hash.
- Treat webhook as trigger only; fetch current state from Linear before decisions.
- Do not log raw payloads if they may contain private data; sanitize or store repo-local redacted artifacts only in development.

### 12.3 GitHub

- GitHub token must be scoped to required repos only.
- Do not bypass branch protection or required review.
- Store PR state in scheduler DB; do not trust worker output alone.

### 12.4 Worker isolation

MVP can use process-level isolation, but design should leave room for container / sandbox later.

Worker must receive only the Linear issue context, repo credentials, and tokens required for that WI. Avoid passing scheduler DB credentials to worker unless it only writes via a constrained callback.

---

## 13. Observability and Admin UX

### 13.1 Metrics

- reconcile duration and error count;
- ready candidate count / skipped reason count;
- active runs / queued runs / stale runs;
- worker success/failure/timeout counts;
- PR checks pending/failing/merged counts;
- lock wait time and stale lock count;
- Linear / GitHub API rate limit and error counts.

### 13.2 Logs

Every event should carry:

```text
trace_id, project_key, linear_identifier, run_id, attempt_id, task_id, repo_key, pr_url, event_type
```

### 13.3 Admin CLI

Required early commands:

```bash
scheduler reconcile --project <project>
scheduler runs list --project <project>
scheduler run inspect <run-id>
scheduler run retry <run-id>
scheduler run cancel <run-id>
scheduler locks list
scheduler locks release <lock-key> --run <run-id>
scheduler project pause <project>
scheduler project resume <project>
```

Each dangerous command writes `scheduler_events` with actor and reason.

---

## 14. Alternatives Considered

### Option A: Build directly on `linear-cli`

- **Pros**: Faster local prototype, existing issue/relation commands, git-aware start/pr helpers.
- **Cons**: Production scheduler needs strict idempotency, typed state, webhook verification, rate-limit handling, DB transactions, and controlled auth; CLI output can drift.
- **Decision**: Use only as local/dev helper. Core scheduler uses official API / SDK.

### Option B: Scheduler directly launches implementation prompt without Legion

- **Pros**: Simpler, fewer steps, lower latency.
- **Cons**: Breaks core safety model; skips contract, design gates, verification, review, report, wiki, worktree PR lifecycle.
- **Decision**: Rejected. Worker must enter Legion workflow.

### Option C: One long-lived agent consumes many WI in sequence

- **Pros**: Less process overhead, easier context reuse.
- **Cons**: Contract bleed, hidden state, poor isolation, difficult retries, high risk of modifying same workspace across WI.
- **Decision**: Rejected as default. Each WI gets independent run / task / worktree / PR.

### Option D: Temporal from day one

- **Pros**: Strong workflow semantics, retries, durable timers, observability.
- **Cons**: More infrastructure and operational complexity before core model is validated.
- **Decision**: Keep scheduler core abstraction compatible with Temporal, but MVP can use Postgres + job queue / worker pool. Revisit after single-WI and parallel flow are validated.

### Option E: Webhook-only scheduler

- **Pros**: Lower API usage and latency.
- **Cons**: Loses recovery from missed/duplicated/out-of-order events; harder to answer current truth.
- **Decision**: Rejected. Webhook triggers reconcile; periodic reconcile remains source of scheduling truth.

---

## 15. Rollout Plan

### Phase 1: Dry-run graph scanner

- Read Linear project.
- Build dependency graph.
- Print ready/skipped reasons.
- No worker launch, no writes except optional dry-run report.

### Phase 2: Single WI happy path

- Add DB run/attempt/lock.
- Claim exactly one ready WI.
- Launch one worker.
- Worker enters Legion workflow and produces PR/dry-run artifact.
- Write back status to Linear.

### Phase 3: PR terminal tracking

- Track checks/review/merge.
- Only unlock downstream when PR merged / terminal.
- Add final Linear summaries.

### Phase 4: Parallel dispatch

- Add resource locks, concurrency limits, fair scheduling.
- Allow N non-conflicting WI.

### Phase 5: Webhook + reliability + admin

- Linear webhook ingestion and signature verification.
- Retry taxonomy, stale recovery, admin CLI, metrics.

---

## 16. Rollback Plan

### Runtime rollback for future implementation

1. Pause project scheduling via admin CLI.
2. Stop dispatcher from launching new workers.
3. Let active workers finish or cancel selected runs.
4. Release stale locks only after verifying no active worker owns them.
5. Remove Linear `agent:queued` / `agent:running` labels if they no longer reflect reality.
6. Keep Legion task docs and PRs as evidence; do not delete raw task history.
7. If a PR must be abandoned, close with reason and write Linear comment.

### Design rollback for this RFC task

Revert `docs/linear-legion-scheduler/**` and `.legion/tasks/linear-legion-scheduler-rfc/**` if the design direction is abandoned. No runtime state exists in this task.

---

## 17. Testing Strategy

### Unit tests

- label parser and issue eligibility;
- dependency graph, cycle detection, and `isBlockerSatisfied()` terminal policy;
- ready candidate explain-skip;
- lock conflict detection;
- run state transition validation;
- webhook signature verification and dedupe.

### Integration tests

- mocked Linear project snapshot -> ready list;
- claim transaction under concurrent workers;
- worker result parser and Legion evidence verifier;
- GitHub PR state sync;
- Linear writeback idempotency.

### End-to-end smoke

- test Linear project with 3-5 WI and blocker chain;
- one WI runs through Legion dry-run / small docs change;
- PR tracking plus Legion evidence verifier move run to done;
- downstream WI becomes ready.
- negative case: PR merged but required Legion evidence missing keeps downstream locked.

### Manual validation

- Admin can answer why a WI did not run.
- Human reading Linear can see current run status and next owner.
- Scheduler restart does not duplicate active runs.

---

## 18. Work Items

The implementation plan is intentionally 8 WI, not 20. Each WI should be independently reviewable but large enough to deliver a meaningful layer.

| WI | Title | Depends on |
|---|---|---|
| [WI-01](work-items/WI-01-linear-wi-contract.md) | Linear WI contract and scheduling policy | none |
| [WI-02](work-items/WI-02-scheduler-core-state.md) | Scheduler core service and durable state | WI-01 |
| [WI-03](work-items/WI-03-linear-graph-scanner.md) | Linear API integration and ready graph scanner | WI-01, WI-02 |
| [WI-04](work-items/WI-04-legion-worker-runner.md) | Legion task mapping and worker runner | WI-01, WI-02 |
| [WI-05](work-items/WI-05-delivery-pr-writeback.md) | PR tracking and Linear delivery writeback | WI-04 |
| [WI-06](work-items/WI-06-parallel-dispatch-locks.md) | Parallel dispatch and resource locks | WI-02, WI-03, WI-04 |
| [WI-07](work-items/WI-07-webhooks-retry-recovery.md) | Webhooks, retries, and stale recovery | WI-03, WI-05, WI-06 |
| [WI-08](work-items/WI-08-operations-security.md) | Admin CLI, observability, and security hardening | WI-02-WI-07 |

---

## 19. Open Questions

- Should the first production version use Linear Agent Sessions API, or start with normal app actor + comments/labels and add sessions later? Recommendation: start with app actor and keep Agent Sessions as an enhancement unless the workspace already depends on agent delegation UX.
- Should workflow orchestration use Temporal immediately? Recommendation: no for MVP; keep an interface that can move to Temporal after the run state model is proven.
- How much Linear issue contract should be required before auto-run? Decision for MVP: require `contract:stable` for implementation runs. A future brainstorm-only mode must be a separate run kind and cannot unlock implementation downstream by itself.

---

## 20. References

- Legion task plan: `.legion/tasks/linear-legion-scheduler-rfc/plan.md`
- Research notes: `.legion/tasks/linear-legion-scheduler-rfc/docs/research.md`
- Work item docs: `docs/linear-legion-scheduler/work-items/`
- Relevant Legion truths:
  - `README.md`
  - `skills/legion-workflow/SKILL.md`
  - `skills/git-worktree-pr/SKILL.md`
  - `.legion/wiki/patterns.md`
