# Log: Linear WI-04 OpenCode Legion Worker Runner

## 2026-06-25

- 入口: 用户要求使用 Legion workflow 完成 Linear issue `0XC-58`。
- Linear context: issue `0XC-58` 为 High priority，labels 包含 `repo:legion-mind`、`risk:high`、`contract:stable`、`area:scheduler`、`work-item`；Design Source 指向 scheduler RFC 与 WI-04 doc。
- Dependency check: blocker `0XC-55` / WI-02 在 Linear 中为 `Done`。
- Workflow: 已加载 `legion-workflow`、`linear`、`brainstorm`、`legion-docs`、`git-worktree-pr`；无 explicit bypass。
- Envelope: 已从最新 `origin/master` 创建 worktree `.worktrees/linear-0xc-58/`，分支 `legion/linear-0xc-58-worker-runner`。
- Contract: 基于 Linear issue、RFC、WI-04 work item 与 WI-02/WI-03 handoff 物化 `plan.md` / `tasks.md`；taskId 采用本 WI 要求的确定性映射 `0XC-58` -> `linear-0xc-58`。
- Design gate: 风险 high；已有 approved design source 为 `docs/linear-legion-scheduler/rfc.md`、`docs/linear-legion-scheduler/work-items/WI-04-legion-worker-runner.md` 和 `.legion/tasks/linear-legion-scheduler-rfc/docs/review-rfc.md` PASS，因此执行模式判定为 approved-design continuation。
- Linear writeback: 已将 `0XC-58` 移至 `In Progress`；一次空字段 update 被立即用原 description / labels 恢复，当前 labels 保持 `repo:legion-mind`、`risk:high`、`contract:stable`、`area:scheduler`、`work-item`。
- Current OpenCode docs check: 使用 repo-local npm cache 调用 `ctx7`；当前 `/opencode-ai/opencode` CLI 支持 `opencode -p <prompt>` 非交互模式、`-f json`、`-q` quiet、`-c <dir>` working directory。实现应仍通过 adapter/fake tests 锁定，不假设 timeout/cancel 由 OpenCode 自身提供。
- Engineer: 新增 `scheduler/src/task-id.ts`，将 Linear identifier 确定性映射为 Legion taskId，并让 scanner / runner 共享映射。
- Engineer: 新增 `scheduler/src/worker-runner.ts`，实现 OpenCode prompt artifact、native startup outbox processor、OpenCode process launcher、heartbeat / timeout / cancel、result block parser、Legion evidence verifier 与 single dispatch executor。
- Engineer: 扩展 `scheduler/src/sqlite-store.ts`，新增 attempt lifecycle、heartbeat、native context、outbox retry/failure、run metadata 和 safe event APIs；扩展 dispatch outbox payload 保留 Linear context。
- Engineer: 扩展 `scheduler/src/cli.ts` 与 `scheduler/README.md`，新增 `worker dispatch` debug path；新增 `docs/linear-legion-scheduler/worker-runner.md` 并更新 index / WI-04 状态。
- Engineer check: `npm --prefix scheduler test` PASS（24 tests）。
- Verify: `npm --prefix scheduler test` PASS（24 tests），覆盖 WI-04 worker runner prompt、native outbox、fake OpenCode launch、result parser、evidence verifier 与 cancel / failure paths。
- Verify: `npm --prefix scheduler run health -- --db :memory:` PASS，DB migrations / debug health 正常。
- Verify: `npm run test:regression` PASS（18 tests）。
- Verify: `npm run pack:dry-run` PASS；root npm package file list 仍不包含 `scheduler/` prototype。
- Verify: `git diff --check` PASS。
- Verify artifact: 写入 `docs/test-report.md`；真实 OpenCode / Linear native API smoke 作为生产前残余，不属于本地自动验证。
- Review iteration 1: `review-change` 返回 FAIL（security lens）。Blocking: worker result / evidence verifier 过信 worker self-attestation；OpenCode launch 通过 argv / inherited env 泄露 prompt / secrets；timeout/cancel 只 SIGTERM 且不等待 hard stop；native startup ordering / failure handling 不够严格。已返回 Engineer 修复。
- Engineer fix: 加强 result block schema / identity 校验，要求 runId / attemptId / Linear identifier / taskId 匹配 DB；parser 拒绝多 result block；evidence path 必须 repo-relative 且匹配 task-local/wiki 预期路径。
- Engineer fix: PR lifecycle evidence 改为读取 `.legion/tasks/<task-id>/docs/git-worktree-lifecycle.json`，不信任 worker self-attested top-level booleans；review PASS 需要显式 Verdict。
- Engineer fix: OpenCode argv 只传 prompt artifact path 指令，prompt artifact 使用 owner-only mode；child env 使用 OpenCode/model provider allowlist，默认不继承 Linear/GitHub/scheduler secrets。
- Engineer fix: OpenCode launcher 使用 process group；timeout/cancel 先 TERM、grace 后 KILL，并等待 close 再记录 terminal attempt result。
- Engineer fix: native startup outbox 按 per-run prerequisite 顺序处理，前置 side effect 失败时后续 side effects 不执行；worker dispatch gate 检查所有 native startup rows 必须 `sent`。
- Verify after review fixes: `npm --prefix scheduler test` PASS（27 tests），新增覆盖 env sanitizer、multiple result block rejection、identity mismatch rejection、absolute/out-of-task evidence rejection、native startup prerequisite failure。
- Verify after review fixes: `npm --prefix scheduler run health -- --db :memory:` PASS；`npm run test:regression` PASS（18 tests）；`npm run pack:dry-run` PASS；`git diff --check` PASS。
- Review iteration 2: `review-change` 返回 FAIL。Blocking: worker dispatch 仍信任 mutable outbox payload 而非 DB identity；stop/cancel 后 pending native startup side effects 仍可能执行。已返回 Engineer 修复。
- Engineer fix iteration 2: worker dispatch 现在校验 outbox row、payload、run row、attempt row identity 一致，prompt/evidence identity 从 DB `runs.task_id` / `runs.linear_identifier` 派生；tampered payload 在 launch 前被拒绝并记录 `worker_dispatch_rejected`。
- Engineer fix iteration 2: native outbox 在 run 已 stop/cancel 时跳过并 failed pending startup side effects，只允许 `final_response`；新增 stop-before-native-startup 回归测试。
- Verify after iteration 2 fixes: `npm --prefix scheduler test` PASS（29 tests）。
- Verify final after iteration 2 fixes: `npm --prefix scheduler run health -- --db :memory:` PASS；`npm run test:regression` PASS（18 tests）；`npm run pack:dry-run` PASS；`git diff --check` PASS。
- Review iteration 3: `review-change` PASS；security lens 覆盖 worker process launch、env/argv、native side effects、evidence path trust boundary。Non-blocking suggestions 已记录在 `docs/review-change.md`。
- Report: 生成 implementation mode 的 `docs/report-walkthrough.md` 与 `docs/pr-body.md`，引用 test-report / review-change 既有证据。
- Wiki: 执行 `legion-wiki` writeback，新增 `wiki/tasks/linear-0xc-58.md`，更新 `index.md`、`patterns.md`、`maintenance.md` 与 `log.md`。
