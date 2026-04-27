# Review Change: Complete VibeHarnessBench v0.1

日期：2026-04-25  
阶段：`review-change` re-review after hidden-test leak fix  
审查范围：`plan.md`、`docs/rfc.md`、`docs/review-rfc.md`、`docs/test-report.md`、指定 Systems Go verifier、current `vibe-harness-bench/results/**` evidence，以及与 scope / security / report persistence 相关的 runner 文件。只读审查；本轮仅覆盖更新本文件，未修改实现代码。

## 结论

PASS

最新 blocker 已解除：Systems Go hidden verifier 不再把 injected hidden tests 写入 HUT workspace；MR/KV verifier 现在先把 HUT workspace copy 到 verifier-owned temp root，再在该 temp root 写入 `vbh_semantics_test.go` 并运行 `go test`。当前持久化结果目录的 Systems Go workspace 也不再包含 `vbh_semantics_test.go`。

此前通过项复查仍成立：2048 `spawn-on-noop` negative 独立覆盖 no-op spawn/state advance；Systems Go starter/prompt/API 与 verifier 对齐，noop failure 是 semantic failure 而非 missing symbol / infra crash；v0.1 不以 contract marker 判 PASS；scope 与 verification evidence 符合 RFC local-first acceptance；security lens 未发现剩余 blocker。

## Blocking findings

无。

## Latest blocker re-check: Systems Go injected hidden-test persistence

PASS。

- `vibe-harness-bench/tasks/systems-go-v1/cases/mr-full-v1/verifier/main.go`：`VBH_WORKSPACE_DIR` 仅作为 source；verifier 创建 `os.MkdirTemp("", "vbh-mr-verify-")`，`copyTree(workspace, verifyRoot)` 后把 `vbh_semantics_test.go` 写入 `verifyRoot`，并以 `cmd.Dir = verifyRoot` 执行 `go test .`。未向 HUT workspace 写 injected test。
- `vibe-harness-bench/tasks/systems-go-v1/cases/kvsrv-core-v1/verifier/main.go`：同样创建 `vbh-kv-verify-*` temp root，copy workspace 后只在 `verifyRoot` 写 `vbh_semantics_test.go` 并运行测试。未向 HUT workspace 写 injected test。
- `docs/test-report.md` 明确记录复验命令与结论：latest reviewed core run、new core run、repo-wide current result workspace check 均没有 `results/**/workspace/vbh_semantics_test.go`。
- 当前结果目录抽查与全局文件检查一致：`results/20260425T094845Z-d33551c0/cases/systems-go-v1/{mr-full-v1,kvsrv-core-v1}/workspace` 仅含 starter/workspace 文件（如 `go.mod`、`runtime.go`/`kv.go`、README、legacy subdir），无 `vbh_semantics_test.go`；此前指出的 `20260425T094201Z-afac90f0` workspace 也已不含该文件。
- `results/**/run.json` / `selfcheck.json` 中仍出现字符串 `vbh_semantics_test.go`，但这些是 Go test failure reason 中的 stack/file labels，不是 persisted injected test file 本体；不构成 hidden test source 泄露。

## Prior pass items re-check

### 2048 `spawn-on-noop`

PASS。

- Hidden verifier 使用 no-op left board 并要求 board、score、`rng` 均不变；错误 spawn 或 state advance 会 FAIL。
- `results/selfcheck-last/selfcheck.json` 记录 `spawn-on-noop` expected/actual 均为 `FAIL_HIDDEN`，`infra_error=false`，reason 为 `noop move spawned tile or advanced state`。

### Systems Go API alignment

PASS。

- MR verifier target 与 starter/root API 对齐：`package mrbench`、`RunScenario(name string) Result`。
- KV verifier target 与 starter/root API 对齐：`package kvbench`、`NewStore`、error constants、versioned methods、ambiguity/linearizability hooks。
- Latest noop/core evidence shows semantic failures (`unexpected word counts`, lease reassignment, crash recovery, `ErrVersion`, concurrent history), with `infra_error=false`; no missing-symbol / package mismatch / verifier infra crash remains.

### Contract marker not used as PASS

PASS。

- v0.1 `task.yaml` entries define `visible_verify_cmd` and `hidden_verify_cmd`; `required_markers` are empty.
- RFC explicitly rejects `contract.json` marker-only PASS for complete v0.1, and current `run.json` records visible/hidden semantic verifier verdicts.

### Scope

PASS。

- Reviewed scope remains within accepted task boundaries: `vibe-harness-bench/**`, task docs/evidence under `.legion/tasks/complete-vibeharnessbench-v01/**`, and wiki writeback as allowed by plan.
- No evidence that Legion workflow/install scripts were modified to simulate benchmark completion.

### Verification evidence

PASS。

- `docs/test-report.md` includes recent successful validation matrix: `compileall`, `doctor`, `selfcheck --suite core-v1`, noop smoke/core runs, compare, direct isolation probe, and targeted hidden-test leak checks.
- Selfcheck covers all four atomic cases: all oracles PASS; all negative controls return expected `FAIL_HIDDEN`; all negative `infra_error=false`.
- Noop smoke/core runs produce complete reports with expected semantic failures rather than runner crashes. Latest core run `20260425T094845Z-d33551c0` has verdict counts `{'FAIL_VISIBLE': 3, 'FAIL_HIDDEN': 1}` and Systems Go failures remain semantic with `infra_error=false`.

## Security lens

Applied, because this change executes HUT/adapter subprocesses and crosses HUT-visible vs protected verifier/oracle/negative-control trust boundaries.

PASS。

- Adapter env probe in `docs/test-report.md` shows only `BENCH_*` visible paths are exposed; repo, case root, verifier, oracle, and negative-control paths are not exposed.
- HUT execution root guard rejects in-repo execution root and accepts out-of-tree temp root, matching local-first isolation stance.
- The previous protected asset leak is fixed at the verifier boundary: injected Go tests are written only into verifier-owned temp copies and temp roots are removed with `defer os.RemoveAll(...)`.
- Persisted report workspaces no longer contain injected hidden test files; remaining result references to `vbh_semantics_test.go` are diagnostic failure text, not protected source files.

## Return assessment

No return to `engineer`, `verify-change`, `spec-rfc`, or `review-rfc` is required. The current implementation and verification evidence satisfy the accepted local-first v0.1 scope with zero blocking findings.
