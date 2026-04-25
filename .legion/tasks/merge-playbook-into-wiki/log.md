# Merge playbook into wiki and clarify README terms - 日志

## 会话进展 (2026-04-23)

### ✅ 已完成

- 读取 README、usage、`legion-docs`、`legion-wiki`、现有 `.legion/playbook.md` 与相关历史资料，确认当前仓库确实同时存在“playbook”与“wiki”两套跨任务知识表述。
- 记录用户新的目标：README 要把关键概念讲清楚，不再靠抽象术语；playbook 概念要并入 wiki，并由 `legion-wiki` 接管。
- 新建任务 `merge-playbook-into-wiki`，为后续 RFC / 实施 / 验证建立任务契约。
- 产出 Medium-risk RFC，定义 unified wiki layer、former playbook 条目映射规则、最小 wiki 完成态、README 直白解释策略，以及 `.legion/playbook.md` 的迁移 / 回滚方案。
- 完成 `review-rfc` 并吸收 blocking 反馈：补齐 residual `playbook` 允许矩阵、对称回滚步骤、最小必需 wiki 页面，以及 `TEMPLATE_RESEARCH.md` 的具体改动说明。
- 更新 README、usage、`legion-docs`、`legion-wiki`、`TEMPLATE_RESEARCH.md` 与 agent 文案，统一只承认 `.legion/wiki/**` 为跨任务知识层。
- 创建 `.legion/wiki/index.md` 与 `.legion/wiki/patterns.md`，并将 “CLI 保持薄层” durable 约定从 `.legion/playbook.md` 迁入 `patterns.md` 后删除旧文件。
- 完成针对性验证、只读交付审查与 reviewer-facing walkthrough / PR body 生成。

### 🟡 进行中

- 无。

### ⚠️ 阻塞/待定

- 无用户侧阻塞；等待 RFC 收敛最终迁移方案。

---

## 关键文件

- **`README.md`** [pending]
  - 作用: 对外总入口，需补清晰定义与系统模型说明
- **`skills/legion-docs/SKILL.md`** [pending]
  - 作用: `.legion` 文档落点规则，需移除独立 playbook 落点
- **`skills/legion-wiki/SKILL.md`** [pending]
  - 作用: 跨任务知识层真源，需接管 playbook 式沉淀职责
- **`.legion/playbook.md`** [pending]
  - 作用: 现有跨任务规则沉淀，需要迁移到统一 wiki 落点
- **`.legion/wiki/index.md`** [completed]
  - 作用: 统一 wiki 查询入口
  - 备注: 已建立最小导航页，指向 `patterns.md`
- **`.legion/wiki/patterns.md`** [completed]
  - 作用: 可复用模式与 former playbook 风格约定落点
  - 备注: 已承接 “CLI 保持薄层” 约定
- **`.legion/tasks/merge-playbook-into-wiki/docs/test-report.md`** [completed]
  - 作用: 本次语义收敛与迁移验证证据
  - 备注: 验证了现行真源去双轨、README 直白解释、init 叙事不变与最小 wiki 完成态
- **`.legion/tasks/merge-playbook-into-wiki/docs/review-change.md`** [completed]
  - 作用: 只读交付审查
  - 备注: 按 task-owned 文件评审后 PASS

---

## 关键决策

| 决策 | 原因 | 替代方案 | 日期 |
|------|------|----------|------|
| 将本任务定为 Medium 风险 | 会修改当前真源文档与技能边界，属于 public workflow semantics 收敛 | 视为 Low 风险直接修改 | 2026-04-23 |
| 统一只保留 `.legion/wiki/**` 作为跨任务 durable knowledge 层 | 用户明确要求合并 playbook 与 wiki；双概念已经制造重复心智模型 | 继续保留 playbook / wiki 双轨 | 2026-04-23 |
| 本任务最小 wiki 完成态固定为 `index.md` + `patterns.md` | 已知唯一 former playbook durable 条目属于 pattern；不为凑布局创建空页 | 一次性预建全量 wiki 页面 | 2026-04-23 |
| 历史 raw docs 保留 `playbook` 术语不视为失败 | 本任务只要求当前真源去双轨，不回溯重写所有历史材料 | repo 范围内彻底删除所有 playbook 提及 | 2026-04-23 |

---

## 快速交接

**下次继续从这里开始：**
1. 若后续需要补更多 durable 结论，继续按 `decisions.md` / `patterns.md` / `maintenance.md` 分类写入 `.legion/wiki/**`。
2. 若要进一步清理历史材料里的 `playbook` 表述，应另开任务，不要把历史 raw docs 清扫与当前真源收敛混在一起。

**注意事项：**
- 不要只改 README，不同步当前真源技能与落点规则。
- 不要把 playbook 仅仅改名；需要明确并入 wiki 后的具体页职责。
- review-change 的首次 FAIL 来自 repo 里存在无关脏文件；对本任务应按 task-owned 文件集合评审 scope compliance。

---

*最后更新: 2026-04-23 14:25 by Legion orchestrator*
