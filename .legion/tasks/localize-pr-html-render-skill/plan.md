# pr-html-render skill 中文化

## 任务目标

将 `skills/pr-html-render/SKILL.md` 的主体说明改为中文表达，使该 skill 与仓库内 Legion 文档风格一致，同时保留必要英文技术名词、文件名、GitHub Actions 权限名、模板名和触发关键词。

## 问题陈述

`pr-html-render` 是刚加入的 support skill，用于把已有 HTML reviewer artifact 渲染成 PR 预览路径。当前 `SKILL.md` 主要用英文写成，而仓库中的 Legion task docs 和大多数核心 workflow skill 使用中文表达。用户明确指出“SKILL 改成中文写”，需要修正文档语言，同时不能弱化 skill 的触发能力、安全边界和与 `report-walkthrough` / `git-worktree-pr` 的职责分工。

## 验收标准

- `skills/pr-html-render/SKILL.md` 的 frontmatter description 和主体说明改为中文为主。
- 保留关键技术 token：`pr-html-render`、`docs/report-walkthrough.html`、`report-walkthrough`、`git-worktree-pr`、`legion-workflow`、`GitHub Pages`、`pull_request_target`、permissions 名称、模板文件名等。
- 不改动 workflow template 的可执行 YAML 语义；本任务只做 skill 说明中文化，必要时可保留模板注释英文。
- 不改变 `pr-html-render` 的职责边界：只处理已有 HTML artifact 的渲染/发布路径，不生成报告内容，不替代 PR lifecycle。
- 验证能证明 skill frontmatter、关键边界、安装 surface 和 regression 未破坏。
- 完成 Legion 证据链、wiki writeback 与 PR lifecycle。

## 范围

- 修改 `skills/pr-html-render/SKILL.md`。
- 如有必要，更新 `skills/pr-html-render/evals/evals.json` 的 prompt / expected_output 为中文或中英混合，以贴合中文 skill 文风。
- 更新本任务 `.legion/tasks/localize-pr-html-render-skill/**`。
- 更新 `.legion/wiki/**`，记录 `pr-html-render` 当前文风已中文化。

## 非范围

- 不修改 `github-pages-pr-render.yml` / `cleanup-pr-render.yml` 的逻辑。
- 不重新设计 `pr-html-render` 的安全模型。
- 不改 `report-walkthrough` 的协议，除非发现其引用因此不一致。
- 不运行完整 skill-creator benchmark viewer；当前是语言一致性修正，可用 regression 和 smoke checks 覆盖。

## 假设

- 用户说的“你的 SKILL”指上一步新增的 `pr-html-render` skill。
- 中文化应服务未来中文使用者和 Legion repo 风格，但 description 仍要包含英文关键词以利触发。
- 这是低风险文档/skill 文案修改，不需要重新走 RFC 设计门。

## 约束

- 必须遵循 `legion-workflow` 和 `git-worktree-pr`，所有实现都在 `.worktrees/localize-pr-html-render-skill/` 内完成。
- 所有 task 文档使用中文。
- 不提交或触碰主工作区既有 `.opencode/package-lock.json` 脏改动与输入 zip。
- 修改 skill 后需提醒用户重启 opencode 才能让已安装/已加载 skill 生效。

## 风险

- 如果 description 完全中文化且丢失英文关键词，可能降低自动触发率。
- 如果翻译时删掉安全规则，可能误导 future agents 使用不安全 PR preview 流程。
- 如果把模板注释也大改，可能引入 YAML 误改风险。

## 推荐方向

采用低风险实现路径：只中文化 `SKILL.md` 和必要 eval 文案，保留技术 token 与模板文件名。验证通过 `git diff --check`、`npm run test:regression` 和针对 `SKILL.md` 的 smoke assertions。

## 阶段拆分

1. Brainstorm：物化当前 contract。
2. Engineer：中文化 `pr-html-render` skill 文案。
3. Verify Change：执行 regression 与文本 smoke checks。
4. Review Change：确认 scope、安全边界和触发语义未回退。
5. Report Walkthrough：生成 reviewer-facing handoff。
6. Legion Wiki：写回当前结论。
7. Git / PR lifecycle：commit、rebase、push、PR、checks/review、merge、cleanup、主工作区刷新。
