# Legion 分层流程与条件化交付

## 目标

把 Legion 从固定全链路改为可解释、只升不降的 Lite、Standard、Strict 三档流程，并修复主工作区刷新、OpenCode agents/权限、条件报告与 Wiki、事件日志和行为测试。

## 问题陈述

当前流程把低中高风险压成近似同一条强制链，报告、Wiki、时间日志与自定义 OpenCode agents 形成固定成本；主工作区刷新还会造成 detached HEAD。部分测试锁住整段措辞，妨碍规则演化却没有验证实际行为。

## 验收标准

- [x] 主工作区刷新切回本地默认分支并 fast-forward 到 `origin/master`，不再 checkout 远端 ref。
- [x] Lite、Standard、Strict 由风险默认映射，显式覆盖只升不降；不以 LOC、文件数或耗时自动降级。
- [x] Lite 为 `engineer -> verify-change`；Standard 增加独立 `review-change`；Strict 强制 RFC/review、独立验证/审查和 walkthrough。
- [x] delivery 与 Wiki 使用相互独立的最低 disposition；`summary`、`no-change` 不要求占位产物。
- [x] `log.md` 只由阶段/结论、scope/风险/假设、关键决定、blocker、验证证据、handoff/lifecycle 等事件驱动。
- [x] 删除 `.opencode/agents/*`；安装与打包不再依赖 custom agents，升级安装安全清理未漂移旧资产并保留用户漂移。
- [x] OpenCode 允许只读 `webfetch`/`websearch`，`external_directory` 保持 ask，高风险 shell deny 保留。
- [x] 回归测试验证 profile、证据门、权限、安装迁移与刷新行为，不锁定说明性整句。
- [x] 根回归、打包检查和上下文审计通过。

## 假设 / 约束 / 风险

- **约束**: 用户有意保留的外部交付授权不变。
- **约束**: scheduler prompt/CLI/evidence verifier 与 per-spawn 模型路由本次不改；等待系统测试和平台能力成熟后再评估。
- **约束**: 不建设真实效率基准，不以无测量依据的模型分配固化成本策略。
- **约束**: 所有修改只在当前隔离 worktree 内完成并保留其他 worktree。
- **风险**: 删除 agents 可能在旧 managed manifest 中留下可发现文件，安装器迁移必须可回滚且不删除用户漂移。
- **风险**: 文档、校验器和测试若使用不同阶段矩阵，会重新形成隐性长链。

## 范围

- Legion workflow、design gate、dispatch/autopilot、文档归属、walkthrough/Wiki 与日志规则。
- git-worktree 主工作区刷新规则。
- OpenCode 配置、custom agents、安装/打包入口与升级迁移。
- profile policy、报告证据校验和相关回归测试。
- README 与 durable Wiki 真源。

## 非目标

- scheduler 源码、prompt、CLI 参数与 evidence verifier。
- Codex/OpenCode 的 per-subagent 或 per-spawn 模型路由。
- 真实效率基准、历史任务回放或成本仪表盘。
- 收窄 push、PR、merge 或其他外部写入授权。
- 取消独立执行上下文；删除的只是 `.opencode/agents/*` 配置层。

## 设计索引 (Design Index)

> **Design Source of Truth**: .legion/tasks/workflow-profiles-model-routing-v1/docs/rfc.md

- Lite 保留有界实现与验证；Standard 增加独立 change review；Strict 保留完整设计、独立验证/审查与强制 walkthrough。
- walkthrough 与 Wiki 分别按 reviewer 价值和 durable knowledge 决定，均只能从最低要求向上升级。
- 独立上下文可由新会话、内置 review 或子代理实现，不绑定 OpenCode custom agents。

## 阶段概览

1. **设计** - 收敛三档 profile、disposition 和迁移边界
2. **实现** - 修改 workflow、配置、安装迁移与刷新规则
3. **验证** - 把措辞测试重构为行为测试并运行套件
4. **交付** - 独立 review、walkthrough/Wiki、PR 终态与刷新

---

*创建于: 2026-07-18 | 最后更新: 2026-07-18*
