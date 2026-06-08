# HTML Report Walkthrough Template

这个 reference 用于生成 `docs/report-walkthrough.html`。它不是固定皮肤，而是 HTML-first walkthrough 的 artifact contract：先用证据服务 reviewer 判断，再用界面层次提升扫读效率。

## Reader and purpose

在写 HTML 前先写下这 5 个判断，可以写在草稿里，不一定展示在页面中：

- Reader: reviewer、maintainer、technical lead 或决策者是谁？
- Situation: 他们现在要判断什么？approve、request changes、inspect evidence、continue lifecycle？
- Main path: 他们最先需要看到哪些结论？
- Evidence: 哪些信息会改变判断、风险认知或下一步？
- Certainty: 哪些是事实、审查结果、假设、风险、限制或建议？

## Required sections

HTML 页面至少包含这些区域，可以调整标题，但不能丢失语义：

1. Profile
2. Reviewer Summary
3. Scope
4. Evidence Map
5. Delivery Path
6. What Changed / What Was Decided
7. Verification / Review Status
8. Risks and Limits
9. Reviewer Checklist
10. Final State / Next Stage

## HTML quality gate

必须满足：

- Standalone single file: 不依赖外部 CDN、字体、脚本或图片。
- Semantic HTML: 使用 `header`、`main`、`nav`、`section`、`table`，并保持清晰 heading hierarchy。
- Responsive: 窄屏可读，不横向溢出核心信息。
- Print-friendly: 至少提供 `@media print`，移除导航或阴影等非必要视觉。
- Colors: 使用 OKLCH；不要使用 `#000` 或 `#fff`。
- Typography: 正文行长控制在 65 到 75ch 左右；层级通过字号和字重变化表达。
- Evidence-first: evidence map 和 delivery path 不能藏在底部。
- Final state: PR state、merge state、blocked state 或 next stage 必须靠前出现。

## Absolute bans

不要生成：

- `background-clip: text` 搭配渐变背景。
- `border-left` 或 `border-right` 大于 1px 的彩色侧边强调。
- 装饰性 glassmorphism。
- hero-metric cliché，也就是大数字加小标签的 SaaS 模板。
- 一排完全相同的 icon card grid。
- em dash 字符。
- 外部网络资源。

## Minimal skeleton

下面是结构骨架。允许改视觉，但必须保留同等语义。

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{{taskTitle}} | Walkthrough</title>
  <style>
    :root {
      color-scheme: light;
      --paper: oklch(96% 0.012 92);
      --surface: oklch(98% 0.008 92);
      --ink: oklch(24% 0.018 132);
      --muted: oklch(50% 0.025 132);
      --line: oklch(82% 0.018 105);
      --accent: oklch(45% 0.12 153);
      --ok: oklch(89% 0.065 144);
    }

    * { box-sizing: border-box; }
    body { margin: 0; background: var(--paper); color: var(--ink); font-family: system-ui, sans-serif; line-height: 1.64; }
    main { width: min(1180px, calc(100vw - 36px)); margin: 0 auto; padding: 52px 0 72px; }
    .hero { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 360px); gap: 34px; align-items: end; }
    .status { border: 1px solid var(--line); border-radius: 24px; background: var(--surface); padding: 24px; }
    .layout { display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: 32px; align-items: start; }
    nav { position: sticky; top: 20px; }
    section { border: 1px solid var(--line); border-radius: 24px; background: var(--surface); padding: 28px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; vertical-align: top; border-bottom: 1px solid var(--line); padding: 12px; }
    .pill { display: inline-flex; border: 1px solid var(--line); border-radius: 999px; background: var(--ok); padding: 0.12rem 0.64rem; font-weight: 760; }
    @media (max-width: 900px) { .hero, .layout { grid-template-columns: 1fr; } nav { position: static; } }
    @media print { nav { display: none; } section, .status { box-shadow: none; break-inside: avoid; } }
  </style>
</head>
<body>
  <main>
    <header class="hero">
      <div>
        <p>{{kicker}}</p>
        <h1>{{taskTitle}}</h1>
        <p>{{oneSentencePurpose}}</p>
      </div>
      <aside class="status" aria-label="交付终态">
        <p>交付状态</p>
        <p><span>Profile</span> <span class="pill">{{profile}}</span></p>
        <p><span>Review</span> <span class="pill">{{reviewStatus}}</span></p>
        <p><span>PR</span> <span class="pill">{{prState}}</span></p>
      </aside>
    </header>

    <div class="layout">
      <nav aria-label="Walkthrough navigation">
        <a href="#summary">摘要</a>
        <a href="#evidence">证据</a>
        <a href="#path">交付路径</a>
        <a href="#final">终态</a>
      </nav>

      <div>
        <section id="summary"><h2>Reviewer Summary</h2>{{summary}}</section>
        <section id="scope"><h2>Scope</h2>{{scope}}</section>
        <section id="evidence"><h2>Evidence Map</h2>{{evidenceTable}}</section>
        <section id="path"><h2>Delivery Path</h2>{{deliveryPath}}</section>
        <section id="decisions"><h2>What Changed / What Was Decided</h2>{{decisions}}</section>
        <section id="verification"><h2>Verification / Review Status</h2>{{verification}}</section>
        <section id="risks"><h2>Risks and Limits</h2>{{risks}}</section>
        <section id="checklist"><h2>Reviewer Checklist</h2>{{checklist}}</section>
        <section id="final"><h2>Final State / Next Stage</h2>{{finalState}}</section>
      </div>
    </div>
  </main>
</body>
</html>
```

## Validation checklist

生成后至少检查：

- [ ] 包含 `<!doctype html>`、`lang`、viewport。
- [ ] 包含 Profile、Reviewer Summary、Scope、Evidence Map、Delivery Path、Verification / Review Status、Risks and Limits、Final State / Next Stage。
- [ ] 使用 OKLCH，不含 `#000` 或 `#fff`。
- [ ] 不含 `background-clip: text`。
- [ ] 不含 `border-left` / `border-right` 大于 1px 的彩色侧边强调。
- [ ] 不含 em dash 字符。
- [ ] 不依赖外部网络资源。
- [ ] 包含 responsive CSS 和 `@media print`。
- [ ] 每个完成性 claim 都能在 evidence map 中找到来源。
