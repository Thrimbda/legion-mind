# `lgmind` 0.5.0 发布说明

`lgmind@0.5.0` 将当前主干的 Legion workflow 改进交付给 CLI 安装用户：

- 新增 Lite、Standard、Strict 风险 profile 与只升不降的控制标签策略。
- walkthrough、Wiki 与日志改为条件化、事件驱动。
- OpenCode custom agents 退出安装面；独立执行上下文仍可由会话、内置 review 或 subagent 提供。
- installer 可安全迁移旧 managed agents，默认保留用户漂移并支持 rollback。
- 仓库内默认 `opencode.json` 权限基线允许 `webfetch`/`websearch`，外部目录保持 `ask`，危险 shell deny 不变；installer 不覆盖用户自己的 OpenCode 配置。
- 新增 detached-HEAD-safe 主工作区刷新脚本。

本版本不修改 scheduler、per-spawn 模型路由或外部交付授权。
