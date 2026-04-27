# Review Change: VibeHarnessBench MVP

日期：2026-04-25  
阶段：`review-change`  
结论：PASS

## Blocking findings

无。

## Re-review focus

本轮复查此前 `review-change` FAIL 的两个 blocking：

1. **Scope**：确认 `benchmark-design.md` 是用户提供的只读需求输入，不作为本任务实现交付产物提交；本次实现产物仍限定在 `vibe-harness-bench/**` 与任务 docs。
2. **Security / isolation**：确认 adapter/HUT runtime workspace 已移动到 repo 外临时 execution root，adapter env 避免 protected/repo path，运行后 copy-back 不影响 runtime 隔离。

审查对象：

- `.legion/tasks/build-vibeharnessbench-mvp/plan.md`
- `.legion/tasks/build-vibeharnessbench-mvp/docs/rfc.md`
- `.legion/tasks/build-vibeharnessbench-mvp/docs/review-rfc.md`
- `.legion/tasks/build-vibeharnessbench-mvp/docs/test-report.md`
- `vibe-harness-bench/**`

## Scope compliance

通过。

- `plan.md` 已明确：`benchmark-design.md` 是“用户提供的需求输入，只读对齐；不作为本任务实现交付产物提交”。
- 本轮实现性产物集中在 `vibe-harness-bench/**`，任务过程与审查证据集中在 `.legion/tasks/build-vibeharnessbench-mvp/**`。
- 未将 `benchmark-design.md` 作为 engineer 输出审查；本次 PASS 以该文件不纳入实现交付为前提。

## Security lens

已应用。触发条件为 trust boundary / isolation boundary / hidden verifier 与 oracle 数据暴露。

通过。

关键证据：

- `vibe-harness-bench/bench/runner/engine.py` 在 `_run_one()` 中使用 `tempfile.TemporaryDirectory(prefix="vbh-hut-")` 创建 HUT execution root，并在该 repo 外 temp root 下调用 `materialize_hut_workspace()`。
- `vibe-harness-bench/bench/runner/isolation.py` 的 `assert_execution_root_outside_project()` 会拒绝位于 `ROOT`（`vibe-harness-bench`）内的 execution root；`materialize_hut_workspace()` 在入口强制调用该 guard。
- `make_adapter_env()` 仅暴露 `workspace`、`prompt`、`public`、`artifacts`、`budget`、`summary`、`trace` 等 temp execution root 下的路径；`assert_visible_env_no_protected_paths()` 将 benchmark `ROOT`、case root、`verifier/`、`oracle/`、`negative_controls/` 纳入 blocked path 检查。
- `engine._base_adapter_process_env()` 过滤进程环境，只保留通用 env，并移除位于 benchmark root 下的 `PATH` entry，避免 `PWD` / `PYTHONPATH` 等 repo-derived path 进入 adapter env。
- `persist_hut_artifacts()` 只在 adapter/HUT 执行结束后，将 temp root 中的 `workspace`、`visible_inputs`、`artifacts` copy back 到 `results/<run>/cases/...` 供审阅；copy-back 发生在 runtime 隔离之后，不再作为 adapter cwd 或 env 输入。
- `docs/test-report.md` 记录的 isolation probe 覆盖：repo 内 execution root 被拒绝；workspace/prompt/public/artifacts/budget/summary/trace 均位于 repo 外 temp root；adapter env 中 visible path 不包含 benchmark repo root。

剩余限制：当前 MVP 仍是 local subprocess executor，不等同于对恶意系统级 HUT 的容器/chroot sandbox；但相对于本任务 RFC 的 MVP 边界和此前 blocking（workspace 祖先路径可达 protected task pack），runtime workspace/env/copy-back 隔离已满足通过条件。

## Contract / implementation review

通过。

- CLI surface：`doctor`、`run`、`selfcheck`、`compare` 均存在，并与 MVP command surface 对齐。
- Runner/report：`run` 能加载 suite/case/adapter，生成 `run.json`、`summary.md`，并记录 family/case verdict、score、infra_error、visible input checksum。
- Task pack isolation：task pack 物理区分 `starter/`、`public/`、`verifier/`、`oracle/`、`negative_controls/`；HUT materialization 使用 allowlist，只复制 starter/prompt/public。
- Noop adapter failure：复验证据显示 smoke run 中 `kvsrv-core-v1` verdict 为 `FAIL_HIDDEN` 且 `infra_error=false`，符合“失败报告而非 infra crash”。
- Selfcheck：复验证据显示 core-v1 四个 case oracle PASS、negative `FAIL_HIDDEN`、`infra_error=false`，满足并超过 RFC 至少一条真实 protected path 的 MVP 下限。

## Verification evidence

`docs/test-report.md` 的复验证据足以支持本轮 PASS：

- `python -m compileall bench`：通过。
- `python -m bench.cli doctor`：通过，并覆盖 out-of-tree HUT materialization 与 adapter env 泄露检查。
- `python -m bench.cli selfcheck --suite core-v1`：四个 atomic case 均通过 oracle/negative selfcheck。
- 两次 `python -m bench.cli run --suite smoke-v1 --adapter bench/adapters/examples/noop.yaml`：均生成非 infra crash 的 `FAIL_HIDDEN` smoke result。
- `python -m bench.cli compare ...`：通过。
- 直接 isolation probe：通过，证明 repo 内 execution root guard、repo 外 temp visible paths/env。

## Non-blocking suggestions

- 若后续要评估不可信 HUT，应将 local subprocess executor 升级为明确 sandbox/container/chroot 或等价文件系统隔离；当前 PASS 仅覆盖 RFC MVP 承诺。
- `doctor` 可进一步增加 starter/public symlink 检查，拒绝指向 case root、protected dirs 或 repo 外敏感路径的 symlink。
