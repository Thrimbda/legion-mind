# 变更审查：准备 Linear Scheduler 生产验收

## 结论

PASS

## 范围审查

- 预期 scope：生产验收准备包、docs、templates、fake fixtures、README/index links 和 Legion evidence。
- 实际 scope：符合预期。
- 未修改 scheduler runtime code。
- 未执行 live acceptance commands。
- 未提交真实 secrets 或 encrypted secret instance。

## Correctness Review

- Runbook 明确区分 sandbox production-like acceptance 和 production launch readiness。
- 当前已知 blockers 保持可见：无 production Linear native writeback adapter、无 live `dispatch project`、无 packaged webhook server/outbox runner。
- 命令安全说明正确区分 external read + DB write 与真正 read-only。
- `npm --prefix scheduler` fixture paths 已修正为 `tests/fixtures/...` 并经过验证。
- Fake project fixture 覆盖 ready、manual Done、dependency blocked、human gate、contract missing、risk missing 和 lock-conflict cases。
- Secret handling 使用 placeholder-only schema，并说明 sops YAML、age 和 `sops exec-env`。

## Security Lens

已应用 security lens，因为本次变更涉及 credentials、tokens、webhook secrets、worker environment boundaries 和 production-like acceptance operations。

未引入 security blocker。文档要求 operator 不把 secrets 解密到磁盘、不提交真实 secrets、使用 sandbox-scoped credentials，并把缺失的 writeback/dispatch/webhook capabilities 明确记录为 blockers。

## 验证证据

- `npm --prefix scheduler run debug -- scan fixture --fixture tests/fixtures/project.json --db :memory:` — PASS。
- `npm --prefix scheduler run debug -- dispatch fixture --fixture tests/fixtures/project.json --db .cache/linear-scheduler/acceptance-fixture.sqlite --parallel-repos legion-mind --global-concurrency 4 --per-repo-concurrency 4` — PASS。
- `npm --prefix scheduler run health -- --db :memory:` — PASS。
- `npm --prefix scheduler test` — PASS, 57/57。

## 非阻塞说明

- Runbook 刻意不解决缺失 runtime capabilities；它要求 operator 在 live acceptance 中把这些记录为 blockers。
- Live PR tracking 仍需要真实 scheduler run row，才能执行 `delivery track --pr-url`；GitHub sandbox runbook 已说明这一点。
