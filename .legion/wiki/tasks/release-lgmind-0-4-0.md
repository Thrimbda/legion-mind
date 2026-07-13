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

- `lgmind@0.4.0` 已从版本准备 PR #53 的 squash merge 提交 `ff4c7009f967b7a897715b077ffb3a3dba76a2b3` 公开发布；GitHub Actions workflow run `29242902972` 成功且 `headSha` 与该提交一致。
- npm 固定版本与 `dist-tags.latest` 当前均为 `0.4.0`；新的继任主张 `REL-040-DISTRIBUTION-RESULT=PASS`，发布前的 `REL-040-DISTRIBUTION=DEFERRED` 保留为当时时点事实。
- 隔离安装首次结果为 `copied=49, skipped=0, failures=0`，复跑为 `copied=0, skipped=49, failures=0`，证明相同内容幂等跳过；`verify --strict` 返回 `READY`。
- 8 个关键安装资产均存在，并与上述合并提交中的源码逐字节一致；`REL-040-ARTIFACT=PASS` 继续有效。
- `review-change-eager-marten` 对协议外字段给出的历史 `FAIL` 保留有效；字段修正后，`review-change-jolly-penguin` 独立复核得到当前 `PASS`，没有现存发布 blocker。
- npm 发布事实已经完成，但发布结果收口 PR 尚未 merge，worktree cleanup 与主工作区刷新尚未执行，因此任务元数据继续保持 `active`。

## 可复用决定

- 发布前 `PASS` 只证明版本准备和待发布 artifact；发布后应登记新的继任主张记录分发结果，不能追溯把历史 `DEFERRED` 改写为 `PASS`。
- 真实发布必须等待版本准备 PR 合并，从锁定的 `master` SHA 触发既有 trusted-publishing workflow，并用 registry、隔离安装、strict verify 与关键资产一致性共同收口。
- 重复安装中的 `skipped` 只有在固定发布版本、`failures=0`、严格验证通过且安装资产内容一致时，才能解释为幂等命中，而不是安装失败。
- npm 版本不可覆盖；`0.4.0` 后续若发现产品缺陷，应发布新的 patch 版本，不得尝试覆盖既有版本。
- 外部 Agent transport 即使启动失败也可能改写已跟踪文件；本任务曾因 `.opencode/package-lock.json` 越界正确进入历史 `FAIL`，精确恢复并独立重验后才回到当前 `PASS`。后续调用应在前后比较 `git status --porcelain`，任何新增且不在批准范围内的路径都按 scope 漂移 fail closed。

## 相关原始来源

- `plan`: `.legion/tasks/release-lgmind-0-4-0/plan.md`
- `log`: `.legion/tasks/release-lgmind-0-4-0/log.md`
- `tasks`: `.legion/tasks/release-lgmind-0-4-0/tasks.md`
- `发布说明`: `.legion/tasks/release-lgmind-0-4-0/docs/release-notes.md`
- `验证`: `.legion/tasks/release-lgmind-0-4-0/docs/test-report.md`
- `审查`: `.legion/tasks/release-lgmind-0-4-0/docs/review-change.md`
- `发布结果`: `.legion/tasks/release-lgmind-0-4-0/docs/publish-result.md`
- `报告数据`: `.legion/tasks/release-lgmind-0-4-0/docs/report-data.json`
- `报告`: `.legion/tasks/release-lgmind-0-4-0/docs/report-walkthrough.md`、`.legion/tasks/release-lgmind-0-4-0/docs/report-walkthrough.html`、`.legion/tasks/release-lgmind-0-4-0/docs/pr-body.md`

## 备注

- 本页记录发布完成后的当前分发真相与必要历史审计；精确协议和证据仍以任务原始文档、`package.json` 和 `.github/workflows/publish-npm.yml` 为准。
- 本任务复用 `patterns.md` 中既有的 `lgmind` npm CLI 发布模式，没有产生未重复的跨任务模式或决定，因此不修改 `patterns.md`。
- 首次固定版本 smoke 的 `command not found` 来自测试目录缺少独立 `package.json` 边界；建立独立 package 边界并清空 cache 后完整通过，该失败保留为夹具假阳性，不作为成功证据。
- 生命周期边界：发布事实已完成；发布结果收口 PR merge、worktree cleanup 与主工作区刷新仍待执行，在这些步骤完成前不得把整个任务或 Git lifecycle 写成已完成。
