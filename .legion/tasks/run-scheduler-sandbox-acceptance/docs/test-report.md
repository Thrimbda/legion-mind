# 测试报告：Linear Scheduler Sandbox 验收

## 结论

BLOCKED。

本地可执行阶段全部通过；live sandbox 阶段因 `secrets/linear-scheduler.sops.yaml` 缺失、live run row 证据缺失和 Stage 5 worker 前置条件缺失而阻塞。

## 执行命令

### Stage 0: scheduler tests

```bash
npm --prefix scheduler test
```

结果：PASS。

```text
tests 57
pass 57
fail 0
duration_ms 359.669002
```

### Stage 0: health smoke

```bash
npm --prefix scheduler run health -- --db :memory:
```

结果：PASS。输出包含 `ok: true`，核心 scheduler tables，`activeRuns: 0`，`pendingOutbox: 0`。

### Stage 0: fixture scan

```bash
npm --prefix scheduler run debug -- scan fixture --fixture tests/fixtures/project.json --db :memory:
```

结果：PASS。

关键观察：

- Ready: `SBOX-READY`, `SBOX-BLOCKED-BY-MANUAL`, `SBOX-LOCK-A`, `SBOX-LOCK-B`。
- Skipped: `SBOX-CONTRACT-MISSING`, `SBOX-DEPENDENCY-BLOCKED`, `SBOX-MANUAL-DONE`, `SBOX-NEEDS-HUMAN`, `SBOX-RISK-MISSING`, `SBOX-UPSTREAM-ACTIVE`。
- Cycles: none。

### Stage 0 / Stage 3: fixture dispatch

```bash
npm --prefix scheduler run debug -- dispatch fixture --fixture tests/fixtures/project.json --db .cache/linear-scheduler/acceptance-fixture.sqlite --parallel-repos legion-mind --global-concurrency 4 --per-repo-concurrency 4
```

结果：PASS。

```bash
npm --prefix scheduler run debug -- dispatch fixture --fixture tests/fixtures/project.json --db .cache/linear-scheduler/stage3-fixture.sqlite --parallel-repos legion-mind --global-concurrency 4 --per-repo-concurrency 4
```

结果：PASS。

关键观察：

- Claimed: `SBOX-BLOCKED-BY-MANUAL`, `SBOX-READY`。
- Waiting for lock: `SBOX-LOCK-A`, `SBOX-LOCK-B`。
- Waiting for blocker: `SBOX-DEPENDENCY-BLOCKED`。
- No worker launch。

### Stage 1: sandbox secret/tool preflight

```bash
sops --version
age --version
```

结果：PARTIAL / BLOCKED。

- `sops` available: `sops 3.11.0`。
- `age` CLI unavailable: `command not found: age`。
- `secrets/linear-scheduler.sops.yaml` unavailable because `secrets/` directory is absent in the worktree。

### Stage 2: Linear live read-path scan

未执行。

原因：`secrets/linear-scheduler.sops.yaml` 缺失，无法通过 `sops exec-env` 注入 sandbox-only credentials。

### Stage 4: GitHub PR read-path tracking

未执行。

原因：`secrets/linear-scheduler.sops.yaml` 缺失；同时没有可验证的 live `SCHEDULER_RUN_ID` 前置状态。

### Stage 5: OpenCode 单 WI sandbox E2E

未执行。

原因：缺少 explicit worker approval、`SCHEDULER_RUN_ID`、`SCHEDULER_ATTEMPT_ID`、native startup outbox 前置状态和 sandbox secret 注入。

## 选择这些验证的原因

- Stage 0 命令证明当前 package、fixtures 和 CLI 基线仍可运行。
- Stage 3 独立 DB 的 fixture dispatch 证明 lock/blocker dispatch 语义，不触发 worker。
- Live stages 在缺少 secret/run row 时必须阻塞；这是 runbook 的安全要求，不应绕过。

## 临时产物

- `.cache/linear-scheduler/acceptance-fixture.sqlite`
- `.cache/linear-scheduler/stage3-fixture.sqlite`

这些是 repo-local 临时验证 DB，不提交。
