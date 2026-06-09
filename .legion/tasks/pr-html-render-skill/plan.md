# pr-html-render skill 集成

## 任务目标

将用户提供的 `pr-html-report-preview-skill.zip` 中的预览发布能力，整理为仓库内独立 Legion skill：`pr-html-render`。同时改造 `report-walkthrough`，使其生成的 HTML walkthrough 默认交给 `pr-html-render` 负责渲染、发布或形成 PR 预览交付路径。

## 问题陈述

`report-walkthrough` 已经要求生成 `docs/report-walkthrough.html` 作为主 reviewer artifact，但目前只定义了 HTML 文件本身，没有把“在 PR review 中如何打开渲染后的 HTML”固化为独立能力。用户提供的 zip 已包含 PR HTML preview 的安全发布思路和 GitHub Pages workflow 模板，但它还不是本仓库的 Legion skill，也没有接入 Legion workflow、report evidence、PR lifecycle 边界与现有 skill surface。

## 验收标准

- 新增 `skills/pr-html-render/SKILL.md`，frontmatter name 与目录名一致，语义从通用 `pr-html-report-preview` 改为 `pr-html-render`。
- 从 zip 迁移必要模板与 eval，命名和说明改为 `pr-html-render`，并保留 GitHub Pages PR preview 的安全边界。
- `pr-html-render` 明确契合 Legion：只渲染/发布既有 HTML artifact，不补设计、验证、review、walkthrough 或 PR lifecycle；对仓库修改型任务仍服从 `legion-workflow` 与 `git-worktree-pr`。
- `report-walkthrough` 改为要求 HTML walkthrough 生成后，默认触发或交给 `pr-html-render` 形成 rendered PR preview / reviewable URL 路径；同时保留 Markdown fallback 与 PR body 的边界。
- OpenCode / OpenClaw skill surface 与 regression 不漂移；必要时更新安装 skill list 或测试期望。
- 产出本任务的设计、验证、review、walkthrough 与 wiki writeback 证据，并通过 PR lifecycle 完成。

## 范围

- 解包 zip 中的 skill 源内容，并迁移为 `skills/pr-html-render/**`。
- 改写新 skill 的触发描述、workflow、security rules、verification checklist、evals 与模板 marker，使其成为可复用的 HTML report render skill。
- 改造 `skills/report-walkthrough/SKILL.md` 与相关 HTML template reference，使 `docs/report-walkthrough.html` 的后续渲染路径明确依赖 `pr-html-render`。
- 更新 regression 覆盖或安装 surface，确保新增 skill 不被安装/发现逻辑遗漏。
- 更新 `.legion/wiki/**` 记录新模式。

## 非范围

- 不为当前仓库新增真实 GitHub Actions workflow，除非设计阶段证明这是安装面必需；本任务目标是提供 skill 与模板，不开启仓库自己的 preview site。
- 不实际启用 GitHub Pages、环境保护规则或仓库设置。
- 不把 `pr-html-render` 做成 PR lifecycle 终态判断器；PR merge/checks/review/cleanup 仍由 `git-worktree-pr` 管理。
- 不修改 `docs/report-walkthrough.html` 的信息架构质量门为视觉框架或外部渲染依赖。
- 不提交用户提供的原始 zip，除非后续发现它必须作为审计输入保留；默认只提交解包后的 skill 源。

## 假设

- zip 是用户提供的可信输入，但迁移后仍需要按本仓库 skill 规范审查和改名。
- 目标平台优先覆盖 GitHub PR，因为 zip 模板当前就是 GitHub Pages / Actions；其他平台保留概念指导，不在本任务实现模板。
- `report-walkthrough` 的 HTML artifact 仍必须 standalone，可被本地打开，也可被 `pr-html-render` 发布到静态预览 URL。
- 新 skill 对 OpenClaw 动态发现自然生效；OpenCode 是否安装需以现有 `setup-opencode.ts` 的 explicit list 为准。

## 约束

- 必须遵循 Legion workflow 与 `git-worktree-pr` envelope，在 `.worktrees/pr-html-render-skill/` 内开发并通过 PR 交付。
- 所有任务文档使用中文。
- skill frontmatter description 必须清晰说明触发时机，避免和 `report-walkthrough`、`git-worktree-pr` 混淆。
- 渲染/发布 HTML 时必须保留安全边界：不在运行未信任 PR 代码的 job 中使用写权限，不发布包含秘密或敏感数据的报告，不用 `pull_request_target` 构建 PR head code。
- `report-walkthrough` 仍只整理已有证据，不能因为接入渲染 skill 而承担发布、checks 或 merge 责任。

## 风险

- zip 中模板使用 GitHub Pages 与 preview branch，若直接迁移可能被误用到 public fork PR 或敏感报告场景。
- `pr-html-render` 若描述过宽，可能在普通 HTML 设计任务中误触发；若描述过窄，又不会在 walkthrough 渲染路径中触发。
- `report-walkthrough` 与 `pr-html-render` 边界不清会导致一个 skill 试图补另一个阶段的工作。
- 新 skill 加入后可能影响 OpenCode installed skill list regression，需要同步安装 surface 或明确不安装。

## 推荐方向

- 将 zip 中 `pr-html-report-preview` 改造成 `pr-html-render`：保留“静态 HTML PR preview + 安全权限分离”的核心，重写为 Legion 语境下的 HTML artifact rendering skill。
- 新 skill 默认接受 `docs/report-walkthrough.html` 等已生成 HTML artifact 作为输入，输出渲染方案、模板 workflow 和 review URL/PR comment 路径；它不生成 walkthrough 内容。
- `report-walkthrough` 只在 exit evidence / return condition / references 中声明：HTML artifact 完成后，PR-backed 交付需要交给 `pr-html-render` 渲染或记录显式 bypass/blocker。
- 保留 zip 模板为 bundled templates，但 marker、名称、说明和 evals 全部改为 `pr-html-render`。

## 阶段拆分

1. Brainstorm：物化当前 contract。
2. Spec RFC：明确两个 skill 的边界、render handoff 语义、安全策略、安装 surface 与验证策略。
3. Review RFC：审查设计是否可实现、是否混淆 Legion lifecycle。
4. Engineer：迁移 zip、创建 `pr-html-render`、改造 `report-walkthrough` 与必要 regression。
5. Verify Change：运行结构检查、skill surface 检查、regression 与模板 smoke check。
6. Review Change：审查交付 readiness 与安全边界。
7. Report Walkthrough：生成本任务 reviewer artifact，使用新 render 语义说明后续路径。
8. Legion Wiki：写回跨任务模式与当前事实。
9. Git / PR lifecycle：commit、rebase、push、PR、checks/review、merge、cleanup、主工作区刷新。
