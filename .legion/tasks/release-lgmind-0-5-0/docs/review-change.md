# `lgmind` 0.5.0 独立审查

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

## 发布后复核

- PR #57 merge SHA 与 workflow run `29640042610` 的 `headSha` 均为 `11890ac495e51f744e68897374a395e26e1dfa08`；workflow conclusion 为 `success`。
- npm fixed version 与 `latest` 均为 `0.5.0`；integrity、shasum 和 registry provenance 与 `publish-result.md` 一致。
- registry tarball 为 64 entries，不含 custom agents；profile policy、refresh script 与 workflow skill 和 locked master 逐项一致。
- 首次安装、幂等复跑与 strict verify 已闭环；首轮 fixture 误改被如实保留并已恢复，当前 `package.json`、scheduler 与 publish workflow 无 diff。
- Wiki 已更新为 `0.5.0` current truth，且没有宣称 CLI 覆盖用户 `opencode.json`。

## Findings

- Blocking findings：无。
- 既有 workflow actions 使用 `@v6` 主版本标签而非 commit SHA，是未扩大的供应链残余风险。
- 历史 `REL-050-DISTRIBUTION=DEFERRED` 保留；当前继任主张 `REL-050-DISTRIBUTION-RESULT=PASS`。

## Verdict

PASS

## 会话注意力摘要

- **阶段**: `review-change`
- **阶段结论**: `PASS`
- **注意力等级**: `skim`
- **判断变化**: distribution successor claim 已由 workflow/SHA、registry、tarball 与实际安装重算为 PASS；fixture 误改已恢复且无残留。
- **关键发现**: 64 项包完整包含 profile/refresh/installer 资产且排除 custom agents；Wiki 与 CLI managed surface 边界一致。
- **阻塞项**: 无。
- **残余风险**: npm `0.5.0` 不可覆盖；后续缺陷只能发布新版本 forward-fix。
- **人类动作**: 知悉；无需介入。
- **自动下一步**: 完成发布结果收口 PR lifecycle。
- **完整证据**: `.legion/tasks/release-lgmind-0-5-0/docs/review-change.md`、`.legion/tasks/release-lgmind-0-5-0/docs/publish-result.md`
