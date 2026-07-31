# PR Tracking 与 Linear Delivery Writeback

> **WI**: [WI-05 PR tracking 与 Linear delivery writeback](work-items/WI-05-delivery-pr-writeback.md)<br>
> **状态**: WI-05 交付物<br>
> **运行时**: 独立 `scheduler/` npm project<br>
> **设计来源**: [RFC](rfc.md), [WI-04 worker runner](worker-runner.md)

## 1. WI-05 交付内容

WI-05 增加 scheduler-side delivery layer，用来在 worker 产出 PR 后观察 GitHub PR state。Worker runner 仍能解析 PR URL 并验证 Legion evidence，但不再把 worker 自报的 `done` 结果单独视为 terminal success。现在 terminal success 必须由 PR tracker 组合判断：

1. 当前 run 的 `runs.pr_url` tracking metadata；
2. GitHub PR snapshot：open/draft、checks、review、merged/closed state；
3. scheduler-side Legion evidence verifier result；
4. Scheduler 对 Git worktree registry、固定 worktree path、fetch、默认分支、remote base、dirty state 与 merge commit ancestry 的直接观测；
5. 最终 Linear native writeback 被幂等排队。

交付源码：

| 路径 | 用途 |
|---|---|
| `scheduler/src/pr-tracker.ts` | PR snapshot model、GitHub adapter boundary、PR delivery decision mapping、terminal success/non-success gate 和 Linear writeback outbox enqueueing |
| `scheduler/src/sqlite-store.ts` | 提供 run-level PR metadata、run state、outbox 与 evaluated snapshot lookup |
| `scheduler/src/git-lifecycle.ts` | 直接执行并记录 cleanup/refresh 与 merge ancestry 观测，不读取 worker 自报 lifecycle JSON |
| `scheduler/src/worker-runner.ts` | 把 worker `done` 停在 `in_review`，把 worker PR URL 写入当前 run，并且不接收 worker 自报 lifecycle JSON |
| `scheduler/src/cli.ts` | 增加支持 fixture 或 GitHub REST mode 的 `delivery track` debug command |
| `scheduler/tests/linear-pr-tracker.test.ts` | 覆盖 PR state mapping、terminal gate、writeback idempotency、evidence/lifecycle negative cases 和 CLI fixture |

## 2. PR delivery decision model

`trackPrDelivery(store, client, options)` 是 scheduler entry point。Tracker 从显式 URL 或 `runs.pr_url` 读取当前 tracking URL，获取 GitHub snapshot，并把 snapshot URL 更新回该 run 的 metadata；这里不存在 task-level compare-and-bind 或跨 run identity gate。随后 tracker 记录 `pr_snapshot_observed` 并应用集中 decision table：

| PR snapshot | Run effect | Downstream unlock |
|---|---|---|
| open / draft / pending checks / review required | `queued/running/blocked -> in_review`；`delivery_gate_status = pending`；enqueue PR external URL 和 in-review activity/plan/state/labels | no |
| checks failing | `blocked`, `failure_type = pr_blocked` | no |
| review changes requested | `blocked`, `failure_type = pr_blocked` | no |
| merged + checks/review resolved + Legion evidence PASS + lifecycle complete | `done`, `delivery_gate_status = passed`, `evidence_status = passed`, locks released, downstream reconcile event recorded, enqueue final response/comment/state/labels | yes |
| merged + missing Legion evidence | 当前 run final non-success（`failed`），preserve `failure_type = legion_evidence_missing`，release locks，enqueue final response/comment；不得自动为证据修复创建 follow-up PR，后续仓库改动等待用户明确授权 | no |
| merged + direct cleanup/refresh/ancestry observation incomplete | `blocked`, `failure_type = lifecycle_blocked` | no |
| closed-unmerged / rejected / duplicate + direct cleanup/refresh complete | terminal non-success（`failed`），delivery gate failed，locks released，enqueue final non-success writeback | no |
| closed-unmerged + cleanup/refresh incomplete | `blocked`, `failure_type = lifecycle_blocked`; only external lifecycle retry is allowed | no |
| cancelled | terminal non-success（`cancelled`） | no |
| abandoned / superseded | terminal non-success（`abandoned`） | no |

仅凭名称 `done` 仍然不够。Downstream 只会在 `state = done`、`delivery_gate_status = passed`、`evidence_status = passed` 同时成立时，通过 `SchedulerStore.isBlockerSatisfiedByRun()` unlock。

## 3. GitHub adapter boundary

Tracker 使用一个小 adapter interface：

```ts
interface GitHubPrClient {
  fetchPullRequest(prUrl: string): Promise<PullRequestSnapshot>;
}
```

当前有两个 adapters：

- `StaticPullRequestClient`：用于 fixtures 和 unit/integration tests。
- `createGitHubRestPullRequestClient()`：用于 GitHub REST debug/prototype。它会读取 PR、head SHA 的 check-runs，以及 PR reviews。Token 可通过 `GITHUB_TOKEN` 或 CLI `--token-env` override 提供。

Unit tests 不需要 network access。Production policy 仍应在 long-running operation 前提供 least-privilege GitHub token scope 和 rate-limit handling。

## 4. Linear native writeback outbox

WI-05 保持 Linear 只是 presentation/control plane。所有 writeback 都通过 `native_outbox` 排队，并使用 deterministic idempotency keys，避免 repeated reconcile 刷屏 activities/comments。

新增到 native outbox contract 的 side-effect payloads：

| Side effect | 预期 adapter 行为 |
|---|---|
| `update_issue_state` | 把 scheduler state（`in_review`, `blocked`, `done`, terminal non-success）映射到配置好的 Linear workflow state，例如 In Review / Done |
| `update_issue_labels` | 添加 / 移除 coarse labels，例如 `agent:running`, `agent:blocked`, `agent:needs-human`, `agent:done` |
| `create_comment` | 当需要 durable comment 时，创建 final summary 或 compatibility comment |

既有 side effects 仍继续使用：

- `create_activity`：用于 PR created / blocked / error / final progress；
- `update_external_urls`：用于 GitHub PR URL；
- `update_plan`：用于 session checklist；
- `final_response`：用于 terminal native agent response。

Final summary payloads 包含 PR URL、Legion task path、result、checks/review summary、`git-worktree-pr` lifecycle summary、downstream reconcile status 和 terminal kind。

## 5. Worker runner integration

WI-05 之前，`processOpenCodeWorkerDispatch()` 可以在 evidence verification 后，把 worker 自报的 `done` 结果转为 `done`。WI-05 改变了这个边界：

1. Worker `done` + evidence PASS 现在变成 `in_review`，并设置 `evidence_status = passed`。
2. Worker dispatch outbox row 标记为 sent，并记录 `pr_tracking_required` event。
3. PR tracker 后续必须验证 GitHub merged/checks/review state，才能给出 terminal success。

这可以防止 worker self-attestation 解锁 downstream WIs。PR open 时修订仍可在当前 delivery PR 上推进；PR merged/closed 后，Tracker 只观察 cleanup/refresh、执行纯外部动作和只读验证，不自动写回 repo 或创建 closeout/follow-up PR。若 merged 后发现 Legion evidence 缺失，则当前 run 直接写入 final non-success 并释放 locks；Scheduler 报告缺口并等待用户明确授权后续仓库改动，而不建立跨 run/task 的 PR 禁令。

## 6. Debug 命令

Fixture mode：

```bash
npm --prefix scheduler run debug -- delivery track \
  --run <run-id> \
  --repo <repo-path> \
  --fixture tests/fixtures/pr-open.json \
  --db .cache/linear-scheduler/dev.sqlite
```

GitHub REST mode：

```bash
GITHUB_TOKEN=... npm --prefix scheduler run debug -- delivery track \
  --run <run-id> \
  --repo <repo-path> \
  --base-ref origin/master \
  --pr-url https://github.com/OWNER/REPO/pull/123 \
  --db .cache/linear-scheduler/dev.sqlite
```

该命令会更新 scheduler DB state，并 enqueue native writeback rows。它不会直接调用 Linear；native outbox processing 仍由 adapter 驱动。

## 7. 后续 WI 边界

- WI-06 添加 parallel dispatch 和 resource locks 时，可以把 `run_terminal_success` 作为默认 downstream unlock signal。
- WI-07 仍负责 webhook ingestion、retry/backoff、stale recovery 和 long-running native outbox workers。
- WI-08 仍负责 production-grade GitHub/Linear token policy、metrics、admin UX 和 security hardening。
