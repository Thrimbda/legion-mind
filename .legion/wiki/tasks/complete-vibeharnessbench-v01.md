# complete-vibeharnessbench-v01

## 任务摘要

- 目标：把 `vibe-harness-bench` 从 MVP contract-verifier path 升级为完整 local-first semantic v0.1 benchmark。
- 风险级别：High；涉及 HUT runtime、protected verifier/oracle/negative controls、hidden test 防泄露与多语言 task pack。
- 生产代码范围：`vibe-harness-bench/**`。

## 当前结论

- v0.1 不再以 `contract.json` marker 判 PASS；当前四个 task pack 均配置 `visible_verify_cmd` 与 `hidden_verify_cmd`。
- Runner 输出 final、visible、hidden、runtime verdict；`selfcheck --suite core-v1` 覆盖四个 atomic case 的 oracle 与全部 negative controls。
- Pelican 采用 deterministic animation artifact + manifest 做本地语义验证；不是二进制 GIF pHash/SSIM full stack。
- 2048 采用 Node stdlib reducer/replay/persistence/undo/RNG/UI data-testid 语义验证。
- Systems Go 采用 clean-room Go simulator-style verifier；verifier 把 HUT workspace copy 到 verifier-owned temp root 后注入 Go tests，避免 hidden test 写入 HUT workspace 或 persisted results。
- 验证矩阵 PASS，`review-change` PASS，blocking findings 为 0。

## 证据入口

- Plan：`.legion/tasks/complete-vibeharnessbench-v01/plan.md`
- RFC：`.legion/tasks/complete-vibeharnessbench-v01/docs/rfc.md`
- Implementation Plan：`.legion/tasks/complete-vibeharnessbench-v01/docs/implementation-plan.md`
- RFC Review：`.legion/tasks/complete-vibeharnessbench-v01/docs/review-rfc.md`
- Test Report：`.legion/tasks/complete-vibeharnessbench-v01/docs/test-report.md`
- Change Review：`.legion/tasks/complete-vibeharnessbench-v01/docs/review-change.md`
- Walkthrough：`.legion/tasks/complete-vibeharnessbench-v01/docs/report-walkthrough.md`
- PR Body：`.legion/tasks/complete-vibeharnessbench-v01/docs/pr-body.md`

## 后续注意

- Docker-faithful full stack、binary GIF pHash/SSIM、real RPC process harness、browser/ffmpeg/Playwright checks 仍是 RFC 非阻塞边界，不应被当前 v0.1 结果误报为完成。
- 若未来运行不可信 HUT，应引入 sandbox/container/chroot；当前 local subprocess isolation 只满足本任务 accepted scope。
