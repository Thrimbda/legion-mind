---
name: pr-html-render
description: 当 reviewer 需要为已有 HTML artifact 获取 rendered preview URL、artifact 或本地预览路径时使用；不生成报告内容。
---

# pr-html-render

为已存在的 HTML artifact 选择安全、可打开的 review 路径。它不生成 walkthrough 内容，也不负责 PR lifecycle。默认中文；URL、workflow 字段与技术原文保持不变。

## 硬门

- artifact 必须已存在，或有确定的 report command；缺 `report-walkthrough.html` 时退回 `report-walkthrough`。
- 不补设计、验证、review、wiki、checks、merge、cleanup。
- 修改仓库 workflow/template 仍遵守 Legion worktree/PR 门禁。
- PR HTML 视为不可信；含 secret、private/customer/account data、internal URL 或 token 时不得发布到可见范围更宽的 Pages。

## 选择路径

先确认 artifact/entrypoint、平台、可见性、敏感性、fork/trust model 和 URL 形态：

| 条件 | 路径 |
|---|---|
| 公开范围安全、trusted same-repo PR | GitHub Pages per-PR preview |
| 含敏感信息 | Actions artifact 或 authenticated internal host |
| fork / 不可信 PR | 只读 build；经批准的隔离 publisher，或不发布 |
| 仅本地 review | 直接打开 artifact |

GitHub Pages 优先使用 Actions source；以 `templates/github-pages-pr-render.yml` 为起点。项目只需配置 report command、artifact directory、entrypoint、必要 runtime/cache 和既有 preview branch。关闭 PR 后是否清理由团队决定；需要时使用 `templates/cleanup-pr-render.yml`。

## 安全不变量

- 运行 PR code 的 job 只读；带 `pages: write`、`contents: write` 或 privileged token 的发布 job 不 checkout/执行 PR head code。
- 不用 `pull_request_target` 构建 PR 内容；不把不可信 GitHub expression 直接插入 shell。
- fork publishing 需 manual approval 或 hardened `workflow_run`，publisher 只复制 artifact，不执行它。
- artifact download 不等于 rendered URL；只有 static host 才能承诺可渲染链接。

## 交接与验证

记录一种结果：preview URL/模式、artifact/internal/local 路径，或带 owner 与恢复条件的明确 bypass/blocker。检查 entrypoint 缺失会失败、sticky comment 不刷屏、多个 PR 不互相覆盖、同一 PR URL 稳定更新、visibility 与敏感性匹配。

handoff 使用五字段 `结果 / 变化 / 风险 / 下一步 / 证据`，说明 artifact/entrypoint、变更文件、一次性配置、URL 或 fallback、安全 caveat；不复制 workflow 说明或命令帮助。

## 引用

- Pages 模板：`templates/github-pages-pr-render.yml`
- 可选清理：`templates/cleanup-pr-render.yml`
