# `lgmind` 0.4.0 发布前独立审查

## 审查结论

- 阶段结论：`PASS`。
- `REL-040-ARTIFACT`：`PASS`。根包版本、pack 文件集、关键资产、CLI/runtime 与回归证据足以支持版本准备进入 PR lifecycle。
- `REL-040-DISTRIBUTION`：`DEFERRED`。公开发布、registry 切换和干净环境安装尚未发生，不能提前写成 `PASS`。
- 验证修订：`PASS`。修订完整输出当前 tracked changed paths，只对产品集合排除 `.legion/**`，排除后仍精确等于 `['package.json']`；其他源码路径不会被忽略。
- 注意力等级：`review`。这是完整的 `defer-by-contract`，不是实现 blocker；`release-040-deferred-review-001` 已解除版本准备 PR 的 merge 门，但不证明未来分发成功。
- 停止点：允许继续 walkthrough、wiki、commit、push、PR、checks 与版本准备 PR merge；发布后 workflow、registry 与干净安装验证完成前，不得声明任务完成、最终清理或把分发主张更新为 `PASS`。

## Blockers

无。

## Scope 审查

- 当前全部 tracked changed paths 为 `.legion/wiki/index.md`、`.legion/wiki/log.md`、`package.json`；仅从产品集合排除 `.legion/**` 后，实际产品差异精确为根 `package.json` 的版本从 `0.3.1` 更新到 `0.4.0`。其余新增内容位于 `.legion/**`，属于中文任务文档、原始验证输出、任务内断言脚本与 wiki writeback。
- `scheduler/package.json` 保持独立版本 `0.0.0`，内容与基线一致；本次没有把 scheduler 纳入根包版本升级。
- `npm pack` 的 69 项文件清单不包含 `.legion` 任务证据，因此任务文档与验证辅助脚本不会进入公开 npm artifact。
- runtime 构建后 tracked diff 仍只有 `package.json`，未发现 CLI、安装器、schema、协议、agent、报告行为或生成文件漂移。
- 发布说明与 contract 一致：仅交付已合并到 `master` 的能力，不把未执行的完整多任务、多模型 A/B 描述为已证明。

## 正确性与可维护性

- 根 `package.json` 是版本单一真源；CLI 版本读取、pack 标识和发布工作流均沿用这一来源，没有新增第二套版本字段。
- scheduler 保持独立 package/version 边界，回归中 scheduler 只消费规范阶段 Verdict 的既有行为也通过。
- 版本准备没有引入新的运行时分支或发布脚本分叉，继续复用既有 `prepack -> build:runtime-js` 与 trusted-publishing workflow，维护面没有扩大。
- 任务内 `assert-package.mjs` 同时检查版本边界、关键资产、bin 与 tracked diff；其输出已作为当前版本准备快照留存。提交或 rebase 后仍须以实际 base diff 和 CI 重新确认，不应把旧快照当作永久证明。

## 验证充分性与独立重算

审查已重新打开 `docs/test-report.md` 及其全部证据 locator，未继承 verify-change 的 Verdict。上一轮独立审查曾重跑完整核心方法；本次新派生 reviewer 只重跑与验证修订直接相关的 package 断言、renderer check 和 diff check，不把既有完整回归证据冒充为本次重跑：

- `npm run audit:context`：exit 0；hot 降低 `64.98%`，medium closure 降低 `62.66%`，`failures=[]`。
- `npm run test:regression`：既有原始证据为 `40/40 PASS`，无 fail、skip、cancelled 或 todo；覆盖 CLI/setup lifecycle、packed bins、报告一致性、认知验证、注意力路由和 scheduler 边界。本次修订复核未重跑该命令，也未重写 `reports/test-regression.txt`。
- `npm run pack:dry-run`：exit 0；artifact 为 `lgmind@0.4.0`，共 `69` entries；prepack 后没有额外 tracked runtime diff。
- 关键资产断言：8 项全部存在；逐项从文件集移除任一项的 8 个主动负例均被拒绝。
- bin/runtime：`lgmind` 与 `setup-opencode` 均进入 pack，带 Node shebang 且具可执行位；回归还覆盖从 packed `node_modules` 运行 bins，无需 TypeScript stripping。
- 版本边界：根包为 `0.4.0`，scheduler 为 `0.0.0`，tracked 产品 diff 仅 `package.json`。
- registry preflight：证据同时记录 npm CLI 与直接 registry HTTP；`latest=0.3.1`，`lgmind/0.4.0` 为 404。这只证明发布前唯一性，且属于会随时间失效的证据，触发发布前必须重查。

这些证据可从“命令/方法 -> 原始输出 -> claim”逐项重算，足以支持 `REL-040-ARTIFACT=PASS`。主动反例覆盖关键资产缺失、版本/scheduler 漂移、bin 缺失或不可执行、tracked diff 越界；置信度为 `high`。残余失效条件为 rebase 后文件集或 base diff 改变、`0.4.0` 被抢先发布，或 workflow checkout SHA 与锁定 SHA 不一致，命中任一项都必须停止并重验。

## 验证修订复核

- `reports/assert-package.mjs` 先用 `git diff --name-only` 得到完整 tracked changed paths，并通过 `TRACKED_DIFF_ALL` 原样输出；当前原始输出完整列出 `.legion/wiki/index.md,.legion/wiki/log.md,package.json`，没有先隐藏 wiki writeback。
- 产品集合唯一过滤条件是 `!path.startsWith('.legion/')`。因此只豁免 `.legion/**`；任何 `scripts/**`、`skills/**`、`scheduler/**` 或其他源码路径都会留在集合中，使 `assert.deepEqual(productTrackedDiff, ['package.json'])` 失败。当前过滤结果仍精确为 `['package.json']`。
- 本次独立重跑 `node .legion/tasks/release-lgmind-0-4-0/reports/assert-package.mjs`：8 项关键资产正向断言与逐项移除的 8 个负例、`lgmind@0.4.0`、scheduler `0.0.0`、2 个 bin 和产品 diff 边界全部通过；输出与 `reports/package-assertions.txt` 一致。
- 本次独立重跑 renderer `--check` 得到 `CHECK_OK release-lgmind-0-4-0`，`git diff --check` 为 exit 0。完整回归没有重跑；既有 `40/40` 原始输出继续由 `reports/test-regression.txt` 提供，本轮只核对并引用它，不把验证修订描述成全量回归的新执行。
- 修订精确消除了合法 `.legion/wiki/**` writeback 的假阳性，没有扩大产品忽略范围，也没有改变 `REL-040-ARTIFACT=PASS`、`REL-040-DISTRIBUTION=DEFERRED` 或 `attention: review`。

## Verifier、authority 与特殊 claim 重查

- 两项 claim 均预注册为 `objective / routine`；npm、Node、git、pack JSON 与 registry 查询足以覆盖当前方法，不需要 domain verifier。
- 无 authority claim，也不依赖外部专家签署或模型多数意见；公开 registry 仅是 objective 数据源。
- engineer、verify-change、上一轮 reviewer 与本次验证修订 reviewer 均为独立派生；本次 reviewer 重新读取全部 locator，并独立执行修订相关的有界方法，独立性为 `high`。
- `REL-040-DISTRIBUTION` 的 `deferredProtocol` 完整记录 trigger、method、requiredData、stopCondition、successorTask 与 onPass/onFail；owner 为发布编排器，后续必须重新执行 `verify-change -> review-change`。
- `release-040-publish-authority-001` 授权公开发布；`release-040-deferred-review-001` 仅确认“版本准备 merge -> 锁定 SHA -> trusted workflow 发布 -> 发布后验证”的顺序可推进。两者都不是 workflow、registry 或真实安装结果，不能把 `DEFERRED` 改写为 `PASS`。

## 安全与供应链视角

本任务命中 identity/token 与发布信任边界，安全视角适用：

- 现有 workflow 权限为 `contents: read` 与 `id-token: write`，发布使用 npm trusted publishing；没有把本机 npm 登录态或 token 作为发布来源。
- 当前 scope 与任务证据未持久化 npm token、OTP、`.tgz` 或 npm cache；workflow 的 npm cache 路径仅为临时 runner 状态，且未配置上传或提交。
- 公开发布只能来自版本准备 PR 合并后的 `master`：触发前重新锁定 SHA，随后核对 workflow checkout SHA；不一致立即停止，不得改用本机 token 绕过。
- `npm publish` 的不可覆盖风险仍存在。缓解措施是发布前重查版本唯一性、从锁定来源运行回归和 pack 检查，并在失败后停止重跑、保留证据、转入修复版本决策。
- 当前没有供应链 blocker；真正的分发正确性仍是延后事实。

## 可选建议

- 发布触发前把锁定的 `master` SHA、registry 唯一性查询时间和 workflow run URL 一并写入后续证据，避免只凭口头对应。
- 发布后在不依赖仓库的干净临时目录固定使用 `lgmind@0.4.0`，保存 version、install、`verify --strict` 与 8 项关键资产检查输出。

## Verdict

PASS

## 会话注意力摘要

- 阶段：`review-change`
- 阶段结论：`PASS`
- 注意力等级：`review`
- 判断变化：独立确认验证修订只排除 `.legion/**`，产品 diff 仍精确为 `package.json`；`REL-040-ARTIFACT=PASS` 与 `REL-040-DISTRIBUTION=DEFERRED` 均不变。
- 关键发现：全部 tracked changed paths 已原样输出且其他源码路径不会被忽略；8 项正负资产、版本、bin、renderer/diff check 通过；40/40 保持为既有原始证据，本次未冒充重跑。
- 阻塞项：无。
- 残余风险：registry 状态、trusted publisher 与 `master` SHA 可能在触发前漂移；公开版本不可覆盖；发布后真实安装仍未验证。
- 人类动作：`release-040-deferred-review-001` 已完成本轮复核，无需新增决定；继续遵守发布后验证前不得完成的停止点。
- 自动下一步：交回 `legion-workflow`，恢复版本准备 PR lifecycle；merge 后锁定 SHA 发布，并恢复 `verify-change -> review-change` 完成分发验证。
- 完整证据：`.legion/tasks/release-lgmind-0-4-0/docs/review-change.md`、`.legion/tasks/release-lgmind-0-4-0/docs/test-report.md`、`.legion/tasks/release-lgmind-0-4-0/reports/`。
