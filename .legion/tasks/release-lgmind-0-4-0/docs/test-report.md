# `lgmind` 0.4.0 发布前验证报告

## 验证范围与方法

- 范围：根包版本边界、runtime 构建漂移、context budget、完整回归、npm dry-run 文件集、关键资产、可执行 bin、registry 发布前唯一性。
- 不在本阶段宣称：workflow 已发布、registry 已切换到 `0.4.0`、其他机器已完成固定版本安装；这些事实必须在 merge 与 publish 后验证。
- 方法选择：两项 claim 均为 routine objective claim，采用可重算命令、结构化 pack 清单、逐项断言和主动负例；版本边界以 `origin/master` 为基线，changed paths 取 `git diff --name-only origin/master...HEAD` 与 `git diff --name-only HEAD` 的去重并集，以覆盖提交前、提交后和 rebase 后状态；验证代理与 engineer 独立派生。
- 实现输入：`package.json`、`scheduler/package.json`、实际 diff、`docs/release-notes.md` 与 `log.md` 的 engineer handoff。

## Claim 登记与证据映射

### REL-040-ARTIFACT

- 单一主张：待发布的 `lgmind@0.4.0` 完整包含当前主干需要的安装资产，并保持 CLI/setup lifecycle 可运行。
- 验收/风险：对应版本、pack、回归和安装资产验收；错误会导致其他机器缺失新能力或 CLI 不可运行。
- 三轴：`objective / now / routine`。
- `domain-id`：`npm-package-artifact`。
- `required-capability`：npm pack 文件集检查与 Node CLI/runtime 回归验证。
- `required-method`：context audit、完整 regression、`npm pack --dry-run --json`、关键路径和失败路径断言。
- `criticality`：`high`；`risk-if-wrong`：发布不可覆盖的残缺包；`blocking-policy`：`block-merge`；owner：`verify-change`。
- 状态：`PASS`；独立 reviewer 曾因 `.opencode/package-lock.json` 越界把该主张退回 `INCONCLUSIVE`，engineer 精确恢复后，本轮重新执行同一 fail-closed 方法并恢复为 `PASS`；独立性：`high`（与 engineer 独立派生并重跑）；置信度：`high`。
- 证据：`reports/audit-context.txt`、`reports/test-regression.txt`、`reports/pack-dry-run.txt`、`reports/package-assertions.txt`。

### REL-040-DISTRIBUTION

- 单一主张：从指定的合并后 `master` SHA 发布后，npm `latest` 指向 `0.4.0`，且干净环境可用固定版本 npx 安装并通过严格校验。
- 验收/风险：对应公开发布与真实安装；错误会占用版本但无法正确交付。
- 三轴：`objective / deferred / routine`。
- `domain-id`：`npm-registry-distribution`。
- `required-capability`：GitHub Actions、npm registry 查询与干净环境安装验证。
- `required-method`：workflow run、`npm view`、固定版本 npx version/install/strict verify、关键资产检查。
- `criticality`：`high`；`risk-if-wrong`：公开版本不可覆盖且用户无法获得新资产；`blocking-policy`：`defer-by-contract`；owner：发布编排器。
- 状态：`DEFERRED`；本阶段只确认前置条件 `latest=0.3.1` 且 `0.4.0` 尚不存在，不把未来分发事实写成 PASS。
- 独立性：`high`（直接查询公开 registry）；未来主张置信度：不适用，等待触发后重验。
- 证据：`reports/npm-registry-preflight.txt`、`plan.md` 与 `log.md`。

## 执行记录

| 检查 | 结果 | 原始证据 |
|---|---|---|
| `npm run audit:context` | exit 0；hot 降低 64.98%，medium closure 降低 62.66%，failures 为空 | `reports/audit-context.txt` |
| `npm run test:regression` | exit 0；40/40 PASS，0 fail/skip | `reports/test-regression.txt` |
| `npm run pack:dry-run` | exit 0；`lgmind@0.4.0`，69 entries | `reports/pack-dry-run.txt` |
| 产品 tracked diff 边界 | 完整输出远端基线至分支 HEAD 与当前工作树的 changed paths 去重并集；仅排除任务元数据 `.legion/**` 后，产品 tracked diff 精确为 `package.json` | `reports/package-assertions.txt` |
| OpenCode 越界清理 | `git diff -- .opencode/package-lock.json` exit 0 且输出为空；完整 changed paths 不含 `.opencode/**` | `reports/package-assertions.txt`、可重算 git diff |
| 8 项关键资产 | 全部存在；逐个移除任一资产的 8 个负例均被拒绝 | `reports/package-assertions.txt` |
| 版本边界 | `origin/master` 根包基线为 `0.3.1`，当前根包为 `0.4.0`；scheduler 保持 `0.0.0` 且相对远端基线内容未变 | `reports/package-assertions.txt` |
| bin 入口 | `lgmind` 与 `setup-opencode` 均在 pack 内、带 shebang 且可执行 | `reports/package-assertions.txt` |
| registry 前置状态 | `latest=0.3.1`；`lgmind/0.4.0` HTTP 404 | `reports/npm-registry-preflight.txt` |
| 当前报告一致性门 | renderer `--check` 预期 exit 1：当前 `review-change.md` Verdict 仍为 `FAIL`，因此拒绝把旧 PASS walkthrough 包装为当前 PASS；待新 reviewer 恢复后重跑 | `docs/review-change.md` |

8 个关键资产为：

1. `skills/report-walkthrough/scripts/current-verdict.mjs`
2. `skills/report-walkthrough/scripts/report-data-validation.mjs`
3. `skills/report-walkthrough/references/report-data.schema.json`
4. `skills/report-walkthrough/templates/report-walkthrough.html`
5. `skills/verify-change/references/REF_COGNITIVE_VERIFICATION.md`
6. `skills/legion-workflow/references/REF_HUMAN_ATTENTION.md`
7. `skills/legion-workflow/scripts/subagent-name.mjs`
8. `skills/legion-workflow/references/context-manifest.json`

## Domain verifier 与 authority evidence

- Domain verifier：不适用。两项 claim 的专业门槛均预注册为 `routine`，现有 npm/Node/git 方法足以验证当前阶段。
- Authority evidence：不适用。本阶段不依赖外部资质、签署或审计结论；公开 registry 仅作为 objective 数据源。
- 作者总结只作为输入；状态由实际命令、pack JSON、负例和公开 registry 结果独立导出。

## DEFERRED 协议

`REL-040-DISTRIBUTION.deferredProtocol`：

- `trigger`：版本准备 PR squash merge 到 `master`，并从该 SHA 触发的 `Publish npm package` workflow 到达终态。
- `method`：核对 workflow URL、checkout SHA 与结论；查询固定版本和 dist-tag；在不依赖仓库的干净目录执行固定版本 npx version/install、`verify --strict` 和关键资产检查。
- `requiredData`：
  - 名称：合并 SHA；来源：GitHub `master`；验收：等于 workflow checkout SHA。
  - 名称：workflow 结果；来源：GitHub Actions；验收：发布步骤成功且来源 SHA 一致。
  - 名称：registry 状态；来源：npm registry；验收：固定版本与 `latest` 均为 `0.4.0`。
  - 名称：隔离安装输出；来源：干净临时目录；验收：version/install/strict verify 与关键资产检查全部成功。
- `stopCondition`：版本已存在但来源不明、workflow SHA 不一致，或发布后 registry/安装任一失败；停止重跑与完成声明。
- `successorTask`：本任务的发布结果收口阶段，重新执行 `verify-change -> review-change`。
- `onPass`：`nextAction` 为回写 workflow、registry 与安装证据；`conclusionUpdate` 为在后续报告把新 claim 判为 PASS。
- `onFail`：`nextAction` 为停止重跑并保留证据、准备修复版本决策；`conclusionUpdate` 为后续阶段 FAIL，不回写本历史 claim。
- 当前风险：版本一旦发布不可覆盖；临时缓解：只从合并后锁定 SHA 的既有 trusted-publishing workflow 发布。
- 用户授权：`log.md` 的 `release-040-publish-authority-001` 已批准“合并后发布再验证”的顺序；该决定不等于未来分发结果。

## 失败、跳过与残余不确定性

- 当前 artifact 检查失败：无。renderer `--check` 因当前 `review-change.md` 仍为 `FAIL` 而预期 exit 1；这是报告一致性的 fail-closed 边界，不是 artifact 失败，也不能包装成 PASS。
- 越界发现与恢复：独立 reviewer 正确检出 OpenCode transport 意外改写 `.opencode/package-lock.json`，当时产品集合超出唯一允许的 `package.json`，并把 `REL-040-ARTIFACT` 退回 `INCONCLUSIVE`。engineer 已把 lockfile 精确恢复到 `HEAD`；本轮 `git diff -- .opencode/package-lock.json` 输出为空，完整 changed paths 包含分支 task、wiki 与 `package.json`，不含 `.opencode/**`，产品集合重新精确为 `package.json`，断言 exit 0，因此 `REL-040-ARTIFACT` 恢复 `PASS`。
- 证据脚本修订：首次脚本把工作树 `git diff --name-only` 的全部结果精确断言为 `['package.json']`，在合法 wiki closing writeback 后重跑会把 `.legion/wiki/**` 误判为产品漂移。第一次修订虽区分了任务元数据与产品路径，但版本基线仍绑定 `HEAD`、changed paths 仍只绑定工作树；提交后 `HEAD:package.json` 已为 `0.4.0` 且普通工作树 diff 为空，因此再次形成生命周期假阳性。第二次修订统一从 `origin/master:package.json` 与 `origin/master:scheduler/package.json` 读取远端基线，并取 `origin/master...HEAD` 与 `HEAD` working diff 的去重并集，覆盖提交前、提交后和 rebase 后状态；仅 `.legion/**` 从产品集合排除，其他路径仍会使精确断言失败。8 项关键资产的正向检查与逐项缺失负例，以及版本、bin、产品 diff 边界断言仍全部通过，当前原始输出见 `reports/package-assertions.txt`。
- 有意跳过：workflow、registry 切换与干净 npx 安装尚未触发，按 contract 延后。
- 非阻塞提示：npm 报出现有 `tmp` env config 弃用 warning，不影响命令退出状态或 artifact。
- 残余不确定性：合并前 `master` 可能移动、trusted publisher 可能漂移、registry 可能被外部状态改变、发布后安装可能失败。
- 失效条件：pack 文件集变化、产品 tracked diff 超出根版本、`0.4.0` 在发布前出现、workflow SHA 与锁定 SHA 不同，均需停止并重跑验证。

## 发布后继任验证

发布前的 `REL-040-DISTRIBUTION=DEFERRED` 已在版本准备 PR 合并和发布 workflow 到达终态后触发。为保留认知验证的时间语义，本节不改写旧 claim，而是登记新的 `REL-040-DISTRIBUTION-RESULT`：

- 主张：从合并提交 `ff4c7009f967b7a897715b077ffb3a3dba76a2b3` 触发的 trusted-publishing workflow 已成功交付可安装、可严格校验的 `lgmind@0.4.0`。
- 三轴：`objective / now / routine`；`criticality=high`；`blocking-policy=block-stage`。
- 状态：`PASS`；独立验证执行者：`verify-change-gentle-marten`；独立性与置信度均为 `high`。
- workflow：run `29242902972` 为 `success`，`headSha` 精确等于上述合并提交，regression、pack 与 publish 步骤全部成功。
- registry：固定版本与 `dist-tags.latest` 均为 `0.4.0`，并含两个预期 bin。
- 隔离安装：空 cache、隔离 HOME、独立 package 边界下，固定版本 npx 返回 `0.4.0`；首次安装 `copied=49 skipped=0 failures=0`，strict verify 返回 `READY`；8 项关键资产存在且与合并提交逐字节一致。
- 幂等复跑：第二次安装 `copied=0 skipped=49 failures=0`；这里的 `skipped` 明确表示目标文件已与发布源一致。
- 首次失败：没有独立 `package.json` 边界的 repo 内 smoke 目录曾返回 `command not found`；npm debug log 证明它错误复用了上层同名源码 package。建立独立 package 边界并清空 cache 后完整通过，该次失败保留为夹具假阳性，不计入成功证据。
- 完整发布后证据：`docs/publish-result.md`。

## Verdict

PASS

本 Verdict 同时覆盖发布前 `REL-040-ARTIFACT=PASS` 与发布后继任主张 `REL-040-DISTRIBUTION-RESULT=PASS`；历史 `REL-040-DISTRIBUTION=DEFERRED` 继续作为发布前时点记录保留。

## 会话注意力摘要

- 阶段：`verify-change` 发布后继任验证
- 阶段结论：`PASS`
- 注意力等级：`skim`
- 判断变化：历史 lockfile 越界与恢复事实保持不变；发布前 DEFERRED 已按协议产生新的分发结果 PASS。
- 关键发现：workflow checkout SHA、registry、固定版本 npx、首次安装、幂等重复安装、strict verify 与 8 项关键资产一致性闭环通过；首次 `command not found` 为缺少独立 package 边界的夹具假阳性。
- 阻塞项：无。
- 残余风险：`0.4.0` 不可覆盖；未来若发现新缺陷只能通过新 patch 版本处理。可选 MCP 未配置不阻塞 filesystem-backed CLI。
- 人类动作：无需新增决定，可快速复核发布 run、registry 与隔离安装摘要。
- 自动下一步：派生新的 `review-change` 独立审查发布后证据，再更新 walkthrough、wiki 与收口 PR。
- 完整证据：`.legion/tasks/release-lgmind-0-4-0/docs/publish-result.md`、本文件与 GitHub Actions run `29242902972`。
