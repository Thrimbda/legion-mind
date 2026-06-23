# RFC Amendment: Lock scheduler worker runtime to OpenCode

> 本 PR 仅更新 Linear + Legion scheduler 设计文档，无 scheduler 运行时代码变更。  
> Merge 视为设计 amendment 批准，不代表 OpenCode worker launcher 已实现。  
> 本 PR body 只是 PR 创建/更新输入，不代表 checks/review/merge 或 PR lifecycle 已完成。

## 交付内容

- 更新 `docs/linear-legion-scheduler/rfc.md`：首版 worker runtime 固定为 OpenCode。
- 更新 `docs/linear-legion-scheduler/work-items/WI-04-legion-worker-runner.md`：WI-04 scope / non-goals / 验收 / 验证同步 OpenCode-only。
- 更新 wiki：记录外部调度器嵌入 Legion 时，首版只启动 OpenCode worker。
- 新增 Legion task evidence：`.legion/tasks/lock-scheduler-worker-opencode/**`。

## 核心变化

- 不再为 OpenClaw / Codex / custom worker runtime 设计 adapter。
- Scheduler 生成 prompt artifact，并在目标 repo 上下文启动 OpenCode worker。
- OpenCode worker 第一动作必须进入 `legion-workflow`。
- Completion gate 仍是 result block + GitHub PR state + Legion evidence verifier。

## Review 状态

- `review-rfc`: PASS。
- `git diff --check`: PASS。
- 旧 runtime adapter 误导性表述搜索：PASS。

## 评审重点

- [ ] 是否接受首版 worker runtime 固定为 OpenCode。
- [ ] 是否接受不在当前版本做多 runtime 抽象。
- [ ] 是否接受不写死 OpenCode CLI 参数，由 WI-04 实现阶段按当前 CLI 语义锁定。
- [ ] 是否确认 Legion workflow / git-worktree-pr / evidence verifier gate 没有被削弱。

## 证据链接

- Plan: `.legion/tasks/lock-scheduler-worker-opencode/plan.md`
- RFC amendment: `.legion/tasks/lock-scheduler-worker-opencode/docs/rfc.md`
- Review: `.legion/tasks/lock-scheduler-worker-opencode/docs/review-rfc.md`
- Walkthrough: `.legion/tasks/lock-scheduler-worker-opencode/docs/report-walkthrough.md`
- Canonical RFC: `docs/linear-legion-scheduler/rfc.md`
- WI-04: `docs/linear-legion-scheduler/work-items/WI-04-legion-worker-runner.md`
