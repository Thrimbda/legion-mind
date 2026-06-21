# 移除 lgmind install 的 runtime 选择

## Task contract

- **Name:** 移除 `lgmind install` 的 runtime 选择
- **Task ID:** `remove-runtime-install-choice`
- **Goal:** 让 `lgmind install` / `lgmind setup` 的默认交互流程只询问安装范围 `project` / `global`，不再让用户选择 OpenCode / OpenClaw runtime，并将发布版本更新到 `0.3.1`。
- **Problem:** `lgmind@0.3.0` 默认交互会先问 “Choose an agent runtime to configure: OpenCode / OpenClaw”。用户反馈这个选择没有实际价值，因为当前核心安装面都落在 `.agents` 相关位置；first-run 体验应该直接聚焦唯一有意义的选择：安装到当前项目还是全局。

## Acceptance

- TTY 下执行 `lgmind install` 或 `lgmind setup` 时，不再出现 OpenCode / OpenClaw runtime 选择提示。
- 默认交互只询问 install scope：`project` 或 `global`。
- 非 TTY / 脚本化调用仍然不会 hang，并保持确定性默认行为。
- `--scope project|global` 继续作为脚本化入口。
- 已有兼容入口不被无意破坏：`setup-opencode` alias 和低层 OpenCode/OpenClaw setup lifecycle 仍保持可用。
- README、CLI help、regression tests 与 generated JS runtime 同步到新行为。
- `package.json` 版本更新为 `0.3.1`，并通过可信发布流程发布后验证 npm `latest = 0.3.1`。
- 任务证据、review、walkthrough 与 wiki writeback 完成。

## Scope

- 更新 `scripts/lgmind.ts` 的 product-level `install` / `setup` 默认交互逻辑。
- 重新生成 `scripts/lgmind.js` 与相关 runtime JS。
- 更新 README、CLI help 与 regression tests，使它们只描述 scope 选择。
- 更新 package 版本到 `0.3.1`。
- 按 Legion + worktree + PR + trusted publishing lifecycle 完成交付。

## Non-goals

- 不重写底层 setup lifecycle、manifest、rollback、verify 或 uninstall 语义。
- 不引入新的 runtime 选择器或新的 agent runtime。
- 不移除 `setup-opencode` alias 或底层 OpenClaw setup 脚本。
- 不改变 npm trusted publishing 工作流结构，除非发布验证暴露必要问题。
- 不在主工作区直接实现或提交。

## Assumptions

- 用户要求的“不要选这两个”特指 `lgmind install` 默认交互里的 OpenCode / OpenClaw runtime prompt。
- `lgmind` product-level 默认安装面应被视为 LegionMind shared agent assets 安装；scope 是用户唯一需要主动决策的维度。
- 保留低层 runtime-specific setup 能降低兼容风险，但它们不应再出现在默认 first-run prompt 中。
- `0.3.0 -> 0.3.1` 是修正同一 minor 能力下的 UX 行为，使用 patch 版本符合预期。

## Constraints

- Worktree: `.worktrees/remove-runtime-install-choice/`
- Branch: `legion/remove-runtime-install-choice`
- Base: `origin/master`
- npm 命令使用 repo-local cache：`npm_config_cache=.cache/npm`
- push 前必须在 worktree 内执行 `git fetch origin && git rebase origin/master`。
- 发布必须从已合并的 `master` 通过 `.github/workflows/publish-npm.yml` trusted publishing 完成。

## Risks

- 移除 runtime prompt 时若仍保留过多 runtime 文案，会造成 docs/help 与实际行为不一致。
- 兼容 flags（如历史 `--agent` / `--runtime`）处理不当可能破坏现有脚本。
- generated JS runtime 与 TS source 容易漂移，必须通过 `build:runtime-js` 和 regression 锁定。
- 交互测试必须避免依赖真实用户 home 或真实 TTY。

## Recommended direction

- 将 `lgmind install` / `setup` 的 product-level default path 固定为一个默认 runtime/backend；用户不再需要在 prompt 中看到 runtime 概念。
- 保留 `--scope project|global`，TTY 下缺少 scope 时只 prompt scope。
- 非 TTY 缺少 scope 时使用确定性默认值，避免 CI hang。
- 对历史 `--agent` / `--runtime` 维持兼容或降级为非默认路径，但不要在 README first-run path 中继续推荐。
- 使用 regression 覆盖“无 runtime prompt、只有 scope prompt、project/global 路径映射、installed package bin 可执行”。

## Phases

1. 打开隔离 worktree 并物化 task contract。
2. 恢复当前 CLI / test / docs 状态，确认 runtime prompt 的来源。
3. 实现 scope-only 交互与版本更新。
4. 更新 README/help/tests/generated JS。
5. 运行 regression、runtime build 与 pack dry-run。
6. 记录 test-report、review-change、report-walkthrough 与 wiki writeback。
7. commit、rebase、push、创建/合并 PR，清理 worktree 并刷新主工作区。
8. 发布 `lgmind@0.3.1` 并验证 npm latest。
