# Build VibeHarnessBench MVP

## 目标

将 benchmark-design.md 发展为一个可运行的最小 benchmark 系统交付：包含 runner、adapter 接口、suite/case 元数据、受保护 task pack 骨架、自检和报告闭环。

## 问题陈述

当前仓库只有 benchmark-design.md 和 docs/benchmark.md 中的历史说明，没有可运行 benchmark harness。设计文档范围覆盖 Docker、隔离、三个 task family、oracle、negative controls 和报告，直接全量实现风险高且容易泄露 hidden verifier 或把 starter 写成答案；本任务先把设计收敛为可验证的 MVP，并通过 RFC 明确后续完整 family 深化边界。

## 验收标准

- [ ] 新增 benchmark 项目可通过本地 CLI 执行 doctor、run、selfcheck、compare 的基本闭环
- [ ] runner 能加载 suite、family、atomic case 与 adapter 配置，并输出 run.json 与 summary.md
- [ ] task pack 目录物理区分 starter、public、verifier、oracle、negative_controls，HUT workspace 不包含 verifier 与 oracle
- [ ] 至少覆盖设计文档中的三个 family 和四个 atomic case 的元数据与受保护自检路径
- [ ] selfcheck 能证明 oracle 正向通过、negative control 负向失败，并记录失败不是 infra crash
- [ ] RFC 明确 MVP 和完整 benchmark done definition 的差距、风险、回滚与后续阶段

## 假设 / 约束 / 风险

- **假设**: 用户要求我自行决定是否写 RFC 并给出结果，因此本轮采用延迟批准继续推进
- **假设**: benchmark-design.md 是本轮 benchmark 系统的需求真源
- **假设**: 当前仓库不是已有 Python benchmark 项目，新代码应隔离在新目录，避免干扰 Legion skill 安装路径
- **假设**: 本轮先交付可运行 MVP，不承诺一次性完成所有高保真 Node、Go、Docker hidden verifier
- **约束**: 不得把 oracle solution 或 hidden verifier 暴露到 evaluated agent 的 starter workspace
- **约束**: 不得把 starter repo 写成已完成解，必须保留 TODO 或不完整工作区
- **约束**: 不得直接 vendor MIT 6.5840 课程分发包或官方测试文件
- **约束**: 不引入需要联网安装才能跑通基础自检的依赖
- **约束**: 变更应限定在 benchmark 项目目录、必要文档与本任务 Legion 产物
- **风险**: 完整三 family benchmark 是 epic 级工作，若不切 MVP 容易变成无法验证的大爆炸交付
- **风险**: Docker 和离线 Node pnpm Go 镜像若一次性做深，会增加环境不可复现风险
- **风险**: 过弱 verifier 会让 benchmark 区分度不足，必须在 RFC 中把 MVP 与后续高保真 verifier 分清
- **风险**: 隔离实现若出错可能泄露 hidden verifier 或 oracle 路径

## 要点

- Runner/Adapter: Python CLI 提供 run、selfcheck、compare、doctor，adapter 以 command YAML 接入
- Task Pack Isolation: starter、public、verifier、oracle、negative_controls 物理隔离，并在 runner 中只复制 starter 给 HUT
- Reporting: 输出 JSON 和 Markdown，保留 family 与 atomic case 视图
- Non-goals: 本轮不建设云调度、leaderboard、人工审美打分或完整预烘焙 Docker 镜像体系
- Non-goals: 本轮不声称完成所有高保真 task verifier，只交付可运行 MVP 与明确 backlog

## 范围

- benchmark-design.md - 用户提供的需求输入，只读对齐；不作为本任务实现交付产物提交
- vibe-harness-bench/** - 新 benchmark MVP 项目
- docs/benchmark.md - 如需更新当前 benchmark truth
- .legion/tasks/build-vibeharnessbench-mvp/** - 本任务 contract、RFC、验证和报告
- .legion/wiki/** - 收口 writeback

## 非目标

- 不建设通用云调度、多机分布式执行、leaderboard UI 或人工审美打分流程。
- 不一次性完成所有高保真 Node、Go、Docker hidden verifier；这些进入 RFC backlog。
- 不把 benchmark starter workspaces 改造成已完成答案。

## 设计索引 (Design Index)

> **Design Source of Truth**: .legion/tasks/build-vibeharnessbench-mvp/docs/rfc.md

**摘要**:
- 核心流程: 先用 RFC 把高风险隔离边界和 MVP 范围固定，再实现独立 benchmark 项目目录和 CLI 闭环。
- 验证策略: 以 doctor、自检 oracle pass、negative fail、noop run 产出失败报告、Python 语法检查作为本轮可重复证据。

## 阶段概览

1. **Design** - 生成 benchmark MVP RFC
2. **Implementation** - 实现 benchmark runner 与 adapter CLI
3. **Validation** - 运行自检与基础命令验证

---

*创建于: 2026-04-25 | 最后更新: 2026-04-25*
