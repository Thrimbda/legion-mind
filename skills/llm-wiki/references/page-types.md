# Canonical page families

本 skill 的 page family 是**固定结构**，不是可选建议。

## 0. `raw/`

- 存放原始 source 文件。
- 内容只读。
- 新 source 必须先归档到这里，再进入 `sources/`。

## 1. `sources/`

- 每个 raw source 对应一个 source summary。
- 文件名与 raw source stem 保持一致。
- 最小栏目：
  - Source
  - Summary
  - Key Facts
  - Uncertainty
  - Affected Pages
  - Sources

## 2. `entities/`

- 承接人物、公司、产品、项目、地点等对象页。
- 当同一对象跨多个 source 或多个 query 反复出现时创建。
- 最小栏目：
  - Identity
  - Current Facts
  - Relations
  - Open Questions
  - Sources

## 3. `topics/`

- 承接概念、议题、方法、 recurring question。
- 当问题不是“谁”，而是“什么 / 为什么 / 怎么做”时优先落这里。
- 最小栏目：
  - Scope
  - Core Ideas
  - Related Pages
  - Exceptions / Gaps
  - Sources

## 4. `comparisons/`

- 承接多个方案、主张、实体之间的横向比较。
- query 形成稳定比较时，优先更新或创建这里的页面。
- 最小栏目：
  - Question
  - Dimensions
  - Summary
  - Trade-offs / Conflicts
  - Sources

## 5. `overviews/`

- 承接跨多个 page family 的综合结论、阶段总结、研究综述、playbook。
- 当内容已经不只是单一 topic，而是跨页型的整合时，优先落这里。
- 最小栏目：
  - Goal
  - Main Conclusions
  - Supporting Pages
  - Competing Interpretations
  - Sources

## 6. `maintenance/`

- 承接 backlog、冲突、待补 source、待验证假设、结构债务。
- 默认入口是 `maintenance/backlog.md`。
- 最小栏目：
  - Issue
  - Severity / Status
  - Affected Pages
  - Next Action
  - Sources（若适用）

## 页面落点判断

- 单个 source 的整理，先落 `sources/`。
- 面向对象的长期页，落 `entities/`。
- 面向概念或方法的长期页，落 `topics/`。
- 面向横向异同，落 `comparisons/`。
- 面向跨页型综合，落 `overviews/`。
- 面向未决问题与结构债务，落 `maintenance/`。

## 创建 / 更新原则

- 先更新已有页面，再决定是否新建。
- 同一结论不应长期分裂在多个近似页面中。
- 新页面必须能从 `index.md` 找到，并至少链接一个相关页面。
