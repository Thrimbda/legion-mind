# build-vibeharnessbench-mvp

## 任务摘要

- 目标：将 `benchmark-design.md` 收敛为一个可运行的 VibeHarnessBench MVP，交付 runner、adapter、suite/case metadata、task pack layout、protected selfcheck、reporting 与 compare 闭环。
- 风险级别：Medium/High；涉及 HUT 与 hidden verifier/oracle 的隔离边界，但实现被限定在独立 `vibe-harness-bench/**` 项目目录内。
- 生产代码范围：`vibe-harness-bench/**`。
- 输入说明：`benchmark-design.md` 是用户提供的只读需求输入，不作为本任务实现交付产物提交。

## 当前结论

- MVP 采用 `runner + metadata + protected selfcheck`，不把 scaffold 伪装成完整 benchmark。
- CLI surface 为 `doctor`、`run`、`selfcheck`、`compare`；验证证据覆盖 compile、doctor、selfcheck、两次 noop smoke run、compare 与 direct isolation probe。
- HUT runtime materialization 必须发生在 repo 外临时 execution root；adapter env 不应包含 benchmark repo root、case root、`verifier/`、`oracle/` 或 `negative_controls/`。
- `workspace/`、`visible_inputs/`、`artifacts/` 可以在 adapter 退出后 copy back 到 `results/`，但 copy-back 不可作为 runtime 可见输入。
- 当前 verifier 是 deterministic contract verifier，只证明 MVP 自检和隔离管线；不是 GIF、2048、MapReduce 或 KV server 的高保真语义 verifier。

## 证据入口

- Plan：`.legion/tasks/build-vibeharnessbench-mvp/plan.md`
- RFC：`.legion/tasks/build-vibeharnessbench-mvp/docs/rfc.md`
- Implementation Plan：`.legion/tasks/build-vibeharnessbench-mvp/docs/implementation-plan.md`
- RFC Review：`.legion/tasks/build-vibeharnessbench-mvp/docs/review-rfc.md`
- Test Report：`.legion/tasks/build-vibeharnessbench-mvp/docs/test-report.md`
- Change Review：`.legion/tasks/build-vibeharnessbench-mvp/docs/review-change.md`
- Walkthrough：`.legion/tasks/build-vibeharnessbench-mvp/docs/report-walkthrough.md`
- PR Body：`.legion/tasks/build-vibeharnessbench-mvp/docs/pr-body.md`

## 后续注意

- 若后续评估不可信 HUT，local subprocess executor 必须升级为明确 sandbox、container、chroot 或等价文件系统隔离。
- 后续应补 Docker pre-baked images、Node/Go 离线环境、高保真 task verifiers、完整 oracle 与更丰富 negative-control matrix。
