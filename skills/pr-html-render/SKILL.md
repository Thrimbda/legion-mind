---
name: pr-html-render
description: 当 PR reviewer 需要为已有 HTML artifact 获取 rendered URL 或预览链接时使用，例如 `docs/report-walkthrough.html`、Legion walkthrough HTML report、CI HTML report、GitHub Pages PR preview、PR comment preview link 或 static HTML review artifact。应在 `report-walkthrough` 已生成 HTML 后使用，不负责生成报告内容本身。
---

# pr-html-render

## 概览

`pr-html-render` 把已经存在的 HTML artifact 转成 PR reviewer 可以直接打开的 rendered preview path。它是渲染和发布交接 skill，不是报告生成器。

默认原则：运行或收集不可信 PR 内容时使用低权限；发布 preview 或写 PR comment 的步骤必须是独立的高权限步骤，并且不能 checkout 或执行 PR head code。

## 硬门禁

- HTML artifact 必须已经存在，或必须由明确的 report command 生成。
- 如果期望 artifact 是 `docs/report-walkthrough.html` 但文件不存在，退回 `report-walkthrough`；不要在本 skill 中发明 walkthrough 内容。
- 不要用本 skill 补设计、补验证、补 review、补 wiki writeback、处理 PR checks、merge、cleanup 或 main workspace refresh。
- 在 Legion-managed 仓库中，如果要修改 workflow、template 或其他仓库文件，仍必须先经过 `legion-workflow` 与 `git-worktree-pr` envelope。
- 把从 PR code 生成的 HTML 视为不可信内容。
- 不要把包含 secrets、private logs、account data、customer data、internal URLs、tokens 或其他敏感信息的 HTML 发布到 public Pages。

## 适用时机

- Legion task 已生成 `docs/report-walkthrough.html`，PR reviewer 需要以 rendered HTML 形式打开它。
- CI 已生成 static HTML report，用户需要稳定的 PR preview URL。
- 用户提到 GitHub Pages PR preview、PR comment preview link、rendered HTML artifact，或想在 review 中查看 HTML report。
- `report-walkthrough` 交接了 PR-backed HTML artifact，并且没有 explicit render bypass 或 blocker。

不要用在：

- 用户还需要设计或编写 HTML report 内容；应先使用生成报告或设计界面的对应 skill。
- artifact 含敏感信息，且 artifact-only 或 authenticated host 也不可接受。
- 任务只是 PR lifecycle 跟进；那属于 `git-worktree-pr` 语义。

## 修改前分类

修改 workflow 前，先询问或推断这些事实：

- Artifact path：Legion walkthrough 通常是 `.legion/tasks/<task-id>/docs/report-walkthrough.html`。
- Entry file：静态托管时应该作为 `index.html` 打开的文件。
- Platform：GitHub Actions、GitLab CI、internal CI，或 local-only。
- Visibility：public Pages、private Pages、authenticated internal host，或 artifact-only。
- Sensitivity：HTML 是否包含 secrets、customer data、private logs、screenshots、internal URLs、tokens 或 account identifiers。
- Trust model：PR 是否可能来自 fork 或不可信贡献者。
- URL shape：稳定 per PR，例如 `/pr-123/`；或 per commit/run，例如 `/pr-123/<sha>/`。

## 决策指南

| Situation | Render path | Notes |
|---|---|---|
| Static HTML 对 Pages 可见范围是安全的 | GitHub Pages PR preview | 优先使用 `actions/upload-pages-artifact` 与 `actions/deploy-pages`。 |
| HTML 含敏感信息 | Actions artifact 或 authenticated internal host | Artifact 有访问控制，但通常不是稳定 rendered URL。 |
| Fork 或不可信 PR | build job 只读；publish 通过 hardened approval / workflow_run path | simple same-repo template 默认不发布 fork PR preview。 |
| 只需要本地 review | 直接打开文件 | 记录不需要 PR preview URL。 |
| 缺 walkthrough HTML | 退回 `report-walkthrough` | 本 skill 渲染已有 HTML，不创建 evidence 内容。 |

GitHub 场景优先选择 Pages source = **GitHub Actions**，并使用 `actions/upload-pages-artifact` 加 `actions/deploy-pages`。不要依赖“用 `GITHUB_TOKEN` 提交生成的 HTML 到 Pages branch 后期待 Pages 自动构建”这种常见失败路径。

## GitHub 默认实现

对 internal 或 trusted same-repository PR，使用 `templates/github-pages-pr-render.yml` 作为起点。

预期行为：

1. PR open/update 时，CI 以 read-only permissions checkout PR code。
2. build job 只在需要时运行配置的 command，收集配置的 HTML artifact directory，并把 entry file 规范化为 `index.html`。
3. build job 上传 staged HTML artifact。
4. deploy job 下载 artifact，更新 `_site/pr-<number>/`，保留其他 PR preview 目录，部署完整 `_site` 到 GitHub Pages，并写入或更新 sticky PR comment。
5. preview URL 形如 `https://<owner>.github.io/<repo>/pr-123/`。

提交 workflow 前，只改这些项目相关值：

- `HTML_RENDER_COMMAND`：例如 HTML 已在 repo 中时使用 `:`，需要 CI 生成时使用 `npm ci && npm run report`。
- `HTML_ARTIFACT_DIR`：例如 `.legion/tasks/<task-id>/docs`。
- `HTML_ENTRYPOINT`：例如 `report-walkthrough.html` 或 `index.html`。
- Node / Python / Rust 等 setup steps 与 dependency caching。
- Preview branch name：只有仓库已经使用不同 preview storage branch 时才改。

只有团队希望 PR 关闭后删除 preview 时，才使用 `templates/cleanup-pr-render.yml`。如果团队有意保留关闭后的 preview，也可以不启用 cleanup，但要记录这个选择。

## Legion 交接规则

- `report-walkthrough` 负责 `docs/report-walkthrough.html`、`docs/report-walkthrough.md` 与 `docs/pr-body.md`。
- `pr-html-render` 负责 rendered preview path、workflow template、PR comment marker 与 render caveats。
- `git-worktree-pr` 负责 commit、push、PR create/update、checks/review、auto-merge、cleanup 与 main workspace refresh。
- `legion-wiki` 负责在 report 与 render handoff evidence 都存在后写入 durable cross-task knowledge。

PR-backed walkthrough 必须记录以下一种结果：

- 已创建 rendered preview URL，或 workflow 会生成该 URL。
- 因敏感性选择 local / artifact-only / internal-host render path。
- 明确的 render bypass 或 blocker，并记录 owner 与恢复条件。

## 安全规则

- 不要把 privileged token 放进运行 arbitrary PR code 的同一个 job。
- 不要用 `pull_request_target` checkout 或运行 PR head code。
- fork PR 默认跳过 Pages publishing；如需发布，必须使用 manual approval 或 hardened `workflow_run` publisher，且 publisher 不得把 artifacts 当代码执行。
- shell scripts 中使用 environment variables 传递 PR title / body / branch name 等不可信字符串；不要把 GitHub expressions 直接插进 shell。
- simple template 只默认支持 same-repo PR publishing。public / fork publishing 属于单独的 hardened design。
- 如果 Pages visibility 比 reviewer group 更宽，不要把敏感报告发布到 Pages。

## 验证清单

实现后检查：

- 如果使用 Pages template，仓库 Pages setting 使用 **GitHub Actions** 作为 source。
- `github-pages` environment 没有用 default-branch-only deployment rule 阻塞该 PR preview workflow，或已记录 blocker。
- PR comment 会更新已有 sticky comment，而不是每次 spam 新 comment。
- URL 打开的是 rendered HTML，不是 raw artifact download。
- 第二个 PR 不会擦掉第一个 PR preview。
- 更新 PR #123 会替换 `/pr-123/` 内容，但 URL 不变。
- PR closed 后，要么有意保留 preview，要么 cleanup workflow 删除对应目录。
- 缺少配置的 HTML entrypoint 时，workflow 明确失败。
- 敏感报告使用 artifact-only 或 authenticated hosting，不发布到 public Pages。

## 给用户的最小输出

完成后向用户说明：

- HTML artifact path 与 entrypoint。
- 改了哪些文件。
- 需要一次性配置的 repository setting。
- Preview URL pattern，或 artifact / internal-host fallback。
- 安全注意事项，特别是 public / fork PR 和 sensitive report。
- 如何用 dummy PR 测试。

## 常见错误

| Mistake | Fix |
|---|---|
| 把 `pr-html-render` 当成报告作者 | 回到创建 HTML artifact 的 skill，例如 `report-walkthrough`。 |
| 只上传 HTML artifact 却承诺 rendered URL | Artifact 通常是下载文件；需要 static hosting 才能 rendered review。 |
| 在带 `pages: write` 或 `contents: write` 的 job 中运行 PR code | 拆分 build 与 deploy；deploy job 只复制 artifact 和写 comment。 |
| 用 `pull_request_target` 构建 report | 只把它用于安全 metadata 操作，例如 cleanup/commenting；不要运行 PR code。 |
| 把敏感报告发布到 Pages | 使用 internal object storage、VPN-only static host，或有访问控制的 artifacts。 |
| 发布 preview link 后宣称 PR lifecycle 完成 | PR lifecycle completion 仍由 `git-worktree-pr` 判断。 |

## 参考

- GitHub Pages render template：`templates/github-pages-pr-render.yml`
- Optional cleanup template：`templates/cleanup-pr-render.yml`
