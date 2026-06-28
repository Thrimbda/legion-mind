# Test Report：准备 Linear Scheduler 生产验收

## 结论

本地无 secret 验证通过。

本任务没有执行任何 live Linear、GitHub、OpenCode 或 secret-backed acceptance。

## 执行命令

### Fixture scanner smoke

```bash
npm --prefix scheduler run debug -- scan fixture --fixture tests/fixtures/project.json --db :memory:
```

结果：PASS

关键观察：

- Ready: `SBOX-READY`, `SBOX-BLOCKED-BY-MANUAL`, `SBOX-LOCK-A`, `SBOX-LOCK-B`。
- Skipped: `SBOX-CONTRACT-MISSING`, `SBOX-DEPENDENCY-BLOCKED`, `SBOX-MANUAL-DONE`, `SBOX-NEEDS-HUMAN`, `SBOX-RISK-MISSING`, `SBOX-UPSTREAM-ACTIVE`。
- Cycles: none。

### Fixture dispatcher smoke

```bash
mkdir -p .cache/linear-scheduler
npm --prefix scheduler run debug -- dispatch fixture --fixture tests/fixtures/project.json --db ../.cache/linear-scheduler/acceptance-fixture.sqlite --parallel-repos legion-mind --global-concurrency 4 --per-repo-concurrency 4
```

结果：PASS

关键观察：

- Claimed: `SBOX-READY`, `SBOX-BLOCKED-BY-MANUAL`。
- Waiting for lock: `SBOX-LOCK-A`, `SBOX-LOCK-B` 等待 `area:legion-mind/api`。
- Waiting for blocker: `SBOX-DEPENDENCY-BLOCKED`。
- 没有启动 workers。

### Health smoke

```bash
npm --prefix scheduler run health -- --db :memory:
```

结果：PASS

输出包含 `ok: true`、核心 scheduler tables、`activeRuns: 0`、`pendingOutbox: 0` 和 `projectControls: 0`。

### Full scheduler regression

```bash
npm --prefix scheduler test
```

结果：PASS

摘要：

```text
tests 57
pass 57
fail 0
duration_ms 908.886944
```

最终 pre-commit rerun：

```text
tests 57
pass 57
fail 0
duration_ms 368.276162
```

### Path verification

首次使用 `scheduler/tests/fixtures/project.json` 的 scanner smoke 失败，因为 `npm --prefix scheduler` 会以 scheduler package path context 执行脚本。当前 docs 和 README 已改为在 `npm --prefix scheduler` 命令中使用 `tests/fixtures/project.json`。

## 未执行

- 针对真实 Linear sandbox 的 `scan project`。
- 针对真实 GitHub sandbox 的 `delivery track --pr-url`。
- 针对真实 OpenCode 的 `worker dispatch`。
- Native Linear writeback。
- Webhook server / outbox runner。

这些仍属于未来 acceptance runbook 的 live/manual stages。

## 新增 artifacts

- `docs/linear-legion-scheduler/production-acceptance-runbook.md`
- `scheduler/docs/production-acceptance-checklist.md`
- `scheduler/docs/runbooks/secrets-sops.md`
- `scheduler/docs/runbooks/linear-sandbox-setup.md`
- `scheduler/docs/runbooks/github-sandbox-setup.md`
- `scheduler/docs/templates/acceptance-evidence.md`
- `scheduler/docs/templates/linear-sandbox-issues.md`
- `scheduler/docs/templates/secrets.linear-scheduler.sops.yaml`
- `scheduler/tests/fixtures/project.json`
- `scheduler/tests/fixtures/` 下的 PR scenario fixtures
