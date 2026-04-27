# harden-v1-kernel-harness

## 任务摘要

- 目标：把 LegionMind 当前产品面收敛到 v1 前可审计状态：删除过时根 `docs/` current-truth 材料，对齐 OpenClaw / OpenCode setup lifecycle，新增 regression suite，并更新 README 支持边界。
- 风险级别：Medium；涉及安装脚本、managed manifest / backup index、README/current truth 与回归测试。
- 生产代码范围：`scripts/setup-opencode.ts`、`scripts/setup-openclaw.ts`、`scripts/lib/setup-core.ts`、`tests/regression/**`、`package.json`、`README.md`、`vibe-harness-bench/README.md`，以及删除根 `docs/**` 历史入口。

## 当前结论

- README 状态更新为 `可运行内核 / v1 前硬化中`，当前只承认 OpenCode 与 OpenClaw 两条维护入口；不承诺 Claude / Codex / Cursor / Gemini 或通用 runtime orchestrator。
- 根 `docs/benchmark.md`、`docs/legionmind-usage.md`、`docs/skill-split-plan.md`、`docs/legion-context-management-raw-wiki-schema.md` 已退出 current truth；现行入口为 README、`.legion/wiki/**`、`skills/**` 与 `vibe-harness-bench/README.md`。
- `scripts/lib/setup-core.ts` 现在承载共享 setup lifecycle primitives；OpenCode / OpenClaw setup 脚本保留 adapter 责任，包括 source enumeration、managed root/state path 与 OpenClaw `openclaw.json` 兼容处理。
- OpenClaw setup 支持与 OpenCode 对齐的 `install / verify / rollback / uninstall` 文件资产 lifecycle；`openclaw.json` 不被 rollback/uninstall 拥有或删除。
- `npm run test:regression` 是当前核心 regression 入口，覆盖 setup lifecycle、skill surface、CLI 文件系统不变量，以及 destructive rollback/uninstall path safety。最终验证为 10/10 PASS。
- `review-change` 以 security lens 审查并给出 PASS；blocking findings 为 0。

## 证据入口

- Plan：`.legion/tasks/harden-v1-kernel-harness/plan.md`
- RFC：`.legion/tasks/harden-v1-kernel-harness/docs/rfc.md`
- RFC Review：`.legion/tasks/harden-v1-kernel-harness/docs/review-rfc.md`
- Test Report：`.legion/tasks/harden-v1-kernel-harness/docs/test-report.md`
- Change Review：`.legion/tasks/harden-v1-kernel-harness/docs/review-change.md`
- Walkthrough：`.legion/tasks/harden-v1-kernel-harness/docs/report-walkthrough.md`
- PR Body：`.legion/tasks/harden-v1-kernel-harness/docs/pr-body.md`

## 后续注意

- CLI 仍是薄文件工具；runtime orchestrator 若未来需要，应单独立项设计，不从本任务延伸。
- Repo hygiene / 旧 worktree / `superpowers/` 等不属于本任务处理范围。
- `targetWithinManagedRoots` 的 root/canonical 对应关系可作为后续可读性增强，但当前安全边界已有 regression 覆盖。
