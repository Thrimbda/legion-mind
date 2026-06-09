# Test Report: pr-html-render skill 集成

## 结论

PASS

本次验证覆盖了新增 skill surface、`report-walkthrough` handoff、模板 marker、安装列表与仓库 regression。未发现阻塞问题。

## 验证命令

### 1. Whitespace / patch hygiene

```bash
git diff --check
```

结果：PASS，无输出。

选择理由：本任务新增较多 Markdown / YAML / JSON 文件，`git diff --check` 能直接发现 trailing whitespace、冲突标记等基础 patch 问题。

### 2. Regression suite

```bash
npm run test:regression
```

结果：PASS。

摘要：

- tests: 10
- pass: 10
- fail: 0
- duration_ms: 1472.258254

关键覆盖：

- OpenCode installed skill list exists on disk and includes required skills
- OpenClaw dynamic skill surface is an OpenCode superset
- setup lifecycle 与 CLI filesystem invariants 仍通过

选择理由：新增 `pr-html-render` 后更新了 `scripts/setup-opencode.ts` 和 `tests/regression/skill-surface.test.ts`，regression suite 是当前仓库最可信的安装 surface 与 skill discovery 验证入口。

### 3. pr-html-render smoke assertions

```bash
node --input-type=module <<'JS'
// 读取 skills/pr-html-render、report-walkthrough、setup-opencode 与 regression 文件，执行结构断言。
JS
```

结果：PASS，输出：

```text
pr-html-render smoke checks passed
```

断言覆盖：

- `skills/pr-html-render/SKILL.md` 存在且 frontmatter name 为 `pr-html-render`。
- 新 skill 提到 `docs/report-walkthrough.html`、`legion-workflow`、`git-worktree-pr`。
- 新 skill 保留 `pull_request_target` 安全警告。
- 新 workflow 不含旧 active skill name / marker，使用 `<!-- pr-html-render -->`。
- workflow 包含 `HTML_ARTIFACT_DIR` / `HTML_ENTRYPOINT`，可适配已有 HTML artifact。
- cleanup template 明确 `pull_request_target` 只用于安全 metadata cleanup，不 checkout 或执行 PR head code。
- evals 的 `skill_name` 为 `pr-html-render`。
- `report-walkthrough` 引用 `pr-html-render`，且保留 `pr-body.md` 不代表 PR lifecycle 完成的边界。
- HTML walkthrough template 包含 Render Handoff 与 `{{renderState}}`。
- `setup-opencode.ts` 包含 `pr-html-render`。
- `skill-surface.test.ts` 通过 `requiredSupportSkills` 要求安装 `pr-html-render`，避免把它误标成 Legion phase skill。

选择理由：regression 能证明安装/discovery surface，但不能直接证明新 skill 与 `report-walkthrough` 的语义联动。smoke assertions 针对本任务核心验收补充文本级证据。

### 4. Walkthrough HTML artifact smoke check

```bash
node --input-type=module <<'JS'
// 检查 docs/report-walkthrough.html 的 HTML-first 质量门。
JS
```

结果：PASS，输出：

```text
walkthrough HTML smoke checks passed
```

断言覆盖：

- `<!doctype html>`、`lang="zh-CN"`、viewport。
- 使用 OKLCH，不含 `#000` / `#fff`。
- 不含 `background-clip: text`。
- 不含 `border-left` / `border-right` 属性。
- 不含 em dash 字符。
- 不含外部 URL。
- 包含 Evidence Map、Delivery Path、Render Handoff、Verification / Review Status、Risks and Limits、Final State / Next Stage。
- 包含 responsive CSS 与 print CSS。

## 未执行项

- 未运行完整 skill-creator eval viewer。RFC 已将其排除为本任务 gate；迁移的 evals 保留在 `skills/pr-html-render/evals/evals.json`，供未来专项评估。
- 未实际部署 GitHub Pages preview。当前任务目标是 skill 与模板迁移，不启用仓库自己的 Pages 或 workflow。

## 验证边界

- 本报告证明仓库文件、skill surface、模板语义和 regression 通过。
- 不证明某个真实仓库已经启用 GitHub Pages，也不证明 PR preview URL 已实际上线；这些属于使用 `pr-html-render` 模板后的仓库级配置验证。

## 复跑与最终 artifact 说明

审查前发现 `pr-html-render` 不应进入 `requiredPhaseSkills`。已将 regression 拆成 phase skills 与 support skills 后重新运行全部验证；本报告中的结果为复跑后的最终结果。

`report-walkthrough` 阶段生成 HTML artifact 后，又补跑 `git diff --check` 与 walkthrough HTML smoke check，结果均为 PASS。
