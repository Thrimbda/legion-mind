# 任务清单

## 当前状态

- Phase: execution
- Overall status: in progress

## Checklist

- [x] 创建 worktree
- [x] 物化 task contract
- [x] 执行 Stage 0 本地基线
- [x] 检查 Stage 1 sandbox resources / secrets
- [x] 执行或阻塞 Stage 2 Linear live scan
- [x] 执行 Stage 3 fixture dispatch baseline
- [x] 执行或阻塞 Stage 4 GitHub PR tracking
- [x] 执行或阻塞 Stage 5 worker E2E
- [x] 写入 acceptance evidence
- [x] 写入 test-report
- [x] 完成 review-change
- [x] 生成 walkthrough / PR body
- [x] 完成 wiki writeback
- [ ] 完成 PR lifecycle

## Planned Commands

- `npm --prefix scheduler test`
- `npm --prefix scheduler run health -- --db :memory:`
- `npm --prefix scheduler run debug -- scan fixture --fixture tests/fixtures/project.json --db :memory:`
- `npm --prefix scheduler run debug -- dispatch fixture --fixture tests/fixtures/project.json --db .cache/linear-scheduler/acceptance-fixture.sqlite --parallel-repos legion-mind --global-concurrency 4 --per-repo-concurrency 4`
- Conditional: `sops exec-env secrets/linear-scheduler.sops.yaml 'npm --prefix scheduler run debug -- scan project --project "$LINEAR_PROJECT_ID" --db "$SCHEDULER_DB" --delegate "$LINEAR_DELEGATE_APP_USER_ID" --scheduler-run-url-base "$SCHEDULER_RUN_URL_BASE"'`
- Conditional: `sops exec-env secrets/linear-scheduler.sops.yaml 'npm --prefix scheduler run debug -- delivery track --run "$SCHEDULER_RUN_ID" --repo "$SCHEDULER_REPO_PATH" --pr-url "$GITHUB_OPEN_PR_URL" --db "$SCHEDULER_DB"'`
- Conditional: `sops exec-env secrets/linear-scheduler.sops.yaml 'npm --prefix scheduler run debug -- worker dispatch --run "$SCHEDULER_RUN_ID" --attempt "$SCHEDULER_ATTEMPT_ID" --repo "$SCHEDULER_REPO_PATH" --db "$SCHEDULER_DB" --timeout-ms 3600000'`
