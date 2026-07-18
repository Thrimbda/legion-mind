# 独立变更审查：Legion 分层流程与条件化交付

## 审查范围

- Lite/Standard/Strict profile 与 delivery/wiki minimum lattice
- walkthrough resolved-policy 与 scheduler legacy 边界
- OpenCode custom agents 删除、权限和安装迁移
- 主工作区刷新安全性
- README、Wiki、tests 与任务 contract 一致性

## Findings

- P0/P1/P2：无。
- 审查中发现并已关闭：控制标签拼写错误静默降级、Strict `brainstorm_only` 降级、README/spec-rfc 旧规则冲突，以及两处事件日志旧措辞。
- 审查探测意外升级的 `.opencode/package-lock.json` 已精确恢复到 HEAD，不进入变更范围。

## 关键判断

- Lite/Standard/Strict、delivery/wiki minimum lattice 均只升不降；`profile`、`workflow`、`delivery`、`wiki`、`design`、`rfc` 控制命名空间的未知值 fail-closed，无关 labels 仍允许。
- Renderer 强制 resolved `workflowProfile`/`designRequired`；scheduler 保留 legacy 验证路径且源码无 diff。
- OpenCode agents 删除及安装迁移具备 checksum、默认 drift 保留、备份回滚、required-source preflight 与 managed-root 路径边界。
- 刷新脚本只切本地分支并 `merge --ff-only`；远端更新可 fast-forward，本地/远端分叉时失败且保留本地提交。
- 权限只放开 `webfetch`/`websearch`，`external_directory=ask`，危险 shell deny 保留。

## 独立验证

- `npm run test:regression`：44/44 PASS。
- `npm --prefix scheduler test`：59/59 PASS。
- `npm run audit:context`：PASS。
- `npm run pack:dry-run`：64 entries，不含 custom agents。
- `git diff --check`：PASS。
- `git diff --exit-code -- scheduler/src/pr-tracker.ts scheduler/src/worker-runner.ts`：PASS。

## 残余风险

- scheduler 仍使用 legacy 全证据链；这是明确延期边界，后续系统测试时单独收敛。
- 旧安装中的 agents 只在下次运行 installer 时迁移；用户漂移与 unmanaged 文件按设计保留。
- 文件系统 canonical 检查保留通常的 TOCTOU 残余，但未扩大可写/可删路径。

## Verdict

PASS

## 会话注意力摘要

- **阶段**: `review-change`
- **阶段结论**: `PASS`
- **注意力等级**: `skim`
- **判断变化**: profile/disposition、迁移、刷新与权限实现已满足 contract；无 blocking finding。
- **关键发现**: 控制标签 fail-closed，Strict 无特殊降级，scheduler/model routing 保持范围外。
- **阻塞项**: 无。
- **残余风险**: scheduler legacy 边界与 installer 激活时机需知悉。
- **人类动作**: 知悉；无需介入。
- **自动下一步**: 生成 Strict walkthrough 并继续 PR lifecycle。
- **完整证据**: `.legion/tasks/workflow-profiles-model-routing-v1/docs/review-change.md`
