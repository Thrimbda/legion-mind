# Complete VibeHarnessBench v0.1

## 目标

按 benchmark-design.md 的完整 v0.1 Done Definition 交付 benchmark 系统，而不是停留在 MVP contract verifier。

## 问题陈述

当前 vibe-harness-bench 只有 runner、metadata、轻量 contract selfcheck 和隔离闭环；它不能真实评测 pelican GIF、2048、MapReduce 或 KV server 的语义能力。用户明确要求做到做完为止，因此本任务将 scope 升级为完整 v0.1：补齐高保真 verifier、oracle、negative controls、自检与可运行验证。

## 验收标准

- [ ] bench doctor 通过并检查 task pack、隔离、verifier 可执行性与本地 runtime 能力
- [ ] bench selfcheck --suite core-v1 对四个 atomic case 全部 oracle PASS 且所有 negative controls FAIL，失败不能是 infra crash
- [ ] noop adapter 跑 smoke/core 至少产生完整失败报告而不是 runner 崩溃
- [ ] pelican-bike-gif-v1 有可执行 starter、oracle、visible verifier、hidden verifier 与至少两个 negative controls，校验 GIF/manifest/motion contract
- [ ] game-2048-v1 有可执行 starter、oracle、visible verifier、hidden verifier 与至少三个 negative controls，校验 reducer、replay、persistence 与 UI/data-testid contract
- [ ] systems-go-v1 的 mr-full-v1 与 kvsrv-core-v1 有 clean-room Go starter、oracle、visible verifier、hidden verifier 与 negative controls，校验设计文档要求的核心 semantics
- [ ] runner/report 层保留 family 与 atomic case 视图，run.json 和 summary.md 能体现 visible/hidden/selfcheck verdict
- [ ] 实现不泄露 verifier/oracle/negative_controls 到 HUT runtime workspace 或 adapter env

## 假设 / 约束 / 风险

- **假设**: benchmark-design.md 是完整 v0.1 需求真源
- **假设**: 当前 v0.1 允许本地 subprocess/out-of-tree temp root 执行；Docker pre-baked images 若当前机器不可用，可作为非阻塞兼容层记录，但核心验证必须本地可执行
- **假设**: 为了在当前仓库完成，Node/Go task packs 可以采用无外部依赖或最小标准库实现，避免运行时联网安装
- **假设**: 用户已明确要求继续做到完整，因此采用延迟批准推进 contract 和设计门
- **约束**: 不得把 oracle solution 或 hidden verifier 暴露给 HUT workspace
- **约束**: 不得把 starter 写成完整答案，starter 必须保留真实 TODO 或不完整实现
- **约束**: systems family 必须 clean-room 派生，不 vendor MIT 6.5840 官方代码或测试
- **约束**: 不得要求联网安装依赖才能通过核心自检
- **约束**: 不得修改 Legion workflow/install scripts 来伪装 benchmark 完成
- **风险**: 完整 v0.1 横跨 artifact/app/systems 三类任务，范围大且验证复杂
- **风险**: 缺少 Docker 或外部 Node/Go 工具会影响设计文档原始 Docker/Playwright/ffmpeg 口径，需要本地可执行 fallback 与明确报告
- **风险**: Verifier 太弱会虚假完成；必须让 negative controls 确实被 hidden verifier 抓住
- **风险**: 隔离边界错误会泄露 oracle 或 hidden tests

## 要点

- Full Task Semantics: 从 contract.json selfcheck 升级为每 case 真实输出与语义 verifier
- Protected Controls: 每 case oracle pass、negative fail，selfcheck 全覆盖 core-v1
- Local-first Runtime: 优先使用标准库或仓库内脚本实现可重复验证，避免联网依赖
- Isolation: 保持 out-of-tree HUT runtime root 和 post-run copy-back 模式
- Non-goals: 不建设云调度、多机执行、leaderboard UI 或人工审美打分流程
- Non-goals: 不直接 vendor MIT 6.5840 官方 lab 分发包、测试或 skeleton

## 范围

- benchmark-design.md - 完整需求真源，只读对齐
- vibe-harness-bench/** - 完整 v0.1 benchmark 实现
- .legion/tasks/complete-vibeharnessbench-v01/** - 本任务设计、验证、审查与交付证据
- .legion/wiki/** - 收口 writeback

## 设计索引 (Design Index)

> **Design Source of Truth**: .legion/tasks/complete-vibeharnessbench-v01/docs/rfc.md

**摘要**:
- 核心流程: 在现有 MVP runner 上补齐真实 task-pack semantics、visible/hidden verifier、oracle 和 negative controls，同时保持隔离边界。
- 验证策略: 以 doctor、selfcheck core-v1、noop smoke/core run、每 case verifier/oracle/negative direct checks、compileall 和必要语言工具命令组成完整证据。

## 阶段概览

1. **Design** - 生成完整 v0.1 RFC
2. **Implementation** - 补齐 runner 对 visible/hidden verifier 与 selfcheck 的支持
3. **Validation** - 运行完整验证矩阵

---

*创建于: 2026-04-25 | 最后更新: 2026-04-25*
