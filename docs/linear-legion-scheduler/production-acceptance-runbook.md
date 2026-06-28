# Linear + Legion Scheduler 生产验收运行手册

## 目的

这份 runbook 用来准备并指导 **sandbox-first 的 production-like acceptance**。它不是生产上线批准书，也不能单独证明 scheduler 已经可以无人值守运行。

目标是安全暴露真实集成缺口：

- Linear 真实项目读取行为。
- GitHub 真实 PR 读取行为。
- Scheduler DB 的 snapshot、run、event、outbox 行为。
- 当前仍缺失的生产能力，必须作为 blocker 明确记录。

## 当前验收边界

来自 `accept-linear-scheduler-overall` 的当前结论：

- 本地原型：已通过。
- 生产无人值守调度器：未通过。
- 当前策略：先 sandbox，分阶段推进，全程人工复核，不直接触碰生产队列。

## 当前关键 blocker

这些是预期 blocker，验收时不能隐藏：

- 尚未实现 production Linear native writeback adapter。AgentSession、delegate、activity、plan、state、label、comment 写入目前只是 outbox contract。
- 尚无 live `dispatch project` 命令。`dispatch fixture` 可以 claim fixture WI，但不能代表真实 Linear project dispatch。
- 尚无 packaged webhook server / outbox runner。`webhook.ts` 只是 primitive，不是生产服务包装。
- `worker dispatch` 会真实启动 OpenCode，只能在明确批准的 sandbox run 上使用。
- `scan project` 和 `delivery track` 不是纯只读：它们读取外部系统，同时会写 scheduler DB state。

## Secret 处理规则

只使用 repo-local 加密 secret：

```bash
sops exec-env secrets/linear-scheduler.sops.yaml 'npm --prefix scheduler run debug -- scan project --project "$LINEAR_PROJECT_ID" --db "$SCHEDULER_DB"'
```

规则：

- 使用 `sops` YAML，并用 `age` 加密。
- 不解密到明文文件。
- 不提交真实 secret 文件。
- 只提交 placeholder schema example。
- DB、prompt、log、evidence 等产物必须留在 repo-local 路径，例如 `.cache/linear-scheduler/`。

详见 `scheduler/docs/runbooks/secrets-sops.md`。

## 验收阶段

### Stage 0：本地基线

目的：确认当前 package 仍符合已通过的本地原型基线。

命令：

```bash
npm --prefix scheduler test
npm --prefix scheduler run health -- --db :memory:
npm --prefix scheduler run debug -- scan fixture --fixture tests/fixtures/project.json --db :memory:
npm --prefix scheduler run debug -- dispatch fixture --fixture tests/fixtures/project.json --db .cache/linear-scheduler/acceptance-fixture.sqlite --parallel-repos legion-mind --global-concurrency 4 --per-repo-concurrency 4
```

通过标准：

- scheduler tests 通过。
- fixture scan 输出符合预期的 ready / skipped / no-cycle 形态。
- fixture dispatch 只 claim non-conflicting WI，并能报告 lock / blocker wait。

停止条件：

- 任一本地 regression 失败。
- fixture 输出与 scheduler 语义不一致。

### Stage 1：创建 sandbox 资源

目的：在任何 live adapter 检查前，先创建安全的外部资源。

准备内容：

- Linear sandbox project 和 labels。
- GitHub sandbox repo 和 PR scenarios。
- 只含 sandbox credentials 的加密 `secrets/linear-scheduler.sops.yaml`。
- repo-local scheduler DB 路径，例如 `.cache/linear-scheduler/production-acceptance-sandbox.sqlite`。

参考：

- `scheduler/docs/runbooks/linear-sandbox-setup.md`
- `scheduler/docs/runbooks/github-sandbox-setup.md`
- `scheduler/docs/templates/secrets.linear-scheduler.sops.yaml`

通过标准：

- sandbox 资源已创建，并记录到 evidence template。
- credentials 已加密，并可用 `sops exec-env` 注入。
- 未使用任何 production project / repo / token。

### Stage 2：真实 Linear read-path scan

目的：验证真实 Linear project 读取行为，但不 claim worker，也不写 Linear。

命令：

```bash
sops exec-env secrets/linear-scheduler.sops.yaml 'npm --prefix scheduler run debug -- scan project --project "$LINEAR_PROJECT_ID" --db "$SCHEDULER_DB" --delegate "$LINEAR_DELEGATE_APP_USER_ID" --scheduler-run-url-base "$SCHEDULER_RUN_URL_BASE"'
```

注意：

- 该命令读取 Linear，并把 `work_item_snapshots` 写入 scheduler DB。
- 它不会 claim run、启动 worker、设置 delegate、创建 AgentSession，也不会写 Linear labels / comments。

通过标准：

- ready / skipped / waiting 判断与 sandbox issue 设计一致。
- `agent:needs-human`、dependency blockers、risk/repo/contract 缺口、manual Done case 都分类正确。
- 没有 Linear 写入副作用。

停止条件：

- label / state 不明确，导致输出无法判断。
- 本应 gated 的 issue 出现在 ready candidates 中。
- Linear API auth 需要超出预期的权限。

### Stage 3：fixture dispatch / lock 基线

目的：在没有 live Linear dispatch 的情况下验证 dispatch 语义。

命令：

```bash
npm --prefix scheduler run debug -- dispatch fixture --fixture tests/fixtures/project.json --db .cache/linear-scheduler/acceptance-fixture.sqlite --parallel-repos legion-mind --global-concurrency 4 --per-repo-concurrency 4
```

通过标准：

- non-conflicting ready WI 被 claim。
- resource conflict 保持 waiting。
- blocked downstream 保持 waiting / skipped。
- 不启动 worker。

已知 blocker：

- live project dispatch 尚未实现。不要用 fixture dispatch 推断 live dispatch readiness。

### Stage 4：真实 GitHub PR read-path tracking

目的：验证真实 GitHub PR 读取行为和 scheduler delivery decision。

命令：

```bash
sops exec-env secrets/linear-scheduler.sops.yaml 'npm --prefix scheduler run debug -- delivery track --run "$SCHEDULER_RUN_ID" --repo "$SCHEDULER_REPO_PATH" --pr-url "$GITHUB_OPEN_PR_URL" --db "$SCHEDULER_DB"'
```

注意：

- 该命令读取 GitHub，并写 scheduler DB delivery state。
- 它会 enqueue Linear native writeback rows；但因为没有 production native adapter，不会真正发送 Linear writeback。

通过标准：

- open / draft / pending PR 不会变成 Done。
- checks failure 和 review changes requested 会进入 blocked。
- closed-unmerged 会成为 terminal non-success。
- merged PR 仍然要求 Legion evidence 和 lifecycle evidence。

停止条件：

- GitHub token scope 超出必要范围。
- branch protection / review / check 解释不清。
- 未 merge 或 evidence 缺失的 PR 被视为 terminal success。

### Stage 5：OpenCode 单 WI sandbox E2E

目的：只有在明确人工批准并且前置 row 已存在时，才运行一个低风险 worker。

命令形态：

```bash
sops exec-env secrets/linear-scheduler.sops.yaml 'npm --prefix scheduler run debug -- worker dispatch --run "$SCHEDULER_RUN_ID" --attempt "$SCHEDULER_ATTEMPT_ID" --repo "$SCHEDULER_REPO_PATH" --db "$SCHEDULER_DB" --timeout-ms 3600000'
```

入口条件：

- scheduler DB 中已存在 run 和 attempt。
- native startup outbox rows 已 sent，或只在 sandbox 中明确记录了 bypass。
- 目标 WI 是低风险、可回滚、已批准的 sandbox 执行对象。
- operator 已确认不会影响 production repo 或 production Linear issue。

停止条件：

- worker 收到不该收到的 secret。
- worker 修改 non-sandbox scope。
- worker 只产出 PR URL，缺少 Legion evidence。
- native stop / cancel 不能安全停止 side effects。

已知 blocker：

- production native writeback 和 live dispatch 不属于当前 scheduler 已具备能力。

### Stage 6：Go / No-Go Review

使用 `scheduler/docs/templates/acceptance-evidence.md` 记录证据。

可能结论：

- `PASS: sandbox read-path only`：live scan / tracking 可用，但 production blockers 仍存在。
- `BLOCKED: missing runtime capability`：native writeback、live dispatch 或 webhook service 缺失，这是预期 blocker。
- `FAIL: unsafe behavior`：出现错误 downstream unlock、错误 Done、duplicate run、secret leak 或失控 side effect。

只有所有 blocker 都通过独立实现任务关闭后，才能讨论 production candidate。

## 紧急停止条件

出现任一情况，立即暂停或停止验收：

- 同一 Linear issue 或 task id 出现 duplicate active run。
- 没有 `run_terminal_success` 却出现 Linear Done / downstream unlock。
- open PR、failed checks 或缺 evidence 被标记 Done。
- worker 触碰 non-sandbox repo / branch / issue。
- secret 出现在 logs、DB output 或 evidence 中。
- native writeback 重复评论/activity，或写入 production project。
- pending outbox 增长且 operator 无法解释。
- admin lock release 会影响 non-terminal live worker。

## Rollback / Cleanup

- 调查前先 pause sandbox project controls。
- 保留 DB 和 artifacts 作为 evidence，除非其中含 secret。
- cancel 或 terminalize sandbox runs，并写清 reason。
- 确认没有 worker side effects 后，才能 release locks。
- 关闭 abandoned sandbox PR，并写明 reason。
- 若怀疑 token 暴露，立刻删除或 rotate token。
