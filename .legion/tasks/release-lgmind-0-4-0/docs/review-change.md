# `lgmind` 0.4.0 越界恢复后独立审查

审查实例：`review-change-sunny-badger`

本实例与 `verify-change-brisk-falcon`、此前给出 FAIL 的 `review-change-quick-koala` 均为不同派生会话，也未参与实现或证据修订。本轮重新读取 task contract、认知验证与 attention 协议，独立核对 `origin/master...HEAD`、当前 working diff、OpenCode lockfile、最新断言脚本及原始输出；除本审查文件外未修改实现、验证证据或任务状态。

## 审查结论

- 当前阶段结论：`PASS`，无现存 scope 或实现 blocker。
- `REL-040-ARTIFACT`：`PASS`。越界 lockfile 已精确恢复，当前完整路径集合仅在排除 `.legion/**` 后得到 `['package.json']`；package、资产、版本和 bin 断言均通过。
- `REL-040-DISTRIBUTION`：`DEFERRED`。workflow、registry 切换及干净环境安装尚未发生，不能提前改写为 PASS。
- attention：`review`。历史 scope FAIL 已修复；当前最高 attention 来自完整的 `defer-by-contract`，发布后验证前不得声明任务完成或最终清理。

## 历史审计轨迹

以下事实均保留，不用当前 PASS 抹除此前正确的 FAIL：

1. 提交后为获得独立 reviewer，编排器尝试通过 OpenCode transport 派生会话；transport 因角色限制与凭据刷新 401 失败，同时意外把已跟踪的 `.opencode/package-lock.json` 从既有依赖图更新到新版依赖图。
2. `review-change-quick-koala` 当时独立重跑 fail-closed 断言，正确得到产品集合 `['.opencode/package-lock.json', 'package.json']`，判定 scope 越界并给出 `FAIL / attention:review`。该结论对当时工作树完全成立，阻止了 push、PR 与发布。
3. root 随后只用 `apply_patch` 将 lockfile 精确恢复为 `HEAD` 内容；`engineer-nimble-otter` 只读确认哈希一致且没有其他 `.opencode/**` 副作用。
4. `verify-change-brisk-falcon` 在恢复后重新运行同一有界方法，最新断言 exit 0；原始输出完整列出分支与工作树路径并集，产品过滤结果重新精确为 `package.json`。

因此，本 Verdict 表示“此前 blocker 被真实移除后的当前状态”，不是把历史 FAIL 追溯改写为误报。

## Blockers

无。

## Scope 与实际差异

- 当前基线为 `origin/master=3f71e5a1bab79582327133d035ce740c3b43e784`，分支 `HEAD=be761a8839605139e7b3574d0e83e3cf7cdd6dce`。分支差异由任务内 `.legion/**` 证据、wiki writeback 与根 `package.json` 构成；当前 working diff 只修改本任务的 `.legion/**` 文档和证据。
- 根产品差异精确为 `package.json` 版本 `0.3.1 -> 0.4.0`；`scheduler/package.json` 保持 `0.0.0` 且与远端基线内容一致。
- `reports/assert-package.mjs` 取 `git diff --name-only origin/master...HEAD` 与 `git diff --name-only HEAD` 的去重并集，既覆盖已提交分支差异，也覆盖当前工作树差异。
- 完整 `changedPaths` 在过滤前原样保留；产品集合唯一过滤条件是 `!path.startsWith('.legion/')`。因此 `.opencode/**`、`scripts/**`、`skills/**`、`scheduler/**` 或任何其他源码路径都不会被一起忽略。
- 当前 `.opencode/package-lock.json` 与 `HEAD` 的 SHA-256 均为 `24a4324a5c78b1e46fd00bfe4aa93070582bee2de26ee2f9371d9a236f640e73`；`origin/master...HEAD` 和 `HEAD` working diff 在 `.opencode/**` 下均为空。未发现 lockfile 或其他 OpenCode 副作用残留。

## 正确性、可维护性与验证充分性

- 本 reviewer 独立执行 `node .legion/tasks/release-lgmind-0-4-0/reports/assert-package.mjs`，exit 0。8 项关键资产正向断言及逐项删除的 8 个负例均通过；artifact 为 `lgmind@0.4.0`、69 entries，根版本为 `0.4.0`，scheduler 为 `0.0.0`，两个 bin 均存在、可执行且带 Node shebang。
- 当前输出完整列出 20 个 tracked changed paths；仅排除 `.legion/**` 后，`TRACKED_PRODUCT_DIFF_OK files=package.json`。该输出与 `reports/package-assertions.txt` 一致。
- 版本和 diff 基线使用 `origin/master`，避免提交后把 `HEAD:package.json=0.4.0` 错当旧版本；branch + working union 也避免提交后普通 working diff 为空造成生命周期假阳性。
- `reports/test-regression.txt` 是首次完整验证留下的原始证据，记录 `40/40 PASS` 且无 fail/skip/cancelled/todo。本 reviewer 只重新打开并核对，没有重跑该完整回归，也没有把它冒充成本轮执行。
- 本审查落盘后，renderer `--check` 返回 `CHECK_OK release-lgmind-0-4-0`，`git diff --check` exit 0；报告一致性门与差异格式继续通过。

上述方法可以从“脚本 -> 原始输出 -> 完整路径集合 -> 产品过滤结果 -> claim”重算，足以支持当前 `REL-040-ARTIFACT=PASS`。主动反例既覆盖 8 项资产逐一缺失，也已由真实 lockfile 越界证明产品路径门会 fail closed；独立性与置信度均为 `high`。

## Verifier、authority 与特殊 claim 重查

- `REL-040-ARTIFACT` 与 `REL-040-DISTRIBUTION` 均为 `objective / routine`；npm、Node、git、pack JSON 与 registry 查询足以覆盖当前方法，不需要 domain verifier。
- 无 authority claim。用户的发布授权只允许从合并后锁定 SHA 的 trusted-publishing workflow 发布，不授权忽略 scope 越界，也不能证明未来分发成功。
- `REL-040-DISTRIBUTION.deferredProtocol` 仍完整记录 trigger、owner、method、requiredData、stopCondition、successorTask 与 onPass/onFail；发布后必须重新执行 `verify-change -> review-change`。
- 历史 reviewer、修复确认者、最新 verifier 与本 reviewer 相互独立；不按代理数量放大置信度，只按可重算证据聚合当前状态。

## 安全与供应链视角

本任务命中 npm 发布、OIDC trusted publishing、identity/token 与依赖供应链边界，安全视角适用：

- OpenCode transport 的失败及其 lockfile 副作用已留下审计记录；当前哈希与差异检查证明副作用已移除，而不是靠扩大过滤范围放行。
- 当前任务没有持久化 npm token、OTP、tarball 或 cache，也没有改用本机凭据绕过 trusted publishing。
- 发布仍只能来自合并后锁定的 `master` SHA；workflow checkout SHA 不一致、`0.4.0` 被外部抢先占用或发布后安装失败时，必须停止重跑与完成声明。
- npm 版本不可覆盖，真实分发正确性仍属于延后事实。

## 可选建议

- 后续若再次通过外部 transport 派生 reviewer，应在调用前后自动比较 `git status --porcelain`，将 transport 副作用变成显式失败证据。
- 发布触发前重新锁定 `master` SHA、查询 `0.4.0` 唯一性，并在干净目录固定使用 `lgmind@0.4.0` 完成 version/install/strict verify 与 8 项资产检查。

## Verdict

PASS

本 Verdict 只覆盖恢复后的发布前 artifact 与 scope；`REL-040-DISTRIBUTION` 保持 `DEFERRED`。

## 会话注意力摘要

- 阶段：`review-change`
- 阶段结论：`PASS`
- 注意力等级：`review`
- 判断变化：保留 quick-koala 对当时 lockfile 越界的正确 FAIL；独立确认 apply_patch 恢复后 `.opencode/**` 已无差异，`REL-040-ARTIFACT` 当前恢复为 PASS；`REL-040-DISTRIBUTION` 继续 DEFERRED。
- 关键发现：当前 lockfile 与 HEAD 哈希一致且无其他 OpenCode 副作用；完整路径并集仅排除 `.legion/**` 后精确为 `package.json`；8 项正负资产、版本、bin、renderer/diff check 均通过，40/40 仅作为既有原始证据引用。
- 阻塞项：无。
- 残余风险：registry、trusted publisher 与合并 SHA 可能漂移；公开版本不可覆盖；发布后真实安装尚未验证。
- 人类动作：复核本审查中“历史 FAIL 正确、当前副作用已清除”的双时态结论；既有 `release-040-deferred-review-001` 继续约束发布顺序，无需新增互斥选择。
- 自动下一步：交回 `legion-workflow` 同步 walkthrough 并恢复版本准备 PR lifecycle；发布后验证完成前不得声明任务完成或最终清理。
- 完整证据：`.legion/tasks/release-lgmind-0-4-0/docs/review-change.md`、`.legion/tasks/release-lgmind-0-4-0/docs/test-report.md`、`.legion/tasks/release-lgmind-0-4-0/reports/package-assertions.txt`。
