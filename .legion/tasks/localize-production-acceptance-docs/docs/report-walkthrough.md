# 交付说明：生产验收文档中文化

## 模式

Implementation / docs-only。未修改 runtime code。

## 改动内容

- 中文化 PR #44 生产验收准备包：
  - `docs/linear-legion-scheduler/production-acceptance-runbook.md`
  - `scheduler/docs/production-acceptance-checklist.md`
  - `scheduler/docs/runbooks/**`
  - `scheduler/docs/templates/**`
  - `scheduler/README.md`
- 中文化与入口跳转相关的设计说明：
  - `docs/linear-legion-scheduler/index.md`
  - `docs/linear-legion-scheduler/delivery-pr-writeback.md`
  - `docs/linear-legion-scheduler/parallel-dispatch-locks.md`
- 中文化上一轮 task evidence、PR body 和 wiki summary：
  - `.legion/tasks/prepare-linear-scheduler-production-acceptance/**`
  - `.legion/wiki/tasks/prepare-linear-scheduler-production-acceptance.md`
  - `.legion/wiki/index.md`
  - `.legion/wiki/maintenance.md`
  - `.legion/wiki/log.md`

## 保留英文的边界

以下内容保留英文，因为它们是机器 token 或执行语义的一部分：

- 命令、路径、env var。
- JSON / YAML key。
- 状态枚举、labels、URL、代码符号。
- 产品名和必要技术术语，例如 Linear、GitHub、OpenCode、Scheduler、outbox、native writeback。

## 验证

- `git diff --check` — PASS。
- 目标文件普通英文标题残留检查 — PASS。
- Fixture scan — PASS。
- Fixture dispatch — PASS。
- Health smoke — PASS。
- `npm --prefix scheduler test` — PASS，57/57。
- `review-change` — PASS。

## Reviewer 关注点

1. 中文表述是否足够直接，是否还存在不必要英文。
2. 是否保留了命令、字段、label、状态枚举等不可翻译 token。
3. 是否没有弱化原 runbook 的安全边界和 production blockers。
4. 是否没有把历史全仓英文文档误纳入本次修复范围。
