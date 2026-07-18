# `lgmind` 0.5.0 发布验证

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
- `REL-050-DISTRIBUTION`：DEFERRED。该历史状态对应版本准备时点，不追溯改写。
- `REL-050-DISTRIBUTION-RESULT`：PASS。版本准备 PR #57 合并后，workflow run `29640042610` 从同一 locked SHA 成功发布；registry、首次安装、幂等复跑、strict verify 与关键资产一致性全部通过。完整证据见 `docs/publish-result.md`。

## 残余风险

- npm 版本不可覆盖；本次已成功发布，后续缺陷只能用新 patch/minor forward-fix。
- `npm` 输出存在本机 `Unknown env config "tmp"` warning，不影响退出码、artifact 或验证结论。
- 首轮 smoke fixture 的 `npm init --prefix` 误改主工作区后已精确恢复；当前 `package.json` 与 `HEAD` 无 diff。

## Verdict

PASS

## 会话注意力摘要

- **阶段**: `verify-change`
- **阶段结论**: `PASS`
- **注意力等级**: `skim`
- **判断变化**: `lgmind@0.5.0` artifact 与公开分发均已通过；历史 DEFERRED 由新的 distribution result PASS 继任。
- **关键发现**: workflow SHA、registry fixed/latest、首次安装、幂等复跑、strict verify 与 profile/refresh 资产一致性全部闭环；custom agents 未进入安装树。
- **阻塞项**: 无。
- **残余风险**: npm 版本不可覆盖；既有 workflow actions 使用主版本标签，CLI 不覆盖用户 `opencode.json`。
- **人类动作**: 知悉；无需介入。
- **自动下一步**: 独立复核发布结果后完成收口 PR。
- **完整证据**: `.legion/tasks/release-lgmind-0-5-0/docs/test-report.md`、`.legion/tasks/release-lgmind-0-5-0/docs/publish-result.md`
