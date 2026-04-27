# Review RFC: Complete VibeHarnessBench v0.1

日期：2026-04-25  
阶段：`review-rfc`  
审查范围：`plan.md`、`docs/research.md`、`docs/rfc.md`、`docs/implementation-plan.md`、`benchmark-design.md`、现有 `vibe-harness-bench/**`。本审查未修改生产代码，未修改 `plan.md` / `tasks.md` / `log.md`。

## 结论

PASS

RFC 足以进入实现阶段。它把现有 MVP 的 contract-only verifier 差距识别清楚，并提出了可实现、可验证、可回滚的 local-first semantic verifier 路径；同时明确拒绝把 `contract.json` marker 继续作为完整 v0.1 PASS 条件。

## Gate 审查

### 1. 完整 v0.1 范围可验证性

PASS。

- RFC 覆盖四个 atomic cases：`pelican-bike-gif-v1`、`game-2048-v1`、`mr-full-v1`、`kvsrv-core-v1`。
- Runner/report 层明确新增 visible / hidden / selfcheck verdict，并要求 `doctor`、`selfcheck --suite core-v1`、noop run、per-case runs、compare、isolation probe 形成验证矩阵。
- 现有 `vibe-harness-bench/**` 仍是 MVP contract verifier 状态，但 RFC 与 implementation plan 均正确把这列为实施目标，而非假装已完成。

### 2. Docker-faithful vs local-first 差距

PASS。

- RFC 明确比较 Docker-faithful full stack、local-first semantic verifiers、继续 MVP contract verifier 三个方案。
- RFC 没有把 local subprocess 等同于 Docker sandbox；它承认 local-first sandbox 不等价 Docker、pelican 二进制 GIF 高保真有限、systems simulator 不等价真实 RPC 进程。
- 该偏离与 `plan.md` 的约束一致：核心验证必须本地可执行，Docker pre-baked images 可作为非阻塞兼容层记录。

### 3. Per-case oracle / negative / verifier 验收

PASS。

- Pelican：定义 required outputs、manifest/artifact contract、hidden motion checks、oracle、`static-scene` 与 `desync-motion` negatives；negative failure reason 可对应 motion variation / sync checks。
- 2048：定义 reducer/replay/storage/UI contract、hidden reducer and replay checks、oracle、`double-merge-bug` / `spawn-on-noop` / `bad-undo` negatives；验收能区分语义错误而非只看文件存在。
- MR：定义 clean-room stance、Go stdlib simulator/test harness、reassignment / late completion / deterministic output / crash recovery / parallelism checks、oracle 与至少三类 negatives。
- KV：定义 versioned Put/Get、retry、ErrMaybe、duplicate/delay、concurrency model checks、oracle 与至少三类 negatives。
- `bench selfcheck --suite core-v1` 要求 oracle PASS、所有 negative controls FAIL_HIDDEN 且不得是 infra crash，形成可执行验收门。

### 4. 隔离与 rollback

PASS。

- RFC 保留现有 out-of-tree HUT execution root，并要求 HUT 不可见 verifier / oracle / negative controls / hidden seeds / golden outputs。
- `doctor` 与 validation matrix 均包含隔离检查。
- Rollback 明确限定到 `vibe-harness-bench/**` 与任务 docs/evidence；禁止恢复 contract-only PASS，允许 case-level emergency disable 但必须标记 blocked。

## Blocking findings

无。

## Non-blocking implementation cautions

- 实现时需要把 verifier invocation contract 固化为具体 env/args（workspace、artifacts、seed、result output），避免每个 task pack 自行约定。
- Pelican 的 deterministic animation artifact 替代二进制 GIF 是已披露边界；实现和报告必须持续显式标注，避免对外声称已完成原始 pHash/SSIM GIF-faithful 路径。
- Systems simulator 路径必须在 authoring notes 中说明其与 coordinator/worker/RPC 能力边界的差异，防止被误读为完整真实进程/RPC harness。
