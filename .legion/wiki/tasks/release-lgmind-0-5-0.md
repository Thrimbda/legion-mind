# release-lgmind-0-5-0

## 元数据

- `task-id`: `release-lgmind-0-5-0`
- `status`: `completed`
- `risk`: `medium`
- `schema-version`: `profile-disposition-v1`
- `historical`: `false`
- `supersedes`: `release-lgmind-0-4-0`
- `superseded-by`: `(none)`

## 结果摘要

- `lgmind@0.5.0` 已从版本准备 PR #57 的 squash merge `11890ac495e51f744e68897374a395e26e1dfa08` 公开发布；workflow run `29640042610` 成功且 `headSha` 一致。
- npm fixed version 与 `dist-tags.latest` 均为 `0.5.0`。
- 固定版本隔离安装首次 `copied=44`，幂等复跑 `skipped=44`，`verify --strict` 返回 `READY`。
- CLI 安装的新 `profile-policy.mjs`、`refresh-main-workspace.mjs` 与 workflow skill 均和 locked master 一致；安装树不含 custom agents。
- CLI managed surface 不覆盖用户 `opencode.json`；权限变化是仓库默认配置基线。

## 相关原始来源

- `plan`: `.legion/tasks/release-lgmind-0-5-0/plan.md`
- `test`: `.legion/tasks/release-lgmind-0-5-0/docs/test-report.md`
- `review`: `.legion/tasks/release-lgmind-0-5-0/docs/review-change.md`
- `release notes`: `.legion/tasks/release-lgmind-0-5-0/docs/release-notes.md`
- `publish result`: `.legion/tasks/release-lgmind-0-5-0/docs/publish-result.md`

## 备注

- 本任务复用既有 trusted-publishing 模式，没有新增发布机制，因此不修改 `patterns.md`。
- 精确版本、registry 和安装证据以 `package.json`、workflow run 与任务 raw docs 为准。
