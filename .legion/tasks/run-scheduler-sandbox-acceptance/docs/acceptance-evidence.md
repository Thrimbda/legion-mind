# Scheduler Sandbox 验收证据

## 元信息

| 字段 | 值 |
|---|---|
| 日期 / 时间 | 2026-07-01 |
| 操作人 | OpenCode agent |
| Repo commit | `b1c2b16` |
| 工作目录 | `.worktrees/run-scheduler-sandbox-acceptance/` |
| Node version | 未单独记录；scheduler tests 使用当前环境成功运行 |
| Scheduler DB path | `.cache/linear-scheduler/acceptance-fixture.sqlite`, `.cache/linear-scheduler/stage3-fixture.sqlite` |
| Secret file path | `secrets/linear-scheduler.sops.yaml` |
| Secret injection method | `sops exec-env` |

## 命令记录

| 阶段 | 命令 | 结果 | 输出 artifact / 备注 |
|---|---|---|---|
| 本地测试 | `npm --prefix scheduler test` | PASS | 57/57 |
| Health | `npm --prefix scheduler run health -- --db :memory:` | PASS | `ok: true`, core tables present, no active runs/outbox |
| Fixture scan | `npm --prefix scheduler run debug -- scan fixture --fixture tests/fixtures/project.json --db :memory:` | PASS | ready 4, skipped 6, cycles 0 |
| Fixture dispatch | `npm --prefix scheduler run debug -- dispatch fixture --fixture tests/fixtures/project.json --db .cache/linear-scheduler/acceptance-fixture.sqlite --parallel-repos legion-mind --global-concurrency 4 --per-repo-concurrency 4` | PASS | claimed 2, waiting 3, no worker launch |
| Linear live scan | `sops exec-env secrets/linear-scheduler.sops.yaml 'npm --prefix scheduler run debug -- scan project ...'` | BLOCKED | `secrets/linear-scheduler.sops.yaml` missing; `secrets/` directory absent |
| Stage 3 fixture dispatch | `npm --prefix scheduler run debug -- dispatch fixture --fixture tests/fixtures/project.json --db .cache/linear-scheduler/stage3-fixture.sqlite --parallel-repos legion-mind --global-concurrency 4 --per-repo-concurrency 4` | PASS | claimed 2, waiting 3, no worker launch |
| GitHub PR tracking | `sops exec-env secrets/linear-scheduler.sops.yaml 'npm --prefix scheduler run debug -- delivery track ...'` | BLOCKED | missing secret file; no `SCHEDULER_RUN_ID` evidence available |
| Worker E2E | `sops exec-env secrets/linear-scheduler.sops.yaml 'npm --prefix scheduler run debug -- worker dispatch ...'` | BLOCKED | missing secret file, no explicit worker approval, no run/attempt/outbox evidence |

## Linear 证据

| 字段 | 值 |
|---|---|
| Project ID | live sandbox 未验证；fixture project `project-scheduler-sandbox` |
| Project name | fixture `Legion Scheduler Sandbox` |
| Team key | live sandbox 未验证 |
| Ready 数量 | fixture ready 4 |
| Skipped 数量 | fixture skipped 6 |
| Cycles | 0 |
| 非预期分类 | none in fixture scan |

| Issue | 预期 | 实际 | 是否通过 | 备注 |
|---|---|---|---|---|
| `SBOX-READY` | ready | ready | yes | fixture |
| `SBOX-BLOCKED-BY-MANUAL` | manual blocker satisfied 后 ready | ready | yes | fixture |
| `SBOX-LOCK-A` | ready but may wait on lock in dispatch | waiting_for_lock in dispatch | yes | fixture dispatch |
| `SBOX-LOCK-B` | ready but may wait on lock in dispatch | waiting_for_lock in dispatch | yes | fixture dispatch |
| `SBOX-CONTRACT-MISSING` | skipped `contract_not_stable` | skipped `contract_not_stable` | yes | fixture |
| `SBOX-DEPENDENCY-BLOCKED` | skipped / waiting for blocker | skipped `dependency_blocked`; dispatch `waiting_for_blocker` | yes | fixture |
| `SBOX-MANUAL-DONE` | non-candidate manual Done | skipped `state_not_candidate` | yes | fixture |
| `SBOX-NEEDS-HUMAN` | skipped `human_gate` | skipped `human_gate` | yes | fixture |
| `SBOX-RISK-MISSING` | skipped `risk_missing` | skipped `risk_missing` | yes | fixture |
| `SBOX-UPSTREAM-ACTIVE` | non-candidate active upstream | skipped `state_not_candidate` | yes | fixture |

## GitHub 证据

| PR URL | Head SHA | Checks | Review | merge / close state | 预期 scheduler decision | 实际 scheduler decision |
|---|---|---|---|---|---|---|
| live sandbox PR | not collected | not collected | not collected | not collected | read-path tracking should classify without false Done | BLOCKED: missing secret file and no run row evidence |

## Scheduler 证据

| 字段 | 值 |
|---|---|
| Run ID | fixture dispatch generated local run ids; live `SCHEDULER_RUN_ID` not available |
| Attempt ID | fixture dispatch generated local attempt ids; live `SCHEDULER_ATTEMPT_ID` not available |
| Trace ID | not applicable |
| Task ID | `run-scheduler-sandbox-acceptance` |
| Lock keys | `area:legion-mind/api`, `area:legion-mind/docs` |
| Outbox side effects | fixture DB only; live native writeback not sent |
| 最终 run state | live run not executed |
| Delivery gate 状态 | live PR tracking blocked |
| Evidence 状态 | this evidence records local PASS + live BLOCKED |
| Terminal 类型 | `BLOCKED: missing sandbox/live prerequisites` |

## 发现的 Blockers

| Blocker | 严重程度 | Owner | 下一步 |
|---|---|---|---|
| `secrets/linear-scheduler.sops.yaml` missing | high | operator | Create encrypted sandbox-only secret file with sops + age |
| `secrets/` directory absent in worktree | high | operator | Add or provide encrypted secret material outside commit scope |
| `age` CLI unavailable | medium | operator | Install `age` or confirm sops age key access works without CLI |
| Stage 4 missing `SCHEDULER_RUN_ID` evidence | high | operator / scheduler | Create/select sandbox run row before `delivery track` |
| Stage 5 lacks explicit worker approval and run/attempt/outbox prerequisites | high | operator | Approve a low-risk sandbox WI and provide run/attempt/outbox state if worker E2E is desired |
| production native writeback adapter missing | expected blocker | implementation owner | Separate implementation task |
| live `dispatch project` missing | expected blocker | implementation owner | Separate implementation task |
| packaged webhook server / outbox runner missing | expected blocker | implementation owner | Separate implementation task |

## 决策

- 决策：BLOCKED
- 原因：本地基线和 fixture dispatch PASS；live sandbox read-path / GitHub tracking / worker E2E 因 missing secret file、missing run row evidence 和 missing worker approval 前置条件被阻塞。
- 后续 owner：operator 准备 sandbox secrets/resources；implementation owners 关闭 runtime blockers。
- 下次 review 日期：完成 sandbox secret 和 live run prerequisites 后。

## 脱敏检查

- [x] 未包含 token values。
- [x] 未包含 private key material。
- [x] 未复制未脱敏的 sensitive payload。
- [x] Artifact paths 均为 repo-local。
