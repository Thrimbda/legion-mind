# Reviewer Walkthrough：merge-playbook-into-wiki

## 目标与范围

- 任务目标：按 [计划](../plan.md) 与 [RFC](./rfc.md) 收敛 playbook/wiki 双概念，把跨任务知识统一到 `.legion/wiki/**`，并把 README 中“设计门禁 / 分层验证 / 证据化汇报”改写成更直白的入口说明。
- 本次交付范围绑定当前 envelope：**仅补充 `docs/` 下 reviewer-facing 文档**，不新增实现结论，不改写任务范围外文件。

## 设计摘要

- 设计真源见 [RFC](./rfc.md)。
- RFC 的核心决策是：
  - 只保留一个统一的跨任务知识层 `.legion/wiki/**`；
  - former playbook 条目按内容属性进入 wiki 页面，本次已知 durable 约定“CLI should stay thin”进入 `patterns.md`；
  - README 首次出现三个术语时，必须直接解释“人话含义”并映射到 `plan.md` / `docs/rfc.md` / `test-report.md` / `report-walkthrough.md` / `pr-body.md` 等真实产物。

## 改动清单（按模块 / 文件）

以下仅列出现有证据可直接支撑的改动：

### 1. README 入口说明

- `README.md` 现在会用直白语言解释：
  - 设计门禁
  - 分层验证
  - 证据化汇报
- 对应证据见 [test-report.md](./test-report.md)：README 已映射到 `plan.md` / `docs/rfc.md` / `test-report.md` / `report-walkthrough.md` / `pr-body.md`。

### 2. 统一 wiki 知识层

- 跨任务 current-truth 文档已统一收敛到 `.legion/wiki/**`。
- `.legion/wiki/index.md` 已创建，作为统一入口。
- `.legion/wiki/patterns.md` 已创建，承接 former playbook 风格的可复用模式。

### 3. former playbook 迁移

- durable 约定“CLI should stay thin”已迁移到 `.legion/wiki/patterns.md`。
- `.legion/playbook.md` 已删除，不再作为活跃 durable 概念保留。

### 4. 当前真源口径收敛

- 当前真源已不再把 `.legion/playbook.md` 当作现行 durable 路径使用。
- 历史 raw docs / 历史设计材料中的 `playbook` 提及仍被允许保留为历史事实，不计为失败。

## 如何验证

- 详细验证记录见 [test-report.md](./test-report.md)。
- 交付评审结果见 [review-change.md](./review-change.md)，结论为 **PASS**。

建议 reviewer 重点复核以下检查项：

1. 检查最小 wiki 完成态与 playbook 删除状态

   ```bash
   ls -la ".legion" && ls -la ".legion/wiki" && test ! -e ".legion/playbook.md"
   ```

   预期：`.legion/wiki/index.md` 与 `.legion/wiki/patterns.md` 存在，`.legion/playbook.md` 不存在。

2. 检查当前真源是否仍把 `.legion/playbook.md` 当作现行路由

   ```bash
   rg -n "\.legion/playbook\.md" README.md docs/legionmind-usage.md skills/legion-docs/SKILL.md skills/legion-docs/references/REF_SCHEMAS.md skills/legion-wiki/SKILL.md skills/legion-wiki/references/*.md skills/spec-rfc/references/TEMPLATE_RESEARCH.md .opencode/agents/legion.md .legion/wiki
   ```

   预期：没有把 `.legion/playbook.md` 当活跃 durable artifact / writeback 目标的现行路由；若有命中，仅应是“已退役/迁移说明”语义。

3. 检查 README 是否提供三术语的人话解释与产物映射

   ```bash
   rg -n "设计门禁|分层验证|证据化汇报|先写代码后补文档|不是一条命令证明一切|test-report\.md|report-walkthrough\.md|pr-body\.md" README.md
   ```

   预期：README 不是只喊口号，而是明确解释术语含义，并指向实际产物。

4. 检查 `init` 叙事未被改成预建 wiki skeleton

   ```bash
   rg -n "init|按需建立|预建|skeleton|\.legion/wiki/\*\*" README.md docs/legionmind-usage.md skills/legion-docs/references/REF_SCHEMAS.md skills/legion-wiki/references/REF_WIKI_LAYOUT.md .legion/tasks/merge-playbook-into-wiki/docs/rfc.md
   ```

   预期：`init` 仍只保证 `.legion/tasks/` 存在；`.legion/wiki/**` 由后续 writeback 按需建立。

5. 检查 `patterns.md` 是否承接 CLI 薄层约定

   ```bash
   ls -la ".legion/wiki" && rg -n "CLI|薄层|task create|status --task-id|log update|tasks update" .legion/wiki/patterns.md .legion/wiki/index.md
   ```

   预期：`patterns.md` 含迁移后的 CLI 薄层模式，`index.md` 提供导航入口。

## 风险与回滚

### 风险

- 本任务在 [计划](../plan.md) 中被定义为 **Medium** 风险：它会同时影响 README、current-truth 文档与知识层定义；若后续口径收敛不完整，容易再次制造术语漂移。
- 当前已知 caveat：`skills/legion-wiki/references/REF_WIKI_LAYOUT.md` 仍出现一次 `.legion/playbook.md`，但 [test-report.md](./test-report.md) 已明确其语义属于“已退役 / 不再单列”的迁移说明，不构成失败。

### 回滚

按 [RFC](./rfc.md) 的 rollback 章节执行：

1. 恢复 `.legion/playbook.md` 内容与路径；
2. 撤回 README / usage / current-truth 文档中 unified wiki 的现行表述；
3. 删除或降级本次迁移带来的 wiki 导航与迁入条目；
4. 避免仓库同时保留两套 active truth；
5. 回到 RFC 评审阶段，而不是带着半收敛状态继续推进。

## 未决项与下一步

### 未决项

- RFC 仍保留一个后续问题：`.legion/wiki/log.md` 是否只在首次真实 writeback 时创建，而不是在本次最小迁移中一并创建。

### 下一步

- reviewer 可优先确认 README 的入口叙事是否足够清晰、统一 wiki 的边界是否易于执行。
- 若本轮通过，可按现有产物继续使用 unified wiki 口径，并在后续真实 writeback 场景中再决定是否落盘 `log.md` 等按需页面。
- [review-change.md](./review-change.md) 还给出一个非阻塞建议：后续可再微调少量 README 措辞，但当前无需阻塞合入。
