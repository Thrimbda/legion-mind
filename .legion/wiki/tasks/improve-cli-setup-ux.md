# improve-cli-setup-ux

## 任务摘要

- 目标：参考 Context7-style setup UX，把 `lgmind` 从 OpenCode 直达安装入口提升为 product-level setup CLI，支持选择 OpenCode / OpenClaw runtime，并隐藏默认文字输出中的成功事件噪音。
- 风险级别：Medium；变更 public CLI grammar、npm package surface 与默认日志行为，但不改变 managed manifest / backup / rollback / uninstall 安全语义。
- 代码/文档范围：`bin/lgmind.js`、`scripts/lgmind.ts`、`scripts/lib/setup-core.ts`、`scripts/setup-opencode.ts`、`scripts/setup-openclaw.ts`、`package.json`、`README.md`、`tests/regression/setup-lifecycle.test.ts`。

## 当前结论

- `lgmind` primary bin 现在指向 product-level aggregator；`setup-opencode` 保留为 OpenCode-only alias。
- 推荐 first-run 入口是 `npx lgmind@latest setup` 或脚本化的 `npx lgmind@latest setup --agent opencode|openclaw`。
- `--agent opencode|openclaw` 是文档主 selector；`--runtime` 作为 alias。无显式 selector 的 `setup` 仅在 stdin/stdout 都是 TTY 时提示，否则默认 OpenCode，避免 CI hang。
- 默认 text output 只显示 final summary 与 warnings/errors；成功 `OK_*` 事件默认隐藏。`--verbose` 恢复详细 text lifecycle events，`--json` 保持详细 structured event stream。
- npm package surface 包含 `bin/lgmind.js`、`scripts/lgmind.ts` 与 `scripts/setup-openclaw.ts`，使 OpenClaw setup 可从 npm 包路径运行。

## 证据入口

- Plan：`.legion/tasks/improve-cli-setup-ux/plan.md`
- RFC：`.legion/tasks/improve-cli-setup-ux/docs/rfc.md`
- RFC Review：`.legion/tasks/improve-cli-setup-ux/docs/review-rfc.md`
- Test Report：`.legion/tasks/improve-cli-setup-ux/docs/test-report.md`
- Change Review：`.legion/tasks/improve-cli-setup-ux/docs/review-change.md`
- Walkthrough：`.legion/tasks/improve-cli-setup-ux/docs/report-walkthrough.md`
- HTML Walkthrough：`.legion/tasks/improve-cli-setup-ux/docs/report-walkthrough.html`
- PR Body：`.legion/tasks/improve-cli-setup-ux/docs/pr-body.md`

## 后续注意

- 本任务不发布新 npm version；若需要让 npm 用户获取变更，应另开 release 任务并 bump/publish。
- per-agent subset selection 仍非当前能力；如果需要，必须作为独立设计问题处理，因为它会改变安装/验证语义。
