# pi-distro-skeleton

## Metadata

- `task-id`: `pi-distro-skeleton`
- `status`: `delivery-ready`
- `risk`: `low`
- `schema-version`: `2026-08 / report-data v1.1`
- `historical`: `false`
- `supersedes`: `(none)`
- `superseded-by`: `(none)`

## Outcome Summary

- Legion Pi 现有可发布骨架以 Node.js 24+、独立 profile 和单一 `legion-pi.json` 为用户入口；配置于 2026-08-17 记录四个精确版本，独立验证于 2026-08-18 再次核对 registry。
- `setup-pi install|verify|rollback` 管理 generated settings、受限 subagent config、skills、managed manifest 与备份恢复，并默认保留用户漂移。
- Package validator、credential-free startup probe 与八行组合矩阵证明包、entrypoint 和 required tools 都在 profile 内；真实 fresh/idempotent install、11/11 目标回归和 59/59 完整回归均通过。
- 当前实现、独立验证和独立审查为 `PASS`，已达到 delivery-ready；PR merge、worktree cleanup 与主工作区刷新仍待 lifecycle 完成。
- Web backend 继续属于 `0XC-302`；OpenCode 配置、skills 内容与现有 setup lifecycle 未修改。

## Reusable Decisions

- 用户配置只接受 `schemaVersion`、`reviewedAt`、精确 `packages` 与 `skills`；provider、model、credential、tools、Web 设置和未知字段 fail closed。
- 安装、验证、探针与 rollback 只操作显式 profile；generated artifacts 不是第二个用户配置源。
- Pi 生态 pin 变更必须重新核对 manifest、license、entrypoint，并运行完整扩展组合启动矩阵。
- 当前信任模型是 Linux、Node.js 24+、单用户单 writer；不要把当前证据外推为并发文件系统、其他 OS/runtime、credentialed provider 或供应链签名保证。

## Related Raw Sources

- `plan`: `.legion/tasks/pi-distro-skeleton/plan.md`
- `log`: `.legion/tasks/pi-distro-skeleton/log.md`
- `tasks`: `.legion/tasks/pi-distro-skeleton/tasks.md`
- `version review`: `.legion/tasks/pi-distro-skeleton/docs/version-review.md`
- `verification`: `.legion/tasks/pi-distro-skeleton/docs/test-report.md`
- `review`: `.legion/tasks/pi-distro-skeleton/docs/review-change.md`
- `report data`: `.legion/tasks/pi-distro-skeleton/docs/report-data.json`
- `report`: `.legion/tasks/pi-distro-skeleton/docs/report-walkthrough.md`、`.legion/tasks/pi-distro-skeleton/docs/report-walkthrough.html`、`.legion/tasks/pi-distro-skeleton/docs/pr-body.md`

## Notes

- 当前设计、配置与 registry 证据分别是 2026-08-16、17、18 的连续快照；未来升级以新任务证据为准。
- 精确运行时行为以 `legion-pi/**`、`scripts/setup-pi.*`、`scripts/lib/pi-distro.*` 与回归测试为真源，本页不复制实现细节。
