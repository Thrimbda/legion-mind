## 摘要

- 将 PR #44 生产验收准备包和对应 Legion/wiki 证据中文化。
- 额外中文化入口相关的 `delivery-pr-writeback.md`、`parallel-dispatch-locks.md` 和 scheduler README 说明，避免从中文入口跳到英文文档。
- 保留命令、路径、env var、JSON/YAML key、状态枚举、labels、URL、代码符号、产品名和必要技术术语。

## 验证

- `git diff --check` — PASS
- 目标文件普通英文标题残留检查 — PASS
- `npm --prefix scheduler run debug -- scan fixture --fixture tests/fixtures/project.json --db :memory:` — PASS
- `npm --prefix scheduler run debug -- dispatch fixture --fixture tests/fixtures/project.json --db .cache/linear-scheduler/localize-fixture.sqlite --parallel-repos legion-mind --global-concurrency 4 --per-repo-concurrency 4` — PASS
- `npm --prefix scheduler run health -- --db :memory:` — PASS
- `npm --prefix scheduler test` — PASS，57/57

## 说明

- 未修改 runtime code。
- 未执行 live acceptance。
- 未新增真实 secrets。
- 没有弱化 sandbox-first、sops/age、`sops exec-env` 和当前 production blockers。
