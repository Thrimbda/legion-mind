# 基于 llm-wiki 创建新 skill - 任务清单

## 快速恢复

**当前阶段**: 阶段 4 - 流程图与验证 ✅ COMPLETED
**当前任务**: (none)
**进度**: 5/5 任务完成

---

## 阶段 1: 重新设计 ✅ COMPLETED

- [x] 结合用户“skill 过于简单”的反馈，更新 plan 与 RFC，明确细化范围与边界。 | 验收: plan.md / docs/rfc.md 说明要把哪些抽象规则细化成可执行 guidance，并保留宿主 schema 覆盖边界。

---

## 阶段 2: 细化实现 ✅ COMPLETED

- [x] 细化 `skills/llm-wiki/SKILL.md`，补齐 session bootstrap、操作入口与导航规则。 | 验收: 主文仍精简，但 agent 已能知道首次接管、何时写回、何时读哪些 reference。
- [x] 扩展 references，使其覆盖页面类型基线、宿主 schema 清单、ingest/query/lint 检查表与更具体的约定。 | 验收: agent 可直接依据 references 执行，而不是只看到抽象原则。

---

## 阶段 3: 再验证与交付 ✅ COMPLETED

- [x] 重新执行验证 / review，并刷新 test-report、review-code、review-security、report-walkthrough、pr-body。 | 验收: quick validate 与文本检查通过；任务文档结论与当前实现一致。

---

## 阶段 4: 流程图与验证 ✅ COMPLETED

- [x] 基于 writing-skills 做无流程图基线测试，并确定最值得补的决策流程图。 | 验收: 能明确指出哪些关键判断需要在多文件间跳读，以及流程图应补在哪些决策点。
- [x] 为 `skills/llm-wiki/SKILL.md` 增加 query / ingest 小型状态机流程图，并完成可用性验证。 | 验收: 关键三岔路和第一落点可一眼扫读；最终采用 Mermaid 状态机；skill 结构仍通过 validate；后测显示 query / ingest 决策更易扫描。

---

## 阶段 5: 轻量 polish ✅ COMPLETED

- [x] 将 frontmatter description 调整为 `Use when ...` 触发式文案，并补充“输出载体 ≠ wiki page type”的最小说明。 | 验收: metadata 更贴近 writing-skills 的 discoverability 约束，同时不改变 llm-wiki 的宿主门禁与 page family 边界。
- [x] 为较长 reference 补目录、统一可写前提短句，并添加安全 ID 示例后完成最小验证。 | 验收: `quick_validate.py` 与 `git diff --check` 通过，且新文案不引入额外设计负担。

---

## 发现的新任务

(暂无)

---

*最后更新: 2026-04-10*
