# Source Summary: The Complete Guide to Building Skills for Claude

- Source file: [`../The-Complete-Guide-to-Building-Skill-for-Claude.pdf`](../The-Complete-Guide-to-Building-Skill-for-Claude.pdf)
- Related pages: [主题页](../topics/building-skills-for-claude.md) · [总览 playbook](../overviews/skill-building-playbook.md) · [维护待办](../maintenance/backlog.md)

## Source scope

- 页数：33 页（正文目录显示主要内容覆盖 pp.3-32）。
- 用途：技能（skills）构建方法指南，覆盖定义、结构、设计、测试、分发、模式与排障。
- 本页定位：事实型摘要页，优先保留稳定结论与页码，不做过度延伸解释。

## Chapter summary

### 1) Introduction（p.3）

- skill 被定义为“一个简单文件夹中的一组指令”，用于把可重复流程一次性教给 Claude，避免每次重述偏好与流程（p.3）。
- 适用场景包括：基于规格生成前端设计、按一致方法做研究、生成符合团队风格的文档、编排多步骤流程（p.3）。
- 指南给出两条阅读路径：
  - standalone skill：重点看 Fundamentals、Planning and Design，以及前两类 use case（p.3）。
  - MCP enhancement：重点看 Skills + MCP 与第 3 类 use case（p.3）。
- 指南声称首次用 `skill-creator` 构建并测试一个可用 skill 通常约 15–30 分钟（p.3）。

### 2) Fundamentals（pp.5-6）

- 一个 skill 文件夹的标准组成：`SKILL.md`（必需）、`scripts/`、`references/`、`assets/`（后三者可选）（p.5）。
- 核心设计原则：
  - progressive disclosure：frontmatter 常驻、正文按需载入、链接文件进一步按需发现（p.5）。
  - composability：多个 skill 可同时加载，单个 skill 不应假设自己独占上下文（p.5）。
  - portability：在 Claude.ai、Claude Code、API 间尽可能一致工作（p.5）。
- Skills 与 MCP 的关系被总结为：MCP 决定“Claude 能做什么”，skills 决定“Claude 应该怎么做”（p.6）。

### 3) Planning and design（pp.8-13）

- 设计起点是 2–3 个具体 use case，而不是先写代码（p.8）。
- 常见 use case 类别：文档 / 资产创建、workflow automation、MCP enhancement（pp.8-9）。
- 成功标准建议同时包含：
  - triggering 命中率等量化指标（如 90% 相关查询能触发）（p.9）。
  - 用户是否还需要补充下一步、结果是否稳定等定性指标（p.9）。
- 技术要求强调：
  - 目录名用 kebab-case（p.10）。
  - 主文件名必须精确为 `SKILL.md`（p.10）。
  - skill 文件夹内不要放 `README.md`（p.10）。
- frontmatter 最小格式只要求 `name` 与 `description`（p.10）；其中 `description` 必须同时说明“做什么”与“何时使用”，且应包含触发短语（pp.10-11）。
- frontmatter 的安全限制包括：禁止 XML angle brackets，以及 skill 名称使用保留前缀（p.11, p.31）。
- 指令编写最佳实践：具体可执行、含错误处理、清晰引用 bundled resources，并用 progressive disclosure 把细节下沉到 `references/`（pp.12-13）。

### 4) Testing and iteration（pp.15-17）

- 测试强度可以分为：Claude.ai 手工测试、Claude Code 脚本化测试、API programmatic testing（p.15）。
- 推荐至少覆盖三类测试：
  - triggering tests（skill 是否在正确场景触发）（p.15）
  - functional tests（输出、API 调用、错误处理、边界情况）（p.16）
  - performance comparison（与无 skill 基线对比）（p.16）
- 一个明确建议是：先围绕单个困难任务持续迭代，成功后再抽象成通用 skill（p.15）。
- `skill-creator` 可用于生成、审阅与迭代 skill，但不负责自动测试套件或定量评估（pp.16-17）。
- 迭代信号分为 undertriggering、overtriggering 与 execution issues，并分别建议调整 description 或 instructions（p.17）。

### 5) Distribution and sharing（pp.19-20）

- 按 PDF 在 2026-01 的描述，当前用户侧分发方式包括：下载 skill 文件夹、必要时 zip、上传到 Claude.ai，或放入 Claude Code skills 目录（p.19）。
- 按 PDF 在 2026-01 的描述，组织级 skills 已支持 workspace-wide 部署与自动更新（p.19）。
- 按 PDF 在 2026-01 的描述，API 侧关键能力包括 `/v1/skills`、`container.skills`、Claude Console 版本管理以及 Agent SDK 集成（p.19）。
- 技能分发建议是：GitHub 公共仓库 + 面向人的 README + MCP 文档中的互链 + 快速安装说明（p.20）。
- 对外定位建议强调 outcome 与 MCP+skills 组合价值，而不是只讲内部技术结构（p.20）。

### 6) Patterns and troubleshooting（pp.22-27）

- 五类常见模式：
  - sequential workflow orchestration（p.22）
  - multi-MCP coordination（p.23）
  - iterative refinement（p.23）
  - context-aware tool selection（p.24）
  - domain-specific intelligence（p.24）
- 常见排障主题包括：上传失败、frontmatter 无效、skill 不触发、触发过多、MCP 连接失败、instructions 未被遵循、上下文过大（pp.25-27）。
- 对 instruction 失效的常见修复：缩短文本、把关键点前置、避免歧义、必要时把关键校验做成脚本（p.26）。
- 对 large context 的修复：缩减 `SKILL.md`、把细节移到 `references/`、避免同时启用过多 skill（p.27）。

### 7) Resources and references（pp.29-32）

- 官方资源包括 skills 文档、API reference、MCP documentation、若干博客文章与 `anthropics/skills` 公共仓库（p.29）。
- `skill-creator` 既可生成 skill，也可评审并给出改进建议（p.29）。
- Quick checklist 提供了从开发前、开发中、上传前到上传后的检查项（p.30）。
- YAML reference 总结了必填字段、可选字段及安全限制（p.31）。
- 完整示例页将读者引向文档技能、示例技能与伙伴目录（p.32）。

## Stable takeaways

- 对 skill 成败影响最大的两个部位是：frontmatter 的触发描述，以及 instructions 的可执行性（pp.10-13, pp.25-26）。
- 技术结构本身很轻量，但高质量 skill 需要明确 use case、测试方法与迭代闭环（pp.8-9, pp.15-17）。
- MCP server 解决连接能力，skill 解决工作流知识；二者结合才更接近“可直接产生价值”的产品体验（pp.5-6, pp.19-20）。

## Uncertain / needs follow-up

- PDF 中提到的 “Current distribution model (January 2026)” 与具体 API 能力可能随产品版本变化；若用于现行外部文档，应再次核对最新官方文档（p.19）。
- `allowed-tools` 等 YAML 可选字段示例出现在参考部分（p.31），但本指南没有完整展开其跨环境行为边界。
- 文中多次提及公共资源与示例仓库，但未在本 PDF 内提供完整 URL 清单；如需落地索引，需二次抓取官方站点（pp.29-32）。
