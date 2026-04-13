# 反哺 llm-wiki skill 的复利与 schema guidance - 上下文

## 会话进展 (2026-04-11)

### ✅ 已完成

- 收到用户新方向：llm-wiki skill 不应处理多种宿主情况，而应全权管理授权给它的 wiki 目录，采用单一有主见的归档方案。
- 使用 explore 子代理梳理当前 skill 中所有 host-adaptive / 多情况处理概念，确认需要删除 host-schema handshake、等价导航/日志机制、宿主覆盖、host-schema template 等分支。
- 将 `skills/llm-wiki/SKILL.md` 重写为单一 canonical wiki 合约：固定 layout、固定 page family、固定 `index.md` / `log.md`、固定 durable writeback 边界。
- 重写 `references/architecture.md`、`workflows.md`、`conventions.md`、`page-types.md`，把“按宿主情况适配”收敛为一个固定目录、固定页型、固定日志和 citation 规则的产品方案。
- 删除 `references/host-schema-template.md`，改为新增 `references/canonical-layout.md`，直接定义 canonical directory contract 与规范化规则。
- 运行 `python3 /Users/c1/.opencode/skills/skill-creator/scripts/quick_validate.py skills/llm-wiki`，结果 PASS。
- 运行 `git diff --check -- skills/llm-wiki .legion/tasks/llm-wiki-skill-schema-guidance`，结果 PASS。
- 使用 explore 子代理做 GREEN-phase 回归检查：确认 skill 现在已经体现单一 canonical layout、移除了 host-adaptive framing，并让 bootstrap / ingest / query / lint 全部围绕同一个被管理的 wiki 根目录工作。
- 在 `skills/llm-wiki/SKILL.md` 恢复 2 个 Mermaid 状态机流程图：query 是否写回 wiki、ingest 如何从 source summary 扇出到高层页。
- 重新运行 `python3 /Users/c1/.opencode/skills/skill-creator/scripts/quick_validate.py skills/llm-wiki`，结果 PASS。
- 运行 `git diff --check -- skills/llm-wiki .legion/tasks/llm-wiki-skill-schema-guidance`，结果 PASS。


### 🟡 进行中

(暂无)


### ⚠️ 阻塞/待定

(暂无)


---

## 关键文件

- `skills/llm-wiki/SKILL.md` [completed]
  - 作用: 主入口；把 skill 定义为全权管理授权 wiki 根目录的单一 canonical 方案。
- `skills/llm-wiki/references/canonical-layout.md` [completed]
  - 作用: 明确固定目录结构、规范化规则与 durable writeback 边界。
- `skills/llm-wiki/references/architecture.md` [completed]
  - 作用: 说明固定三层、复利式维护与 skill 的管理权限。
- `skills/llm-wiki/references/workflows.md` [completed]
  - 作用: 定义 bootstrap / ingest / query / lint 如何围绕同一个 canonical wiki 根目录工作。
- `skills/llm-wiki/references/conventions.md` [completed]
  - 作用: 固化 `index.md`、`log.md`、命名、citation、状态标记与复利优先规则。
- `skills/llm-wiki/references/page-types.md` [completed]
  - 作用: 把 page families 从“推荐 baseline”改成固定结构。

---

## 关键决策

| 决策 | 原因 | 替代方案 | 日期 |
|------|------|----------|------|
| 本轮继续按 writing-skills 的 RED→GREEN 思路执行：先用 explore 子代理做漏洞盘点，再把失败点收敛为 skill 改写。 | 用户要求对 skill 做产品方向调整，仍应遵守 failing-test-first 的写法，而不是直接凭感觉重写。 | 直接人工改文档：更快，但不满足 writing-skills 的测试导向。 | 2026-04-11 |
| 接受用户的新 product direction，放弃 host-schema / multi-case 模式，改为 skill 全权管理一个授权 wiki 根目录的单一 canonical 方案。 | 用户明确表示当前 skill 不该按不同情况适配，而应该有主见地管理文档归档结构。 | 保留宿主覆盖与等价机制：更通用，但违背用户明确方向。 | 2026-04-11 |
| 删除 `host-schema-template.md`，改为 `canonical-layout.md`。 | 新产品方向不再需要补宿主 schema，而需要直接定义固定目录契约与规范化规则。 | 继续保留 host-schema 模板：会让 skill 看起来仍在等外部规则裁决。 | 2026-04-11 |
| query durable writeback 保留“是否值得沉淀”的判断，但写回目标只允许 canonical markdown page families。 | 用户要求统一方案，不代表每条聊天都要落盘；更合理的是保留单一判断标准，但把落点固定在 canonical 结构内。 | 所有 query 一律写回：会制造大量低价值页面；继续要求外部授权流：违背“全权管理目录”的方向。 | 2026-04-11 |
| 在保留单一 canonical product direction 的前提下，把 Mermaid 流程图补回 SKILL.md，而不是继续维持纯文字版本。 | 用户明确指出流程图在这个 skill 中很重要；query 写回与 ingest 扇出仍然是非显然决策点，符合 writing-skills 建议保留小型流程图的场景。 | 继续只保留纯文字：更短，但损失快速扫读与执行骨架；把流程图下沉到 references：会降低入口可见性。 | 2026-04-13 |

---

## 快速交接

**下次继续从这里开始：**

1. 如需继续收紧，可再为 bootstrap / lint 添加流程图，但当前最关键的 query / ingest 已恢复。

**注意事项：**

- 本轮只恢复流程图，不回退单一 canonical layout 的产品方向。
- 当前没有 Mermaid 渲染级校验，仅完成语法块存在检查、quick_validate 与 diff checks。

---

*最后更新: 2026-04-13 14:19 by Claude*
