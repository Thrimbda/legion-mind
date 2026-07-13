# verify-change-witty-koala 验证输出记录

记录日期：2026-07-13

本文件保存本轮独立验证的可重算命令、结果摘要与固定路径直接反例。逐测试名称可由相同命令重新执行获得；本轮没有修改产品代码、测试或核心任务文档。

## 1. 定向报告、scheduler、attention 与权限回归

```text
$ node --test --experimental-strip-types --experimental-sqlite scheduler/tests/linear-worker-runner.test.ts tests/regression/attention-verification-protocol.test.ts tests/regression/report-walkthrough-permissions.test.ts tests/regression/token-cognitive-efficiency.test.ts
exit code: 0
tests 36
suites 0
pass 36
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 1812.57275
```

其中与上一轮阻断直接对应的自动回归包括：

- renderer 合法普通文件通过；repo root 由 symlink 访问时合法普通文件仍通过。
- renderer 拒绝跨 task 与仓库外的阶段文件 symlink，也拒绝跨 task 与仓库外的 `report-data.json` symlink。
- scheduler 拒绝跨 task、仓库外和同 task 其他文件的固定证据 symlink。
- 严格当前 Verdict、无 verifier、DEFERRED、OpenCode 精确权限、强制阶段派生与五字段交接回归均通过。

## 2. 根回归

```text
$ npm run test:regression
exit code: 0
npm warn Unknown env config "tmp". This will stop working in the next major version of npm.
tests 40
suites 0
pass 40
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 6910.277166
```

## 3. scheduler 全量测试

```text
$ npm --prefix scheduler test
exit code: 0
npm warn Unknown env config "tmp". This will stop working in the next major version of npm.
tests 59
suites 0
pass 59
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 1507.161417
```

## 4. 上下文预算审计

```text
$ npm run audit:context
exit code: 0
baselineRevision: 5359115
hot.baseline: 70581
hot.current: 24715
hot.budget: 42000
hot.reductionPercent: 64.98
mediumClosure.baseline: 96146
mediumClosure.current: 35901
mediumClosure.budget: 59000
mediumClosure.reductionPercent: 62.66
unbudgetedRequiredReferences: []
failures: []
```

## 5. 发布包 dry-run

```text
$ npm run pack:dry-run
exit code: 0
package: lgmind@0.3.1
entryCount: 69
prepack build: PASS
```

关键新增运行文件均进入发布包：

- `skills/report-walkthrough/scripts/current-verdict.mjs`
- `skills/report-walkthrough/scripts/report-data-validation.mjs`
- `skills/report-walkthrough/references/report-data.schema.json`
- `skills/report-walkthrough/scripts/render-report.mjs`
- `skills/report-walkthrough/templates/report-walkthrough.html`

## 6. scheduler 全部固定 evidence 的 symlink 直接矩阵

执行 Node 诊断，使用 `writeEvidenceFixture()` 生成合法高风险且 PR-backed 的完整证据；先验证正常目录，再逐一把每个规范 evidence 文件替换为同目录其他文件的 symlink，并调用 `verifyLegionEvidence()`。

```text
exit code: 0
normal: true
fixed evidence rejected with exact-binding failure:
  plan: true
  tasks: true
  log: true
  rfc: true
  reviewRfc: true
  testReport: true
  reviewChange: true
  reportData: true
  report: true
  wiki: true
  lifecycle: true
crossTask.rejected: true
crossTask.exactBindingFailure: true
outsideRepo.rejected: true
outsideRepo.exactBindingFailure: true
directorySymlink.rejected: true
directorySymlink.exactBindingFailure: true
repoRootSymlinkPositive: true
```

这证明共享 `resolveExactRepoFile()` 已覆盖 scheduler 当前运行模式下的全部固定 evidence，而不只覆盖 `reportData` 或阶段 Verdict 文档。

## 7. renderer 固定路径直接矩阵

执行 Node 诊断，在仓库内建立临时合法 task，直接调用 `render-report.mjs --check`，每个场景完成后恢复并清理 fixture。

```text
exit code: 0
normal: true
repoRootSymlinkPositive: true
sameTaskRedirect.rejected: true
sameTaskRedirect.exactBindingFailure: true
crossTask.rejected: true
crossTask.exactBindingFailure: true
outsideRepo.rejected: true
outsideRepo.exactBindingFailure: true
directorySymlink.rejected: true
directorySymlink.exactBindingFailure: true
crossTaskReportData.rejected: true
crossTaskReportData.exactBindingFailure: true
outsideReportData.rejected: true
outsideReportData.exactBindingFailure: true
absoluteInput.rejected: true
absoluteInput.repoRelativeFailure: true
```

## 8. worker 必需结果块与最终 evidence gate 可达性

执行 Node 诊断，调用 `renderOpenCodePrompt()` 并解析 `LEGION_WORKER_RESULT_START/END` 中的 JSON；再以同一 task 的合法高风险 fixture 调用 `verifyLegionEvidence()`，最后只删除 `legionEvidence.reportData` 重验。

```json
{
  "promptReportData": ".legion/tasks/verify-worker-reportdata-reachability/docs/report-data.json",
  "expected": ".legion/tasks/verify-worker-reportdata-reachability/docs/report-data.json",
  "completeOk": true,
  "missingReportData": {
    "ok": false,
    "failureType": "legion_evidence_missing",
    "missing": [
      "docs/report-data.json"
    ]
  }
}
```

## 9. diff 与范围检查

```text
$ git diff --check
exit code: 0
stdout: <empty>
stderr: <empty>
```

人工逐项复核 `git diff --name-only origin/master` 与未跟踪文件：产品与测试改动只位于批准范围 `skills/report-walkthrough/**`、`skills/verify-change/**`、`skills/legion-workflow/**`、`scheduler/src/worker-runner.ts`、`scheduler/tests/**`、`.opencode/agents/report-walkthrough.md` 与 `tests/regression/**`；其余新增文件均为当前 task 证据。新增或改写的人类可读自然语言为中文，命令、路径、协议枚举、代码标识和既有英文机器合同保持原文。

## 10. 已知环境输出

- npm 命令均提示 `Unknown env config "tmp"`，但所有命令 exit code 均为 `0`；这是未来 npm 主版本兼容警告，不是本次改动失败。
- `resolveExactRepoFile()` 明确记录普通文件系统无法消除检查完成后的 TOCTOU；本轮验证证明静态 symlink、目录 symlink 和固定 locator 重定向均 fail-closed，不把该结果扩大为对恶意并发文件替换的密码学保证。
