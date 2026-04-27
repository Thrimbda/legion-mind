# refresh-readme-current-reality

## 任务摘要

- 目标：维护 README 中 `当前现实` 与 `通往 v1` 的真实状态叙事，使其准确反映 `harden-v1-kernel-harness` 后的仓库现实。
- 风险级别：Low；README-only 文档维护，不修改 setup、regression、CLI、benchmark、CI 或 release 行为。
- 生产代码范围：`README.md`。

## 当前结论

- README 的已成型能力现在明确包括：`legion-workflow` 工作流内核、任务/wiki/规则层分工、OpenCode / OpenClaw 共享 setup core 与 lifecycle parity、`npm run test:regression`、VibeHarnessBench local-first semantic v0.1、GitHub Actions OpenCode 接线，以及根 `docs/` 退出 current truth。
- README 的未毕业项现在明确包括：发布 / CI / 默认可发布信号未闭环、真实项目与多人协作压力测试不足、CLI 仍是薄文件工具、runtime 支持面只有 OpenCode / OpenClaw、benchmark 仍非完整 sandbox/full-stack/生产隔离平台、低摩擦 onboarding 仍需打磨。
- README 没有重新引入 Claude / Codex / Cursor / Gemini 泛化 runtime 支持叙事，也没有把 CLI 描述为 runtime orchestrator、状态注册表或审计层。
- `npm run test:regression` 在本任务中仍为 PASS（10/10）。`review-change` PASS，blocking findings 为 0。

## 证据入口

- Plan：`.legion/tasks/refresh-readme-current-reality/plan.md`
- Test Report：`.legion/tasks/refresh-readme-current-reality/docs/test-report.md`
- Change Review：`.legion/tasks/refresh-readme-current-reality/docs/review-change.md`
- Walkthrough：`.legion/tasks/refresh-readme-current-reality/docs/report-walkthrough.md`
- PR Body：`.legion/tasks/refresh-readme-current-reality/docs/pr-body.md`

## 后续注意

- README 仍是 current product entry；若仓库能力再次变化，应同步 `当前现实` 与 `.legion/wiki/**`，避免 README 重新滞后。
- 任何 runtime 扩展或 CLI orchestrator 化仍需独立 contract / design gate，不应从当前 OpenCode / OpenClaw 支持面自然外推。
