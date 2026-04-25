# LegionMind 入口规则

本仓库使用 Legion。

在任何由 Legion 管理的非简单多步骤工程工作开始代码、git、文件探索，或开始实现、追问、派生子代理之前：

1. 先加载 `legion-workflow`。它是由 Legion 管理工作的 mandatory first gate。
2. 严格遵循它的入口门规则。
3. 用户指令始终优先。

不要绕过这条入口序列。不要先打补丁再补规则，不要忽略 `.legion/`，不要在当前请求没有明确恢复任务时跳过 `brainstorm`，也不要在任务契约尚未稳定前启动 `engineer`。
