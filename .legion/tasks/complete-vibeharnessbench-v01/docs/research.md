# Research: Complete VibeHarnessBench v0.1

日期：2026-04-25  
阶段：`spec-rfc`  
范围：只读摸底 `benchmark-design.md`、现有 MVP `vibe-harness-bench/**`、既有 MVP RFC 与 review；不修改生产代码。

## 1. 任务契约摘要

`complete-vibeharnessbench-v01` 的目标不是新增 scaffold，而是把 MVP 升级为 `benchmark-design.md` 的完整 v0.1 Done Definition：四个 atomic case 都必须具备真实 workspace outputs、visible verifier、hidden verifier、oracle、negative controls、自检与可报告 verdict。

关键约束：

- 完整 v0.1 不再接受 `contract.json` capability markers 作为唯一 verifier。
- HUT runtime 仍只能看到 starter、prompt、public；不能看到 verifier、oracle、negative controls、hidden seeds/golden outputs。
- 核心验证必须 local-first、离线可运行；Node tasks 只依赖 Node stdlib/仓库内代码，Go tasks 只依赖 Go stdlib/仓库内代码。
- 若本机缺 Node 或 Go，验证报告必须明确标记 blocker，而不是静默降级成 contract verifier。

## 2. 现有 MVP 观察

### 2.1 已完成且应保留

- `vibe-harness-bench/bench/runner/engine.py` 已有 local subprocess runner、out-of-tree temporary HUT execution root、adapter env allowlist、运行后 copy-back。
- `bench/runner/isolation.py` 与 doctor/review 证据已证明 MVP 解决了“case root 作为 workspace 祖先路径导致 protected paths 可达”的隔离 blocking。
- `bench/runner/schema.py` 已能加载 suite/family/case metadata；四个 atomic case 已建物理目录。
- `bench selfcheck --suite core-v1` 在 MVP 中已覆盖四 case 的 oracle/negative plumbing。
- `run.json`/`summary.md` 已有 suite/family/case 层级雏形。

### 2.2 当前不足

- `bench/runner/contract.py` 是唯一实际 verifier：只检查 `artifacts/contract.json` 的 schema、case id 与 capability markers。
- `engine.py` 在 HUT run 后只调用 `verify_contract()`，没有 visible/hidden 两阶段，也没有 selfcheck/oracle/negative verdict 进入 run schema。
- `selfcheck.py` 直接复制 `oracle/` / `negative_controls/` 并用 contract verifier；没有运行 case-specific verifier semantics。
- task metadata 的 `verifier.command` 为空，reason 明确声明 MVP 未实现 GIF/browser/Go semantic verifier。
- task packs 的 starter/public/verifier/oracle/negative 主要是 README 与 marker JSON，缺少可执行 task pack。
- MVP README 明确承认：当前 contract verifier 只证明 protected selfcheck 与 isolation plumbing，不是 GIF、2048、MapReduce、KV 行为验证。

## 3. 需求差距表

| 领域 | `benchmark-design.md`/本任务要求 | 现有 MVP | v0.1 设计结论 |
|---|---|---|---|
| Verifier | 每 case hidden semantics，visible debug | 单一 contract markers | 引入 case-specific visible/hidden verifier command |
| Selfcheck | oracle PASS、negative FAIL，非 infra crash | marker pass/fail | 对 oracle/negative 运行同一 hidden verifier，并记录 selfcheck verdict |
| Pelican | GIF/manifest/motion/keyframes/loop | marker JSON | 用 deterministic animation artifact + manifest；二进制 GIF 高保真可作为兼容增强 |
| 2048 | reducer/replay/persistence/UI contract | marker JSON | 以纯逻辑 reducer/replay/persistence model verifier 为主，static DOM/source fallback |
| MR | coordinator/worker/reassign/late ignore/output | marker JSON | clean-room deterministic simulator/test harness 可替代真实 RPC 进程 |
| KV | versioned Put/Get/retry/ErrMaybe/concurrency | marker JSON | clean-room Go harness 覆盖简化线性一致 history 与 negative controls |
| Runtime | Docker pre-baked offline | local subprocess | v0.1 推荐 local-first；Docker faithful 留兼容/后续 |

## 4. Local-first 可行性

### Node tasks

为避免联网依赖，Node task packs 不以 `pnpm install`、Playwright、ffmpeg 作为核心通过条件。核心 artifact 与 verifier 均可用 Node stdlib：

- `pelican`：生成 deterministic animation bundle，例如 `artifacts/pelican.anim.json`、`artifacts/scene_manifest.json`，可选生成 minimal GIF-like binary `pelican.gif`。hidden verifier 校验 manifest、帧序列、关键帧、运动方程、loop continuity、frame hash/变化量。
- `2048`：核心 reducer/replay/storage model 用 TS/JS 源文件或 CommonJS module；verifier 用 Node stdlib 载入/执行 reducer，另做 static source/HTML contract 检查 `data-testid`。

若本机无 `node`，doctor/selfcheck/verification report 必须将 Node cases 标记为 `ERROR_INFRA` / blocked，并说明缺少 runtime。

### Go tasks

Go task packs 使用 clean-room Go module + stdlib `go test`：

- `mr-full`：可采用 deterministic simulator/test harness 直接实例化 coordinator/worker semantics；不要求启动真实多进程 RPC，除非实现阶段选择增强。
- `kvsrv-core`：用 stdlib goroutine/channel/RPC simulator 或直接 API harness 检查 versioned Put/Get、retry、ErrMaybe 与简化线性一致 history。

若本机无 `go`，doctor/selfcheck/verification report 必须将 systems cases 标记 blocked。

## 5. 主要风险

- **Verifier 过弱**：若只检查 markers、文件存在或 TODO removal，会虚假完成；negative controls 必须证明 hidden verifier 能抓语义错误。
- **Pelican 二进制 GIF 风险**：无 ffmpeg/Playwright/GIF decoder 时，高保真 GIF pHash/SSIM 不稳定；必须诚实降级为可执行 deterministic animation artifact，而不能回到 contract markers。
- **Systems clean-room 风险**：参考 MIT 6.5840 能力边界，但不得 vendor 官方 skeleton/tests；需写 authoring notes 明确改写点。
- **Runner schema migration 风险**：`run.json` 需要兼容新增 visible/hidden/selfcheck verdict；旧结果读取应尽量容忍缺字段。
- **Runtime absence 风险**：Node/Go 缺失是环境 blocker，不应被误报为 task failure 或 PASS。

## 6. 设计输入结论

进入 RFC 的推荐方向：保留 MVP 的隔离、metadata、report 基线，替换 contract-only verifier 为 local-first semantic verifier 框架；每 case 提供可执行 starter/oracle/negative，并让 runner/report 显式记录 visible、hidden、selfcheck verdict。
