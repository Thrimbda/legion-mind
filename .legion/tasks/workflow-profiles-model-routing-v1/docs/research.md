# 现状调研：分层流程与条件化交付

## 已验证事实

- workflow、dispatch 与 autopilot 曾把实现任务固定为近似同一长链，并无条件要求 walkthrough 与 Wiki。
- 日志最佳实践曾以 15–20 分钟和思考超过 5 分钟触发写入，触发条件与信息价值无关。
- git-worktree 的主工作区刷新曾使用 `git checkout origin/master`，会留下 detached HEAD；本任务开始时主工作区正处于该状态。
- `.opencode/agents/` 保存 7 个 custom agents，`opencode.json` 还指定 `default_agent: legion`；安装脚本、npm 打包、context manifest 和测试都依赖它们。
- `opencode.json` 拒绝外部只读验证与仓库外证据访问，和验证目标冲突；高风险 shell deny 本身仍有价值。
- walkthrough 校验器把 low/medium/high 都反向推向 review/RFC 证据，导致显式生成报告等同于升级整个流程。
- 根回归中有测试直接匹配完整阶段串、说明性句子和 agent 文件内容；这些测试阻止改写表达，却不证明 profile、权限、安装迁移或证据门行为正确。

## 平台能力边界

- Codex custom agent 配置可以固定模型，但当前 `spawn_agent` 调用面没有自由指定 model 的参数。
- OpenCode custom subagent 可以在配置中指定 model；没有配置时继承 primary。Task 调用面没有自由的 per-spawn model 参数。
- 删除 OpenCode custom agents 后，仍可通过新会话、内置 review 或其他独立进程保留审查上下文独立性。
- 因此本次不实现按派生任务选模型：这会重新引入待删除配置层或把“独立上下文”偷换成外部 CLI 进程。待平台提供稳定 per-spawn 能力且有真实效率数据后再设计。

## 设计含义

1. 风险投影为最低 profile：low→Lite、medium→Standard、high→Strict；semantic trigger 和显式 override 只能升级。
2. profile、delivery、Wiki 是三个相关但独立的维度；Strict 强制 walkthrough，Standard/Lite 可显式向上升级。
3. 独立判断是上下文属性，不是 agent 文件属性；删除 custom agents 不取消 Standard/Strict 的独立审查要求。
4. 旧 managed agents 只在 checksum/链接目标仍匹配 manifest 或显式 force 时自动迁移；用户漂移必须保留并告警。
5. scheduler 和真实效率评测明确延期，避免在未经系统测试的自动路径上同时引入新策略。
