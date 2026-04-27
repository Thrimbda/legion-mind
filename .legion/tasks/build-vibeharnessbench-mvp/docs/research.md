# VibeHarnessBench MVP Research

日期：2026-04-25  
阶段：`spec-rfc` 设计产物  
输入：`benchmark-design.md`、`docs/benchmark.md`、`.legion/wiki/index.md`、`.legion/wiki/patterns.md`、任务 contract

## 1. 研究问题

本任务的 contract 已稳定，但 `benchmark-design.md` 的完整 Done Definition 是一个接近 epic 的 benchmark 系统：Docker 隔离、三个 task family、四个 atomic case、高保真 hidden verifier、oracle、negative controls、报告与比较工具。直接实现会同时触碰 runner、adapter、task authoring、隔离安全、Node/Go/Docker 环境和报告 schema，存在范围爆炸与 hidden material 泄露风险。

本研究只回答 MVP 设计前必须澄清的问题：

1. 当前仓库是否已有可复用 benchmark harness？
2. 完整设计中哪些能力必须进入 MVP，哪些应明确延期？
3. 怎样在不污染现有 Legion tooling 的前提下放置新项目？
4. 哪些隔离边界和验证证据必须在实现前写死？

## 2. 当前仓库事实

### 2.1 `docs/benchmark.md`

当前仓库没有活动 benchmark harness：

- 没有 `benchmark:*` npm scripts。
- 没有 committed `scripts/benchmark/` 实现。
- 没有已执行的 artifact contract 或 scorecard format。
- 仅有 `shell.nix` 中用于本地实验的 Harbor wrapper；不能视为本任务的 benchmark substrate。

结论：VibeHarnessBench MVP 应作为独立新项目落在新目录，而不是试图接入不存在的旧 benchmark surface。

### 2.2 Legion wiki 当前约束

`.legion/wiki/patterns.md` 记录的可复用模式集中在 Legion CLI/安装资产：

- CLI 保持薄层，避免重新实现隐式状态机。
- `task create` 使用 staging + rename。
- `setup-opencode verify --strict` 以 expected items 和 managed ownership 为真源。

这些模式不直接提供 benchmark runner，但给出一个设计约束：不要把 benchmark MVP 塞进现有 install/setup 脚本，也不要引入跨仓库全局状态。benchmark 应是自包含项目，CLI 自己管理 suite/case/results，不改 existing install scripts。

## 3. 需求真源摘要

`benchmark-design.md` 定义 VibeHarnessBench v0.1：用于评测另一个 agent/harness，而不是让 builder 解题。核心组件包括：

- Runner：准备 workspace、调用 adapter、运行 verifier、生成 report。
- Adapter：把任意 HUT 适配为命令接口。
- Task Pack：包含 starter、public、verifier、oracle、negative controls、docs。
- Report/Compare：输出 run JSON、Markdown 摘要，并比较结果。
- Selfcheck：oracle 必须 pass，negative controls 必须 fail，noop run 应失败但不是 infra crash。

目标 task family：

1. `pelican-bike-gif-v1`
2. `game-2048-v1`
3. `systems-go-v1`
   - `mr-full-v1`
   - `kvsrv-core-v1`

## 4. 完整 Done Definition 与 MVP 差距

完整 Done Definition 要求：

1. `bench doctor` 成功。
2. `bench selfcheck --suite core-v1` 全通过。
3. `noop` adapter 完整跑完并输出失败报告。
4. 每个 case 的 oracle 可以 pass。
5. 每个 case 至少一个 negative control 会 fail。
6. `core-v1` 可在一台有 Docker 的机器上离线运行。
7. HUT 看不到 hidden verifier / oracle。
8. runner 输出 family 与 atomic case 报告。

本任务 MVP 不应承诺完整高保真 benchmark 题库，而应承诺可运行闭环和保护边界：

| 能力 | 完整设计 | MVP 设计裁剪 |
|---|---|---|
| Runner | Docker 化、资源隔离、全 suite 调度 | Python 本地 runner scaffold，保留 executor 抽象；默认可本地命令执行，Docker 作为后续增强 |
| Task pack | 三 family 四 case 均有真实 starter/verifier/oracle/negative controls | 三 family 四 case 均有 metadata 与目录骨架；至少 `kvsrv-core-v1` 具备可执行 protected selfcheck 核心路径 |
| Verifier | Node/Go 高保真 hidden verifier | MVP 使用轻量 deterministic verifier/selfcheck 证明接口和隔离；高保真 verifier 进入 backlog |
| Oracle | 每 case 完整正确实现 | MVP 至少保留 protected oracle 路径与一条可执行 oracle pass；其余可用 placeholder/metadata 标记未实现 |
| Negative controls | 每 case 多个 known-bad | MVP 至少一条可执行 negative fail；其余以 metadata/backlog 明确 |
| Docker/offline | 预烘焙 Node/Go 镜像，运行时禁网 | 不改 existing install scripts；Docker image baking 延期，runner schema 预留 |
| Reports | run.json、summary.md、traces、snapshots | run.json + summary.md 必须；trace/snapshot 可空或占位 |

## 5. 推荐仓库边界

推荐新增并隔离所有实现到：

```text
vibe-harness-bench/**
```

理由：

- 当前仓库没有 benchmark harness，独立目录避免误导 `docs/benchmark.md` 的当前事实。
- 不触碰 Legion CLI、setup-opencode、install scripts，降低回滚风险。
- 可以用 Python 项目结构独立承载 runner、adapter schema、suite metadata、task packs、results。
- 未来若 benchmark 成熟，可再把文档和命令入口上收；MVP 阶段不应污染 root-level scripts。

## 6. 关键安全边界

实现前必须写死：HUT 只能拿到 starter/public/prompt。

可见性规则：

- HUT 可写：`starter/` 的临时 copy。
- HUT 可读：`prompt.md`、`public/`。
- HUT 不可见：`verifier/`、`oracle/`、`negative_controls/`、hidden seeds、golden outputs。
- selfcheck/verifier 可读 protected paths，但 selfcheck 产物不得被后续 HUT run 复用为 workspace 输入。

因此 runner 不能把 case root 整体复制给 HUT；必须按白名单复制/挂载。

## 7. 设计风险

1. **范围爆炸**：完整 pelican/2048/systems verifier 各自都可成为独立任务。
2. **隔离泄露**：若实现便利地复制 case root，会把 oracle/verifier 暴露给 HUT。
3. **伪自检**：只检查文件存在会导致 benchmark 看似通过，实际没有能力区分 harness。
4. **Docker 不可复现**：预烘焙 Node/Go 镜像若一次性推进，可能让 MVP 卡在环境问题。
5. **clean-room 风险**：systems-go-v1 参考 MIT 6.5840 能力边界，但不得 vendor 官方分发包或测试。

## 8. 研究结论

需要 RFC，因为本任务不是单纯实现 runner，而是要在安全隔离、MVP 裁剪、目录边界、验证证据和后续高保真路线之间做设计裁决。推荐方案是：`runner + metadata + protected selfcheck MVP`。它比只做 runner scaffold 更能验证核心风险，也比全量一次性实现更可控。
