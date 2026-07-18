# `lgmind` 0.5.0 版本准备验证

## 验证范围

- 根包版本与 scheduler 边界
- root regression、上下文预算与 runtime JS 同步
- npm pack 标识、关键资产和 custom-agent 排除
- npm registry 版本唯一性

## 结果

1. `npm run build:runtime-js`：PASS；没有产生版本范围外的 runtime diff。
2. `npm run test:regression`：PASS，44/44。
3. `npm run audit:context`：PASS；hot `24,795 / 42,000`，medium closure `35,938 / 59,000`。
4. `npm run pack:dry-run`：PASS；artifact 为 `lgmind@0.5.0`，64 entries。
5. pack 行为断言：PASS；包含：
   - `skills/legion-workflow/scripts/profile-policy.mjs`
   - `skills/git-worktree-pr/scripts/refresh-main-workspace.mjs`
   - 更新后的 workflow、installer 与 report assets
6. pack 排除断言：PASS；不存在 `.opencode/agents/**`。
7. `npm view lgmind@0.5.0 version --json`：预期 `E404 No match found for version 0.5.0`，证明发布前该不可覆盖版本尚未占用。
8. `git diff --check`：PASS；scheduler package/version 与发布 workflow 无 diff。

## 主张状态

- `REL-050-ARTIFACT`：PASS。待发布包完整包含本次 CLI 安装所需的新资产，版本与包边界一致。
- `REL-050-DISTRIBUTION`：DEFERRED。必须在版本准备 PR 合并后，从锁定的 `master` 触发 trusted-publishing workflow，并以 registry 与隔离安装结果形成继任结论。

## 残余风险

- npm 版本不可覆盖；发布 workflow 失败时先查询 registry，禁止盲目重跑。
- `npm` 输出存在本机 `Unknown env config "tmp"` warning，不影响退出码、artifact 或验证结论。

## Verdict

PASS

## 会话注意力摘要

- **阶段**: `verify-change`
- **阶段结论**: `PASS`
- **注意力等级**: `skim`
- **判断变化**: `lgmind@0.5.0` artifact 已通过版本、回归、预算、pack 与唯一性门；公开分发仍按 contract 延后到 merge 后。
- **关键发现**: 新 profile/refresh scripts 已进入包，custom agents 未进入包，scheduler 保持范围外。
- **阻塞项**: 无。
- **残余风险**: npm 版本不可覆盖；发布后必须执行 registry 与干净安装验证。
- **人类动作**: 知悉；用户已明确要求发布，无需再次确认。
- **自动下一步**: 独立 `review-change` 后推进版本准备 PR。
- **完整证据**: `.legion/tasks/release-lgmind-0-5-0/docs/test-report.md`
