# Remove config/ledger from Legion CLI - 日志

## 会话进展 (2026-04-23)

### ✅ 已完成

- 确认 playbook schema 当前定义在 `skills/legion-docs/references/REF_SCHEMAS.md` 第 7 节，`legion-docs/SKILL.md` 也把它定义为跨任务复用规则落点。
- 确认 CLI 当前仍真实读写 `.legion/config.json` 与 `.legion/ledger.csv`。
- 删除文档中对 `config.json` / `ledger.csv` 作为 Legion schema 组成部分的描述。
- 完成 Medium 风险 RFC 与 review-rfc 收敛，明确 CLI 精简后的命令面与错误语义。
- 移除 CLI 对 `.legion/config.json` / `.legion/ledger.csv` 的运行时依赖，并删除 proposal/approval、task switch/archive、ledger query 等旧命令。
- 更新 README、usage、REF_TOOLS、REF_AUTOPILOT、REF_BEST_PRACTICES 等文档，使其与当前 CLI 一致。
- 完成针对性验证、代码审查和 reviewer-facing walkthrough / PR body 生成。

### 🟡 进行中

- 无。

### ⚠️ 阻塞/待定

- 无阻塞；实现已改为显式 `--task-id` / JSON `taskId`。

---

## 关键文件

- **`skills/legion-workflow/scripts/lib/cli.ts`** [completed]
  - 作用: CLI 状态模型与文件写回实现
  - 备注: 已改为文件系统驱动，并补齐损坏任务目录的 `TASK_CORRUPTED` 校验
- **`skills/legion-workflow/scripts/legion.ts`** [completed]
  - 作用: CLI 命令路由入口
  - 备注: 已移除旧命令并统一返回 `UNSUPPORTED_COMMAND`
- **`skills/legion-workflow/references/REF_TOOLS.md`** [completed]
  - 作用: CLI 参考真源
  - 备注: 已收敛为精简命令集与显式 task-id 模式
- **`.legion/tasks/drop-ledger-config-from-cli/docs/test-report.md`** [completed]
  - 作用: 本次 CLI 收敛的验证证据
  - 备注: 包含损坏任务目录与隔离环境 `verify --strict` 结果
- **`.legion/tasks/drop-ledger-config-from-cli/docs/review-code.md`** [completed]
  - 作用: 代码正确性与范围合规审查
  - 备注: 首轮 blocking 已修复，结论更新为 PASS

---

## 关键决策

| 决策 | 原因 | 替代方案 | 日期 |
|------|------|----------|------|
| 将本任务定为 Medium 风险 | 涉及 CLI 行为与 schema 收敛，属于公共接口调整 | 视为 Low 风险直接修改 | 2026-04-23 |
| 不引入新的全局状态文件替代 config.json | 避免删旧文件后又长出新的平行真源 | 改用 `state.json` / `current-task.txt` | 2026-04-23 |
| 单任务命令统一改为显式 task-id | 去掉隐式 active task，提升可重放性与可预测性 | 继续保留 currentTask 注册表 | 2026-04-23 |
| 已删除命令统一返回 `UNSUPPORTED_COMMAND` | 固定 breaking change 语义，避免实现与文档漂移 | 报 generic unsupported / 随机错误文案 | 2026-04-23 |

---

## 快速交接

**下次继续从这里开始：**
1. 如需继续收敛 CLI，可补更细粒度的自动化回归，覆盖 `log/tasks/plan/review/dashboard` 全部显式 task-id 路径。
2. 如需对外发布 breaking change，直接复用 `docs/pr-body.md` 与 `docs/report-walkthrough.md`。

**注意事项：**
- 不要为了保留 active task 语义再引入新的隐藏全局状态文件。
- 文档与实现需要同次更新。
- playbook schema 目前定义在 `skills/legion-docs/references/REF_SCHEMAS.md` 第 7 节；`legion-docs/SKILL.md` 负责落点约束。

---

*最后更新: 2026-04-23 01:00 by Legion orchestrator*
