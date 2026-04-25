# Reviewer Walkthrough

## 目标与范围

- 目标：让 Legion CLI 停止依赖 `.legion/config.json` 与 `.legion/ledger.csv`，回到基于任务目录与显式 `--task-id` 的薄工具层。
- Scope：
  - `skills/legion-workflow/scripts/**`
  - `skills/legion-workflow/references/**`
  - `skills/legion-docs/references/**`
  - `docs/**`
  - `README.md`

## 设计摘要

- 设计来源：[`docs/rfc.md`](./rfc.md)
- 核心决策：
  - 任务发现改为扫描 `.legion/tasks/*`
  - 单任务命令必须显式提供 `--task-id` / `taskId`
  - 删除 proposal/approval、task switch/archive、ledger query 等旧命令面
  - 让 CLI 描述与 README / reference 文档重新对齐

## 改动清单

### 1. CLI 实现
- `skills/legion-workflow/scripts/lib/cli.ts`
  - 去掉 config/ledger 初始化、读写与隐式 active task 依赖
  - 统一为文件系统任务发现与按需文件校验
  - 已删除命令改为稳定返回 `UNSUPPORTED_COMMAND`
- `skills/legion-workflow/scripts/legion.ts`
  - 收敛命令面，移除 proposal / switch / archive / ledger 相关入口

### 2. 参考文档与使用说明
- `skills/legion-workflow/references/**`
  - 更新 CLI 能力描述，改为显式 task-id 与文件系统驱动模型
- `skills/legion-docs/references/**`
  - 清理对 active task / ledger 旧叙事的依赖
- `README.md`
  - 同步新的 CLI 主干与 breaking change
- `docs/**`
  - 更新与 CLI 使用方式相关的叙述

### 3. 任务交付物
- `docs/review-rfc.md`：RFC 已通过，确认方案可实现、可验证、可回滚
- `docs/review-code.md`：代码审查 PASS，仅剩非阻塞收敛建议
- `docs/test-report.md`：主干验证 PASS

## 如何验证

- 详细结果见 [`docs/test-report.md`](./test-report.md)
- 已执行命令：
  - `node --experimental-strip-types "skills/legion-workflow/scripts/legion.ts" task list --format json`
  - `node --experimental-strip-types "skills/legion-workflow/scripts/legion.ts" status --task-id drop-ledger-config-from-cli --format json`
  - `node --experimental-strip-types "skills/legion-workflow/scripts/legion.ts" ledger query`
  - 损坏任务目录用例：`task list` 返回 `TASK_CORRUPTED`
  - `node "scripts/setup-opencode.ts" install ... && node "scripts/setup-opencode.ts" verify --strict ...`
- 预期：
  - `task list` 与 `status --task-id` 成功
  - 已删除命令 `ledger query` 返回 `UNSUPPORTED_COMMAND`
  - 缺少必要文件的任务目录返回 `TASK_CORRUPTED`
  - `verify --strict` 通过（允许可选 MCP 提示）

## 风险与回滚

- 风险：
  - 仍有外部调用链依赖旧命令或隐式 active task
  - CLI 契约已发生 breaking change，调用方需要显式传 `taskId`
  - 代码审查指出仍有少量重复校验/死代码残留，虽不阻塞但可能增加后续维护噪音
- 回滚：
  - 直接回滚本次提交，恢复旧 CLI 与旧文档
  - 详见 RFC 回滚章节：[`docs/rfc.md`](./rfc.md)
  - 若新 CLI `init` 后仓库中没有旧文件，回退旧版时需补最小 `config.json` / `ledger.csv` stub

## 未决项与下一步

- 未决项：无阻塞未决项
- 下一步：
  - reviewer 重点确认 breaking change 与文档收敛是否符合预期
  - 如需进一步收敛，可后续清理 failure audit 残留并抽取统一文件校验辅助函数
