---
name: pr-html-render
description: 当已有 HTML artifact 需要可打开的本地、Actions artifact、内部托管或 GitHub Pages review 路径时使用。不生成报告内容。
---

# pr-html-render

为已有 HTML artifact 选择与信任边界匹配的 review 路径。缺少 artifact 时先运行其明确生成命令；本能力不补设计、验证或 PR 结论。

## 选择

| 条件 | 路径 |
|---|---|
| 仅本地审阅 | 直接打开 artifact |
| 含敏感信息 | Actions artifact 或 authenticated internal host |
| trusted same-repo PR 且内容可公开 | GitHub Pages per-PR preview |
| fork 或不可信 PR | 只读 build，加人工批准或隔离 publisher |

## 安全不变量

- 运行 PR code 的 job 只读；持有 `pages: write`、`contents: write` 或 privileged token 的 publisher 不 checkout 或执行 PR head code。
- 不使用 `pull_request_target` 构建 PR 内容，不把不可信 GitHub expression 直接插入 shell。
- 含 secret、private/customer/account data、internal URL 或 token 的 HTML 不发布到更宽可见范围。
- artifact download 不等于 rendered URL；只有静态 host 才能承诺可渲染链接。

可从 `templates/github-pages-pr-render.yml` 和 `templates/cleanup-pr-render.yml` 开始适配。输出说明实际 URL 或 artifact/local 路径、可见性、安全限制和验证结果，不使用固定交接格式。
