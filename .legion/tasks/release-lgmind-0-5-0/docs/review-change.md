# `lgmind` 0.5.0 版本准备独立审查

## Scope 与 correctness

- `0.4.0 -> 0.5.0` 符合仓库既定的 `0.x` 用户可见能力 minor 发布规则。
- 产品 diff 仅根 `package.json` 版本；scheduler 保持 `0.0.0`，publish workflow 与 scheduler 均无 diff。
- release notes 已区分 npm CLI managed 安装面与仓库 `opencode.json` 权限基线；installer 不覆盖用户配置。

## 证据重算

- root regression：44/44 PASS。
- context audit：PASS。
- pack：`lgmind@0.5.0`，64 entries；包含 `profile-policy.mjs`、`refresh-main-workspace.mjs` 与 installer 必需 skills。
- package surface 不含 `.opencode/agents/**`、scheduler、task docs、tests、worktrees 或 runtime TS。
- npm 当前 `latest=0.4.0`；`lgmind@0.5.0` 返回 E404，版本未占用。
- 既有 OIDC workflow 保持回归 → pack → publish 顺序，不依赖本机 token/OTP。

## Findings

- Blocking findings：无。
- 既有 workflow actions 使用 `@v6` 主版本标签而非 commit SHA，是未扩大的供应链残余风险。
- `REL-050-DISTRIBUTION` 必须保持 `DEFERRED`，直到 merge 后 workflow、registry、首次安装、幂等复跑和 strict verify 完成。

## Verdict

PASS

## 会话注意力摘要

- **阶段**: `review-change`
- **阶段结论**: `PASS`
- **注意力等级**: `skim`
- **判断变化**: 0.5.0 semver 与窄 scope 合规；64 项包完整包含 profile/refresh/installer 资产且排除 custom agents。
- **关键发现**: registry 唯一性与 OIDC 发布前门已独立重算；release notes 未混淆仓库配置与 CLI 安装面。
- **阻塞项**: 无。
- **残余风险**: 公开分发仍为 DEFERRED；版本不可覆盖，发布后必须核对锁定 SHA、registry 与干净安装闭环。
- **人类动作**: 知悉；无需介入。
- **自动下一步**: 推进版本准备 PR；发布后重新验证分发结果。
- **完整证据**: `.legion/tasks/release-lgmind-0-5-0/docs/review-change.md`
