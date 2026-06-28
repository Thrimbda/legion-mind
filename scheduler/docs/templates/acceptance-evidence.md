# Scheduler 验收证据模板

## 元信息

| 字段 | 值 |
|---|---|
| 日期 / 时间 | |
| 操作人 | |
| Repo commit | |
| 工作目录 | |
| Node version | |
| Scheduler DB path | |
| Secret file path | `secrets/linear-scheduler.sops.yaml` |
| Secret injection method | `sops exec-env` |

## 命令记录

| 阶段 | 命令 | 结果 | 输出 artifact / 备注 |
|---|---|---|---|
| 本地测试 | | PASS / FAIL / BLOCKED | |
| Fixture scan | | PASS / FAIL / BLOCKED | |
| Fixture dispatch | | PASS / FAIL / BLOCKED | |
| Linear live scan | | PASS / FAIL / BLOCKED | |
| GitHub PR tracking | | PASS / FAIL / BLOCKED | |
| Worker E2E | | PASS / FAIL / BLOCKED | |

## Linear 证据

| 字段 | 值 |
|---|---|
| Project ID | |
| Project name | |
| Team key | |
| Ready 数量 | |
| Skipped 数量 | |
| Cycles | |
| 非预期分类 | |

| Issue | 预期 | 实际 | 是否通过 | 备注 |
|---|---|---|---|---|
| | | | | |

## GitHub 证据

| PR URL | Head SHA | Checks | Review | merge / close state | 预期 scheduler decision | 实际 scheduler decision |
|---|---|---|---|---|---|---|
| | | | | | | |

## Scheduler 证据

| 字段 | 值 |
|---|---|
| Run ID | |
| Attempt ID | |
| Trace ID | |
| Task ID | |
| Lock keys | |
| Outbox side effects | |
| 最终 run state | |
| Delivery gate 状态 | |
| Evidence 状态 | |
| Terminal 类型 | |

## 发现的 Blockers

| Blocker | 严重程度 | Owner | 下一步 |
|---|---|---|---|
| | | | |

## 决策

- 决策：PASS / FAIL / BLOCKED
- 原因：
- 后续 owner：
- 下次 review 日期：

## 脱敏检查

- [ ] 未包含 token values。
- [ ] 未包含 private key material。
- [ ] 未复制未脱敏的 sensitive payload。
- [ ] Artifact paths 均为 repo-local。
