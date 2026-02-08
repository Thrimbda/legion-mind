# 设计门禁指南 (Design Gate Guide)

> **强制要求**：所有编码任务必须在开始实现前通过设计门禁。  
> **目标**：在尽量少打扰人的前提下，仍然保证“先想清楚再写”，并把关键取舍留痕，便于 Review / 复盘 / 交接。

---

## 0. 两种“批准”方式（减少人类同步成本）

### A) 显式批准（适合本地对话 / 高风险任务）
用户在对话或 PR 中明确写出 **“Design Approved”**（或等价语义），才视为设计批准。

### B) 延迟批准（Autopilot，推荐用于 GitHub/PR 驱动）
允许 Agent **先生成设计并直接实现，开 PR 让人类 Review**。  
**PR 合并（merge）视为最终批准**，而不是在编码前强制阻塞提问。

延迟批准的前提：
- 仍然必须产出 **design-lite** 或 **RFC**
- 必须至少完成一次 **对抗审查/自检**（低风险可自检；中高风险必须 `review-rfc`）
- 所有假设必须写入 `docs/pr-body.md`（让人类在 PR review 一次性纠偏）

---

## 1. 核心规则

**无设计，不编码 (No Code Without Design)。**

在写第一行生产代码之前，你必须有一个清晰的计划（design-lite 或 RFC）。  
“边写边想”会导致技术债务和反复返工。

---

## 2. 风险分级与门禁强度（决定要不要写 RFC）

> **默认策略**：尽量按低风险流程跑完并开 PR；触发高风险信号才升级门禁强度。

### Low Risk（低风险）
满足以下条件的绝大多数“局部修复/小改动”：
- 改动范围小、可回滚
- 不涉及认证/权限/支付/加密/密钥/数据迁移/基础设施
- 没有对外 API 合约变更（接口、schema、wire format）

门禁要求：
- 允许 **design-lite**（写在 `docs/rfc.md` 的 “Design-lite” 章节或单独 `docs/task-brief.md`）
- 直接进入实现
- 设计批准：**延迟批准（PR merge）**即可

### Medium Risk（中风险）
典型信号：
- 新增/修改公共 API
- 涉及业务核心流程，但仍然可回滚
- 引入新依赖 / 新配置项
- 需要多模块联动改动

门禁要求：
- 必须有 RFC（可短，但要有 **Options + Decision + Verification**）
- 必须跑一次 `review-rfc`（PASS 或提出修改后收敛）
- 允许延迟批准（PR merge），但 RFC review 必须先 PASS 才能写生产代码

### High Risk（高风险）
典型信号：
- 认证/鉴权/权限模型/密钥处理
- 数据迁移、持久化 schema 变更、兼容性/回滚困难
- 影响支付/计费/合规/安全边界
- 影响大量用户或关键基础设施

门禁要求：
- RFC 必须完整
- `review-rfc` 必须 PASS
- 仍然允许延迟批准，但 **PR 必须标注高风险**，并在 PR body 写清回滚与风险控制

---



---

## 2.5 RFC Heavy（大任务/史诗级）

当任务满足“高风险信号”或“规模信号”（Epic）时，**Standard RFC 不足以降低返工与不可逆风险**，必须升级为 RFC Heavy。

### 触发信号（示例）
- auth/permission/payment/crypto、密钥处理
- 数据迁移 / schema 或协议变更 / 回滚困难
- 对外合约变更（API 行为、wire format、storage format）
- 跨模块/跨服务/改动面很大，需要拆 2+ 里程碑才能交付
- Unknowns ≥ 3（需要明显调研）

### 门禁要求（强制交付物）
- `docs/task-brief.md`
- `docs/research.md`（证据驱动现状摸底）
- `docs/rfc.md`（heavy 模板）
- `docs/review-rfc.md`（必须 PASS 才能进入实现）

### 推荐执行模式：RFC-only Draft PR（减少人类同步成本）
- Agent 先只提交上述 docs，创建 **Draft PR（仅设计）**
- 人类在 PR review 中一次性纠偏；**Merge 视为设计批准**
- 合并后再进入实现阶段（按 RFC 的 Milestones 分步交付）

> 详见：`REF_RFC_PROFILES.md` 与模板文件。
## 3. 快速通道 (Fast Track)

**仅当**任务满足**所有**以下条件时，可以跳过正式 RFC（走 design-lite）：
1. **小规模**：改动 ≤ 50 行 且 ≤ 3 个文件（大概量级，允许略超但必须说明原因）
2. **低影响**：无 API/Schema 合约变更、无新依赖
3. **无关键路径**：不涉及认证/支付/加密/基础设施
4. **可回滚**：回滚只需 `git revert`，不会产生数据损坏

即使走快速通道，也必须写清：
- Scope（允许改哪些文件/目录）
- Assumptions（你做了哪些默认假设）
- Verification（怎么验收：测试命令 / 复现步骤）

---

## 4. 标准流程（中/高风险）

1. 起草 RFC（写入 `docs/rfc.md`）
2. 更新 `plan.md` 的 Design Index 链接到 RFC
3. 对抗审查：`review-rfc` → PASS/FAIL
4. FAIL 则回到 RFC 迭代，直到收敛
5. 进入实现
6. 最终以 PR 作为“批准载体”（推荐），或者用户显式批准

---

## 5. 设计变更处理

如果在实现中发现设计缺陷或前置假设不成立：
1. **停止**扩大改动
2. **更新** RFC/design-lite
3. **记录**变更原因到 `context.md` 的决策表
4. 如涉及风险升级，必须重新跑 `review-rfc`
