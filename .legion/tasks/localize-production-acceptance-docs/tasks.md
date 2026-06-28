# 任务清单

## 当前状态

- Phase: implementation
- Overall status: in progress

## 任务清单

- [x] 创建中文化 worktree
- [x] 物化任务契约
- [x] 中文化 PR #44 新增/改动的人类阅读文档
- [x] 检查残留英文是否属于命令/路径/字段/产品名等允许保留 token
- [x] 运行本地无 secret 验证
- [x] 写入 test-report
- [x] 完成 review-change
- [x] 生成 walkthrough / PR body
- [ ] 完成 wiki writeback 和 PR lifecycle

## 计划验证命令

- `npm --prefix scheduler run debug -- scan fixture --fixture tests/fixtures/project.json --db :memory:`
- `npm --prefix scheduler run debug -- dispatch fixture --fixture tests/fixtures/project.json --db .cache/linear-scheduler/localize-fixture.sqlite --parallel-repos legion-mind --global-concurrency 4 --per-repo-concurrency 4`
- `npm --prefix scheduler run health -- --db :memory:`
- `npm --prefix scheduler test`
