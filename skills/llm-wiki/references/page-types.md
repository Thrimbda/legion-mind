# 页面类型基线

以下 page family 是推荐 baseline，不是强制目录树。宿主 schema 若已定义等价页型、目录或 frontmatter，以宿主规则优先。

## 1. source summary

- **用途**：承接单个 source 的摘要、关键论点、证据、涉及页面、待验证项。
- **何时创建**：首次 ingest 某个 source 时，默认创建或更新 source summary；若宿主 schema 明确使用等价页型，则写入宿主等价页型；若宿主明确禁止沉淀来源摘要，则停止写入并报告 schema 缺口。
- **何时更新**：补充更精确引用、附件说明、纠错、或补上与其他页面的链接。
- **最小栏目**：
  - source 身份信息（标题、作者、时间或宿主等价字段）
  - 关键事实 / 主张
  - 证据与限制
  - 影响到的 wiki 页面
  - open questions / needs-verification

## 2. entity

- **用途**：沉淀人物、公司、产品、项目、地点等对象页。
- **何时创建**：对象被多个 source 或多个问题反复提及，且已有持续维护价值。
- **何时更新**：source summary 带来新事实、关系变化、状态变化或争议证据。
- **最小栏目**：
  - entity 定义 / 角色
  - 当前已知事实
  - 关键关系 / 相关页面
  - 争议与待验证项
  - citations

## 3. topic / concept

- **用途**：承接概念、议题、方法论、问题域与 recurring question。
- **何时创建**：已有多个 source 或多个 entity 指向同一主题，单靠 entity 页无法承载。
- **何时更新**：出现新解释框架、新证据、边界变化，或 query 高频命中该主题。
- **最小栏目**：
  - topic 定义 / scope
  - 核心观点 / 子主题
  - 相关 entity / source summary
  - 争议、例外与缺口
  - citations

## 4. comparison

- **用途**：沉淀“多个方案 / 主张 / 实体之间的对比”。
- **何时创建**：用户问题天然是横向比较，或 ingest 已积累足够材料支持稳定对比。
- **何时更新**：新增比较维度、证据变化、对比对象变化。
- **最小栏目**：
  - comparison question / scope
  - 对比维度
  - 结论摘要
  - 依据与限制
  - unresolved differences / next steps

## 5. synthesis / overview

- **用途**：比 topic 更高层的阶段总结、thesis、研究综述、项目状态概览。
- **何时创建**：需要把多个 source summary、entity、topic 串成一份稳定观点时。
- **何时更新**：关键结论改变、阶段推进、或 query 反复需要同一综合视角。
- **最小栏目**：
  - synthesis goal / question
  - 核心结论
  - supporting pages / sources
  - competing interpretations
  - open questions / maintenance hooks

## 6. maintenance

- **用途**：承接冲突、缺口、待补 source、待验证假设、结构债务等维护 backlog。
- **何时创建**：宿主 schema 明确有维护工作台，或 lint / ingest / authorized query 需要落地未决事项。
- **何时更新**：发现新问题、关闭旧问题、变更优先级、补充证据状态。
- **最小栏目**：
  - issue / task
  - severity / status
  - 触发来源
  - 受影响页面
  - 建议动作 / owner（若宿主有此字段）

## 页面落点判断

- 单个 source 的归纳，先落 **source summary**。
- 面向“谁 / 什么对象”的长期页面，落 **entity**。
- 面向“概念 / 议题 / 方法”的长期页面，落 **topic / concept**。
- 面向“两个或多个候选的横向异同”，优先落 **comparison**。
- 面向“阶段性综合、跨多页汇总”，优先落 **synthesis / overview**。
- 面向“未决问题、修复、冲突清单”，优先落 **maintenance**。

## query 沉淀建议

- **只读 query**：只给出建议落点，不写页面。
- **建议沉淀但未授权**：说明推荐 page type、建议标题 / scope、应补哪些 citations。
- **授权写回**：仅写宿主 schema 明确允许的 page type；若宿主未定义 comparison / synthesis / maintenance 的写回流程，则退回建议模式。
