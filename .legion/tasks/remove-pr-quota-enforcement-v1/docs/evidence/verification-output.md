# 返修后独立验证原始输出摘录

- verifier：`verify-change-lucky-lemur`
- 工作区：`/Users/c1/Work/legion-mind/.worktrees/remove-pr-quota-enforcement-v1`
- 验证对象：`remove-pr-quota-enforcement-v1`
- 历史 blocker：`.legion/tasks/remove-pr-quota-enforcement-v1/docs/review-change.md`

## 完整 diff 与历史边界

执行：

```text
git status --short
git diff --stat
git diff --name-status
git diff --unified=2
git diff --name-only -- .legion/tasks/enforce-single-pr-lifecycle-v1
test ! -e scheduler/src/pr-identity.ts
```

结果：

```text
exit 0
historical raw task diff: empty
pr-identity.ts: absent
```

验证者逐段审视了全部 tracked diff，并读取全部 untracked task docs、当前 Wiki task summary 与 `tests/regression/no-auto-closeout-pr.test.ts`。`npm run pack:dry-run` 后 `git status --short` 未出现额外生成文件。

## 首轮 blocker 定向测试

命令：

```text
node --experimental-strip-types --test \
  scheduler/tests/linear-worker-runner.test.ts \
  scheduler/tests/linear-scheduler-core.test.ts \
  scheduler/tests/linear-pr-tracker.test.ts \
  tests/regression/no-auto-closeout-pr.test.ts
```

退出码：`0`

关键输出：

```text
✔ legacy task PR binding schema is preserved but ignored by current runtime
✔ fresh database omits task PR binding schema and retired migrations
✔ worker result parser extracts result block and rejects malformed output
✔ tracker treats PR identity as run-level metadata and accepts an authorized follow-up URL
✔ existing run-level PR metadata does not block an explicitly authorized follow-up PR
✔ a later run for the same task may track a different explicitly authorized PR
✔ historical non-success PR metadata does not create a cross-run worker gate
✔ current policy has no task-level PR quota or permanent identity gate
✔ terminal facts are external and cannot autonomously create a status-only PR
✔ Scheduler uses run-level PR metadata and keeps direct lifecycle observation
ℹ tests 44
ℹ pass 44
ℹ fail 0
```

## Worker result 输入反例

方法：直接调用 `parseWorkerResultBlock()`，分别输入 malformed `prUrl`、`externalUrls: [null]`、错误字段类型，并提供一个合法对照。

退出码：`0`

原始输出：

```json
{"rejected":[{"name":"malformed-pr-url","rejected":true,"message":"Worker result prUrl must be a supported HTTPS pull request URL."},{"name":"null-external-entry","rejected":true,"message":"Worker result externalUrls entries must contain string label and url fields."},{"name":"typed-external-entry","rejected":true,"message":"Worker result externalUrls entries must contain string label and url fields."}],"validPrUrl":"https://github.com/example/repo/pull/22","validExternalUrls":[{"label":"GitHub PR","url":"https://github.com/example/repo/pull/22"}]}
```

对应实现/测试：

```text
scheduler/src/worker-runner.ts:326
scheduler/src/worker-runner.ts:350
scheduler/tests/linear-worker-runner.test.ts:132
```

## Terminal same-issue 反例

方法：内存 SQLite 中创建 run，转为 `failed / legion_evidence_missing`，再用仍含 `agent:ready` 的同一 Linear issue 调用 `scanLinearProject()`。

退出码：`0`

原始输出：

```json
{"ready":[],"skipped":[{"identifier":"WI-TERMINAL-NO-CLOSEOUT","reason":"already_terminal"}]}
```

对应实现：`scheduler/src/scanner.ts:489`

## 当前规范与 runtime 负向扫描

扫描范围：22 个 current policy files，包括入口规则、README、workflow/worktree/docs/wiki/report skills、Scheduler RFC/执行文档与 WI-04/WI-05 contracts。历史 raw task evidence 与 append-only Wiki log 不作为 current policy。

旧规范精确表达扫描：

```text
0..1
PR 配额 / PR cardinality
terminal PR binding
task binding is conflicted
Legacy identity backfill
same PR as open can re-enable
compareAndBindTaskPr
pr_identity_conflict
```

结果：

```text
old retained rule hits: 0
runtime forbidden symbol hits: 0
prIdentityFileExists: false
explicitAuthorization: true
newPrAllowed: true
```

更宽的词面扫描只命中：

```text
docs/linear-legion-scheduler/worker-runner.md:87
there is no task-level compare-and-bind or cross-run PR gate

docs/linear-legion-scheduler/worker-runner.md:103
does not add a task-level binding or cross-run dispatch gate
```

这两处均是显式否定旧 gate，不是规范保留。首轮 review 指出的旧 affirmative binding/backfill/same-PR recovery 文本已不存在。

## Scheduler 全量测试

命令：

```text
npm --prefix scheduler test
```

退出码：`0`

关键输出：

```text
✔ direct lifecycle observer proves cleanup, refresh, and merge ancestry from Git
✔ direct lifecycle observer blocks registered or remaining task worktree
✔ direct lifecycle observer blocks fetch, branch, dirty refresh, remote-base, and ancestry gaps
✔ scanner emits ready list, required skipped reasons and persists work item snapshots
✔ checks failure and review changes requested block run without downstream unlock
✔ merged PR reaches done only after evidence and lifecycle verifier pass
✔ merged PR with missing repo evidence is terminal non-success while lifecycle gaps remain externally retryable
✔ legacy task PR binding schema is preserved but ignored by current runtime
✔ fresh database omits task PR binding schema and retired migrations
✔ worker result parser extracts result block and rejects malformed output
✔ existing run-level PR metadata does not block an explicitly authorized follow-up PR
✔ a later run for the same task may track a different explicitly authorized PR
✔ historical non-success PR metadata does not create a cross-run worker gate
ℹ tests 70
ℹ pass 70
ℹ fail 0
ℹ skipped 0
```

## Root regression

命令：

```text
npm run test:regression
```

退出码：`0`

关键输出：

```text
✔ current policy has no task-level PR quota or permanent identity gate
✔ terminal facts are external and cannot autonomously create a status-only PR
✔ Scheduler uses run-level PR metadata and keeps direct lifecycle observation
✔ current Wiki truth supersedes the historical quota decision
ℹ tests 48
ℹ pass 48
ℹ fail 0
ℹ skipped 0
```

## Context audit

命令：

```text
npm run audit:context
```

退出码：`0`

关键输出：

```json
{
  "hot": {
    "current": 26917,
    "budget": 42000
  },
  "mediumClosure": {
    "current": 38239,
    "budget": 59000
  },
  "unbudgetedRequiredReferences": [],
  "failures": []
}
```

## Package dry-run

命令：

```text
npm run pack:dry-run
```

退出码：`0`

关键输出：

```json
{
  "id": "lgmind@0.5.0",
  "size": 109001,
  "unpackedSize": 366070,
  "shasum": "bc6d34dec53972386a2ad7e036577ec610d60e01",
  "filename": "lgmind-0.5.0.tgz",
  "entryCount": 64,
  "bundled": []
}
```

## Diff hygiene

命令：

```text
git diff --check
```

退出码：`0`

原始输出：无。

## 非阻塞环境提示

涉及 npm 的命令均出现：

```text
npm warn Unknown env config "tmp". This will stop working in the next major version of npm.
```

所有命令 exit code 为 `0`；该 warning 未改变验证结果，也不来自本任务 diff。
