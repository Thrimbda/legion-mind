# Align Legion entry semantics - 日志

## 会话进展 (2026-04-23)

### ✅ 已完成

- 重新审视当前 README、usage、workflow、brainstorm、AGENTS 与 CLI 实现的语义偏差。
- 确认当前最大偏差集中在 active task 语义、`init` 与 wiki skeleton 契约、以及 `legion-workflow` / `legion.ts` 的入口命名混淆。
- 通过 RFC / review-rfc 收敛最小复杂度方案：文档追随真实行为，不扩展 `init`，对外只保留 `bypass / restore / brainstorm` 三条入口语义。
- 更新 README、AGENTS、usage、workflow、brainstorm、REF_TOOLS、REF_WIKI_LAYOUT，使 active task、restore、playbook/wiki、workflow vs CLI 的定义重新一致。
- 运行定向验证，确认 in-scope 文档已清除禁用旧语义，且真实 `init` 行为仍只创建 `.legion/tasks/`。
- 生成 test-report、review-code、report-walkthrough 与 pr-body。
- 把 CLI `status` 输出字段重命名为 `currentChecklistItem`，并同步 dashboard / schema / docs 的“当前检查项”表述。

### 🟡 进行中

- 无。

### ⚠️ 阻塞/待定

- 无阻塞；本任务已明确选择“文档追随真实行为，不改 init”。

---

## 关键文件

- **`README.md`** [completed]
  - 作用: 对外总入口与系统模型说明
  - 备注: 已修正 init/wiki/命名语义，并补足 playbook/wiki 与 workflow/CLI 关系
- **`skills/legion-workflow/SKILL.md`** [completed]
  - 作用: workflow 真源
  - 备注: active task 已重定义为“当前请求明确恢复的既有任务目录”
- **`docs/legionmind-usage.md`** [completed]
  - 作用: 用户操作说明
  - 备注: 已去掉“恢复活跃任务”的旧说法并定义 playbook/wiki 关系
- **`skills/legion-workflow/references/REF_TOOLS.md`** [completed]
  - 作用: 本地 CLI 调用参考
  - 备注: 已移除“默认入口”措辞，并与真实 init 行为一致
- **`skills/legion-wiki/references/REF_WIKI_LAYOUT.md`** [completed]
  - 作用: wiki 目标布局说明
  - 备注: 已明确这是目标布局，不等于 init 默认落盘集合
- **`skills/legion-workflow/scripts/lib/cli.ts`** [in_progress]
  - 作用: 本地 CLI 状态输出
  - 备注: 已将 `currentTask` 输出字段改成 `currentChecklistItem`

---

## 关键决策

| 决策 | 原因 | 替代方案 | 日期 |
|------|------|----------|------|
| 新开任务收敛入口语义，而不是继续混在 CLI 精简任务里 | 这是独立的 README / workflow / schema 一致性问题 | 继续堆在旧 task 下 | 2026-04-23 |
| 文档追随真实行为，不扩展 `init` | README 真实性比保留旧措辞更重要；扩展 init 没有被证明有必要 | 为了保留旧叙事而增加 wiki skeleton 行为 | 2026-04-23 |
| 对外入口语义只保留 `bypass / restore / brainstorm` | `continue` 容易重新引入 active-task 歧义 | 继续把 continue 当对外可观察路径 | 2026-04-23 |

---

## 快速交接

**下次继续从这里开始：**
1. 如需更彻底的历史清扫，可在 scope 外老文档中继续移除对 `currentTask` 旧字段名的说明。
2. 如需进一步固定契约，可在 `REF_TOOLS.md` 增补最小 JSON 响应示例。

**注意事项：**
- 不要重新引入任何持久化 active task 状态文件。
- `init` 当前只创建 `.legion/tasks/`；wiki 页面由后续 writeback 按需建立。

---

*最后更新: 2026-04-23 02:30 by Legion orchestrator*
