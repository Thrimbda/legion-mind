# harden-strict-verify-integrity

## 任务摘要

- 目标：修复 `scripts/setup-opencode.ts verify --strict` 只检查文件存在的问题，使其能检测安装资产内容损坏、unmanaged conflict、manifest missing/invalid、symlink drift 与 rollback false positive。
- 风险级别：Medium；安装/校验路径是公开本地验收面，但改动可回滚且限定在单个脚本。
- 生产代码范围：`scripts/setup-opencode.ts`。

## 当前结论

- `verify --strict` 应校验完整 expected sync item 集合，而不是只校验少量 required file presence。
- strict 通过条件是：目标等于当前源期望状态，并且 manifest 证明该 target 由 installer 管理。
- legacy same-content 安装可由普通 `install` 通过 `OK_ADOPT` 补写 managed ownership；内容不同的 unmanaged 冲突仍需 `install --force` 接管。
- rollback 后不应无条件通过；若恢复 unmanaged 或旧内容，strict verify 必须失败并给出稳定错误码。

## 证据入口

- Plan：`.legion/tasks/harden-strict-verify-integrity/plan.md`
- RFC：`.legion/tasks/harden-strict-verify-integrity/docs/rfc.md`
- RFC Review：`.legion/tasks/harden-strict-verify-integrity/docs/review-rfc.md`
- Test Report：`.legion/tasks/harden-strict-verify-integrity/docs/test-report.md`
- Change Review：`.legion/tasks/harden-strict-verify-integrity/docs/review-change.md`
- Walkthrough：`.legion/tasks/harden-strict-verify-integrity/docs/report-walkthrough.md`
- PR Body：`.legion/tasks/harden-strict-verify-integrity/docs/pr-body.md`

## 后续注意

- 不要把 npm pack 发布边界问题混入本任务；那是独立发布面修复。
- 若未来要强化 manifest 自一致性，可单独要求 `record.targetPath === manifest key` 并补对应测试。
