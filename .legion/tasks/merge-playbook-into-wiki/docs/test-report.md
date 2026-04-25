# 测试报告：merge-playbook-into-wiki

## 结论

- 结果：**通过（无阻塞失败）**
- 范围内要求已验证：
  - 当前真源不再把 `.legion/playbook.md` 当作活跃 durable 路径使用
  - 历史文档中的 `playbook` 提及被正确视为历史材料，而非失败
  - `.legion/wiki/index.md` 与 `.legion/wiki/patterns.md` 存在，且 `patterns.md` 含迁移后的 CLI 薄层约定
  - README 已用人话解释“设计门禁 / 分层验证 / 证据化汇报”
  - `init` 叙事仍是“只建 `.legion/tasks/`，wiki 由后续 writeback 按需建立”

## 执行命令

### 1) 检查 wiki 最小完成态与 `.legion/playbook.md` 删除状态

**为什么选它**：这是最直接的文件系统验证，能同时确认最小 wiki 页面存在以及旧路径已删除。

```bash
ls -la ".legion" && ls -la ".legion/wiki" && test ! -e ".legion/playbook.md"
```

**结果**：通过。

- `.legion/wiki/index.md` 存在
- `.legion/wiki/patterns.md` 存在
- `.legion/playbook.md` 不存在

### 2) 检查当前真源是否仍把 `.legion/playbook.md` 当作现行路由

**为什么选它**：直接对 task scope 内的当前真源文件做路径级搜索，最快发现是否还有旧 durable 路由残留。

```bash
rg -n "\.legion/playbook\.md" README.md docs/legionmind-usage.md skills/legion-docs/SKILL.md skills/legion-docs/references/REF_SCHEMAS.md skills/legion-wiki/SKILL.md skills/legion-wiki/references/*.md skills/spec-rfc/references/TEMPLATE_RESEARCH.md .opencode/agents/legion.md .legion/wiki
```

**结果**：1 处命中。

- `skills/legion-wiki/references/REF_WIKI_LAYOUT.md:5`

**判定**：通过。

原因：该处是“**不再单列 `.legion/playbook.md`**”的历史/迁移说明，不是把它当作现行 durable artifact / writeback 目标来路由。

### 3) 检查历史文档仍可保留 `playbook` 提及，且不应误报失败

**为什么选它**：把历史材料单独搜出来，验证“允许保留历史术语”的边界真的存在，而不是被错误纳入失败集。

```bash
rg -n "playbook|\.legion/playbook\.md" .legion/tasks docs/skill-split-plan.md docs/legion-context-management-raw-wiki-schema.md
```

**结果**：命中多处历史任务文档、历史设计文档，以及当前任务 raw docs。

**判定**：通过。

原因：这些文件属于 raw docs / 历史研究材料，符合 RFC 允许矩阵；本任务目标不是全仓彻底去掉 `playbook` 一词，而是**当前真源不再把它当活跃概念**。

### 4) 检查 README 的人话解释是否存在

**为什么选它**：直接抓取 README 中与三个术语及其产物映射相关的关键短语，验证不是只剩口号。

```bash
rg -n "设计门禁|分层验证|证据化汇报|先写代码后补文档|不是一条命令证明一切|test-report\.md|report-walkthrough\.md|pr-body\.md" README.md
```

**结果**：通过。

- `README.md:16` 明确解释：
  - 设计门禁 = 中高风险改动先在 `plan.md` / `docs/rfc.md` 说清为什么改、影响什么、怎么回滚
  - 分层验证 = 把安装校验、任务验证、文档一致性分开检查
  - 证据化汇报 = 用 `test-report.md`、`report-walkthrough.md`、`pr-body.md` 带着证据交付

**判定**：通过。

### 5) 检查 `init` 叙事未被改成预建 wiki skeleton

**为什么选它**：该任务明确约束“不改 init 行为”；直接搜索 `init` / `按需建立` / `skeleton` 是最短验证路径。

```bash
rg -n "init|按需建立|预建|skeleton|\.legion/wiki/\*\*" README.md docs/legionmind-usage.md skills/legion-docs/references/REF_SCHEMAS.md skills/legion-wiki/references/REF_WIKI_LAYOUT.md .legion/tasks/merge-playbook-into-wiki/docs/rfc.md
```

**结果**：通过。

- `README.md:125`：`init` 当前只保证 `.legion/tasks/` 存在；`.legion/wiki/**` 由后续 writeback 按需建立
- `docs/legionmind-usage.md:63`：wiki 页面由后续 writeback 按需建立，不假定 `init` 预建 skeleton
- `skills/legion-docs/references/REF_SCHEMAS.md:42`：`init` 不要求预建整套 wiki skeleton
- `skills/legion-wiki/references/REF_WIKI_LAYOUT.md:5`：目标布局不等于 `init` 默认落盘集合

### 6) 检查 `patterns.md` 是否承接迁移后的 CLI 薄层约定

**为什么选它**：这是本任务迁移内容的核心事实，直接读取目标页最可靠。

```bash
ls -la ".legion/wiki" && rg -n "CLI|薄层|task create|status --task-id|log update|tasks update" .legion/wiki/patterns.md .legion/wiki/index.md
```

**结果**：通过。

- `.legion/wiki/patterns.md` 含“**模式：CLI 保持薄层**”
- 条目包含背景、做法、适用边界、常见陷阱、最小示例
- `.legion/wiki/index.md` 提供了到 `patterns.md` 的导航

## 失败项

- 无阻塞失败。
- 备注：`skills/legion-wiki/references/REF_WIKI_LAYOUT.md` 仍提到 `.legion/playbook.md`，但语义是“已退役 / 不再单列”，不是现行路由，因此本次验证不判为失败。
