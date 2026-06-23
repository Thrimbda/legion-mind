# WI-04: Legion task mapping and worker runner

## 目标

实现 Linear WI 到 Legion task 的确定性映射，并提供 worker launcher，让 scheduler 能启动一个 agent 按 Legion workflow 执行单个 WI。

## 背景

这是系统最关键的安全边界：Scheduler 不能直接让 agent “实现 Linear issue”。它必须启动一个受约束的 worker，worker 第一动作进入 `legion-workflow`，contract 不稳定则 `brainstorm`，修改仓库则 `git-worktree-pr`。

## 范围

- TaskId 映射：`ENG-123` -> `linear-eng-123`。
- Worker prompt contract。
- Worker environment contract：repo path、base ref、Linear context、run id、task id。
- Worker process launcher：timeout、heartbeat、stdout/stderr capture、exit code。
- Worker result parser：PR URL、Legion evidence、blocked reason、next step。
- Scheduler-side Legion evidence verifier：required files exist and required review docs are PASS。
- Minimal single-worker execution path。
- Run attempt lifecycle update。

## 非目标

- 不实现 parallel dispatcher。
- 不实现 PR checks tracking。
- 不实现完整 agent runtime abstraction for every vendor；只定义接口并接入一个首选 runtime。
- 不在 scheduler 内写 Legion task docs 内容。

## 依赖

- WI-01。
- WI-02。

## 设计要求

### Prompt hard gate

Prompt 必须包含：

```text
必须先进入 legion-workflow。
如果没有稳定 contract，进入 brainstorm。
如果修改仓库文件，进入 git-worktree-pr envelope。
每个 WI 独立 task/worktree/branch/PR。
PR created 不是完成。
```

### Result block

Worker 结束时必须输出 machine-readable result，例如：

```json
{
  "runResult": "in_review",
  "linearIssue": "ENG-123",
  "taskId": "linear-eng-123",
  "prUrl": "https://github.com/org/repo/pull/123",
  "blocker": null,
  "nextStep": "wait_for_pr_checks"
}
```

如果缺失 result block，attempt 进入 `agent_failed` 或 `unknown_result`，不得假设成功。

### Evidence verifier

Worker 返回 PR URL 不足以证明完成。Runner 必须提供 verifier，至少检查：

- implementation run 有 `plan.md`、`docs/test-report.md`、`docs/review-change.md`、`docs/report-walkthrough.md` 和 wiki writeback pointer；
- medium/high risk implementation 还必须有 `docs/rfc.md`、`docs/review-rfc.md` 且 review PASS；
- design-only run 必须有 `docs/rfc.md`、`docs/review-rfc.md` PASS、`docs/report-walkthrough.md` 和 wiki writeback pointer；
- 缺失 evidence 时 run 不得 Done，不得解锁 downstream。

## 验收标准

- [ ] 同一 Linear issue 重试时恢复同一 taskId，不创建重复 Legion task。
- [ ] Scheduler 能为指定 WI 启动一个 worker attempt。
- [ ] Worker prompt 中包含 Legion hard gates 和 Linear context。
- [ ] Worker heartbeat / timeout 可被 DB 观察。
- [ ] Worker result parser 能提取 PR URL、blocked reason、evidence paths。
- [ ] Evidence verifier 能拒绝“只有 PR URL、缺 Legion evidence”的结果。
- [ ] Worker 非零退出不会释放 run 为 done。

## 验证

- Unit tests：taskId mapping、prompt rendering、result parser、evidence verifier。
- Integration tests：fake worker 输出 success / blocked / malformed result。
- Manual smoke：对测试 WI 启动 worker dry-run，确认 run attempt timeline 完整。

## 风险

- **Prompt 漂移**: prompt 被简化后绕过 Legion。缓解：prompt template 加 snapshot tests。
- **长任务失联**: worker 运行很久但 scheduler 不知道状态。缓解：heartbeat + timeout + stale recovery。
- **重复 task**: retry 生成新 task 会污染 evidence。缓解：确定性 taskId + unique active run。
