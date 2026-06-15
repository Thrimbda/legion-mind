# 全仓库 Skill 中文输出约束日志

## 2026-06-15

- 用户要求使用 Legion workflow，为本仓库所有 skill 增加“使用中文回答并输出文档产物（如果有）”的约束，并允许根据各 skill 实际情况调整。
- 已加载 `legion-workflow`，确认当前仓库为 Legion-managed，任务为非 bypass 的修改型多步骤工作。
- 当前请求没有指定既有 task id，按入口规则加载 `brainstorm` 进入新任务契约收敛。
- 已读取仓库入口、`skills/` 列表和 `.legion` 状态；确认仓库内共有 13 个可安装 skill：`brainstorm`、`engineer`、`git-worktree-pr`、`legion-docs`、`legion-wiki`、`legion-workflow`、`llm-wiki`、`pr-html-render`、`report-walkthrough`、`review-change`、`review-rfc`、`spec-rfc`、`verify-change`。
- 已加载 `git-worktree-pr`；主工作区只做准备与只读检查，从最新 `origin/master` 创建 worktree `.worktrees/localize-skill-outputs/`，分支 `legion/localize-skill-outputs-chinese-docs`。
- 已加载 `legion-docs`、`customize-opencode`、`writing-skills`，用于 task 文档落点、skill loader/frontmatter 约束和 skill 编辑质量约束。
- Contract 稳定：scope 限定为仓库 `skills/*/SKILL.md`；默认中文回答与文档产物中文输出，但保留代码、命令、路径、机器可读字段、错误原文、英文技术 token 和用户指定语言。
- 由于任务跨 13 个核心 workflow skill，按中风险文档行为变更处理，进入 `spec-rfc -> review-rfc` 设计门后再实现。
- 已加载 `spec-rfc`，完成 `docs/rfc.md`。决策采用“统一原则 + 按 skill 职责定制落点”，不改 frontmatter description、安装脚本、模板或测试 harness。
- 已加载 `review-rfc`，完成 `docs/review-rfc.md`，结论 PASS；无 blocking findings，允许进入 `engineer`。
- 已加载 `engineer`，按 RFC 更新 13 个 `skills/*/SKILL.md`：均新增“输出语言与文档产物”约束，默认中文回答与中文文档产物，同时保留代码、命令、路径、机器可读字段、错误原文和平台术语。
- 已加载 `verify-change`，完成 `docs/test-report.md`。`git diff --check` PASS；静态 smoke check 确认 13 个 `SKILL.md` 均含中文输出与文档产物约束；`npm run test:regression` 13/13 PASS。
- 已加载 `review-change`，完成 `docs/review-change.md`，结论 PASS；scope、correctness、maintainability 均通过，security trigger 未命中且 PR trust boundary 文案未被削弱。
- 已加载 `report-walkthrough` 与 `clean-doc`，完成 `docs/report-walkthrough.md`、`docs/report-walkthrough.html` 和 `docs/pr-body.md`。HTML artifact 记录为 artifact-only/local fallback；如 reviewer 需要 rendered URL，可后续使用 `pr-html-render`。
- 已加载 `legion-wiki`，完成 wiki writeback：更新 `index.md`、`patterns.md`、`log.md`，新增 `tasks/localize-skill-outputs.md`。
- 收口后复验完成：`git diff --check` PASS；skill static smoke PASS；HTML walkthrough smoke PASS；`npm run test:regression` 13/13 PASS，并已补充到 `docs/test-report.md`。
