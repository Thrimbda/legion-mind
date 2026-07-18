# Legion 分层流程与条件化交付：交付审阅指南


## 交付视角与结论

- 交付类型：`implementation`
- Workflow profile：`strict`
- 风险：`high`
- 阶段结论：`PASS`
- 审查状态：`PASS`
- 最终状态：实现、验证、独立审查、Wiki 写回与 reviewer artifact 已完成；PR lifecycle 尚未完成

Lite、Standard、Strict 三档 profile 与独立 delivery/wiki disposition 已落地；控制标签 fail\-closed，Strict 强制 walkthrough。OpenCode custom agents 已退出安装面，旧 managed agents 可回滚迁移；权限和主工作区刷新缺口已修复。独立 RFC 与 change review 均 PASS，root 44/44、scheduler 59/59 及完整交付验证通过。

## 人类注意力与当前动作

- 聚合注意力：`skim`
- 当前唯一人类动作：知悉；无需介入。
- lifecycle 边界：允许继续 commit、rebase、push、PR、checks/review、merge、cleanup 与主工作区刷新。
- 停止点：允许继续 commit、rebase、push、PR、checks/review、merge、cleanup 与主工作区刷新。
- 摘要：实现与独立审查均通过；需知悉 scheduler、per\-spawn 模型路由与真实效率 benchmark 明确延期，旧 managed agents 需在下次 installer 运行时迁移。
- 证据：\.legion/tasks/workflow\-profiles\-model\-routing\-v1/docs/test\-report\.md、\.legion/tasks/workflow\-profiles\-model\-routing\-v1/docs/review\-change\.md


## 未解决的认知状态

当前证据未登记需要单独聚合的未解决 claim。

## 领域验证摘要

当前证据未登记领域或权威 verifier。

## 范围

### 范围内

- Lite/Standard/Strict profile、只升不降控制标签与阶段/独立性规则
- 条件化 walkthrough、Wiki 与事件驱动日志
- OpenCode custom agents 退役、权限修复与 installer 迁移
- 本地默认分支 fast\-forward 刷新脚本与回归
- 将旧措辞锁定测试改为 profile、迁移、权限和刷新行为测试

### 范围外

- 缩窄外部交付授权
- scheduler prompt、CLI、evidence verifier 或业务源码修改
- Codex/OpenCode per\-spawn 模型路由
- 真实效率 benchmark

## 证据地图

| 证据 | 类型 | 状态 | locator |
| --- | --- | --- | --- |
| 任务契约 | plan | PASS | \.legion/tasks/workflow\-profiles\-model\-routing\-v1/plan\.md |
| 最终设计真源 | rfc | PASS | \.legion/tasks/workflow\-profiles\-model\-routing\-v1/docs/rfc\.md |
| 三轮独立 RFC 审查 | review\-rfc | PASS | \.legion/tasks/workflow\-profiles\-model\-routing\-v1/docs/review\-rfc\.md |
| 最终验证报告 | test\-report | PASS | \.legion/tasks/workflow\-profiles\-model\-routing\-v1/docs/test\-report\.md |
| 独立变更审查 | review\-change | PASS | \.legion/tasks/workflow\-profiles\-model\-routing\-v1/docs/review\-change\.md |

## 交付路径

1. 与用户讨论并锁定最终范围，明确 scheduler、模型路由与 benchmark 延期
2. 完成 Strict RFC；独立 review\-rfc 两轮 FAIL 后关闭 resolved\-policy、retired\-source 与 contract\-only blocker，第三轮 PASS
3. 实现 profile/disposition、OpenCode 迁移与权限、事件日志和安全刷新
4. 执行完整回归、scheduler compatibility、context audit、npm package 与 patch hygiene 验证
5. 独立 review\-change 关闭控制标签静默降级与旧规则漂移后 PASS
6. 生成 Strict walkthrough、写回 durable Wiki 并进入 PR lifecycle

## 变更与决定

- 风险 low/medium/high 默认映射 Lite/Standard/Strict；显式 profile 只能升级，控制标签错误 fail\-closed。
- Lite 为 engineer\+verify，Standard 增加独立 change review，Strict 强制 RFC、独立验证/审查和 walkthrough。
- walkthrough 与 Wiki 成为独立 disposition：Strict 强制 walkthrough，Wiki 只写 durable cross\-task knowledge。
- 日志只在阶段、决策/假设、风险/阻塞或可靠恢复点变化时更新，不再按分钟或编辑单元机械记录。
- 删除 \`\.opencode/agents/\*\` 和默认 agent；独立执行上下文由会话、内置 review 或 subagent 保留。
- OpenCode 允许 webfetch/websearch，外部目录改为 ask，危险 shell deny 保持。
- installer 只退役显式 agents 根内的旧 managed 文件，缺必需源码 fail\-closed，clean 文件备份迁移，用户 drift 默认保留。
- 主工作区刷新切回本地默认分支并 merge \-\-ff\-only；detached HEAD 被修复，分叉不覆盖。

## 验证与审查状态

| 检查 | 状态 | 证据 |
| --- | --- | --- |
| 根回归 44/44 | PASS | \.legion/tasks/workflow\-profiles\-model\-routing\-v1/docs/test\-report\.md |
| scheduler compatibility 59/59 且核心源码无 diff | PASS | \.legion/tasks/workflow\-profiles\-model\-routing\-v1/docs/test\-report\.md |
| context audit 与 npm pack dry\-run（64 entries） | PASS | \.legion/tasks/workflow\-profiles\-model\-routing\-v1/docs/test\-report\.md |
| 三轮 RFC 审查与最终独立 change review | PASS | \.legion/tasks/workflow\-profiles\-model\-routing\-v1/docs/review\-change\.md |

## 风险与限制

- scheduler 仍使用 legacy 全证据链，尚未采用新的 profile 输入。；缓解：本任务保持 scheduler 源码无 diff并运行 59/59 compatibility suite；待系统测试后单独设计迁移。
- 旧 managed agents 只在 installer 下次运行时迁移，unmanaged 或用户漂移文件不会自动删除。；缓解：这是保守迁移边界；clean managed 文件进入 backup index 可 rollback，漂移文件告警并保留。
- 文件系统 canonical 检查存在通常的 TOCTOU 残余。；缓解：删除范围限定在 manifest 与显式 retired root，拒绝 symlink managed root，并在 destructive action 前复核路径。

## 审阅清单

- [ ] 确认外部交付授权未被缩窄。
- [ ] 确认 scheduler prompt/CLI/evidence verifier 与 per\-spawn 模型路由没有进入 diff。
- [ ] 确认控制标签 typo 不会静默降级，Strict 在任一 runKind 都保持 walkthrough。
- [ ] 确认 OpenCode custom agents 不再打包/安装，迁移与 rollback 行为有回归。
- [ ] 确认主工作区刷新不 checkout 远端 tracking ref、不 reset、不覆盖分叉。
- [ ] 确认 PR 合并、worktree cleanup 与主工作区刷新仍需在本报告之后完成。

## 渲染交接

- PR-backed：是
- 状态：`artifact-only`
- 说明：本任务不新增 HTML 托管发布链；reviewer 可在 PR 中查看仓库内 HTML/Markdown artifact，PR body 由同一 JSON 生成。

## 最终状态与下一阶段

- 当前状态：实现、验证、独立审查、Wiki 写回与 reviewer artifact 已完成；PR lifecycle 尚未完成
- 下一阶段：完成 commit、rebase、push、PR、checks/review、merge、cleanup 与主工作区刷新
- lifecycle 声明：本报告只证明当前工作树中的实现和 reviewer artifact 已准备，不证明 PR 已创建、checks 已通过、PR 已合并、worktree 已清理或主工作区已刷新。
