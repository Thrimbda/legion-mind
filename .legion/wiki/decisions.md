# Legion Decisions

## 决策：同一 Legion task 的 PR 配额固定为 0..1

- 来源任务：`enforce-single-pr-lifecycle-v1`
- 当前规则：每个 `repoKey + taskId` 最多绑定一个 PR；首次绑定的 host/owner/repo/number identity 不可替换。所有仓库产物与修订必须在该唯一 PR terminal 前进入同一分支。
- 终态边界：PR merged/closed 后进入 external-only；只允许外部发布/部署、只读验证、worktree cleanup、主工作区 refresh 与最终报告，不再改 task/wiki/report，也不创建 closeout、publish-result、deploy-result、wiki-only 或其他第二 PR。
- 状态语义：PR-backed task 的 repo evidence 以 `delivery-ready` 结束；GitHub 与 Scheduler 保存 checks/review/merge/cleanup/refresh 的 delivery terminal，不要求合并后把仓库状态追写为 `completed`。
- 失败语义：纯外部动作可重试；任何需要仓库改动的修复或回滚都结束原 task，只有用户明确创建的新 task 才拥有新的 `0..1` PR 配额。

## 决策：Legion 任务使用只升不降的三档 profile

- 来源任务：`workflow-profiles-model-routing-v1`
- 当前规则：`risk:low|medium|high` 默认映射 Lite/Standard/Strict；显式 profile 与 semantic trigger 只能升级。LOC、文件数、耗时或执行者自报不能降级。
- 最低阶段：Lite 为 `engineer -> verify-change`；Standard 增加独立 `review-change`；Strict 强制 `spec-rfc -> review-rfc -> engineer -> verify-change -> review-change`，且验证/review 与实现判断分离。
- 高风险触发：安全/权限、持久数据/schema、外部协议、秘密/签名、破坏性动作和困难回滚必须升级。

## 决策：walkthrough 与 Wiki 使用独立 disposition

- 来源任务：`workflow-profiles-model-routing-v1`
- Delivery：`summary < walkthrough`；Strict 最低为 walkthrough，Lite/Standard 可显式升级，不可向下覆盖。
- Wiki：`no-change < write`；只有跨任务当前决定、模式、维护事项或当前真相才写 Wiki。no-change 不创建占位页。
- 二者互不蕴含；walkthrough 不反向把 Standard 升级为 Strict 设计门。

## 决策：OpenCode custom agents 退出安装面

- 来源任务：`workflow-profiles-model-routing-v1`
- 删除 `.opencode/agents/*` 与 `default_agent`，不再打包、安装或校验 custom agents；这不取消独立执行上下文。
- OpenCode 允许只读 `webfetch`/`websearch`，`external_directory` 保持 `ask`，危险 shell deny 保留。
- 升级安装只迁移 manifest 中 `<configDir>/agents/**` 的旧 managed files；用户漂移默认保留，required source 缺失时在写入前 fail closed。
