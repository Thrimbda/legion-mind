# Code Review Report

## 结论
FAIL

## Blocking Issues
- [ ] `docs/task-brief.md:18` - 任务定义将 `docs/review-code.md`、`docs/report-walkthrough.md`、`docs/pr-body.md` 列为核心产物，但当前 `docs/` 目录中缺失这些文件。该状态不满足任务自身验收标准。
- [ ] `.opencode/commands/legion.md:31` - `/legion` 明确要求产出 `docs/review-code.md`，且 `.opencode/commands/legion.md:35` 要求 `docs/report-walkthrough.md` 与 `docs/pr-body.md`。当前仓库仅见 `docs/test-report.md`，与命令产物约定不一致，会导致交付闭环不完整。

## 建议（非阻塞）
- `docs/test-report.md:8` - 建议在验证步骤中增加“必需交付物存在性检查”（例如检查 `task-brief/test-report/review-code/report-walkthrough/pr-body` 是否都存在），减少文档流程漏项。
- `docs/legionmind-usage.md:61` - 已按模式区分交付物，建议补一条“最小闭环清单”一句话规则（按 Low/Medium/High/Heavy），便于执行时快速对照。
- `README.md:51` - Heavy 流程描述已较完整，建议补充“设计阶段 merge 后再进入实现并补齐 test/review-code”的显式提醒，降低新成员误读。

## 修复指导
1. 在仓库根 `docs/` 下补齐缺失产物文件：
   - `docs/review-code.md`
   - `docs/report-walkthrough.md`
   - `docs/pr-body.md`
2. 内容应与命令约定一致：
   - `docs/review-code.md`：记录结论（PASS/FAIL）、blocking 与修复建议；
   - `docs/report-walkthrough.md`：覆盖变更说明、验证结果、风险与回滚；
   - `docs/pr-body.md`：可直接用于 PR 的摘要、验证与风险说明。
3. 更新 `docs/test-report.md` 的验证步骤，增加“产物完整性检查”并在结果区给出明确 PASS/FAIL。
4. 复核 `docs/task-brief.md` 的验收条目与实际落盘文件一致后，再进行最终合入。
