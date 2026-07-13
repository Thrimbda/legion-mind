# release-lgmind-0-4-0

## 元数据

- `task-id`: `release-lgmind-0-4-0`
- `status`: `active`
- `risk`: `medium`
- `schema-version`: `report-data-v1.1`
- `historical`: `false`
- `supersedes`: `(none)`
- `superseded-by`: `(none)`

## 结果摘要

- `lgmind@0.4.0` 当前仅达到发布前就绪：根包版本已由 `0.3.1` 更新为 `0.4.0`，scheduler 独立包版本与运行时行为未改变。
- `REL-040-ARTIFACT=PASS`：context audit、40/40 回归、69 项 pack 清单、8 个关键资产及其负例断言均已通过，独立变更审查无 blocker。
- `REL-040-DISTRIBUTION=DEFERRED`：版本准备 PR 尚未完成 lifecycle，可信发布 workflow、npm registry 切换与干净环境固定版本安装尚未发生，因此不能写成已经发布。
- 任务风险记为 `medium`：版本实现本身是低风险的单一版本号变更，但公开 npm 版本一旦发布不可覆盖，分发阶段必须继续遵守锁定 SHA 与停止点。
- 当前允许进入版本准备 PR lifecycle；只有合并后从锁定的 `master` SHA 发布，并完成 workflow、registry 与隔离安装验证，任务才可收口。

## 可复用决定

- 阶段 `PASS` 只证明版本准备和待发布 artifact，不等于 npm 分发已经完成；发布事实必须由发布后证据单独确认。
- 真实发布必须等待版本准备 PR 合并，从锁定的 `master` SHA 触发既有 trusted-publishing workflow；不得从未合并分支、本地主工作区或本机 npm 凭据直接发布。
- npm 版本不可覆盖；若 workflow 来源、registry 或隔离安装验证任一异常，应停止重跑与完成声明，并转入后续修复版本决策。
- 外部 Agent transport 即使启动失败也可能改写已跟踪文件；本任务曾因 `.opencode/package-lock.json` 越界正确进入历史 `FAIL`，精确恢复并独立重验后才回到当前 `PASS`。后续调用应在前后比较 `git status --porcelain`，任何新增且不在批准范围内的路径都按 scope 漂移 fail closed。

## 相关原始来源

- `plan`: `.legion/tasks/release-lgmind-0-4-0/plan.md`
- `log`: `.legion/tasks/release-lgmind-0-4-0/log.md`
- `tasks`: `.legion/tasks/release-lgmind-0-4-0/tasks.md`
- `发布说明`: `.legion/tasks/release-lgmind-0-4-0/docs/release-notes.md`
- `验证`: `.legion/tasks/release-lgmind-0-4-0/docs/test-report.md`
- `审查`: `.legion/tasks/release-lgmind-0-4-0/docs/review-change.md`
- `报告数据`: `.legion/tasks/release-lgmind-0-4-0/docs/report-data.json`
- `报告`: `.legion/tasks/release-lgmind-0-4-0/docs/report-walkthrough.md`、`.legion/tasks/release-lgmind-0-4-0/docs/report-walkthrough.html`、`.legion/tasks/release-lgmind-0-4-0/docs/pr-body.md`

## 备注

- 本页只记录发布前当前真相；精确发布协议与验证证据仍以任务原始文档、`package.json` 和 `.github/workflows/publish-npm.yml` 为准。
- 本任务复用 `patterns.md` 中既有的 `lgmind` npm CLI 发布模式，没有产生未重复的跨任务模式或决定，因此不修改 `patterns.md`。
- 停止点：发布后的 workflow、registry 与干净安装验证完成前，不得把 `REL-040-DISTRIBUTION` 更新为 `PASS`，不得声明任务完成，也不得执行最终清理。
