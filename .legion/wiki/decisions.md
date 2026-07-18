# Legion Decisions

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
