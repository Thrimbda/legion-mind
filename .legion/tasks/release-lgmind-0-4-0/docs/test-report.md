# `lgmind` 0.4.0 发布前验证报告

## 验证范围与方法

- 范围：根包版本边界、runtime 构建漂移、context budget、完整回归、npm dry-run 文件集、关键资产、可执行 bin、registry 发布前唯一性。
- 不在本阶段宣称：workflow 已发布、registry 已切换到 `0.4.0`、其他机器已完成固定版本安装；这些事实必须在 merge 与 publish 后验证。
- 方法选择：两项 claim 均为 routine objective claim，采用可重算命令、结构化 pack 清单、逐项断言和主动负例；验证代理与 engineer 独立派生。
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
- 状态：`PASS`；独立性：`high`（与 engineer 独立派生并重跑）；置信度：`high`。
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
| 产品 tracked diff 边界 | 当前全部 tracked 变更为 `.legion/wiki/index.md`、`.legion/wiki/log.md`、`package.json`；仅排除任务元数据 `.legion/**` 后，产品 tracked diff 精确为 `package.json` | `reports/package-assertions.txt` |
| 8 项关键资产 | 全部存在；逐个移除任一资产的 8 个负例均被拒绝 | `reports/package-assertions.txt` |
| 版本边界 | 根包 `0.4.0`；scheduler 保持 `0.0.0` 且内容未变 | `reports/package-assertions.txt` |
| bin 入口 | `lgmind` 与 `setup-opencode` 均在 pack 内、带 shebang 且可执行 | `reports/package-assertions.txt` |
| registry 前置状态 | `latest=0.3.1`；`lgmind/0.4.0` HTTP 404 | `reports/npm-registry-preflight.txt` |

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

- 当前检查失败：无。
- 证据脚本修订：首次脚本把 `git diff --name-only` 的全部结果精确断言为 `['package.json']`，在合法 wiki closing writeback 后重跑会把 `.legion/wiki/**` 误判为产品漂移，形成假阳性。修订后脚本先保留并输出全部 changed paths，仅从产品漂移集合排除 `.legion/**`，再继续精确断言产品 tracked diff 只有 `package.json`；8 项关键资产的正向检查与逐项缺失负例，以及版本、bin、产品 diff 边界断言仍全部通过，当前原始输出见 `reports/package-assertions.txt`。
- 有意跳过：workflow、registry 切换与干净 npx 安装尚未触发，按 contract 延后。
- 非阻塞提示：npm 报出现有 `tmp` env config 弃用 warning，不影响命令退出状态或 artifact。
- 残余不确定性：合并前 `master` 可能移动、trusted publisher 可能漂移、registry 可能被外部状态改变、发布后安装可能失败。
- 失效条件：pack 文件集变化、产品 tracked diff 超出根版本、`0.4.0` 在发布前出现、workflow SHA 与锁定 SHA 不同，均需停止并重跑验证。

## Verdict

PASS

本 Verdict 仅表示发布前 artifact 与发布前置条件满足；`REL-040-DISTRIBUTION` 仍为 `DEFERRED`。

## 会话注意力摘要

- 阶段：`verify-change`
- 阶段结论：`PASS`
- 注意力等级：`review`
- 判断变化：`REL-040-ARTIFACT` 已由 INCONCLUSIVE 更新为 PASS；`REL-040-DISTRIBUTION` 保持 DEFERRED。
- 关键发现：40/40 回归通过；pack 的 8 个关键资产及其负例门禁通过；registry 当前为 `latest=0.3.1` 且 `0.4.0` 不存在。
- 阻塞项：无；完整 `defer-by-contract` 不阻塞版本准备阶段 PASS。
- 残余风险：公开发布与真实安装只能在 merge + publish 后验证，发布版本不可覆盖。
- 人类动作：复核已由 log 中 `release-040-publish-authority-001` 完成，允许推进版本准备 PR 合并；禁止在发布后验证前声明任务完成。
- 自动下一步：`review-change`；随后可准备版本 PR，发布后必须恢复本任务完成分发验证。
- 完整证据：`.legion/tasks/release-lgmind-0-4-0/docs/test-report.md` 与 `.legion/tasks/release-lgmind-0-4-0/reports/`。
