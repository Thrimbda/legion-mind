# 新增 OpenClaw setup 脚本 - 上下文

## 会话进展 (2026-03-27)

### ✅ 已完成

- 已完成仓库内 setup/install 约定调研，并确认新脚本采用 scripts/setup-openclaw.ts + package.json 最小入口。


### 🟡 进行中

- 已新增 setup-openclaw.ts 并完成命令级验证，正在整理交付摘要。


### ⚠️ 阻塞/待定

(暂无)

---

## 关键文件

(暂无)

---

## 关键决策

| 决策 | 原因 | 替代方案 | 日期 |
|------|------|----------|------|
| 本任务按 Low 风险处理，采用 design-lite 而非完整 RFC。 | 仅新增本地 setup 脚本并可选接入 package.json，不涉及现有运行时逻辑、外部合约破坏或不可回滚变更。 | 若需引入新的外部依赖、修改长期文档或变更公开安装模型，再升级到 Medium 并补 RFC。 | 2026-03-27 |
| OpenClaw setup 仅管理 skills.load.extraDirs，不额外写入未知配置项。 | 仓库当前可复用资产主要是 skills/legionmind；最小接入更安全，也更符合“focused and practical”的要求。 | 同时初始化 workspace/AGENTS.md 或更多 OpenClaw 配置，但这会扩大假设面并增加误改用户环境的风险。 | 2026-03-27 |

---

## 快速交接

**下次继续从这里开始：**

1. 如需真实环境验证，可在本机 ~/.openclaw 目录上执行 npm run openclaw:install 与 npm run openclaw:verify。

**注意事项：**

- 已在临时目录完成 install + verify 验证，确认脚本会写入 openclaw.json 并检查 skills.load.extraDirs。
- 若用户已有带注释或 JSON5 特性的 openclaw.json，脚本会因无法安全按 JSON 重写而失败退出，需要手动整理后再运行。

---

*最后更新: 2026-03-27 13:37 by Claude*
