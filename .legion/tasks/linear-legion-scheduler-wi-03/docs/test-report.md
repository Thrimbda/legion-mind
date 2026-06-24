# Test Report: Linear Scheduler WI-03

## 结论

PASS。WI-03 scanner 的核心验收面已有自动化覆盖：Linear GraphQL pagination snapshot adapter、`blocker -> blocked` graph、cycle path、terminal blocker policy、ready/skipped report、snapshot persistence、dry-run fixture CLI、WI-02 core regression、root regression 与 packaging smoke 均通过。

## 验证选择理由

- `npm --prefix scheduler test` 是最直接的验证面：它运行 scheduler 独立 npm project 内的 core + scanner tests，覆盖本次新增代码路径。
- `npm --prefix scheduler run health -- --db :memory:` 证明新增 CLI 仍能打开 SQLite store、执行 migration 并报告核心表健康状态。
- `npm run test:regression` 证明 root `lgmind` 既有 regression surface 未被 scheduler project 改动破坏。
- `npm run pack:dry-run` 证明 root npm package 发布边界仍未把 `scheduler/` 误打包进 `lgmind` artifact。
- `git diff --check` 捕获 whitespace / conflict marker 等基础提交质量问题。

## 已执行命令

### 1. Scheduler tests

```bash
npm --prefix scheduler test
```

结果：PASS。

关键输出：

```text
✔ dependency graph uses blocker -> blocked direction and reports cycle paths
✔ Linear GraphQL client fetches project issues with Relay pagination and relation normalization
✔ blocker satisfaction uses scheduler terminal policy before Linear Done fallback
✔ scanner emits ready list, required skipped reasons and persists work item snapshots
✔ scan fixture CLI prints dry-run report without Linear write side effects
...
ℹ tests 17
ℹ pass 17
ℹ fail 0
```

### 2. Scheduler health smoke

```bash
npm --prefix scheduler run health -- --db :memory:
```

结果：PASS。

关键输出：

```json
{
  "ok": true,
  "dbPath": ":memory:",
  "tables": [
    "native_outbox",
    "resource_locks",
    "run_attempts",
    "runs",
    "scheduler_events",
    "webhook_events",
    "work_item_snapshots"
  ],
  "activeRuns": 0,
  "pendingOutbox": 0
}
```

### 3. Root regression

```bash
npm run test:regression
```

结果：PASS。

关键输出：

```text
ℹ tests 18
ℹ pass 18
ℹ fail 0
```

### 4. Root package dry-run

```bash
npm run pack:dry-run
```

结果：PASS。

关键输出：

```text
"name": "lgmind",
"version": "0.3.1",
"entryCount": 62,
"bundled": []
```

说明：dry-run package file list 仍只包含 root `lgmind` CLI / skills / setup assets；未包含 `scheduler/` runtime project。

### 5. Diff whitespace check

```bash
git diff --check
```

结果：PASS（无输出）。

## 覆盖的验收标准

- 指定 Linear project snapshot 拉取：mock GraphQL server 验证 Relay `first` / `after` / `pageInfo` pagination、labels/state/project/relation normalization。
- DAG 构建：`blocker -> blocked` outgoing / incoming edge 测试覆盖。
- Cycle detection：双节点 cycle 输出 `path` 测试覆盖。
- Terminal blocker policy：manual done、scheduler-run success with delivery/evidence gates、terminal non-success、inconsistent terminal state 测试覆盖。
- Ready / skipped report：required skipped reasons 与 ready native preview 测试覆盖。
- No Linear write side effect：CLI fixture scan 使用 repo-local fixture 和 SQLite DB，只输出 report；实现中 `scan project` 只执行 GraphQL query，不调用 mutation。
- `work_item_snapshots` persistence：scanner test 断言 snapshot row 写入。

## 跳过 / 未执行项

- 未对真实 Linear project 执行 `scan project`：当前验证环境没有提供 repo-local `LINEAR_API_KEY` / 专用测试 project。该风险由 mock GraphQL pagination test 与 Linear MCP 读取 `0XC-57` contract 共同降低；上线到真实项目前仍建议用只读 API key 对测试 project 运行一次 dry-run。

## 残余风险

- Linear issue relation GraphQL field shape 若未来变化，`scheduler/src/scanner.ts` 的 adapter 可能需要更新；测试已把当前假设固定在 fixture / mock server 中。
- Scanner 目前只做 dry-run ready calculation；claim-time revalidation 和真实 worker dispatch 仍属于后续 WI。
