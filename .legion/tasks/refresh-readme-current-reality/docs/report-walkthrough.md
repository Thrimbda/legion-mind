# Report Walkthrough: refresh-readme-current-reality

日期：2026-04-27

## Mode

implementation（README documentation change）

## Reviewer summary

- README 的 `当前现实` 与 `通往 v1` 相关 sections 已更新为当前仓库真实状态：workflow kernel、任务/wiki/规则层分工、OpenCode / OpenClaw setup parity、regression suite、VibeHarnessBench v0.1、GitHub Actions OpenCode 接线与 current-truth 收敛。
- 变更没有扩展 runtime 支持面：README 仍明确当前维护 runtime 只有 OpenCode 与 OpenClaw，没有重新引入 Claude / Codex / Cursor / Gemini 泛化支持叙事。
- CLI 边界仍保持为 `.legion/tasks/**` 的本地初始化、查询和有限更新薄工具；未被描述为 runtime orchestrator、状态注册表或审计层。
- 未毕业项更明确：发布 / CI 闭环、真实项目压力测试、低摩擦 onboarding、benchmark sandbox/full-stack/生产隔离能力仍未毕业。

## What changed

- `README.md` 的 `已经成型的部分` 从泛化能力列表改为更具体的 current-reality 描述。
- `README.md` 的 `还没有毕业的部分` 明确保留当前缺口与边界，避免把本地可运行内核误读为成熟 OS / 稳定发行包。
- `README.md` 的 v1 门槛改为围绕 README/wiki/阶段技能/CLI 薄工具一致性、OpenCode / OpenClaw strict verify、regression、CI/release、真实项目压力测试与 runtime 扩展门禁来判断。

## Verification evidence

来自 `docs/test-report.md`：

- `git status` / `git diff` 检查通过；tracked diff 仅为 `README.md`，README diff 只修改 `当前现实` 与 `通往 v1` 相关叙事。
- README 静态支持边界检查通过：禁用 runtime names 未出现在 README，且 OpenCode / OpenClaw-only、CLI-thin、regression、benchmark、current-truth 等必要事实均存在。
- 变更范围静态检查通过：未修改 setup scripts、tests、GitHub Actions、package metadata 或 lockfiles。
- `npm run test:regression` 通过：10 tests / 10 pass / 0 fail；npm 的 `Unknown env config "tmp"` warning 未影响结果，且与 README-only 变更无关。

## Review evidence

来自 `docs/review-change.md`：

- Review 结论：PASS，无 blocking findings。
- Correctness：README 已准确反映 OpenCode / OpenClaw setup parity、regression suite、VibeHarnessBench v0.1、GitHub Actions OpenCode 接线、current-truth 收敛与未毕业边界。
- Scope compliance：代码、setup scripts、tests、package metadata 与 GitHub Actions 未被修改。
- Runtime / CLI boundary：未扩展 OpenCode / OpenClaw 之外的 runtime 支持承诺；CLI 仍是本地薄工具。
- Security lens：未触发安全审查条件，因为本次为 README 文档更新。

## Boundaries and non-claims

- 本任务不新增 runtime 支持，不把 OpenCode / OpenClaw 支持面外推到其他 agent runtime。
- 本任务不扩展 CLI 能力；CLI 仍不是 orchestrator、状态注册表或审计层。
- 本任务不修改 setup scripts、regression tests、GitHub Actions、package metadata 或发布流程。
- 本任务不声称 VibeHarnessBench 已是完整 sandbox、完整 full-stack benchmark 或生产级隔离执行平台。
- 本任务未验证真实 GitHub Actions workflow、发布 / CI release pipeline，或真实用户目录中的 OpenCode / OpenClaw 全局安装；这些仍属于 README 明确列出的未毕业项。

## Exit note

report-walkthrough completed for implementation mode; next phase should hand off to Legion wiki writeback / PR lifecycle.
