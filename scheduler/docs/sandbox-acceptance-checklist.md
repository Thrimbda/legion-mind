# Linear + Legion Scheduler Sandbox 验收步骤

## 目标

- [ ] 只做 sandbox-first production-like acceptance。
- [ ] 不碰 production Linear project / GitHub repo / token。
- [ ] 不把 sandbox PASS 当成 production-ready。
- [ ] 最终结论只能是 `PASS: sandbox read-path only`、`BLOCKED: missing prerequisites / runtime capability` 或 `FAIL: unsafe behavior`。

## 0. 前置准备

- [ ] 确认当前仓库在预期 commit / branch。
- [ ] 确认 Node version `>=22.6.0`。
- [ ] 安装 `sops`。
- [ ] 安装 `age`。
- [ ] 准备 repo-local DB 目录：

```bash
mkdir -p .cache/linear-scheduler
```

- [ ] 设定 sandbox DB：

```text
.cache/linear-scheduler/production-acceptance-sandbox.sqlite
```

## 1. 准备 Linear Sandbox

- [ ] 创建 Linear sandbox project，例如：

```text
Legion Scheduler Sandbox
```

- [ ] 确认这是非 production project。
- [ ] 创建 / 确认 labels：

```text
agent:ready
contract:stable
contract:needs-review
agent:needs-human
repo:legion-mind
risk:low
risk:medium
risk:high
area:api
area:docs
area:ui
scheduler:sandbox
```

- [ ] 按模板创建 sandbox issues：

```text
scheduler/docs/templates/linear-sandbox-issues.md
```

- [ ] 覆盖 ready issue 场景。
- [ ] 覆盖 manual Done blocker 场景。
- [ ] 覆盖 dependency blocked 场景。
- [ ] 覆盖 needs human 场景。
- [ ] 覆盖 contract missing 场景。
- [ ] 覆盖 risk missing 场景。
- [ ] 覆盖 lock conflict A 场景。
- [ ] 覆盖 lock conflict B 场景。

## 2. 准备 GitHub Sandbox

- [ ] 创建 GitHub sandbox repo，例如：

```text
linear-legion-scheduler-sandbox
```

- [ ] 准备 least-privilege token，只 scoped 到 sandbox repo。
- [ ] 准备 open / pending checks PR。
- [ ] 准备 draft PR。
- [ ] 准备 checks failing PR。
- [ ] 准备 review changes requested PR。
- [ ] 准备 merged PR。
- [ ] 准备 closed unmerged PR。

## 3. 准备 encrypted secret

- [ ] 创建 secret 文件：

```bash
mkdir -p secrets
cp scheduler/docs/templates/secrets.linear-scheduler.sops.yaml secrets/linear-scheduler.sops.yaml
```

- [ ] 填入 sandbox-only 值：

```text
LINEAR_API_KEY
LINEAR_PROJECT_ID
GITHUB_TOKEN
GITHUB_OPEN_PR_URL
SCHEDULER_DB=.cache/linear-scheduler/production-acceptance-sandbox.sqlite
SCHEDULER_REPO_PATH=<repo path>
SCHEDULER_RUN_URL_BASE=scheduler://runs
```

- [ ] 用 `sops + age` 加密：

```bash
sops --encrypt --age <age-recipient> --in-place secrets/linear-scheduler.sops.yaml
```

- [ ] 确认不提交真实 secret。
- [ ] 确认不解密到 plaintext 文件。

## 4. Stage 0：本地基线

- [ ] 跑 scheduler tests：

```bash
npm --prefix scheduler test
```

- [ ] 跑 health：

```bash
npm --prefix scheduler run health -- --db :memory:
```

- [ ] 跑 fixture scan：

```bash
npm --prefix scheduler run debug -- scan fixture --fixture tests/fixtures/project.json --db :memory:
```

- [ ] 跑 fixture dispatch：

```bash
npm --prefix scheduler run debug -- dispatch fixture --fixture tests/fixtures/project.json --db .cache/linear-scheduler/production-acceptance-sandbox.sqlite --parallel-repos legion-mind --global-concurrency 4 --per-repo-concurrency 4
```

- [ ] 确认 tests pass。
- [ ] 确认 health `ok: true`。
- [ ] 确认 fixture scan ready / skipped / cycles 符合预期。
- [ ] 确认 fixture dispatch 只 claim non-conflicting WIs，不启动 worker。

## 5. Stage 2：Linear live read-path scan

- [ ] 确认 `secrets/linear-scheduler.sops.yaml` 存在且已加密。
- [ ] 确认 `LINEAR_PROJECT_ID` 指向 sandbox project。
- [ ] 执行 Linear live scan：

```bash
sops exec-env secrets/linear-scheduler.sops.yaml 'npm --prefix scheduler run debug -- scan project --project "$LINEAR_PROJECT_ID" --db "$SCHEDULER_DB" --delegate "$LINEAR_DELEGATE_APP_USER_ID" --scheduler-run-url-base "$SCHEDULER_RUN_URL_BASE"'
```

- [ ] 检查 human-gated issue 不应 ready。
- [ ] 检查 contract missing issue 不应 ready。
- [ ] 检查 risk missing issue 不应 ready。
- [ ] 检查 dependency blocked issue 不应 ready。
- [ ] 确认没有 Linear 写入副作用。

## 6. Stage 3：fixture dispatch / lock baseline

- [ ] 使用同一个 sandbox DB 跑 dispatch baseline：

```bash
npm --prefix scheduler run debug -- dispatch fixture --fixture tests/fixtures/project.json --db .cache/linear-scheduler/production-acceptance-sandbox.sqlite --parallel-repos legion-mind --global-concurrency 4 --per-repo-concurrency 4
```

- [ ] 确认 non-conflicting ready WI 被 claim。
- [ ] 确认 lock conflict 保持 waiting。
- [ ] 确认 dependency blocked 保持 waiting / skipped。
- [ ] 确认没有启动 worker。

## 7. Stage 4：GitHub PR tracking

- [ ] 先列出可用 run：

```bash
npm --prefix scheduler run debug -- runs list --db .cache/linear-scheduler/production-acceptance-sandbox.sqlite
```

- [ ] 选择一个 `runId`。
- [ ] 设置 `SCHEDULER_RUN_ID`：

```bash
export SCHEDULER_RUN_ID=<run-id>
```

- [ ] 跑 GitHub PR tracking：

```bash
sops exec-env secrets/linear-scheduler.sops.yaml 'npm --prefix scheduler run debug -- delivery track --run "$SCHEDULER_RUN_ID" --repo "$SCHEDULER_REPO_PATH" --pr-url "$GITHUB_OPEN_PR_URL" --db "$SCHEDULER_DB"'
```

- [ ] 确认 open / draft / pending PR 不会变 Done。
- [ ] 确认 failed checks 会 blocked。
- [ ] 确认 review changes requested 会 blocked。
- [ ] 确认 closed-unmerged 是 terminal non-success。
- [ ] 确认 merged PR 仍要求 Legion evidence + lifecycle evidence。

## 8. Stage 5：Worker E2E，默认不跑

只有全部勾选后才跑：

- [ ] 明确批准启动 OpenCode worker。
- [ ] 目标 WI 是 sandbox-only。
- [ ] 目标 WI 低风险、可回滚。
- [ ] 已有 `SCHEDULER_RUN_ID`。
- [ ] 已有 `SCHEDULER_ATTEMPT_ID`。
- [ ] native startup outbox rows 已 sent，或 sandbox bypass 已记录。
- [ ] 确认不会影响 production repo / branch / issue。
- [ ] 执行 worker dispatch：

```bash
sops exec-env secrets/linear-scheduler.sops.yaml 'npm --prefix scheduler run debug -- worker dispatch --run "$SCHEDULER_RUN_ID" --attempt "$SCHEDULER_ATTEMPT_ID" --repo "$SCHEDULER_REPO_PATH" --db "$SCHEDULER_DB" --timeout-ms 3600000'
```

- [ ] 如果任一前置条件不满足，记录 `BLOCKED`，不要硬跑。

## 9. 填写 evidence

- [ ] 使用模板：

```text
scheduler/docs/templates/acceptance-evidence.md
```

- [ ] 记录命令。
- [ ] 记录结果。
- [ ] 记录 Linear ready / skipped。
- [ ] 记录 GitHub PR decision。
- [ ] 记录 Scheduler run / attempt / lock / outbox 状态。
- [ ] 记录 blockers。
- [ ] 确认无 token values。
- [ ] 确认无 private key material。
- [ ] 确认无未脱敏 payload。
- [ ] 确认 artifact paths 都是 repo-local。

## 10. 停止条件

出现任一项立刻停止：

- [ ] duplicate active run。
- [ ] 没有 `run_terminal_success` 却 downstream unlock。
- [ ] open / failed / missing evidence PR 被标记 Done。
- [ ] worker 触碰 non-sandbox scope。
- [ ] secret 出现在 logs / DB output / evidence。
- [ ] token 权限要求超出 sandbox read-path。
- [ ] operator 无法解释 running / waiting / blocked state。

## 11. 最终结论

- [ ] 如果 Stage 0-4 通过，但 production blockers 仍存在，结论写：

```text
PASS: sandbox read-path only
```

- [ ] 如果缺 secret、run id、worker 前置状态、native adapter、live dispatch 等，结论写：

```text
BLOCKED: missing prerequisites / runtime capability
```

- [ ] 如果出现错误 Done、错误 unlock、secret leak、non-sandbox side effect，结论写：

```text
FAIL: unsafe behavior
```

## 12. 仍不能证明 production-ready 的 blocker

- [ ] no production Linear native writeback adapter。
- [ ] no live `dispatch project`。
- [ ] no packaged webhook server / outbox runner。
- [ ] real worker stop / cancel / cleanup 未证明。
- [ ] metrics / exporter / retention 未证明。
