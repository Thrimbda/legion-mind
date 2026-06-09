# RFC: pr-html-render skill 与 report-walkthrough 渲染交接

## 读者与目的

- 读者：维护 Legion skills 的 reviewer / tech lead。
- 目的：确认新增 `pr-html-render` skill 和 `report-walkthrough` 的交接边界安全、可实现、不会扩张 Legion workflow 或 PR lifecycle 语义。

## 背景

`report-walkthrough` 已经把 `docs/report-walkthrough.html` 定义为主 reviewer artifact。当前缺口是：HTML 文件生成后，reviewer 在 PR 中如何看到“渲染后的页面”还没有独立能力承载。用户提供的 `pr-html-report-preview-skill.zip` 已包含一个通用 PR HTML preview skill，它强调 GitHub Pages、PR comment、权限分离与 fork PR 风险。

本任务将该能力收编为仓库内 `pr-html-render` skill，并让 `report-walkthrough` 在 HTML artifact 完成后把渲染/发布路径交给它。

## 设计目标

- `pr-html-render` 是独立 skill，负责把已有 HTML artifact 变成 reviewer 可打开的 rendered preview 路径。
- `report-walkthrough` 仍只生成证据型 walkthrough，不承担发布、CI、PR comment、checks 或 merge 责任。
- GitHub Pages PR preview 模板保留，但作为可复制模板，不直接改造本仓库 CI。
- 安全边界比原 zip 更适配 Legion：先有 evidence artifact，再考虑渲染；任何修改型落地仍服从 `legion-workflow` 与 `git-worktree-pr`。
- 新 skill 能被现有 install / discovery surface 覆盖，并进入 regression 保护。

## 非目标

- 不启用当前仓库的 GitHub Pages。
- 不实际创建 `.github/workflows/**`。
- 不把 `pr-html-render` 做成 artifact 生成器或 HTML 设计规范。
- 不让 `pr-html-render` 判断 PR 是否可合并。
- 不支持所有 CI 平台的完整模板；本次只迁移 GitHub 模板，其他平台保留选择指导。

## 现状观察

- `scripts/setup-opencode.ts` 使用显式 `INSTALLED_SKILLS` 列表；新增 skill 若希望 OpenCode 安装，需要加入该列表。
- `setup-openclaw.ts` 从 `skills/**/SKILL.md` 动态发现 skills；新增目录天然可被发现。
- `tests/regression/skill-surface.test.ts` 检查 OpenCode explicit list 中的技能都存在，并要求 OpenClaw dynamic surface 覆盖 OpenCode；新增 skill 加入 OpenCode list 后应继续通过。
- zip 原 skill 的核心语义是“CI 生成 HTML report，发布为 PR preview URL，并在 PR comment 中更新链接”。这需要改写为“已有 HTML artifact render skill”，避免和 `report-walkthrough` 的内容生成职责重叠。

## 方案比较

### 方案 A：直接原样解包并重命名

把 `pr-html-report-preview` 目录复制到 `skills/pr-html-render`，只替换名称。

优点：实现最快，保留原模板。

缺点：仍以 CI-generated report 为中心，不理解 Legion evidence、report-walkthrough、阶段链或 PR lifecycle 边界；容易误导 future agents 直接在 `report-walkthrough` 中做发布工作。

结论：不采用。

### 方案 B：把渲染能力塞进 report-walkthrough

让 `report-walkthrough` 同时生成 HTML、写 workflow、发布 preview、写 PR comment。

优点：一个 skill 完成更多步骤，调用路径短。

缺点：违背现有 `report-walkthrough` 定义。它只应重组已有证据，不能补 CI、补发布或替代 PR lifecycle。职责膨胀后会让 review handoff 难以审查。

结论：不采用。

### 方案 C：新增 `pr-html-render`，让 report-walkthrough 输出后交接给它

`report-walkthrough` 继续生成 standalone HTML artifact，并在 exit / return condition / reference 中声明：PR-backed 交付需要把该 artifact 交给 `pr-html-render` 渲染或显式记录 bypass/blocker。`pr-html-render` 接收已有 HTML artifact，选择本地打开、Actions artifact、GitHub Pages PR preview 或内部静态 host 路径，并提供可复制模板。

优点：职责清晰；保留原 zip 的安全价值；适配 Legion evidence 和 PR lifecycle；后续也能用于其他 HTML report。

缺点：多一个 skill 交接点，要求描述和 return condition 写清楚，避免 agents 忘记调用。

结论：采用。

## 推荐设计

### Skill 结构

新增：

```text
skills/pr-html-render/
├── SKILL.md
├── templates/
│   ├── github-pages-pr-render.yml
│   └── cleanup-pr-render.yml
└── evals/
    └── evals.json
```

命名选择：

- skill name：`pr-html-render`
- marker：`<!-- pr-html-render -->`
- workflow display name：`PR HTML Render Preview`
- preview branch 默认名仍可使用 `pr-preview-pages`，因为这是 storage implementation detail，不等于 skill 名称。

### pr-html-render 语义

`pr-html-render` 的核心输入是已经存在的 HTML artifact，例如：

- `.legion/tasks/<task-id>/docs/report-walkthrough.html`
- `report/index.html`
- 任意 CI 生成的 static HTML report

它负责帮助 agent 选择或实现“reviewer 能看到渲染页面”的路径：

1. 本地/直接文件打开：适用于不需要 PR reviewer URL 的场景。
2. GitHub Actions artifact：适用于敏感报告或不允许公开 Pages 的场景，但不提供直接 rendered URL。
3. GitHub Pages PR preview：适用于可公开给 Pages 可见范围的静态 HTML。
4. 内部认证静态 host：适用于包含内部信息的 HTML。

默认推荐保持原 zip 的 GitHub Pages Actions 模板，但要把“安全发布”写成选择结果，而不是默认无条件执行。

### Legion 边界

`pr-html-render` 必须写明：

- 如果使用者要修改仓库 workflow/template 文件，且仓库是 Legion-managed，必须先经过 `legion-workflow` 和 `git-worktree-pr`。
- 它不生成 `docs/report-walkthrough.html` 内容；缺 walkthrough 时返回 `report-walkthrough`。
- 它不补测试、review、RFC 或 wiki writeback。
- 它不判断 PR lifecycle 完成；PR 终态仍由 `git-worktree-pr` 处理。
- 它可以生成或修改 CI workflow 模板，但这只是让 HTML artifact 可渲染，不代表 PR 已 ready。

### report-walkthrough 改造

在 `report-walkthrough` 中做最小但明确的改造：

- Overview / exit evidence：HTML artifact 完成后，PR-backed reviewer handoff 默认需要 `pr-html-render` 形成 rendered preview 或记录显式 bypass/blocker。
- HTML requirements：保持 standalone HTML，避免让 HTML 依赖 preview hosting 才能阅读。
- Return conditions：若 PR-backed 交付缺 rendered preview path 且无 bypass/blocker，转交 `pr-html-render`，不是在 walkthrough 中补发布。
- References：新增 `pr-html-render` 作为后续渲染 skill。

### 安全策略

保留并强化 zip 中的规则：

- Treat generated HTML from PR code as untrusted.
- 构建 PR code 的 job 使用只读权限。
- 发布/评论的 job 不 checkout 或执行 PR head code。
- 不用 `pull_request_target` 构建 PR head code；cleanup 类 metadata 操作才可使用。
- public/fork PR 默认不发布 Pages preview，除非有 hardened `workflow_run` 或人工批准路径。
- 含 secrets、private logs、account data、customer data、internal URLs 的报告不得发布到 public Pages。
- shell 中使用 env 承载 PR title/body/branch 等不可信字符串，避免直接插值 GitHub expression。

### 安装与 regression

- 将 `pr-html-render` 加入 `scripts/setup-opencode.ts` 的 `INSTALLED_SKILLS`，让 OpenCode 默认安装。
- OpenClaw 动态发现无需额外列表更新。
- `tests/regression/skill-surface.test.ts` 应增加一个 assertion：OpenCode installed list 包含 `pr-html-render`，从而防止未来被遗漏。

### Evals

迁移 zip evals，并改成 `pr-html-render` 语义：

- PR 已有 `docs/report-walkthrough.html`，需要 PR comment 中的 rendered preview URL。
- public fork PR 想用 `pull_request_target` 构建并发布，skill 应拒绝。
- HTML 报告含 private logs/account IDs，skill 应推荐 artifacts 或 internal host，不发布 public Pages。

这些 evals 存在于 skill bundle 中，作为未来手工或自动 skill eval 输入。本任务不强制跑完整 skill-creator benchmark viewer，因为仓库当前 regression surface 不是该体系。

## 实施计划

1. 从 zip 解包必要文件到 `skills/pr-html-render/**`。
2. 重写 `SKILL.md`：frontmatter、overview、classification、decision guide、Legion integration、security rules、verification checklist、output summary。
3. 重命名模板文件并替换 workflow 名称、marker、artifact 语义。
4. 更新 evals skill name、prompt 与 expected_output。
5. 更新 `report-walkthrough` 的 handoff / return / references 文本。
6. 更新 `setup-opencode.ts` 与 `skill-surface.test.ts`。
7. 运行结构检查、`git diff --check`、`npm run test:regression`，并做文本 smoke checks。

## Rollback

如果实现后发现边界混淆或 regression 失败且无法快速修复：

- 删除 `skills/pr-html-render/**`。
- 从 `setup-opencode.ts` 与 `skill-surface.test.ts` 移除 `pr-html-render`。
- 回退 `report-walkthrough` 中对 `pr-html-render` 的引用。
- 保留 task docs 中的失败原因与后续拆分建议。

## 验证计划

- `git diff --check`
- `npm run test:regression`
- 文本 smoke check：
  - `skills/pr-html-render/SKILL.md` frontmatter name 为 `pr-html-render`。
  - 新 skill 不含旧 marker `pr-html-report-preview`，除非作为历史输入名出现且明确说明。
  - 模板 marker 使用 `<!-- pr-html-render -->`。
  - `report-walkthrough` 引用 `pr-html-render` 且仍说明 PR body 不代表 lifecycle 完成。
  - `setup-opencode.ts` 与 regression 包含 `pr-html-render`。

## Open Questions

- 当前任务是否提交原始 zip？推荐不提交，因为 zip 是用户输入材料，仓库最终真源应是解包后的 skill 源文件。
- 是否需要完整运行 skill-creator eval viewer？推荐不作为本任务 gate。迁移 evals 足以保留测试意图；当前仓库可执行 gate 是 regression suite 与 smoke checks。
