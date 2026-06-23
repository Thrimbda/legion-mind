# Test Report：Linear Native Agent RFC amendment

## Verdict

**PASS**

## 验证目标

本任务只修改文档与 Legion task evidence。验证重点不是运行代码回归，而是证明：

- Markdown diff 没有 whitespace / conflict-marker 类问题。
- 旧的 “PR merged 或 abandoned 都可 Done” 表述没有出现在本次设计产物中。
- 新的关键门禁术语在主 RFC、task RFC 和 WI 文档中出现并互相对齐。
- Legion task 目录可被 CLI 正常读取。

## 执行命令

### 1. Diff whitespace 与关键术语检查

```bash
git diff --check && if rg -n "PR merged, or closed / confirmed abandon[e]d|closed / confirmed abandon[e]d with reason|closed / confirmed abandon[e]d" "docs/linear-legion-scheduler" ".legion/tasks/amend-linear-native-scheduler-rfc/docs"; then exit 1; else true; fi && rg -n "run_terminal_success|run_terminal_non_success|lifecycle_blocked|native_outbox|snapshot revalidation" "docs/linear-legion-scheduler" ".legion/tasks/amend-linear-native-scheduler-rfc/docs" && for f in "docs/linear-legion-scheduler/work-items/WI-01-linear-wi-contract.md" "docs/linear-legion-scheduler/work-items/WI-02-scheduler-core-state.md" "docs/linear-legion-scheduler/work-items/WI-03-linear-graph-scanner.md" "docs/linear-legion-scheduler/work-items/WI-04-legion-worker-runner.md" "docs/linear-legion-scheduler/work-items/WI-05-delivery-pr-writeback.md" "docs/linear-legion-scheduler/work-items/WI-06-parallel-dispatch-locks.md" "docs/linear-legion-scheduler/work-items/WI-07-webhooks-retry-recovery.md" "docs/linear-legion-scheduler/work-items/WI-08-operations-security.md"; do rg -q "AgentSession|native|terminal|lifecycle|snapshot|PermissionChange|waiting" "$f"; done
```

Result: **PASS**

Evidence:

- `git diff --check` 通过。
- 禁止旧表述的 `rg` 没有命中。
- 关键术语命中包括：
  - `run_terminal_success` / `run_terminal_non_success`
  - `lifecycle_blocked`
  - `native_outbox`
  - `snapshot revalidation`
- 8 个 WI 文档均命中新 native / terminal / lifecycle / snapshot / permission / waiting 相关要求之一。

### 2. Legion task status

```bash
node --experimental-strip-types skills/legion-workflow/scripts/legion.ts status --cwd . --format json --task-id amend-linear-native-scheduler-rfc
```

Result: **PASS**

Output summary:

```json
{
  "success": true,
  "data": {
    "taskId": "amend-linear-native-scheduler-rfc",
    "name": "Amend Linear scheduler RFC with native agent gates",
    "currentChecklistItem": "验证文档一致性与关键术语",
    "progress": { "completed": 3, "total": 7 },
    "path": ".legion/tasks/amend-linear-native-scheduler-rfc"
  }
}
```

### 3. Post-review and wiki revalidation

After `review-change` dependency fixes and `legion-wiki` writeback, the targeted validation was rerun against proposal docs, this task evidence, and changed wiki pages.

```bash
git diff --check && if rg -n "PR merged, or closed / confirmed abandon[e]d|closed / confirmed abandon[e]d with reason|closed / confirmed abandon[e]d" "docs/linear-legion-scheduler" ".legion/tasks/amend-linear-native-scheduler-rfc/docs" ".legion/wiki/tasks/amend-linear-native-scheduler-rfc.md" ".legion/wiki/tasks/linear-legion-scheduler-rfc.md" ".legion/wiki/patterns.md" ".legion/wiki/index.md" ".legion/wiki/log.md"; then exit 1; else true; fi && rg -n "run_terminal_success|run_terminal_non_success|lifecycle_blocked|native_outbox|snapshot revalidation" "docs/linear-legion-scheduler" ".legion/tasks/amend-linear-native-scheduler-rfc" ".legion/wiki/tasks/amend-linear-native-scheduler-rfc.md" ".legion/wiki/tasks/linear-legion-scheduler-rfc.md" ".legion/wiki/patterns.md" ".legion/wiki/index.md" ".legion/wiki/log.md"
```

Result: **PASS**

## 未执行项

- 未运行 `npm run test:regression`：本任务不修改 runtime code、CLI、install scripts 或 tests。对 docs-only RFC amendment，更强的验证是 targeted wording / gate consistency check 与 `review-rfc` PASS。

## 结论

当前文档改动通过 targeted verification。可以进入 `review-change`。
