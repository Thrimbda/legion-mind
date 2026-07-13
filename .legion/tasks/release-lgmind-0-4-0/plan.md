# 发布 `lgmind` 0.4.0

## 目标

把已经合并到 `origin/master` 的 LegionMind 注意力路由、认知验证与报告一致性改进正式发布为 `lgmind@0.4.0`，使其他机器能够通过 npm 获得当前仓库的新资产，并完成可追溯的提交、合并、发布和真实安装验证。

## 问题陈述

当前仓库根 `package.json` 与 npm `latest` 仍为 `0.3.1`，因此其他机器执行 `npx lgmind@latest` 无法获得已经进入 `origin/master` 的新报告解析器、校验器和验证协议。仓库已有经历史发布验证的 GitHub Actions trusted publishing 路径，本次应复用该路径，而不是依赖本机 npm 登录态。npm 版本一旦成功发布不可覆盖，因此必须先验证合并来源、回归结果和实际打包内容，再执行公开发布。

## 验收标准

- 根 `package.json` 的版本由 `0.3.1` 精确更新为 `0.4.0`，不修改独立的 scheduler 包版本。
- `npm run audit:context`、`npm run test:regression` 与 `npm run pack:dry-run` 通过。
- 待发布包标识为 `lgmind@0.4.0`，并显式确认包含报告 verdict 解析、report-data 校验、schema/template、认知验证协议、注意力协议、subagent 命名器与 context manifest 等当前关键资产。
- 版本准备改动通过隔离 worktree、commit、push、PR、checks/review 与 squash merge 进入 `master`；不直接提交或推送 `master`。
- 发布前确认 npm 尚不存在 `lgmind@0.4.0`，并确认发布工作流使用合并后的 `master` 提交。
- 从合并后的 `master` 触发 `.github/workflows/publish-npm.yml`，工作流成功完成回归、打包检查与公开发布。
- npm registry 返回 `version=0.4.0` 且 `dist-tags.latest=0.4.0`。
- 在不依赖本地仓库的干净临时目录中，固定版本 `npx` 能输出 `0.4.0`、完成安装，并通过 `verify --strict`；安装结果包含本次关键新增资产。
- 发布结果、workflow URL、提交 SHA、registry 与真实安装证据回写到任务文档和 wiki；相关 PR 到终态后清理 worktree并刷新主工作区。

## 假设 / 约束 / 风险

### 假设

- 用户明确指定 `0.4.0`，该 semver 目标已确认。
- 发布内容以执行时最新的正式 `origin/master` 为基线，不夹带未合并分支。
- GitHub 仓库的 npm trusted publisher 仍与现有发布工作流匹配；历史成功记录只作为前置证据，当前发布仍须重新验证。

### 约束

- 所有修改只在 `.worktrees/release-lgmind-0-4-0/` 的 `codex/release-lgmind-0-4-0` 分支完成。
- npm 发布只能来自合并后的 `master`，并通过现有 `workflow_dispatch` 发布工作流执行。
- 不提交 npm token、OTP、缓存、tarball 或其他秘密/临时产物。
- 人类阅读型新增或修改文档使用中文；命令、路径、schema 字段和原始输出保持原样。
- 若验证要求改变 `package.json.files`、安装器行为或发布工作流，停止当前 approved-design continuation，并升级到正式 RFC。

### 风险

- npm 发布不可覆盖；错误包只能通过后续修复版本纠正。
- 递归 allowlist 或 prepack 生成漂移可能造成仓库与发布包不一致。
- 发布时若 `master` 已新增提交，可能把未经本任务验证的内容一并发布；触发前必须重新锁定并核对 SHA。
- trusted publisher 配置可能漂移；发布失败后必须先确认 registry 实际状态，不得盲目重跑或改用本地 token 绕过。

## 要点

- 这是既有发布设计的延续：版本准备 PR → 合并 `master` → OIDC 发布 → registry/npx 验证 → 发布结果收口 PR。
- 版本单一真源是根 `package.json`；现有 `prepack` 会重新生成 runtime JS。
- 真正完成标准是 registry 中的固定版本与 `latest` 正确，且干净环境安装和严格校验通过；workflow 单独变绿不等于完成。
- 实现改动低风险，公开发布操作中高风险；既有发布设计已批准且无设计分叉，因此采用 approved-design continuation，不重做 RFC。

## 范围

### 范围内

- 根 `package.json` 版本更新为 `0.4.0`。
- `.legion/tasks/release-lgmind-0-4-0/**` 中文任务、验证、审查、walkthrough 与发布结果证据。
- 必要的 `.legion/wiki/**` 发布状态更新。
- context audit、回归测试、pack 内容检查、PR lifecycle、GitHub Actions trusted publish、registry/npx smoke 与最终清理。
- 若验证发现与 `0.4.0` 可安装性直接相关的 release blocker，仅修复该 blocker；出现设计变化时先升级设计门。

### 非目标

- 不新增或重设计 CLI、installer、schema、协议、agent 或报告行为。
- 不修改 npm package name、registry、public access、Node engine、trusted-publishing 架构或 scheduler 独立包版本。
- 不创建 git tag；仓库当前没有 release tag 约定。
- 不从未合并分支、本地主工作区或本机 npm 凭据直接发布。
- 不把其他开放 PR 的未合并内容纳入本次版本准备。

## 关键主张

### `REL-040-ARTIFACT`

- 单一主张：`lgmind@0.4.0` 待发布 artifact 完整包含当前主干需要的安装资产，并保持 CLI/setup lifecycle 可运行。
- 验收/风险关系：对应打包内容、回归与干净安装验收；错误会使其他机器继续拿不到或无法运行新功能。
- 三轴：`objective / now / routine`。
- `domain-id`：`npm-package-artifact`。
- `required-capability`：npm pack 文件集检查与 Node CLI/runtime 回归验证。
- `required-method`：context audit、回归套件、`npm pack --dry-run --json`、关键路径逐项断言。
- 原始证据：任务内命令输出、pack JSON 与关键文件清单。
- `criticality`：`high`；`blocking-policy`：`block-merge`；当前状态：`INCONCLUSIVE`；owner：`verify-change`。

### `REL-040-DISTRIBUTION`

- 单一主张：从指定的合并后 `master` SHA 发布后，npm `latest` 指向 `0.4.0`，且干净环境可通过 `npx` 安装并严格校验。
- 验收/风险关系：对应公开发布、registry 与真实安装验收；错误会占用版本但无法正确交付。
- 三轴：`objective / deferred / routine`。
- `domain-id`：`npm-registry-distribution`。
- `required-capability`：GitHub Actions run、npm registry 查询与干净环境安装验证。
- `required-method`：workflow run + `npm view` + 固定版本 `npx` version/install/strict verify + 关键资产存在性检查。
- 原始证据：workflow URL/SHA、registry JSON 与 smoke 输出。
- `criticality`：`high`；`blocking-policy`：`defer-by-contract`；当前状态：`DEFERRED`；owner：发布编排器。
- 触发：版本准备 PR squash merge，且发布工作流结束。
- 所需数据：合并 SHA、workflow checkout SHA/结论、registry 版本与 dist-tag、隔离安装输出；验收条件为逐项一致且全部成功。
- 停止条件：版本已存在但来源不明、workflow SHA 不等于待发布 master、发布后 registry/安装任一失败。
- 后续任务：本任务的发布结果收口阶段；PASS 时更新主张为 `PASS` 并记录发布完成，FAIL 时停止重跑、保留证据并准备新的修复版本决策。

## 设计索引

- 已批准发布实现：`.github/workflows/publish-npm.yml`。
- 包边界与验证入口：`package.json`。
- 历史发布模式：`.legion/tasks/release-lgmind-0-2-0/plan.md`。
- 本任务不新增 RFC；若触发设计漂移，创建 `docs/rfc.md` 并回到 `spec-rfc -> review-rfc`。

## 阶段概览

1. `engineer`：更新版本、建立中文发布说明与有界实现证据。
2. `verify-change`：执行 context audit、回归、pack 内容断言与发布前唯一性检查。
3. `review-change`：独立审查版本边界、供应链风险、验证覆盖与发布就绪度。
4. `report-walkthrough`：生成评审摘要、HTML 与 PR body。
5. `legion-wiki`：写回当前发布状态与复用模式。
6. Git lifecycle：commit、rebase、push、PR、checks/review、squash merge。
7. 发布与收口：从合并后 `master` 触发发布、验证 registry/npx，提交发布结果收口 PR，最终清理与刷新。
