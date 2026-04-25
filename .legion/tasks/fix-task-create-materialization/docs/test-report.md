# Test Report: fix-task-create-materialization

## Scope

Focused validation for `skills/legion-workflow/scripts/lib/cli.ts` task materialization on the normal success path.

## Chosen commands

Reason: this change is localized to CLI task creation, so the lowest-cost credible proof is a real isolated repo smoke run that exercises `init -> task create -> status -> task list`, then inspects the created task roots directly.

```bash
TMP_REPO=$(mktemp -d "/tmp/legion-cli-verify.XXXXXX") && CMD=(node --experimental-strip-types "/Users/c1/Work/legion-mind/skills/legion-workflow/scripts/legion.ts") && "${CMD[@]}" init --cwd "$TMP_REPO" --format json && for TASK_ID in verify-smoke-a verify-smoke-b verify-smoke-c; do JSON=$(node -e 'const taskId=process.argv[1]; process.stdout.write(JSON.stringify({taskId,name:"Verify "+taskId,goal:"Validate task bootstrap reliability",problem:"Need focused verification for staging-based task create",acceptance:["task create returns a fully materialized task root"],assumptions:["CLI runs in isolated temp repo"],constraints:["focused validation only"],risks:["No cheap failure injection in this run"],points:["Immediate status/list smoke"],scope:["skills/legion-workflow/scripts/lib/cli.ts"],designIndex:"design-lite in verification",designSummary:["Create task then immediately read it."],phases:[{name:"Smoke",tasks:[{description:"Run create/status/list validation",acceptance:"Commands succeed immediately"}]}]}));' "$TASK_ID") && "${CMD[@]}" task create --cwd "$TMP_REPO" --format json --json "$JSON" && "${CMD[@]}" status --cwd "$TMP_REPO" --format json --task-id "$TASK_ID"; done && "${CMD[@]}" task list --cwd "$TMP_REPO" --format json && node -e 'const fs=require("fs"); const path=require("path"); const repo=process.argv[1]; const tasksRoot=path.join(repo,".legion","tasks"); const taskIds=["verify-smoke-a","verify-smoke-b","verify-smoke-c"]; const required=["docs","plan.md","log.md","tasks.md"]; const report=taskIds.map((taskId)=>{ const root=path.join(tasksRoot,taskId); const present=fs.readdirSync(root).sort(); const missing=required.filter((name)=>!fs.existsSync(path.join(root,name))); return {taskId,present,missing}; }); const staging=fs.readdirSync(tasksRoot).filter((name)=>name.startsWith(".tmp-")).sort(); console.log(JSON.stringify({repo,tasksRoot,report,staging},null,2)); if (report.some((entry)=>entry.missing.length) || staging.length) process.exit(1);' "$TMP_REPO"
```

## Results

- `init` succeeded in an isolated temp repo.
- `task create` succeeded for `verify-smoke-a`, `verify-smoke-b`, `verify-smoke-c`.
- `status --task-id <id>` worked immediately after each create.
- `task list` worked immediately and returned all three new tasks.
- Direct filesystem inspection showed each final task directory contained:
  - `docs/`
  - `plan.md`
  - `log.md`
  - `tasks.md`
- Direct filesystem inspection showed no `.tmp-*` directory remained under `.legion/tasks` after the success path.

## Evidence summary

Temp repo used: `/tmp/legion-cli-verify.IvgAI0`

Observed final task roots:

- `.legion/tasks/verify-smoke-a` → complete, no missing required entries
- `.legion/tasks/verify-smoke-b` → complete, no missing required entries
- `.legion/tasks/verify-smoke-c` → complete, no missing required entries

Observed staging leftovers:

- none

## Limits / residual risk

- I did **not** perform failure injection in this verification pass; there was no cheap, low-scope hook for forcing mid-write or final-rename failure without adding test-only implementation surface.
- So this report gives direct evidence for the normal success path and immediate readability guarantees, but not for interrupted-process or forced-rename-failure scenarios.
