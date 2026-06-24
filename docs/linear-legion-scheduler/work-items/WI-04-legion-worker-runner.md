# WI-04: Legion task mapping and worker runner

> **交付产物**: [`../worker-runner.md`](../worker-runner.md)<br>
> **状态**: 已完成为 `scheduler/` 独立 npm project 中的 OpenCode-only worker runner；后续 WI-05 继续接入 GitHub PR tracking 与 Linear delivery writeback。

## 目标

实现 Linear WI 到 Legion task 的确定性映射，并提供 OpenCode worker launcher，让 scheduler 能启动一个 OpenCode worker 按 Legion workflow 执行单个 WI。

## 背景

这是系统最关键的安全边界：Scheduler 不能直接让 agent “实现 Linear issue”。它必须启动一个受约束的 OpenCode worker，worker 第一动作进入 `legion-workflow`，contract 不稳定则 `brainstorm`，修改仓库则 `git-worktree-pr`。首版不做多 runtime abstraction。

## 范围

- TaskId 映射：`ENG-123` -> `linear-eng-123`。
- OpenCode worker prompt contract。
- Worker environment contract：repo path、base ref、Linear context、run id、task id。
- AgentSession create/find、delegate setup、initial activity / plan / external URL before worker launch。
- OpenCode process launcher：timeout、heartbeat、stdout/stderr capture、exit code。
- Stop/cancel signal propagation to OpenCode worker。
- Worker result parser：PR URL、Legion evidence、blocked reason、next step。
- Scheduler-side Legion evidence verifier：required files exist and required review docs are PASS。
- Minimal single-worker execution path。
- Run attempt lifecycle update。

## 非目标

- 不实现 parallel dispatcher。
- 不实现 PR checks tracking。
- 不实现 OpenClaw / Codex / custom runtime adapter。
- 不把 worker launcher 抽象成多 runtime 框架；未来多 runtime 支持必须单独 RFC。
- 不在 scheduler 内写 Legion task docs 内容。

## 依赖

- WI-01。
- WI-02。

## 设计要求

### OpenCode launch contract

Scheduler 必须为每个 run 生成 OpenCode prompt artifact，并在目标 repo 上下文中启动 OpenCode 进程 / job。Prompt artifact 是 worker 的唯一任务输入，至少包含：

- Linear issue identifier / URL / title / description / labels / blockers；
- native agent context：delegate app user、AgentSession id、stop signal source；
- Legion taskId；
- repo path 与 base ref；
- Legion hard gates；
- result block schema；
- evidence verifier 需要的输出路径。

本 WI 不要求提前写死最终 OpenCode CLI 参数；实现时按当前 OpenCode CLI 语义确定命令行，并用 launch tests 锁定。

### Prompt hard gate

Prompt 必须包含：

```text
必须先进入 legion-workflow。
如果没有稳定 contract，进入 brainstorm。
如果修改仓库文件，进入 git-worktree-pr envelope。
每个 WI 独立 task/worktree/branch/PR。
PR created 不是完成。
收到 stop/cancel 后必须停止 tool/code/API side effects，并输出 canceled result。
```

### Native session startup

启动 worker 前，dispatcher 必须通过 native outbox：

1. create/find AgentSession，并把 `linear_agent_session_id` 写回 `runs`；
2. 设置或确认 `Issue.delegate` 为 agent app user，不能改写人类 assignee；
3. emit initial `thought`，说明正在进入 Legion workflow；
4. 初始化 Agent Plan：ready check、claim、launch worker、PR/evidence tracking；
5. 写入 scheduler run `externalUrl`。

这些 side effects 失败时不应重复创建 run，也不应直接从 webhook handler 启动 worker。

### Result block

Worker 结束时必须输出 machine-readable result，例如：

```json
{
  "runResult": "in_review",
  "linearIssue": "ENG-123",
  "taskId": "linear-eng-123",
  "agentSessionId": "...",
  "prUrl": "https://github.com/org/repo/pull/123",
  "externalUrls": [{ "label": "GitHub PR", "url": "https://github.com/org/repo/pull/123" }],
  "blocker": null,
  "nextStep": "wait_for_pr_checks"
}
```

如果缺失 result block，attempt 进入 `agent_failed` 或 `unknown_result`，不得假设成功。

### Evidence verifier

Worker 返回 PR URL 不足以证明完成。Runner 必须提供 verifier，至少检查：

- implementation run 有 `plan.md`、`tasks.md`、`log.md`、`docs/test-report.md`、`docs/review-change.md`、`docs/report-walkthrough.md` 和 wiki writeback pointer；
- medium/high risk implementation 还必须有 `docs/rfc.md`、`docs/review-rfc.md` 且 review PASS；
- design-only run 必须有 `docs/rfc.md`、`docs/review-rfc.md` PASS、`docs/report-walkthrough.md` 和 wiki writeback pointer；
- PR-backed run 必须有 `git-worktree-pr` lifecycle evidence：PR merged、checks/review 完成、worktree 已删除、主工作区已刷新；
- 缺失 evidence 时 run 不得 Done，不得解锁 downstream。

## 验收标准

- [ ] 同一 Linear issue 重试时恢复同一 taskId，不创建重复 Legion task。
- [ ] Scheduler 能为指定 WI 启动一个 OpenCode worker attempt。
- [ ] OpenCode prompt artifact 中包含 Legion hard gates 和 Linear context。
- [ ] OpenCode prompt artifact 中包含 AgentSession id、delegate identity 和 stop signal source。
- [ ] Worker launch 前会幂等 create/find AgentSession、emit initial activity 并设置 external URL。
- [ ] Worker heartbeat / timeout 可被 DB 观察。
- [ ] Native stop/admin cancel 会让 worker 停止后续 tool/code/API side effects，并进入 canceling/cancelled attempt。
- [ ] Worker result parser 能提取 PR URL、blocked reason、evidence paths。
- [ ] Evidence verifier 能拒绝“只有 PR URL、缺 Legion evidence”的结果。
- [ ] Evidence verifier 能拒绝“PR merged 但缺 cleanup / main refresh lifecycle evidence”的结果。
- [ ] Worker 非零退出不会释放 run 为 done。

## 验证

- Unit tests：taskId mapping、OpenCode prompt rendering、native session startup、stop signal handling、result parser、evidence verifier。
- Integration tests：fake OpenCode worker 输出 success / blocked / malformed result。
- Manual smoke：对测试 WI 启动 OpenCode worker dry-run，确认 run attempt timeline 完整。

## 风险

- **Prompt 漂移**: prompt 被简化后绕过 Legion。缓解：OpenCode prompt template 加 snapshot tests。
- **长任务失联**: worker 运行很久但 scheduler 不知道状态。缓解：heartbeat + timeout + stale recovery。
- **重复 task**: retry 生成新 task 会污染 evidence。缓解：确定性 taskId + unique active run。
- **过早抽象**: 多 runtime adapter 会放大首版 scope。缓解：首版只支持 OpenCode，其他 runtime 另开 RFC。
