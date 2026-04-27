# Report Walkthrough: VibeHarnessBench MVP

mode: implementation

日期：2026-04-25  
证据来源：`plan.md`、`docs/rfc.md`、`docs/implementation-plan.md`、`docs/test-report.md`、`docs/review-change.md`、`vibe-harness-bench/README.md`

## 1. Reviewer-facing 结论

本轮交付为 **VibeHarnessBench MVP implementation**，review-change 结论为 **PASS**，blocking findings 为 **0**。  
Security lens 已应用，重点审查了 HUT runtime workspace、adapter env、protected verifier/oracle/negative controls 暴露风险，以及 adapter 退出后的 copy-back 行为。

## 2. 变更摘要

新增独立 `vibe-harness-bench` MVP benchmark 项目，覆盖：

- CLI：`doctor`、`run`、`selfcheck`、`compare`。
- Metadata：suite/family/case/adapter schema 与三 family 四 atomic case 元数据。
- Task packs：物理区分 `starter/`、`public/`、`verifier/`、`oracle/`、`negative_controls/`。
- Selfcheck：protected oracle/negative controls 路径可执行，并证明 oracle pass、negative fail 不是 infra crash。
- Reporting：生成 `run.json`、`summary.md`，并支持 compare smoke outputs。
- Isolation fix：HUT runtime temp root 位于 repo 外；adapter env 不暴露 protected/repo paths；copy-back 仅发生在 adapter/HUT 退出后。

## 3. 关键审查点

- `benchmark-design.md` 是用户提供的需求输入，只读对齐；不作为本任务实现交付产物提交或审查。
- HUT runtime temp root 在 `vibe-harness-bench` repo 外创建，`materialize_hut_workspace` 会拒绝 repo 内 execution root。
- Adapter/HUT 运行时只看到 out-of-tree temp root 下的 workspace、prompt、public、artifacts、budget、summary、trace 等路径。
- `verifier/`、`oracle/`、`negative_controls/`、case root 与 benchmark repo root 不进入 adapter-visible env。
- `workspace/`、`visible_inputs/`、`artifacts/` 的 copy-back 仅在 adapter 退出后发生，用于 reviewer artifacts，不作为 runtime 输入。

## 4. 验证摘要

`docs/test-report.md` 记录的复验证据为 **PASS**：

- `python -m compileall bench`：通过。
- `python -m bench.cli doctor`：通过；覆盖 out-of-tree HUT materialization 与 adapter env leakage 检查。
- `python -m bench.cli selfcheck --suite core-v1`：四个 atomic case 均 PASS；oracle expected/actual PASS；negative expected/actual `FAIL_HIDDEN`；`infra_error=False`。
- 两次 `python -m bench.cli run --suite smoke-v1 --adapter bench/adapters/examples/noop.yaml`：均生成 smoke result，noop 未解题归一化为 `FAIL_HIDDEN`，不是 infra crash。
- `python -m bench.cli compare ...`：通过，输出 smoke run verdict/score/infra_error diff。
- Direct isolation probe：PASS；repo 内 execution root 被拒绝，repo 外 temp visible paths/env 通过断言。

## 5. Review 摘要

`docs/review-change.md` 结论：**PASS**。

- blocking findings：0。
- Scope compliance：通过；实现产物限定在 `vibe-harness-bench/**` 与任务 docs。
- Security lens：已应用；重点覆盖 trust boundary、isolation boundary、hidden verifier/oracle 数据暴露。
- Contract / implementation review：通过；CLI、runner/report、task pack isolation、noop adapter failure、selfcheck 均满足 MVP contract。

## 6. 已知限制 / Backlog

- MVP contract verifier 是轻量 deterministic contract verifier，非完整高保真 verifier；不能宣称已经完成 GIF rendering、2048 gameplay、MapReduce 或 KV 行为的完整语义验证。
- 当前 local subprocess isolation 不是完整 sandbox/container/chroot，不等同于可安全运行任意恶意 HUT。
- Docker pre-baked images、离线 Node/Go/Playwright/ffmpeg 环境仍为 backlog。
- 高保真 pelican verifier、2048 verifier、systems verifier、Go RPC/concurrency tests、linearizability、完整 Go/Node protected oracles 与更多 negative controls 仍为后续任务。

## 7. Handoff note

本 walkthrough 仅重组已有 implementation/test/review 证据；未补跑测试、未修改生产代码、未新增验证 claim。
