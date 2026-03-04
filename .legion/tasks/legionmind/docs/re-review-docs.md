# Code Review Report

## 结论
FAIL

## Blocking Issues
- [ ] `docs/legionmind-usage.md:63` - 实现模式的交付物清单与命令规范不一致：文档将 `docs/rfc.md` 标注为“可选（Medium/High 建议必需）”，且缺少 `docs/review-rfc.md`。但 `.opencode/commands/legion.md:24` 明确要求 Medium/High 任务“生成 RFC + review-rfc 收敛”。当前描述会让执行者在 Medium/High 场景下漏产 `review-rfc`，属于流程正确性阻塞。

## 建议（非阻塞）
- `README.md:22` - `/legion` 的说明可补一句“Medium/High 会自动进入 RFC + review-rfc 收敛”，与命令文档保持同粒度，降低误解。
- `docs/legionmind-usage.md:56` - 标签语义已列出，建议补充 `rfc:heavy`/`risk:high`/`epic` 的优先级示例（任一命中即切 Heavy），提升可操作性。
- `docs/legionmind-usage.md:85` - Heavy 阶段“不产出 test-report/review-code”的说明清晰，建议同时提示“进入实现阶段后必须补齐”，与执行闭环对齐。

## 修复指导
1. 在 `docs/legionmind-usage.md` 的“4.1 实现模式”中把 Medium/High 规则写成强约束：
   - 将 `docs/rfc.md` 从“可选”改为“Medium/High 必需”。
   - 新增 `docs/review-rfc.md`，标注“Medium/High 必需”。
2. 在同节末尾补一条一句话规则：
   - “当风险分级为 Medium/High 时，交付物至少包含 `task-brief + rfc + review-rfc + test-report + review-code + pr-body`（安全相关再加 `review-security`）。”
3. 可选同步 `README.md` 的 `/legion` 一行描述，避免入口文案与详细手册出现信息落差。
