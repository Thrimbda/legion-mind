# 安全审查报告

## 结论
PASS WITH CHANGES

## 阻塞问题
- [ ] 无。

## 建议（非阻塞）
- `skills/legionmind/scripts/lib/cli.ts:661-684`：`ledger query` 已增加正整数与上限校验，但仍是整文件读入后过滤；ledger 持续增长时仍有 DoS/误判风险，建议后续改为流式读取或按尾部窗口读取。
- `skills/legionmind/scripts/lib/cli.ts:634-658`：`dashboard generate --output` 仍允许写到任意 repo 内路径；从 secure-by-default 看，建议默认限制到 `<taskRoot>/docs/`，超出时要求显式开关。
- `scripts/legionmind/check-no-default-mcp.ts`：扫描脚本的 allowlist/“历史兼容”跳过策略仍可能带来漏报；建议补充 fixture 级正反样例，降低回归误判。

## 修复确认
1. **路径/软链越界**：已修复。`createContext`、`ensureInitialized`、`taskRoot`、`writeTextAtomic`、`appendLedger` 统一走 `assertRepoControlledPath(...)`，会拒绝 repo 外真实路径和符号链接路径。
2. **`--json` 白名单与 review/status 校验**：已修复。未知字段继续报 `SCHEMA_INVALID`；`addFile.status` 与 `review status` 已收紧为枚举；自由文本已禁止换行与保留 Review/Response/Status 语法。
3. **ledger 审计泄漏/缺失**：已基本修复。成功路径改为记录字段摘要而非原始 payload；失败路径通过 `appendFailureAudit(...)` 追加错误码审计；`limit` 已加正整数和上限校验。
4. **危险默认操作**：文档已把 CLI 不可用时的直接落盘改为仅 orchestrator 可用的 break-glass，并明确“无 ledger 审计”，默认面更安全。

## 结论说明
本轮已确认上轮 3 个 security blocking 均已关闭；当前剩余问题主要是资源使用与 secure-by-default 加固项，不构成发布阻塞。
