# Review RFC: VibeHarnessBench MVP

日期：2026-04-25  
阶段：`review-rfc`  
审查对象：

- `.legion/tasks/build-vibeharnessbench-mvp/plan.md`
- `.legion/tasks/build-vibeharnessbench-mvp/docs/research.md`
- `.legion/tasks/build-vibeharnessbench-mvp/docs/rfc.md`
- `.legion/tasks/build-vibeharnessbench-mvp/docs/implementation-plan.md`
- `benchmark-design.md`

## 结论

PASS

RFC 足以支持进入实现阶段。未发现会让实现不可行、不可验证或不可回滚的 blocking gap。

## 审查摘要

### 1. MVP scope

通过。

RFC 明确选择 `runner + metadata + protected selfcheck MVP`，没有把 scaffold 伪装成完整 benchmark。它诚实标出与 `benchmark-design.md` full Done Definition 的差距：Docker 离线、高保真 Node/Go verifier、每 case 完整 oracle、每 case negative matrix、trace/snapshot 等均进入 backlog 或延期范围。

### 2. hidden verifier / oracle 隔离边界

通过。

RFC 将 HUT 可见输入限定为：`starter/` copy、`prompt.md`、`public/`，并显式禁止 HUT 看到 `verifier/`、`oracle/`、`negative_controls/`、hidden seeds、golden outputs、case root 和 selfcheck protected workspace。实现要求使用 allowlist materialization，而不是 denylist；doctor/selfcheck/run workspace 也有分离要求。

### 3. CLI 与验证计划

通过。

CLI surface 覆盖 `doctor`、`run`、`selfcheck`、`compare`，并给出可执行命令与期望输出。验证计划包含 compile、doctor、selfcheck、noop run、compare，能够验证 runner 闭环、报告输出、protected selfcheck 和非 infra crash 的失败路径。

### 4. Rollback

通过。

实现范围隔离在 `vibe-harness-bench/**`，不修改 root scripts、Legion CLI、setup-opencode 或 install scripts。回滚路径为删除/隔离该目录和任务 docs，足够简单。

## 非阻塞建议

1. 实现时将 `metadata-only` case 在 `selfcheck` 与 `run.json` 中使用明确状态字段呈现，避免 reviewer 误读为完整 oracle/negative 已覆盖。
2. `run` 对 `verifier.command` 为空的 case 应有确定性 verdict/diagnostic，而不是依赖异常路径；建议在 schema loader 或 engine 中显式处理。
3. `compare` MVP 可先只比较 `run.json` 中的 verdict/score/infra_error，但应在 README 或 summary 中声明不比较 trace/snapshot。
4. selfcheck 证据应包含 protected workspace 与 HUT workspace 分离的路径记录或 checksum 摘要，以便审查隔离边界不是只靠代码约定。
