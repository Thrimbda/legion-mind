# Report Walkthrough

## Profile

implementation

## Reviewer Summary

- 本任务新增 `pr-html-render` support skill，用于把已有 HTML artifact 交给 PR reviewer 以 rendered preview、artifact-only 或内部静态 host 的形式查看。
- `report-walkthrough` 已更新：生成 `docs/report-walkthrough.html` 后，PR-backed handoff 默认交给 `pr-html-render`，或记录显式 render bypass / blocker。
- 安装 surface 已同步：OpenCode explicit install list 包含 `pr-html-render`，OpenClaw dynamic discovery 通过 regression 覆盖。
- 安全边界已保留：PR code build job 只读，publish/comment job 不执行 PR head code，fork PR 和敏感报告不走 simple public Pages path。

## Scope

In scope:

- `skills/pr-html-render/**`
- `skills/report-walkthrough/SKILL.md`
- `skills/report-walkthrough/references/TEMPLATE_REPORT_WALKTHROUGH_HTML.md`
- `scripts/setup-opencode.ts`
- `tests/regression/skill-surface.test.ts`
- 当前 task docs 与 review evidence

Out of scope:

- 不新增当前仓库 `.github/workflows/**`。
- 不启用 GitHub Pages 或环境设置。
- 不提交原始 zip。
- 不把 `pr-html-render` 做成 Legion phase 或 PR lifecycle 完成判断器。

## Evidence Map

| Claim | Evidence | Status |
|---|---|---|
| 设计边界已明确 | `docs/rfc.md` | PASS |
| RFC 可实现、可验证、可回滚 | `docs/review-rfc.md` | PASS |
| 新 skill 与 report handoff 已实现 | `skills/pr-html-render/**`, `skills/report-walkthrough/**` | PASS |
| 安装 surface 已覆盖 | `scripts/setup-opencode.ts`, `tests/regression/skill-surface.test.ts` | PASS |
| 验证通过 | `docs/test-report.md` | PASS |
| 交付审查通过 | `docs/review-change.md` | PASS |

## Delivery Path

1. Brainstorm 物化 `plan.md` / `tasks.md` / `log.md`。
2. RFC 选择独立 `pr-html-render` support skill，不扩张 `report-walkthrough`。
3. RFC review PASS。
4. Engineer 新增 skill、模板、evals，并改造 `report-walkthrough` handoff。
5. Verify rerun：`git diff --check` PASS，`npm run test:regression` 10/10 PASS，smoke assertions PASS。
6. Review-change PASS，安全视角已覆盖 Actions permissions / PR trust boundary / Pages publishing。
7. 当前 walkthrough 完成后交给 `legion-wiki`。

## Render Handoff

- Artifact: `.legion/tasks/pr-html-render-skill/docs/report-walkthrough.html`
- Render skill: `pr-html-render`
- Current path: artifact-only / local fallback
- Reason: 本任务交付 skill 与 templates，不启用本仓库 GitHub Pages 或 `.github/workflows/**`。这是 `plan.md` 与 RFC 的明确非范围。
- Future path: 在需要 live PR preview 的仓库中，使用 `skills/pr-html-render/templates/github-pages-pr-render.yml`，并完成 Pages source / environment / visibility 设置。

## What Changed

- 新增 `skills/pr-html-render/SKILL.md`，定义 artifact rendering、Legion handoff、安全规则、GitHub template 使用方式与 output checklist。
- 新增 `github-pages-pr-render.yml` 与 `cleanup-pr-render.yml` template。
- 新增 `skills/pr-html-render/evals/evals.json`，保留三类关键场景：walkthrough HTML preview、fork PR 安全拒绝、敏感报告不发 public Pages。
- 更新 `report-walkthrough`：PR-backed HTML artifact 需要 rendered preview path 或 explicit bypass/blocker。
- 更新 HTML walkthrough template：增加 Render Handoff 与 `{{renderState}}`。
- 更新 OpenCode install list 与 regression，且将 `pr-html-render` 归为 support skill，不污染 phase skill list。

## Verification / Review Status

- Verification: PASS，见 `docs/test-report.md`。
- Change review: PASS，见 `docs/review-change.md`。
- Security lens: applied，因为模板涉及 GitHub Actions permissions、PR trust boundary、Pages publishing、PR comments、fork PR 与敏感 HTML 报告。

## Risks and Limits

- 没有实际部署 GitHub Pages preview，因此当前 PR 不会自动产生 live rendered URL。
- GitHub template 默认适合同仓库可信 PR；public fork 自动发布仍需要单独 hardened `workflow_run` 或人工批准设计。
- 敏感 HTML 报告必须走 artifact-only 或 authenticated internal host，不应发 public Pages。

## Reviewer Checklist

- [ ] 确认 `pr-html-render` 是 support skill，不是 Legion phase。
- [ ] 确认 `report-walkthrough` 仍不承担 preview workflow / PR comment / lifecycle 职责。
- [ ] 确认模板安全边界足以作为 same-repo starting point。
- [ ] 确认未启用当前仓库 Pages workflow 符合本任务非范围。

## Final State / Next Stage

当前 task evidence ready。下一步交给 `legion-wiki` 写回 durable pattern；随后进入 `git-worktree-pr` commit / PR lifecycle。`pr-body.md` 只是 PR 创建输入，不代表 PR lifecycle 完成。
