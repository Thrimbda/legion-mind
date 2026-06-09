# Change Review: pr-html-render skill 集成

## 结论

PASS

当前变更 ready for reviewer-facing walkthrough 与 wiki writeback。实现符合 RFC：新增 `pr-html-render` support skill，保留 GitHub Pages PR preview 的安全权限分离，并将 `report-walkthrough` 改为在 PR-backed HTML artifact 完成后交接渲染路径，而不是把发布职责塞回 walkthrough 阶段。

## Blocking findings

无。

## Scope review

### In scope

- 新增 `skills/pr-html-render/**`。
- 迁移并改名 GitHub Pages render / cleanup templates。
- 迁移并改名 evals。
- 更新 `report-walkthrough` 和 HTML walkthrough template 的 render handoff 语义。
- 更新 `setup-opencode.ts` 和 `skill-surface.test.ts`，确保 OpenCode / OpenClaw surface 不遗漏新 skill。
- 写入本任务 RFC、review、test evidence。

### Out of scope avoided

- 未新增当前仓库 `.github/workflows/**`。
- 未启用 GitHub Pages 或仓库环境设置。
- 未提交用户提供的原始 zip。
- 未把 `pr-html-render` 写成 Legion phase、PR lifecycle 判断器或 HTML content generator。

## Correctness / maintainability review

- `pr-html-render` frontmatter name 与目录一致，description 明确触发场景包含 `docs/report-walkthrough.html` 与 PR rendered preview。
- 新 skill 的 hard gate 明确缺 walkthrough 时返回 `report-walkthrough`，避免生成内容职责漂移。
- `report-walkthrough` 保留 HTML-first、Markdown fallback、PR body lifecycle disclaimer，同时新增 render handoff note 和 return condition。
- Regression test 把 `pr-html-render` 放入 `requiredSupportSkills`，没有污染 `requiredPhaseSkills`，与 Legion workflow 阶段语义一致。
- `setup-opencode.ts` explicit install list 包含 `pr-html-render`；OpenClaw 动态发现由现有 regression 覆盖。

## Security lens

已应用。触发原因：模板涉及 GitHub Actions permissions、PR trust boundary、Pages publishing、PR comments、fork PR 与敏感 HTML 报告。

审查结果：PASS。

- Build job 使用 `contents: read`，符合“运行 PR code 不带写权限”的边界。
- Deploy job 才持有 `contents: write` / `pages: write` / `id-token: write` / `pull-requests: write`，并且不 checkout 或执行 PR head code。
- Same-repo PR 才使用简单 Pages publish path；fork PR 被模板条件排除，并在 skill 文档中要求 hardened `workflow_run` / manual approval。
- Cleanup workflow 使用 `pull_request_target`，但说明并保持为 preview branch metadata cleanup，不 checkout 或执行 PR head code。
- Skill 明确禁止把 secrets、private logs、customer data、internal URLs、tokens 等敏感内容发布到 public Pages。

未发现 exploitable 或 trust-boundary blocker。

## Verification evidence reviewed

来源：`docs/test-report.md`

- `git diff --check` PASS。
- `npm run test:regression` PASS，10/10。
- `pr-html-render` smoke assertions PASS。
- 复跑后确认 `pr-html-render` 是 support skill，不是 phase skill。

## Non-blocking suggestions

- 如果未来要支持 public fork PR 自动发布，单独设计 hardened `workflow_run` publisher，不要扩展当前 same-repo template。
- 若某个仓库实际启用 Pages preview，首次 PR 应人工确认 Pages environment、visibility 与 preview branch retention 策略。

## 下一步

进入 `report-walkthrough`，生成本任务 reviewer-facing artifact；随后执行 `legion-wiki` writeback。
