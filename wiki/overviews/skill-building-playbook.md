# Overview: Skill Building Playbook

- Start here from: [Wiki Index](../index.md)
- Evidence base: [Source Summary](../sources/the-complete-guide-to-building-skills-for-claude.md)
- Deeper topic page: [Building Skills for Claude](../topics/building-skills-for-claude.md)

## Purpose

把 PDF 中分散的建议压缩为一个“从想法到上线”的最小 playbook，方便后续围绕 skill 设计、审阅与维护快速对齐。

## Recommended flow

### Step 1: 明确 use cases 与目标结果

- 先定义 2–3 个用户真正会提出的场景，而不是先写文件结构（p.8）。
- 为每个 use case 写出：trigger、关键步骤、预期结果（p.8）。

### Step 2: 判断 skill 类型

- 如果重点是产出质量与一致性，通常偏文档 / 资产创建型（p.8）。
- 如果重点是稳定执行多步骤流程，通常偏 workflow automation（p.9）。
- 如果重点是把已有 MCP 工具变成“可直接使用的工作流”，通常偏 MCP enhancement（p.9）。

### Step 3: 设计最小 skill 结构

- 必备：`SKILL.md`（p.5, p.10）。
- 可选：`scripts/`、`references/`、`assets/`（p.5）。
- 目录名 kebab-case，避免在 skill 内加入 `README.md`（p.10）。

### Step 4: 先把 frontmatter 写对

- `name` 与 `description` 是最低要求（p.10）。
- `description` 要同时回答两个问题：
  - 这个 skill 帮什么？
  - 用户在什么情况下会需要它？（pp.10-11）
- 触发短语应贴近真实用户表达，而不是只写内部术语（p.11）。

### Step 5: 再写 instructions

- Instructions 要可执行、分步骤、含失败处理与资源引用（pp.12-13）。
- 把“核心流程”留在正文，把细节与长文档沉到 `references/`，利用 progressive disclosure 控制上下文大小（p.5, p.13）。

### Step 6: 做三类验证

- triggering：该触发时会触发，不该触发时不触发（p.15）。
- functional：输出正确、工具调用成功、边界情况可处理（p.16）。
- performance：与无 skill 的做法相比是否更省 token、更少失败、更少往返（p.16）。

### Step 7: 根据失败信号迭代

- undertriggering → 扩充 description 的真实触发语义（p.17）。
- overtriggering → 收窄范围，必要时写负向触发条件（pp.17, 25-26）。
- execution issues → 改 instructions，补错误处理，必要时把关键校验改为脚本（p.26）。

### Step 8: 分发与定位

- 面向人：GitHub 仓库、README、安装说明、示例截图（p.20）。
- 面向程序：使用 API、Console 与 Agent SDK 管理 skills（p.19）。
- 定位文案应强调 outcome 与 MCP+skills 的组合价值（p.20）。

## Heuristics

- 优先把一个困难任务做通，再抽象出广义 skill；这比一开始覆盖很多任务更快获得有效信号（p.15）。
- 如果 skill 说明越来越长，先检查是否该把细节转移到 `references/`，而不是继续堆在主文件里（p.13, p.27）。
- 如果用户常问“这个 skill 什么时候用”，通常说明 `description` 仍不够具体（p.17, p.25）。

## 待确认 / 不确定

- 不提供最新 API / 平台状态保证；当前平台能力仍需以实时官方文档为准（p.19）。
- 不替代具体领域知识设计；若 skill 涉及合规、财务、医疗等高风险领域，还需要单独定义领域验证机制（p.24）。
