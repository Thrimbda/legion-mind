# HTML 交付审阅模板

这个 reference 用于生成 `docs/report-walkthrough.html`。它不是固定皮肤，而是 HTML-first walkthrough 的 artifact contract：先用证据服务 reviewer 判断，再用界面层次提升扫读效率。

## 读者与目的

在写 HTML 前先写下这 5 个判断，可以写在草稿里，不一定展示在页面中：

- 读者：reviewer、maintainer、technical lead 或决策者是谁？
- 场景：他们现在要批准、要求修改、检查证据还是继续 lifecycle？
- 主路径：他们最先需要看到哪些结论？
- 证据：哪些信息会改变判断、风险认知或下一步？
- 确定性：哪些是事实、审查结果、假设、风险、限制或建议？

## 必需区域

HTML 页面至少包含这些区域，可以调整标题，但不能丢失语义：

1. 交付视角
2. 审阅结论
3. 人类注意力与当前动作
4. 未解决的认知状态
5. 领域验证摘要
6. 范围
7. 证据地图
8. 交付路径
9. 变更与决定
10. 验证与审查状态
11. 风险与限制
12. 审阅清单
13. 最终状态与下一阶段
14. 渲染交接，当任务由 PR 承载，或 rendered preview 状态会改变 reviewer 动作时

“人类注意力与当前动作”必须复用各阶段证据内嵌的 `## 会话注意力摘要`，按 `REF_HUMAN_ATTENTION.md` 聚合，不在页面中重新定义注意力枚举或 lifecycle 规则。“未解决的认知状态”与“领域验证摘要”必须复用 `REF_COGNITIVE_VERIFICATION.md` 约束下已经验证、审查的记录，不重新执行验证。

## HTML 质量门

必须满足：

- Standalone single file: 不依赖外部 CDN、字体、脚本或图片。
- Semantic HTML: 使用 `header`、`main`、`nav`、`section`、`table`，并保持清晰 heading hierarchy。
- Responsive: 窄屏可读，不横向溢出核心信息。
- Print-friendly: 至少提供 `@media print`，移除导航或阴影等非必要视觉。
- Colors: 使用 OKLCH；不要使用 `#000` 或 `#fff`。
- Typography: 正文行长控制在 65 到 75ch 左右；层级通过字号和字重变化表达。
- Evidence-first: evidence map 和 delivery path 不能藏在底部。
- Final state: PR state、merge state、blocked state 或 next stage 必须靠前出现。
- Render handoff: PR-backed walkthroughs should show whether `pr-html-render` is pending, has produced a rendered URL, is artifact-only/internal-host because of sensitivity, or is explicitly bypassed/blocked.
- 注意力优先：聚合注意力等级、当前唯一人类动作与动作完成前的 lifecycle 边界必须靠前出现。
- Claim 聚合：所有仍为 `INCONCLUSIVE`、`DEFERRED`、`RECOMMENDATION` 的关键 claim 必须内联其对验收或风险的影响、owner、当前缓解与直接证据入口。
- Verifier 聚合：领域验证必须内联 verifier 精确来源、实际方法、证据独立性及理由、置信度、通俗结论与未证明范围、残余不确定性及原始证据入口。
- 判断自足：reviewer 不打开原始文件也能理解当前动作、关键不确定性和专业证据边界；原始路径只用于深入审计。

## 绝对禁止

不要生成：

- `background-clip: text` 搭配渐变背景。
- `border-left` 或 `border-right` 大于 1px 的彩色侧边强调。
- 装饰性 glassmorphism。
- hero-metric cliché，也就是大数字加小标签的 SaaS 模板。
- 一排完全相同的 icon card grid。
- em dash 字符。
- 外部网络资源。

## 最小骨架

下面是结构骨架。允许改视觉，但必须保留同等语义。

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{{taskTitle}} | 交付审阅</title>
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
      <aside class="status" aria-label="当前结论与动作">
        <p>交付状态</p>
        <p><span>交付视角</span> <span class="pill">{{profile}}</span></p>
        <p><span>审查</span> <span class="pill">{{reviewStatus}}</span></p>
        <p><span>注意力</span> <span class="pill">{{aggregatedAttention}}</span></p>
        <p><strong>当前唯一人类动作</strong></p>
        <p>{{singleHumanAction}}</p>
        <p><span>动作边界</span> {{lifecycleBoundary}}</p>
        <p><span>PR</span> <span class="pill">{{prState}}</span></p>
        <p><span>渲染</span> <span class="pill">{{renderState}}</span></p>
      </aside>
    </header>

    <div class="layout">
      <nav aria-label="交付审阅导航">
        <a href="#summary">摘要</a>
        <a href="#attention">当前动作</a>
        <a href="#claims">未解决主张</a>
        <a href="#verifiers">领域验证</a>
        <a href="#evidence">证据</a>
        <a href="#path">交付路径</a>
        <a href="#render">渲染</a>
        <a href="#final">终态</a>
      </nav>

      <div>
        <section id="summary"><h2>审阅结论</h2>{{summary}}</section>
        <section id="attention">
          <h2>人类注意力与当前动作</h2>
          {{attentionSummary}}
          <p><strong>当前唯一人类动作：</strong>{{singleHumanAction}}</p>
          <p><strong>动作完成前的 lifecycle 边界：</strong>{{lifecycleBoundary}}</p>
          <p><strong>摘要证据：</strong>{{attentionEvidence}}</p>
        </section>
        <section id="claims">
          <h2>未解决的认知状态</h2>
          <p>{{claimStateSummary}}</p>
          {{unresolvedClaimsTable}}
        </section>
        <section id="verifiers">
          <h2>领域验证摘要</h2>
          <p>{{verifierSummary}}</p>
          {{domainVerifierTable}}
        </section>
        <section id="scope"><h2>范围</h2>{{scope}}</section>
        <section id="evidence"><h2>证据地图</h2>{{evidenceTable}}</section>
        <section id="path"><h2>交付路径</h2>{{deliveryPath}}</section>
        <section id="render"><h2>渲染交接</h2>{{renderHandoff}}</section>
        <section id="decisions"><h2>变更与决定</h2>{{decisions}}</section>
        <section id="verification"><h2>验证与审查状态</h2>{{verification}}</section>
        <section id="risks"><h2>风险与限制</h2>{{risks}}</section>
        <section id="checklist"><h2>审阅清单</h2>{{checklist}}</section>
        <section id="final"><h2>最终状态与下一阶段</h2>{{finalState}}</section>
      </div>
    </div>
  </main>
</body>
</html>
```

## 校验清单

生成后至少检查：

- [ ] 包含 `<!doctype html>`、`lang`、viewport。
- [ ] 包含交付视角、审阅结论、人类注意力与当前动作、未解决的认知状态、领域验证摘要、范围、证据地图、交付路径、验证与审查状态、风险与限制、最终状态与下一阶段。
- [ ] 页面靠前位置直接显示聚合注意力等级、当前唯一人类动作和动作完成前的 lifecycle 边界。
- [ ] 未解决 `INCONCLUSIVE`、`DEFERRED`、`RECOMMENDATION` 均包含 reviewer 理解结论所需字段与直接证据入口，不能只有文件路径。
- [ ] 领域 verifier 摘要包含精确来源、实际方法、独立性及理由、置信度、通俗结论与未证明范围、残余不确定性及原始证据入口。
- [ ] PR-backed walkthrough 包含渲染交接，说明 `pr-html-render` 状态、URL、artifact/internal-host fallback 或 explicit bypass/blocker。
- [ ] 使用 OKLCH，不含 `#000` 或 `#fff`。
- [ ] 不含 `background-clip: text`。
- [ ] 不含 `border-left` / `border-right` 大于 1px 的彩色侧边强调。
- [ ] 不含 em dash 字符。
- [ ] 不依赖外部网络资源。
- [ ] 包含 responsive CSS 和 `@media print`。
- [ ] 每个完成性 claim 都能在 evidence map 中找到来源。
