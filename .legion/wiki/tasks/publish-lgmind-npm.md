# publish-lgmind-npm

## 任务摘要

- 目标：把已准备为 npm CLI 的 OpenCode installer 从 `setup-opencode` 发布面改名为 `lgmind`，走 PR lifecycle 后从刷新后的 `origin/master` 发布 `lgmind@0.1.0`。
- 风险级别：High；真实 npm publish 是外部可见且 name/version 组合不可安全复用的 release action。
- 代码/文档范围：`package.json`、`bin/setup-opencode.js` executable mode、`scripts/setup-opencode.ts`、`README.md`、`tests/regression/setup-lifecycle.test.ts`，以及本任务 release 证据。

## 当前结论

- npm package name 已选定为 unscoped `lgmind`，版本保持 `0.1.0`。
- primary bin 是 `lgmind`；`setup-opencode` 保留为指向同一 wrapper 的 alias，用于保留描述性命令入口。
- README 与 CLI help 以 `npx lgmind@latest` 为主叙事；`setup-opencode` 只作为 alias 出现。
- `publishConfig` 明确 public npm registry 与 public access intent；真实发布命令仍使用 `npm publish --access public`。
- 发布分两门：先通过 PR merge release config，再从刷新后的 `origin/master` 重跑最终检查并执行 publish。
- npm 命令使用 repo-local `.cache/npm`，避免 npm cache/log 持久化到用户 home。
- 可选参考仓库 `/home/c1/Work/opencode-feishu-notifier` 虽已由用户 clone，但当前工具权限仍阻止读取；本任务未从该仓库引入 release-shape 变更。

## 证据入口

- Plan：`.legion/tasks/publish-lgmind-npm/plan.md`
- RFC：`.legion/tasks/publish-lgmind-npm/docs/rfc.md`
- RFC Review：`.legion/tasks/publish-lgmind-npm/docs/review-rfc.md`
- Test Report：`.legion/tasks/publish-lgmind-npm/docs/test-report.md`
- Change Review：`.legion/tasks/publish-lgmind-npm/docs/review-change.md`
- Walkthrough：`.legion/tasks/publish-lgmind-npm/docs/report-walkthrough.md`
- HTML Walkthrough：`.legion/tasks/publish-lgmind-npm/docs/report-walkthrough.html`
- PR Body：`.legion/tasks/publish-lgmind-npm/docs/pr-body.md`

## 后续注意

- PR merge 前不得执行 `npm publish`。
- PR merge 后必须从刷新后的 `origin/master` 重跑 package-name、auth、pack dry-run 等最终检查，再执行 `npm publish --access public`。
- 如果 npm auth、2FA、permission、registry 或 name race 阻塞发布，记录 blocker、owner、恢复条件与已执行命令；不要把 blocked handoff 当作完成。
- 发布完成后需要补记 npm registry state，并更新本页 / wiki maintenance 中的 pending publish 状态。
