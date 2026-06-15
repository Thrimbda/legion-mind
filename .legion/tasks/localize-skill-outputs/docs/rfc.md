# RFC: 全仓库 Skill 中文输出约束

## Profile

Standard RFC。该任务不改可执行代码，但跨 13 个核心 skill，属于中风险文档行为变更：需要明确语言约束、例外边界、验证方式与回滚方式。

## 背景

LegionMind 的仓库说明、任务证据和多数 workflow skill 已以中文为主，但每个 skill 是否必须用中文回答、是否必须用中文产出文档并没有在 skill 本体中统一声明。由于 skills 会被安装或同步到不同运行时，单靠仓库级 AGENTS 规则不足以保证独立加载后的语言行为一致。

## 设计目标

- 每个 `skills/*/SKILL.md` 都显式声明默认中文回答。
- 会产出人类阅读型文档的 skill 显式声明文档产物默认中文。
- 保留代码、命令、路径、配置字段、错误原文、API/CLI 名称、frontmatter 字段、GitHub/Linear 等平台术语。
- 不改变现有触发条件、阶段链、Git lifecycle、安装脚本或验证脚本语义。

## 非目标

- 不把所有 skill 主体全文重写成统一模板。
- 不翻译机器可读内容或外部系统原文。
- 不修改用户本地已安装 skill 副本。
- 不引入新的运行时配置项或安装步骤。

## 选项

### 选项 A：在每个 skill 中加入相同的统一段落

优点：实现简单，静态检查容易。

缺点：部分 skill 不产出文档，统一写法会制造误导；workflow/envelope skill 与文档产出型 skill 的语义强度不同，完全相同的段落容易过宽。

### 选项 B：统一原则 + 按 skill 职责定制落点（推荐）

在每个 skill 的高可见位置加入“输出语言”或“输出语言与文档产物”小节。所有 skill 共享默认中文与例外规则；文档型/流程型 skill 强调 task docs、wiki、RFC、review、walkthrough、PR body 等产物；只读 review 或实现型 skill 强调 handoff/report 使用中文，同时保留命令输出和技术 token 原文。

优点：满足用户要求，同时减少对各 skill 职责的误解；新增文本与已有中文文风一致。

缺点：静态检查需要看语义，而不只是逐字模板。

### 选项 C：只在 `legion-workflow` 或 README 写全局规则

优点：改动少。

缺点：不满足“所有 skill”要求；单独安装或独立加载某个 skill 时约束可能丢失。

## 决策

采用选项 B。

每个 skill 的新增约束应包含三层含义：

1. 默认用中文回答或交接。
2. 如果本 skill 产出人类阅读型文档产物，文档默认中文。
3. 代码、命令、路径、配置字段、错误原文、外部术语、用户指定语言和机器可读内容不强制翻译。

## Per-skill 落点

| Skill | 新增约束重点 |
|---|---|
| `brainstorm` | task contract、`plan.md`、`tasks.md` 默认中文；用户指定其他语言除外。 |
| `spec-rfc` | `docs/rfc.md`、`research.md`、`implementation-plan.md` 默认中文；技术 token 保留。 |
| `review-rfc` | `docs/review-rfc.md` 和 PASS/FAIL 结论默认中文。 |
| `engineer` | 实现 handoff 默认中文；代码、命令、标识符保持原语义。 |
| `verify-change` | `docs/test-report.md` 默认中文；命令与输出原文可引用。 |
| `review-change` | `docs/review-change.md` 默认中文；security/correctness 术语可保留英文。 |
| `report-walkthrough` | `report-walkthrough.md/html`、`pr-body.md` 默认中文；HTML 属性和模板结构不翻译。 |
| `legion-wiki` | `.legion/wiki/**` 和 task summary 默认中文。 |
| `legion-docs` | `.legion/tasks/**` 文档默认中文。 |
| `legion-workflow` | 编排、task docs、阶段交接和收口证据默认中文。 |
| `git-worktree-pr` | lifecycle log、handoff、PR body 摘要默认中文；Git/GitHub 命令原文保留。 |
| `pr-html-render` | 给用户的最小输出、render handoff 和 PR comment 文案默认中文；HTML/URL/Actions 字段保持原文。 |
| `llm-wiki` | durable wiki 页面与回答默认中文；raw 证据引用保持原文。 |

## 验证计划

- 静态检查所有 `skills/*/SKILL.md` 均包含中文输出约束。
- 静态检查每个 skill 的文档产物约束与职责匹配，不给无文档产物的 skill 虚构产物。
- `git diff --check` 确认 Markdown whitespace 无异常。
- `npm run test:regression` 确认安装/验证脚本 surface 未被文档改动破坏。

## 回滚

该任务无数据迁移和外部状态变更。若发现语言约束影响触发或误导流程，可通过 `git revert` 回退本 PR；已生成的 `.legion/tasks/localize-skill-outputs/**` 证据可随同回退或在后续任务中标记为 historical。

## 实现边界

- 只改 `skills/*/SKILL.md` 和本任务 `.legion` 证据，除非后续验证暴露必要的 wiki writeback。
- 不改 frontmatter `name` / `description`，避免影响 skill discovery。
- 不调整模板、脚本、测试或 CLI 行为。

## 设计批准语义

本任务采用延迟批准：RFC 与 review-rfc 先在 PR 中交付，PR merge 视为最终批准。实现前必须先完成 `review-rfc` 且结论为 PASS。
