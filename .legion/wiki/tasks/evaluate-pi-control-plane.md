# evaluate-pi-control-plane

## Metadata

- `task-id`: `evaluate-pi-control-plane`
- `status`: `delivery-ready`
- `risk`: `medium`
- `schema-version`: `2026-08`
- `historical`: `false`
- `supersedes`: `(none)`
- `superseded-by`: `(none)`

## Outcome Summary

评估"Legion 从 OpenCode 腾挪到 Pi、以控制平面为终态组成个人 harness"：结论 **GO，分六阶段（M1–M6）**。先建 Pi runtime parity（M1 交互 runtime、M2 scheduler worker），再建控制平面（M3 内核、M4 subagent backend、M5 操作面、M6 fleet/computer-use），每阶段是独立 Legion 任务、各自过设计门。OpenCode 线冻结作为全程退路。

当前有效结论：Pi 核心链路（skills 加载、print/JSON、RPC、SDK、pi-subagents 派生）已 smoke-proven（2026-08-16）；pi-web/pi-goal/pi-mcp-adapter/browser/computer-use 为 doc-level；审批闸、Wayland、macOS 节点为 unknown 并绑定到对应阶段 PoC。提案核实发现多处失真（LSP 应选 pi-lens、skills 目录需显式配置、内置工具默认 4/7、pi-web 无认证且内部 route 不可依赖、glla AGPL 不纳入），已在 rfc/research 中修正。

仍然是历史快照的地方：所有版本号与默认值均为 2026-08-16 当日快照，Pi 生态迭代极快，实施任务启动时必须复核。

## Reusable Decisions

- 迁移决策与路线图真源：`.legion/tasks/evaluate-pi-control-plane/docs/rfc.md`；M1–M6 各自独立过设计门。
- 目标架构裁决：Pi 拥有 session/模型/工具循环；Legion 控制平面拥有 goal/任务图/审批/租约/证据/记忆；pi-web 只作 operator console，不作 backend；不依赖 pi-web 内部 HTTP route。
- managed profile 不装 pi-goal（goal 判定属 Legion）；`pi-goal-list-loop-audit` 因 AGPL-3.0-only 不纳入任何分发路径。
- subagent 第一版 backend 委派 pi-subagents（pin 版本 + 启动矩阵）；切换 SDK child sessions 的判据已写入 RFC §6.2。
- 生态评估方法：外部 runtime/扩展 claims 必须一手核实并按 smoke-proven / doc-level / unknown 分级；同名包陷阱多，安装必须带 scope 核对作者。

## Related Raw Sources

- `plan`: `.legion/tasks/evaluate-pi-control-plane/plan.md`
- `log`: `.legion/tasks/evaluate-pi-control-plane/log.md`
- `tasks`: `.legion/tasks/evaluate-pi-control-plane/tasks.md`
- `rfc`: `.legion/tasks/evaluate-pi-control-plane/docs/rfc.md`
- `research`: `.legion/tasks/evaluate-pi-control-plane/docs/research.md`
- `reviews`: `.legion/tasks/evaluate-pi-control-plane/docs/review-rfc.md`
- `report`: `.legion/tasks/evaluate-pi-control-plane/docs/report-walkthrough.md`
