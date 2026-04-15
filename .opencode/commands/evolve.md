---
description: 从当前任务中提取可复用模式和当前有效结论，写入 .legion/wiki/**（必要时再同步 playbook）
agent: legion
---

在完成一个任务或阶段后，使用此命令提取和记录可复用的模式。

## 前置检查

1) 调用 `skill({ name: "legion-workflow" })` 加载指南
2) 调用 `skill({ name: "legion-wiki" })` 处理 `.legion/wiki/**`
3) 如需写 `.legion` 文档规则，追加 `skill({ name: "legion-docs" })`
4) 运行 `node --experimental-strip-types "${OPENCODE_HOME:-$HOME/.opencode}/skills/legion-workflow/scripts/legion.ts" status --format json` 确认有活跃任务

## 执行步骤

1) **识别可复用模式**

分析本次任务中发现的通用规律：
- API 模式或约定（如"所有 API 使用 `Result<T, E>` 返回"）
- 陷阱或非显而易见的要求（如"修改 X 时必须同步更新 Y"）
- 文件/模块间的依赖关系
- 测试策略（如"此模块需要 mock 数据库"）
- 配置或环境要求

2) **记录到 `.legion/wiki/**`（并在当前任务 log.md 留痕）**

- task 级综合摘要 → `.legion/wiki/tasks/<task-id>.md`
- 当前有效决策 → `.legion/wiki/decisions.md`
- 可复用模式 → `.legion/wiki/patterns.md`
- 迁移债务 / 待确认项 → `.legion/wiki/maintenance.md`

必要时，再把极简 conventions 摘要同步到 `.legion/playbook.md`

使用 `log update --json '{...}'` 添加决策记录：
```
addDecision: {
  decision: "发现可复用模式: <模式名称>",
  reason: "<具体描述>",
  alternatives: "适用场景: <何时使用> | 不适用: <何时不用>",
  date: "<YYYY-MM-DD>"
}
```

3) **输出摘要**

在对话中输出发现的模式（供用户确认是否值得保留）：

```markdown
## 发现的可复用模式

### <模式名称>
- **描述**: <具体规则>
- **适用场景**: <何时使用>
- **示例**: <代码片段或文件路径>

### ...
```

## 适合记录到 wiki 的模式

- "当修改 X 时，也需要更新 Y 以保持同步"
- "此模块的所有 API 调用使用模式 Z"
- "测试需要在 PORT 3000 运行 dev server"
- "字段名必须与模板完全匹配"
- "此目录的文件需要遵循 <约定>"

## 不适合记录的

- 任务特定的实现细节（应在 tasks.md/log.md 的进展中记录，而不是直接抬升到 wiki）
- 临时调试笔记
- 已在其他文档（如 README）中说明的内容
