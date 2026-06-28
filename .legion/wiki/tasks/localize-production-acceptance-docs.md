# 任务摘要：localize-production-acceptance-docs

## 状态

- 日期：2026-06-26
- 结果：PASS，生产验收准备包中文化修正完成
- Raw evidence：`.legion/tasks/localize-production-acceptance-docs/`

## 摘要

用户明确要求将上一轮生产验收准备文档中文化。本任务把 PR #44 中的 production acceptance package、scheduler docs/templates、README 说明、上一轮 task evidence、PR body 和 wiki summary 改为中文。

同时中文化入口相关的 `docs/linear-legion-scheduler/delivery-pr-writeback.md` 与 `docs/linear-legion-scheduler/parallel-dispatch-locks.md`，避免从中文入口跳转到整篇英文说明。

## 当前有效结论

- 本仓库中面向用户 / reviewer 的 Legion task 文档应默认使用中文。
- 不能翻译会影响执行或 schema 的 token：命令、路径、env var、JSON/YAML key、状态枚举、labels、URL、代码符号、产品名和必要技术术语。
- 生产验收准备包仍保持原安全边界：sandbox-first、sops/age、`sops exec-env`、不提交真实 secrets、live `dispatch project` / native writeback / packaged webhook server 仍是 blocker。
- 本任务没有把全仓历史英文文档全部重写；若需要，应另开专门迁移任务。

## 验证

- `git diff --check`：PASS。
- 目标文件普通英文标题残留检查：PASS。
- Fixture scan：PASS。
- Fixture dispatch：PASS。
- Health smoke：PASS。
- `npm --prefix scheduler test`：PASS，57/57。
- `review-change`：PASS。
