# Linear + Legion Scheduler

本目录是 Linear + Legion scheduler 原型的独立 npm project。它刻意与根 `lgmind` package 分离，避免 scheduler runtime code 放进根 `scripts/`，也不会随根 package 发布。

## 目录结构

| 路径 | 用途 |
|---|---|
| `src/cli.ts` | health、reconcile、run inspect、retry/cancel、locks、project pause/resume 和 fixture flows 的 admin/debug command |
| `src/admin.ts` | project controls、run inspection、带 audit 的 retry/cancel/lock release、project health 和 security validation |
| `src/observability.ts` | structured log context、secret redaction 和 in-process metrics snapshots |
| `src/scanner.ts` | Linear project snapshot adapter、dependency graph、ready/skipped scanner 和 dry-run report |
| `src/state-machine.ts` | 中央 run state machine 和 terminal-state helpers |
| `src/sqlite-store.ts` | SQLite migrations、repository APIs、claim transaction、locks、outbox 和 debug service |
| `src/task-id.ts` | Linear identifier 到 Legion task id 的 deterministic mapping |
| `src/worker-runner.ts` | OpenCode-only worker prompt、native startup processing、launcher、result parser 和 Legion evidence verifier |
| `src/pr-tracker.ts` | GitHub PR snapshot adapter、PR delivery decision mapping 和 Linear native writeback outbox enqueueing |
| `src/resource-locks.ts` | Resource lock parser、canonical key derivation 和 conflict matrix |
| `src/dispatcher.ts` | 带 capacity limits、waiting visibility 和 stale lock hooks 的 parallel dispatcher planning/execution |
| `src/retry-policy.ts` | Failure taxonomy、retry classification 和 deterministic bounded backoff |
| `src/recovery.ts` | Stale active run detection、worker liveness probe boundary 和 retry/terminal recovery executor |
| `src/webhook.ts` | Linear webhook raw-body signature verification、dedupe persistence、event routing 和可选 Node HTTP handler |
| `tests/linear-scheduler-core.test.ts` | Scheduler core regression tests |
| `tests/linear-graph-scanner.test.ts` | Scanner graph、terminal blocker、skipped reason 和 dry-run CLI tests |
| `tests/linear-worker-runner.test.ts` | Worker runner prompt、native outbox、fake OpenCode launch、cancel 和 evidence verifier tests |
| `tests/linear-pr-tracker.test.ts` | PR state mapping、terminal gate、Linear writeback idempotency 和 fixture CLI tests |
| `tests/linear-dispatcher.test.ts` | Resource lock parser、fair scheduling 和 parallel dispatcher regression tests |
| `tests/linear-reliability.test.ts` | Webhook signature/dedupe、retry policy、native stop 和 stale recovery regression tests |
| `tests/linear-admin-observability.test.ts` | Admin controls、project pause/security block、redaction、metrics 和 PermissionChange regression tests |
| `tests/fixtures/project.json` | scan/dispatch fixture commands 使用的 fake Linear project snapshot |
| `docs/production-acceptance-checklist.md` | sandbox-first production-like acceptance checklist |

## 命令

从 repository root 使用 `--prefix` 运行：

```bash
npm --prefix scheduler test
npm --prefix scheduler run health -- --db :memory:
npm --prefix scheduler run debug -- reconcile --project <linear-project-id> --db .cache/linear-scheduler/dev.sqlite
npm --prefix scheduler run debug -- runs list --db .cache/linear-scheduler/dev.sqlite
npm --prefix scheduler run debug -- run inspect <run-id> --db .cache/linear-scheduler/dev.sqlite
npm --prefix scheduler run debug -- run retry <run-id> --reason "operator reason" --db .cache/linear-scheduler/dev.sqlite
npm --prefix scheduler run debug -- run cancel <run-id> --reason "operator reason" --db .cache/linear-scheduler/dev.sqlite
npm --prefix scheduler run debug -- locks list --db .cache/linear-scheduler/dev.sqlite
npm --prefix scheduler run debug -- locks release <lock-key> --run <run-id> --reason "operator reason" --db .cache/linear-scheduler/dev.sqlite
npm --prefix scheduler run debug -- project pause <linear-project-id> --reason "maintenance window" --db .cache/linear-scheduler/dev.sqlite
npm --prefix scheduler run debug -- project resume <linear-project-id> --reason "maintenance complete" --db .cache/linear-scheduler/dev.sqlite
npm --prefix scheduler run debug -- project health <linear-project-id> --db .cache/linear-scheduler/dev.sqlite
npm --prefix scheduler run debug -- scan fixture --fixture tests/fixtures/project.json --db .cache/linear-scheduler/dev.sqlite
npm --prefix scheduler run debug -- scan project --project <linear-project-id> --db .cache/linear-scheduler/dev.sqlite
npm --prefix scheduler run debug -- dispatch fixture --fixture tests/fixtures/project.json --db .cache/linear-scheduler/dev.sqlite --parallel-repos legion-mind --global-concurrency 4
npm --prefix scheduler run debug -- worker dispatch --run <run-id> --attempt <attempt-id> --repo <repo-path> --db .cache/linear-scheduler/dev.sqlite
npm --prefix scheduler run debug -- delivery track --run <run-id> --repo <repo-path> --pr-url <github-pr-url> --db .cache/linear-scheduler/dev.sqlite
```

也可以在 `scheduler/` 目录内运行：

```bash
npm test
npm run health -- --db :memory:
npm run debug -- events list --run <run-id> --db .cache/linear-scheduler/dev.sqlite
npm run debug -- run inspect <run-id> --db .cache/linear-scheduler/dev.sqlite
npm run debug -- project pause <linear-project-id> --reason "maintenance window" --db .cache/linear-scheduler/dev.sqlite
npm run debug -- project health <linear-project-id> --db .cache/linear-scheduler/dev.sqlite
npm run debug -- scan project --project <linear-project-id> --db .cache/linear-scheduler/dev.sqlite
npm run debug -- dispatch fixture --fixture tests/fixtures/project.json --db .cache/linear-scheduler/dev.sqlite --parallel-repos legion-mind --global-concurrency 4
npm run debug -- worker dispatch --run <run-id> --attempt <attempt-id> --repo <repo-path> --db .cache/linear-scheduler/dev.sqlite
npm run debug -- delivery track --run <run-id> --repo <repo-path> --fixture tests/fixtures/pr-open.json --db .cache/linear-scheduler/dev.sqlite
```

`scan project` 默认通过 `LINEAR_API_KEY` 使用 Linear GraphQL API 读取 Linear。它只持久化 `work_item_snapshots` 并打印 dry-run report；不会 claim runs、启动 workers、设置 delegates、创建 AgentSessions，也不会写 Linear labels/comments。

`reconcile` 是 project scan 的 admin spelling。它会尊重 `project_controls` 中的 durable project controls，因此 paused 或 `security_blocked` project 在任何新 worker claim 前会被报告为 skipped。

`project pause` / `project resume` 会持久化 scheduler-local project controls，并写入 `scheduler_events` audit entries。Pause 会阻止该 project 的新 claims / worker launch，但不会取消 active runs；使用 `run inspect` 继续跟踪，或用 `run cancel --reason ...` 明确标记 terminal non-success。

`run retry`、`run cancel` 和 `locks release` 都要求非空 `--reason`，并会在修改 run/attempt/lock state 前写 admin audit events。`run inspect` 会展示 run row、evaluated snapshot、attempts、resource locks、event timeline、outbox rows、AgentSession id、last activity、native stop request 和 terminal success/non-success reason。

CLI JSON output 会通过 `src/observability.ts` 做 redaction，因此 token-like values、Authorization headers、signatures 和 signed URL query parameters 默认不会打印出来。

`worker dispatch` 会消费一个 pending `worker_dispatch` outbox row，并用生成的 prompt artifact 非交互式启动 OpenCode。它会拒绝在 native startup outbox rows sent 前启动，只通过 argv 传递 prompt artifact path，对 child environment 使用 allowlist，记录 heartbeat / attempt exit data，把 stdout/stderr 写到 repo-local `.cache/linear-scheduler/worker-logs/` artifact，解析 worker result block，并运行 scheduler-side Legion evidence verifier。它刻意只支持 OpenCode。Worker 报告 `done` 后会先停在 `in_review`，直到 PR delivery tracking 验证 GitHub terminal state。

`delivery track` 会通过 fixture 或 GitHub REST adapter 观察一个 GitHub PR snapshot，更新 run delivery state，并为 PR external URL、AgentActivity、Agent Plan、coarse issue state/labels 和 final summary enqueue idempotent Linear native writeback rows。只有 PR merged + checks/review resolved + Legion evidence PASS + `git-worktree-pr` lifecycle complete 后，它才会标记 `done`。

`dispatch fixture` 会在 global/project/repo capacity limits 和 resource locks 下规划并 claim 多个 ready WI。它只写 scheduler DB rows/events/outbox jobs；不会自己启动 OpenCode workers。等待项会以 `waiting_for_lock`、`waiting_for_capacity` 或 `waiting_for_blocker` 报告，不会被标记为 running。

## Production-like 验收

Production-like 验收必须 sandbox-first。在触碰任何真实项目之前，先阅读主 runbook：`docs/linear-legion-scheduler/production-acceptance-runbook.md`，并使用 scheduler checklist：`scheduler/docs/production-acceptance-checklist.md`。

命令安全说明：

- `scan project` 会读取外部 Linear，并写 scheduler DB snapshots；它不会写 Linear，也不会启动 workers。
- `delivery track` 会读取外部 GitHub，写 scheduler DB delivery state，并 enqueue native Linear writeback rows；它本身不会发送 Linear writeback。
- `dispatch fixture` 会创建 runs、attempts、locks、events 和 outbox rows，因此会修改 scheduler DB；它不会启动 workers。
- `worker dispatch` 会启动 OpenCode，并写 repo-local prompt/log artifacts；只能用于明确批准的 sandbox WI。

当前 production blockers 必须保持显式可见：没有 production Linear native writeback adapter，没有 live `dispatch project` command，也没有 packaged webhook server/outbox runner。

## 安全 readiness checklist

- Linear production auth 应优先使用 OAuth / app actor / client credentials；personal API keys 只适合 prototype。
- Production writeback 应在支持时使用 `actor=app`。
- 只有 app 用作 `Issue.delegate` 时才申请 `app:assignable`；只有需要用户在 Linear editor 中 mention app 时才申请 `app:mentionable`。
- `Issue.delegate` 永远不替代 human assignee / owner。
- PermissionChange / app access revocation 必须 pause 或 `security_blocked` affected projects，直到 scopes 重新验证通过。
- Linear webhooks 必须对 raw body 验证 signatures。
- GitHub tokens 必须限制到 required repo(s) 和 PR/check/review operations；不要绕过 branch protection。
- Workers 只应接收 WI context、repo path、prompt artifact path 和该 WI 需要的最小 credentials；不得接收 scheduler DB superuser credentials。
- Raw webhook payloads 和 worker logs 应 sanitizied，或被当作 sensitive data 处理；`.cache/linear-scheduler/` 下的 development artifacts 是 repo-local，不应未经审查发布。
- 生产部署前必须明确 log retention 和 data retention policy。

Scheduler 仍是 local prototype。它能连接 Linear 做 dry-run project scanning，能 claim parallel non-conflicting fixture WIs，有 single-worker OpenCode runner path、PR delivery tracking、webhook ingestion primitives、bounded retry policy、stale-run recovery，以及带 audit 的 admin/security hardening layer。它仍未实现 production native Linear API adapters，也没有 metrics dashboard/exporter。
