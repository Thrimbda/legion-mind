# Tasks

## Current Status

- Phase: report review and closing
- Overall status: in progress

## Checklist

- [x] Confirm local prototype acceptance boundary with user
- [x] Create task contract and task-local docs directory
- [x] Inventory scheduler docs/code/test surfaces
- [x] Run full scheduler regression suite
- [x] Run representative CLI fixture/smoke commands
- [x] Build acceptance case matrix
- [x] Write detailed acceptance report
- [x] Review report for overclaiming / missing caveats
- [x] Generate reviewer walkthrough and PR body
- [x] Complete Legion wiki writeback
- [ ] Complete Legion closing evidence and PR lifecycle

## Verification Commands Planned

- `npm --prefix scheduler test`
- `npm --prefix scheduler run health -- --db :memory:`
- `npm --prefix scheduler run debug -- scan fixture --fixture <task-local project snapshot> --db <repo-local acceptance sqlite>`
- `npm --prefix scheduler run debug -- dispatch fixture --fixture <task-local project snapshot> --db <repo-local acceptance-dispatch sqlite> --parallel-repos legion-mind --global-concurrency 4 --per-repo-concurrency 4`

Additional targeted commands may be added if the source/test review identifies a credible local acceptance gap.

## Verification Commands Executed

- `npm --prefix scheduler test` — PASS, 57/57.
- `npm --prefix scheduler run health -- --db :memory:` — PASS.
- `npm --prefix scheduler run debug -- scan fixture --fixture <absolute task-local fixture> --db <absolute repo-local sqlite> --delegate linear-agent-app` — PASS after correcting path context.
- `npm --prefix scheduler run debug -- dispatch fixture --fixture <absolute task-local fixture> --db <absolute repo-local sqlite> --parallel-repos legion-mind --global-concurrency 4 --per-repo-concurrency 4` — PASS.
- `npm --prefix scheduler run debug -- runs list --db <acceptance-dispatch.sqlite>` — PASS.
- `npm --prefix scheduler run debug -- delivery track --run <run-id> --repo <worktree> --fixture <pr-open.json> --db <acceptance-dispatch.sqlite>` — PASS.
- `npm --prefix scheduler run debug -- project health project-linear-scheduler --db <acceptance-dispatch.sqlite>` — PASS.
