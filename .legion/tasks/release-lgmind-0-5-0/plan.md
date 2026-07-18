# 发布 `lgmind` 0.5.0

## 目标

把已合并的 Legion profile、条件交付、OpenCode custom-agent 退役、安全安装迁移与主工作区刷新改进正式发布为 `lgmind@0.5.0`，确保用户通过 npm CLI 能完整安装当前主干资产。

## 验收标准

- [ ] 根 `package.json` 从 `0.4.0` 升至 `0.5.0`，scheduler 版本不变。
- [ ] root regression、context audit 与 pack dry-run 通过；包标识为 `lgmind@0.5.0`，包含新 profile/refresh scripts，不含 `.opencode/agents/**`。
- [ ] 版本准备通过隔离 worktree、PR 与 squash merge 进入 `master`。
- [ ] 从合并后的 `master` 触发既有 trusted-publishing workflow，workflow checkout SHA 与锁定的 `master` 一致。
- [ ] npm fixed version 与 `latest` 均为 `0.5.0`。
- [ ] 干净隔离目录中固定版本 `npx lgmind@0.5.0 install` 首次安装、幂等复跑与 `verify --strict` 全部通过。
- [ ] 安装结果包含 `profile-policy.mjs`、`refresh-main-workspace.mjs` 与更新后的 workflow skill，不含 custom agents。
- [ ] 发布结果回写当前任务与 Wiki，收口 PR 合并后清理 worktree并刷新主工作区。

## 范围与约束

- 复用 `.github/workflows/publish-npm.yml` 与既有 `0.4.0` 发布设计，不重设计 CLI、installer、registry、trusted publishing 或 scheduler。
- 版本准备仅修改根包版本及本任务证据；若发现可安装性 blocker，只修复直接 blocker，出现设计分叉则停止升级。
- npm 版本不可覆盖；发布前必须确认 `0.5.0` 不存在，发布失败先核对 registry 状态，不盲目重跑。
- 不使用本机 npm token/OTP，不提交 cache、tarball、安装树或秘密。

## 风险与流程

- 风险：Medium / Standard。公开版本不可覆盖，但采用已验证的 OIDC workflow，失败可通过后续 patch forward-fix。
- 阶段：`engineer -> verify-change -> review-change`；delivery 为 summary；发布完成后 Wiki disposition 为 write。
- 设计来源：`.github/workflows/publish-npm.yml`、`.legion/wiki/patterns.md` 的既有发布模式与 `.legion/tasks/release-lgmind-0-4-0/plan.md`。

## 非目标

- 不改外部交付授权、scheduler、per-spawn model routing 或真实效率 benchmark。
- 不创建 git tag，不发布 scheduler 子包，不改 npm package name 或 Node engine。
