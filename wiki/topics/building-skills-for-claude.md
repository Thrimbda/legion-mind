# Topic: Building Skills for Claude

- Parent navigation: [Wiki Index](../index.md)
- Source basis: [Source Summary](../sources/the-complete-guide-to-building-skills-for-claude.md)
- Related overview: [Skill Building Playbook](../overviews/skill-building-playbook.md)

## Topic overview

本页把 PDF 中与“如何构建一个有效 skill”直接相关的知识，按可执行主题重新组织，便于后续 query 与扩展。

## 1. Skill 的定位

- skill 是“知识与工作流层”，适合把重复任务、领域偏好与步骤化方法沉淀为可复用能力（p.3, p.5）。
- 当任务需要实时系统访问时，MCP 提供连接；当任务需要稳定做法与最佳实践时，skill 提供 recipes（pp.5-6）。
- 对使用者而言，好的 skill 应减少“我下一步该提示什么”的负担（p.9）。

## 2. 设计原则

### Progressive disclosure

- frontmatter 负责“是否应触发”的最小信号（p.5）。
- `SKILL.md` 正文承载核心 instructions（p.5）。
- `references/` 等链接文件承载详细文档，按需读取（p.5, p.13）。

### Composability

- skill 默认需要与其他 skills 共存，因此不应假设自己拥有全部上下文与唯一工作流控制权（p.5）。

### Portability

- 设计时应优先考虑 Claude.ai、Claude Code、API 的跨场景可迁移性，并在需要时用 compatibility 字段声明依赖（p.5, p.11）。

## 3. 规划方法

### 从 use cases 出发

- 先明确 2–3 个具体 use case、触发语句、步骤与结果，再写技术结构（p.8）。
- 常见大类：
  - 文档 / 资产生成（p.8）
  - workflow automation（p.9）
  - MCP enhancement（p.9）

### 定义成功标准

- 量化维度：触发率、工具调用数、失败 API 调用数（p.9）。
- 定性维度：是否还需用户纠偏、跨会话结果是否稳定、新用户是否能第一次就成功（p.9）。

## 4. 关键实现要点

### 文件与命名

- 文件夹名必须 kebab-case，主文件必须是精确的 `SKILL.md`（p.10）。
- skill 目录内不放 `README.md`；面向人的 README 放仓库级分发位置（p.10, p.20）。

### Frontmatter

- 最小必需字段是 `name` 与 `description`（p.10）。
- `description` 需要同时说明：
  - skill 做什么
  - 何时使用 / 用户可能怎么说（pp.10-11）
- 常见失败原因是描述太泛、没有 trigger phrases、只写技术实现不写用户场景（pp.11-12, p.25）。

### Instructions

- 推荐写成步骤化结构，包含示例与 troubleshooting（p.12）。
- 高质量 instructions 的共同点是：具体、可执行、带错误处理、明确引用资源（p.13）。

## 5. 测试与迭代

- 推荐至少做三类测试：triggering、functional、performance comparison（pp.15-16）。
- 最快获得高价值反馈的方法，是先拿一个高难任务反复调优，再扩展覆盖面（p.15）。
- 若表现不佳，可按症状定位：
  - 不触发：补 description 的触发语义（p.17, p.25）
  - 过触发：加负向条件、收窄范围（pp.17, 25-26）
  - 执行质量差：改 instructions、加 error handling，必要时加脚本（p.17, p.26）

## 6. 常见模式

- 顺序编排：适合强依赖步骤链（p.22）。
- 多 MCP 协作：适合跨服务交接（p.23）。
- 迭代 refinement：适合质量驱动产出（p.23）。
- 上下文感知选工具：适合同一目标对应不同执行路径（p.24）。
- 领域智能：适合把合规、政策、专业判断嵌入流程（p.24）。

## 7. 分发视角

- 对个体用户，当前路径仍偏“下载 / zip / 上传 / 放入目录”（p.19）。
- 对程序化场景，API 能力更适合版本管理与规模化部署（p.19）。
- 对生态传播，推荐采用 GitHub + README + 安装指南 + MCP 文档互链的组合（p.20）。

## 待确认 / 不确定

- API、workspace-wide deployment 与 Code Execution beta 的现状可能随时间变化；若要做对外说明，需先复核最新官方文档（pp.19-20）。
- 本 PDF 提供了模式与 checklist，但没有给出统一的技能评测框架；定量评估方法仍需补充实践方案（p.9, p.16）。
