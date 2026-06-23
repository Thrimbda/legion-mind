# Review Change：Linear Native Agent RFC amendment

## Verdict

**PASS**

## Scope Reviewed

- Proposal docs: `docs/linear-legion-scheduler/**`
- Task evidence: `.legion/tasks/amend-linear-native-scheduler-rfc/**`
- Prior gates: `docs/review-rfc.md`, `docs/test-report.md`

## Findings

### First pass: FAIL, fixed

第一轮 review-change 发现 WI-06 dependency 在总 RFC / index / WI 文档中不一致：主 RFC 已要求 WI-06 等待 WI-05，但 WI-06 自身仍只列 WI-02 / WI-03 / WI-04。

影响：实现者可能在 PR terminal tracking / lifecycle gate 尚未完成前推进 parallel dispatch / lock release。

修复：

- `docs/linear-legion-scheduler/work-items/WI-06-parallel-dispatch-locks.md` 改为依赖 WI-03、WI-04、WI-05。
- 明确 WI-02 通过 WI-03 / WI-04 间接前置。
- `docs/linear-legion-scheduler/index.md` 图示补充 WI-06 等待 WI-03 / WI-04 / WI-05。

### Final pass: PASS

- Scope 符合 task contract：只修正文档与任务证据，没有实现 scheduler runtime。
- Native Agent 层清晰：作为 presentation/control plane，不替代 Scheduler DB truth。
- Terminal semantics 清晰：`Done` / `run_terminal_success` 与 non-success 终态拆开，且包含 `git-worktree-pr` lifecycle completion。
- Snapshot revalidation、native outbox、stop/cancel、PermissionChange 都已落入 RFC 与对应 WI。
- OpenCode-only runtime 和 Legion hard gates 未被放宽。

## Security Lens

已应用 security lens，因为本任务涉及 auth / permission / session / webhook / control-plane 设计。

结论：未发现新增可利用 trust-boundary blocker。RFC 已把 app actor scopes、`app:assignable` / `app:mentionable`、PermissionChange、webhook raw body signature、native stop/cancel 与 data redaction 纳入后续 WI。

## Non-blocking Notes

- 后续如果同步已创建的 Linear issue descriptions，应以 PR merge 后的 repo docs 为真源，避免提前把未合并设计写入外部队列。
