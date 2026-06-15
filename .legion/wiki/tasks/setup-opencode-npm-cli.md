# setup-opencode-npm-cli

## 任务摘要

- 目标：把 OpenCode 安装脚本包装成可发布到 npm 的 `setup-opencode` CLI，支持 Context7-style `npx setup-opencode@latest ...` 使用方式。
- 风险级别：Medium；涉及 package metadata、npm bin wrapper、README、CLI 参数展示与 regression，但不改安装 core lifecycle 语义。
- 生产代码范围：`bin/setup-opencode.js`、`scripts/setup-opencode.ts`、`package.json`、`tests/regression/setup-lifecycle.test.ts`；用户文档范围：`README.md`。

## 当前结论

- npm package / primary bin 目标是 `setup-opencode`；本任务只准备 package layout 和验证证据，不执行 `npm publish`。
- npm bin 不直接指向 TypeScript implementation；`bin/setup-opencode.js` 使用 portable `#!/usr/bin/env node` shebang，并以 `--experimental-strip-types` 启动 `scripts/setup-opencode.ts`。
- `setup-opencode` CLI 支持 `--help` / `--version` / `help` / `version`，默认命令仍是 `install`，生命周期命令仍是 `install / verify / rollback / uninstall`。
- `package.json#files` 必须显式包含 `bin/`、OpenCode `.opencode/agents/`、`scripts/setup-opencode.ts`、`scripts/lib/setup-core.ts` 和 `skills/`，并排除 task docs、worktrees、tests 与 cache。
- npm package dry-run 是 release-readiness 验证面之一；执行 npm 命令时应使用 repo-local cache（如 `.cache/npm`）避免持久日志落到 repo 外。

## 证据入口

- Plan：`.legion/tasks/setup-opencode-npm-cli/plan.md`
- RFC：`.legion/tasks/setup-opencode-npm-cli/docs/rfc.md`
- RFC Review：`.legion/tasks/setup-opencode-npm-cli/docs/review-rfc.md`
- Test Report：`.legion/tasks/setup-opencode-npm-cli/docs/test-report.md`
- Change Review：`.legion/tasks/setup-opencode-npm-cli/docs/review-change.md`
- Walkthrough：`.legion/tasks/setup-opencode-npm-cli/docs/report-walkthrough.md`
- HTML Walkthrough：`.legion/tasks/setup-opencode-npm-cli/docs/report-walkthrough.html`
- PR Body：`.legion/tasks/setup-opencode-npm-cli/docs/pr-body.md`

## 后续注意

- 首次真实发布前，维护者仍需决定是否保留 unscoped `setup-opencode` 包名，还是切换到组织 scope；bin wrapper 设计不依赖这个决定。
