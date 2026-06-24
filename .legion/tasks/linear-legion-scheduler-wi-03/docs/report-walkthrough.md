# Report Walkthrough

## Profile

implementation

## Reviewer Summary

- WI-03 交付了 `scheduler/` 内的 dry-run Linear graph scanner。
- Scanner 能读取 Linear project snapshot，构建 `blocker -> blocked` DAG，检测 cycle，输出 ready / skipped / cycles report。
- Ready item 包含 priority、locks、snapshotHash、linearUpdatedAt 与 native action preview。
- Scanner 只写 `work_item_snapshots` 和 stdout report，不 claim run、不启动 worker、不修改 Linear。
- Verification PASS，review-change PASS。
- PR lifecycle 尚未完成；本文件和 `pr-body.md` 只是 PR 创建输入，不代表 checks / review / merge 已完成。

## Scope

In scope:

- `scheduler/src/scanner.ts`：Linear GraphQL snapshot fetcher、dependency graph、cycle detection、eligibility、terminal blocker policy、ready/skipped report。
- `scheduler/src/cli.ts`：新增 `scan project` / `scan fixture` dry-run 命令。
- `scheduler/src/sqlite-store.ts`：新增 scanner 所需的只读查询 helpers 与 snapshot inspection。
- `scheduler/tests/linear-graph-scanner.test.ts`：新增 scanner 自动化覆盖。
- WI-03 docs / scheduler README / Legion evidence。

Out of scope:

- 不 claim run。
- 不启动 OpenCode worker。
- 不写回 Linear labels、comments、delegate、AgentSession 或 AgentActivities。
- 不实现 webhook server、PR tracker、parallel dispatcher 或 full admin CLI。

## Evidence Map

| Claim | Evidence | Status |
|---|---|---|
| Task contract 稳定且 scope 清楚 | `.legion/tasks/linear-legion-scheduler-wi-03/plan.md` | PASS |
| Scanner 实现 ready/skipped/cycles report | `scheduler/src/scanner.ts` | PASS |
| Dry-run CLI 可执行 | `scheduler/src/cli.ts` | PASS |
| GraphQL pagination / relation normalization 有测试 | `scheduler/tests/linear-graph-scanner.test.ts` | PASS |
| Terminal blocker policy 有测试 | `scheduler/tests/linear-graph-scanner.test.ts` | PASS |
| Snapshot persistence 有测试 | `scheduler/tests/linear-graph-scanner.test.ts` | PASS |
| 验证证据完整 | `docs/test-report.md` | PASS |
| Readiness review | `docs/review-change.md` | PASS |
| PR lifecycle | `git-worktree-pr` 后续阶段 | PENDING |
| Rendered HTML preview | `pr-html-render` 后续阶段 | PENDING |

## What Changed

1. 新增 `scheduler/src/scanner.ts`，将 Linear project snapshot 转成可解释的 scheduler dry-run report。
2. 新增 graph builder 和 cycle detector，固定 `blocker -> blocked` 方向。
3. 新增 typed skipped reason taxonomy，覆盖 WI-03 必需原因并补充 policy/debug 原因。
4. 新增 `isBlockerSatisfied()`：scheduler run truth 优先，manual Linear Done 只在无 run 且无 active agent labels 时作为 fallback。
5. 新增 native preview，描述未来 claim 会发生的 delegate / AgentSession / activity / externalUrls，但不执行 side effect。
6. 新增 CLI dry-run commands：`scan project` 和 `scan fixture`。
7. 更新 WI-03 delivery doc、scheduler README、work item checklist 和 Legion task evidence。

## Verification / Review Status

- `npm --prefix scheduler test` PASS，17 tests。
- `npm --prefix scheduler run health -- --db :memory:` PASS。
- `npm run test:regression` PASS，18 tests。
- `npm run pack:dry-run` PASS，root package artifact 未包含 `scheduler/` runtime project。
- `git diff --check` PASS。
- `review-change` PASS，无 blocking finding。Security lens 已覆盖 Linear token、GraphQL read path、fixture / DB path 与 native preview side-effect 边界。

## Risks and Limits

- 未对真实 Linear project 执行 `scan project`，因为环境未提供 repo-local `LINEAR_API_KEY` / 专用测试 project。上线前建议用只读 token 对测试 project 执行一次 dry-run。
- Linear relation GraphQL field shape 若漂移，需要在 `scanner.ts` adapter 和 mock GraphQL fixture 中同步更新。
- Scanner 只产出候选和 snapshot hash；claim-time revalidation、worker dispatch、PR tracking 和 webhook recovery 属于后续 WI。

## Reviewer Checklist

- [ ] Ready/skipped/cycles output 是否满足 WI-03 contract？
- [ ] `isBlockerSatisfied()` 是否坚持 Scheduler DB truth，不被 Linear Done 或 AgentSession state 绕过？
- [ ] Scanner 是否确实没有 Linear mutation / claim / worker side effect？
- [ ] Tests 是否覆盖 graph、cycle、skip reasons、terminal gate 和 CLI dry-run？
- [ ] Docs 是否清楚表达 WI-03 与后续 WI-04/WI-05/WI-06/WI-07 边界？

## Next Stage

- 将 `docs/report-walkthrough.html` 交给 `pr-html-render` 或在 PR 阶段记录 render blocker。
- 执行 `legion-wiki` writeback。
- 继续 `git-worktree-pr` lifecycle：commit、fetch+rebase、push、PR、auto-merge attempt、checks/review follow-up、cleanup、主工作区刷新。
