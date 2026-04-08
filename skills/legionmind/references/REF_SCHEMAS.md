# LegionMind 数据结构

> **范围**: 定义目录结构、Plan、Context、Tasks、Config、Ledger 和 Review 语法。

---

## 1. 目录结构

```text
.legion/
├── config.json          # 全局状态与任务注册表
├── ledger.csv           # 所有操作的审计日志
├── playbook.md          # 跨任务沉淀（推荐）
└── tasks/{task-id}/     # 任务级产物
    ├── plan.md          # 唯一任务契约：问题/验收/范围/设计入口/阶段概览
    ├── context.md       # 进展日志与交接文档
    ├── tasks.md         # 结构化任务清单
    ├── config.json      # 任务级配置（可选，Scope mirror）
    ├── docs/            # 设计/评审/报告（推荐）
    │   ├── research.md              # RFC Heavy：证据驱动现状摸底（推荐/强制）
    │   ├── rfc.md
    │   ├── review-rfc.md
    │   ├── review-code.md
    │   ├── review-security.md
    │   ├── implementation-plan.md   # 可选：从 RFC Milestones 抽取
    │   ├── risk-register.md         # 可选：风险登记与回滚触发器
    │   ├── appendix-migration.md    # 可选：迁移细节附录（避免 RFC 主文膨胀）
    │   ├── appendix-threat-model.md # 可选：威胁模型附录
    │   ├── test-report.md
    │   ├── report-walkthrough.md
    │   └── pr-body.md
    └── reports/         # 可选：benchmark、profiling、截图等
```

---

## 1.5 文档语言约定

- `.legion/tasks/<task-id>/plan.md`、`context.md`、`tasks.md` 与 `docs/*.md` 默认使用当前用户与 agent 的工作语言。
- 若仓库已有明确文档语言约定，则遵循仓库约定。
- 不要因为模板示例或历史标题曾使用英文，就把新文档默认写成英文。

---

## 2. plan.md (任务契约 + 执行索引)

**目的**: 作为唯一的人类可读任务契约，定义问题陈述、验收标准、假设/约束/风险、目标、要点、允许 Scope、设计入口与阶段概览。
**角色**: 读多写少 (创建后少变动；当契约、Scope、设计入口或阶段切分变化时更新)。

### 结构

```markdown
# {Task Name}

## 目标
(1-2 句话概括期望结果)

## 问题陈述
(为什么要做、当前痛点是什么、期望改善什么)

## 验收标准
- [ ] (可验证的验收条件 1)
- [ ] (可验证的验收条件 2)

## 假设 / 约束 / 风险
- **假设**: ...
- **约束**: ...
- **风险**: ...

## 要点
- **关键词1**: 描述
- **关键词2**: 描述

## 范围 (Scope)
- `src/auth/` - 认证逻辑
- `.legion/tasks/<task-id>/docs/rfc.md` - 设计文档

## 设计索引 (Design Index)
> **Design Source of Truth**: [RFC 链接或外部文档]

**摘要**:
- 核心流程: (1-2 句话)
- 验证策略: (1-2 句话)

## 阶段概览
1. **Phase 1** - 描述
2. **Phase 2** - 描述

---
*Created: YYYY-MM-DD | Updated: YYYY-MM-DD*
```

### 校验规则
- **标题必须保留**: 为了兼容 Legion CLI 与仓库约定，必须保留 `## 目标`、`## 问题陈述`、`## 验收标准`、`## 假设 / 约束 / 风险`、`## 要点`、`## 范围`、`## 阶段概览` 这几个二级标题。
- **唯一契约真源**: `plan.md` 是唯一的人类可读任务契约；不要再生成、依赖或回退读取 `task-brief.md`。
- **设计内容**: 详细设计（接口、流程图、取舍）**应该**放在 RFC 或 design-lite 文档中。此文件仅提供链接和 1-2 段简要摘要。
- **设计索引条件**: 当任务存在 design-lite 或任何 RFC/设计文档时，`## 设计索引` 为必需；否则可省略。
- **职责边界**: `plan.md` 要覆盖问题、验收和风险，但只能保留摘要级信息；不要粘贴大段 RFC 正文、迁移细节、测试矩阵或实现推导。
- **Scope 真源**: `## 范围` 是唯一的人类可读授权边界；`config.json` 若存在，只能镜像这里的 Scope，不能独立收紧、扩展或否定 `plan.md`。

---


---

## 2.5 tasks/<task-id>/docs/research.md（现状摸底，RFC Heavy 推荐/强制）

**目的**：把“现在是什么样 / 历史决策是什么 / 关键坑是什么”用证据驱动的方式快速写清，避免后续实现阶段重复调研、重复阅读与重复推理。  
**角色**：读多写少（设计阶段可迭代更新，但应保持简短）。

### 结构（推荐）
参考模板：`.opencode/skills/legionmind/references/TEMPLATE_RESEARCH.md`

核心原则：
- 不要粘贴大段代码
- 使用文件路径 + 行号/函数名作为 Evidence
- 对“不确定结论”明确标注 `Unverified`

---

## 2.6 tasks/<task-id>/docs/rfc.md（设计方案）

**目的**：设计 source of truth；供 review 与实现阶段引用。  
**角色**：中频更新（被 `review-rfc` 驱动收敛）。

### RFC 档位
- `standard`：适用于 Medium 风险任务（可短，但必须含 Options/Decision/Verification）
- `heavy`：适用于 Epic/High-risk（必须含 Milestones、Migration/Rollback、Observability 等）

Heavy 模板参考：
- `.opencode/skills/legionmind/references/TEMPLATE_RFC_HEAVY.md`

---

## 2.7 tasks/<task-id>/docs/implementation-plan.md（可选）

**目的**：把 RFC 的 Milestones 抽取成更“工程化”的执行清单，便于 tasks.md 更新与分阶段交付。  
**角色**：可选；对 Epic 任务强烈建议。

模板参考：
- `.opencode/skills/legionmind/references/TEMPLATE_IMPLEMENTATION_PLAN.md`

---

## 2.8 tasks/<task-id>/docs/risk-register.md / appendix-*.md（可选）

**risk-register.md**
- 记录风险、触发器、缓解方式、回滚路径
- 对 High-risk/Epic 任务建议有（但不是强制）

**appendix-*.md**
- 用于承载易膨胀细节（迁移步骤、威胁模型、benchmark 输出等）
- 目标：避免 RFC 主文成为长作文，同时保留可追溯证据

## 3. context.md (上下文与交接)

**目的**: 追踪“怎么做的” (How) 和“进展如何” (Where)。任务的活体记忆。
**角色**: 仅追加 (Append-only)，高频更新。

### 结构

```markdown
# {Task Name} - Context

## 会话进展 (YYYY-MM-DD)
### ✅ 已完成
- 完成事项 1
### 🟡 进行中
- 当前事项
### ⚠️ 阻塞/待定
- 阻塞项 1

---

## 关键文件
**`path/to/file`** [status]
- 作用: ...

## 关键决策
| 决策 | 原因 | 替代方案 | 日期 |
|------|------|----------|------|
| 使用 X | 性能更好 | 使用 Y | 2023-01-01 |

---

## 快速交接
**下次继续从这里开始：**
1. 下一步骤 1

**注意事项：**
- 注意事项 1

---
*Updated: YYYY-MM-DD HH:mm*
```

---

## 4. tasks.md (任务清单)

**目的**: 追踪“状态” (Status)。机器可读的进度表。
**角色**: 通过 Legion CLI 高频更新。

### 结构

```markdown
# {Task Name} - 任务清单

## 快速恢复
**当前阶段**: Phase 1
**当前任务**: Task 1
**进度**: 1/10 任务完成

---

## 阶段 1: Phase Name 🟡 IN PROGRESS
- [x] 已完成任务 | 验收: 标准
- [ ] 当前任务 | 验收: 标准 ← CURRENT
- [ ] 待办任务 | 验收: 标准
```

### 阶段状态逻辑
- ⏳ **NOT STARTED**: 0 个任务完成。
- 🟡 **IN PROGRESS**: 完成了 >0 个，但未全部完成。
- ✅ **COMPLETE**: 所有任务均已完成。

---

## 5. Review 语法

Reviewer 可以在三个文件的任意位置插入 Review 块。

### 触发格式
```markdown
> [REVIEW] 评论内容...
> [REVIEW:blocking] 必须修复此问题...
> [REVIEW:question] 为什么选 X?
> [REVIEW:suggestion] 建议尝试 Y...
```

### 响应格式 (由 Legion CLI 自动生成)
```markdown
> [REVIEW] 评论内容...
> [RESPONSE] 回复内容...
> [STATUS:resolved]
```

### 状态
- `open`: 等待回复。
- `resolved`: 已修复/已回答。
- `wontfix`: 拒绝修改（附理由）。
- `need-info`: 需要更多信息。

---

## 6. tasks/<task-id>/config.json (任务级配置，可选)

**目的**: 提供机器可校验的 Scope mirror，避免“自然语言范围”难以约束。

### 示例
```json
{
  "scope": {
    "allow": ["src/auth/**", "src/utils/*.ts"],
    "deny": ["infra/**", "**/*.sql"]
  }
}
```

### 规则
- `allow` / `deny` 使用 Glob（与常用 gitignore/minimatch 语义一致）。
- `deny` 优先级最高：匹配 `deny` 即视为越界。
- 若存在 `allow`，则所有改动必须命中 `allow` 且不命中 `deny`。
- `plan.md` 的 `## 范围` 是人类可读的 Scope 真源；`config.json` 只能镜像或结构化表达同一范围，不能独立收紧、扩展或否定 `plan.md`。
- 若缺失 `config.json`，允许直接以 `plan.md` 的 Scope 列表为准。

---

## 7. docs/ 与 reports/ 约定（推荐）

**目的**: 统一文档输出位置，便于 orchestrator 与子 agent 读取/写入。

### 设计与审查的默认路径
- **RFC 真源路径**: `.legion/tasks/<task-id>/docs/rfc.md`
- **RFC 审查**: `.legion/tasks/<task-id>/docs/review-rfc.md`
- **Code Review**: `.legion/tasks/<task-id>/docs/review-code.md`
- **Security Review**: `.legion/tasks/<task-id>/docs/review-security.md`
- **Walkthrough**: `.legion/tasks/<task-id>/docs/report-walkthrough.md`
- **PR Body**: `.legion/tasks/<task-id>/docs/pr-body.md`

### 报告/附件路径（可选）
- 性能/基准: `.legion/tasks/<task-id>/reports/benchmark.md`
- Profiling: `.legion/tasks/<task-id>/reports/profiling.md`
- 截图/媒体: `.legion/tasks/<task-id>/reports/`

### 与 handoff / dashboard 的关系
- `<taskRoot>/docs/` 下的文件应在 `context.md` 的“关键文件”里登记（便于交接）。
- `report-walkthrough.md` 与 `pr-body.md` 可作为 dashboard 的重点链接。

---

## 8. playbook.md（跨任务沉淀，推荐）

**目的**: 将可复用模式/策略从单一任务中抽离，形成长期知识资产。

**建议结构**:
```markdown
# Legion Playbook

## 模式：...
- 来源任务：task-xxx
- 背景：...
- 方案：...
- 适用边界：...
- 陷阱：...
- 最小示例：...
```
