# 发布 lgmind 0\.4\.0：交付审阅指南


## 交付视角与结论

- 交付类型：`implementation`
- 风险：`low`
- 阶段结论：`PASS`
- 审查状态：`PASS`
- 最终状态：发布前就绪，分发待验证：版本准备实现、artifact 验证与独立审查均为 PASS，公开 npm 发布和真实安装仍为 DEFERRED。

版本准备实现风险为 low：全部 tracked paths 已原样输出为 \.legion/wiki/index\.md、\.legion/wiki/log\.md、package\.json；产品集合仅排除 \.legion/\*\* 后精确为 package\.json，scheduler 边界和运行时行为未改变，发布前 artifact 与独立审查均已通过。40/40 是既有原始证据，本轮验证修订复核未重跑该命令，也未冒充为新执行。公开 npm 发布仍具有版本不可覆盖风险，REL\-040\-DISTRIBUTION 保持 DEFERRED；当前只可进入版本 PR lifecycle，不能把发布、registry 切换或干净安装写成已经完成。

## 人类注意力与当前动作

- 聚合注意力：`review`
- 当前唯一人类动作：已由 release\-040\-deferred\-review\-001 完成本轮复核，允许版本准备 PR merge；无需新增决定，但必须遵守发布后验证停止点。
- lifecycle 边界：可继续 walkthrough、wiki、commit、push、PR、checks 与版本准备 PR merge；merge 后必须从锁定的 master SHA 触发既有 trusted\-publishing workflow，再恢复分发验证。
- 停止点：发布后的 workflow、registry 与干净安装验证完成前，不得声明任务完成、把 REL\-040\-DISTRIBUTION 更新为 PASS、执行最终清理或把主工作区刷新视为发布收口。
- 摘要：公开 npm 版本一旦发布不可覆盖；当前 PASS 只覆盖版本准备与待发布 artifact，尚不覆盖 workflow、registry 和干净安装。release\-040\-deferred\-review\-001 已完成复核并允许版本准备 PR merge。
- 证据：\.legion/tasks/release\-lgmind\-0\-4\-0/log\.md、\.legion/tasks/release\-lgmind\-0\-4\-0/docs/test\-report\.md、\.legion/tasks/release\-lgmind\-0\-4\-0/docs/review\-change\.md


## 未解决的认知状态

| claim\-id | 主张 / 状态 / 门槛 | 影响 | 负责人 / 状态字段 | 当前缓解 | 证据 |
| --- | --- | --- | --- | --- | --- |
| REL\-040\-DISTRIBUTION | 从指定的合并后 master SHA 发布后，npm latest 指向 0\.4\.0，且干净环境可通过固定版本 npx 安装并通过严格校验。；DEFERRED；routine | 该主张决定其他机器能否真正获得新资产；若失败，公开版本可能已被占用但无法正确交付。 | 发布编排器；触发条件：版本准备 PR squash merge 到 master，且从该合并 SHA 触发的 Publish npm package workflow 到达终态。；届时方法：核对 workflow URL、checkout SHA 与结论；查询固定版本和 dist\-tag；在不依赖本地仓库的干净目录执行固定版本 npx version、install、verify \-\-strict 和关键资产检查。；所需数据：合并 SHA（来源：GitHub master；验收：精确等于发布 workflow 的 checkout SHA。）；workflow 结果（来源：GitHub Actions；验收：发布步骤成功，且来源 SHA 与锁定的合并 SHA 一致。）；registry 状态（来源：npm registry；验收：固定版本与 dist\-tags\.latest 均为 0\.4\.0。）；隔离安装输出（来源：不依赖仓库的干净临时目录；验收：version、install、verify \-\-strict 与关键资产检查全部成功。）；停止条件：版本已存在但来源不明、workflow SHA 与锁定的 master SHA 不一致，或发布后 registry、安装任一失败；停止重跑与完成声明。；后续任务：本任务的发布结果收口阶段，重新执行 verify\-change \-&gt; review\-change。；通过后：回写 workflow URL、合并与 checkout SHA、registry 状态和干净安装证据。／在后续验证与审查中将新的分发主张判为 PASS，再进入最终清理和完成声明。；失败后：停止重跑并保留全部证据，准备后续修复版本决策。／后续阶段返回 FAIL，不修改本报告中的历史 DEFERRED 状态。 | 只从合并后锁定 SHA 的既有 trusted\-publishing workflow 发布；触发前重查版本唯一性，发布后逐项验证 workflow、registry 与隔离安装，任一异常立即停止重跑与完成声明。 | \.legion/tasks/release\-lgmind\-0\-4\-0/docs/test\-report\.md |

## 领域验证摘要

当前证据未登记领域或权威 verifier。

## 范围

### 范围内

- 根 package\.json 版本由 0\.3\.1 精确更新为 0\.4\.0
- 中文发布说明和任务内版本准备、验证、审查与报告证据
- context audit、完整回归、npm pack 文件集、关键资产、bin、runtime 与 registry 唯一性检查
- 版本准备 PR lifecycle、合并后 trusted\-publishing workflow、registry 与固定版本 npx 验证
- 发布结果回写 wiki 和任务证据，以及全部终态完成后的清理与主工作区刷新

### 范围外

- 新增或重设计 CLI、安装器、schema、协议、agent 或报告行为
- 修改 scheduler 独立包版本或边界
- 修改 npm package name、registry、public access、Node engine 或 trusted\-publishing 架构
- 从未合并分支、本地主工作区或本机 npm 凭据直接发布
- 把尚未执行的完整多任务、多模型旧新版本 A/B 描述为已经证明

## 证据地图

| 证据 | 类型 | 状态 | locator |
| --- | --- | --- | --- |
| 0\.4\.0 发布合同与验收边界 | plan | INFO | \.legion/tasks/release\-lgmind\-0\-4\-0/plan\.md |
| 发布授权、DEFERRED 复核与阶段恢复记录 | attention | INFO | \.legion/tasks/release\-lgmind\-0\-4\-0/log\.md |
| verify\-change\-gentle\-otter 发布前验证报告 | test\-report | PASS | \.legion/tasks/release\-lgmind\-0\-4\-0/docs/test\-report\.md |
| review\-change\-lively\-penguin 独立变更与供应链审查 | review\-change | PASS | \.legion/tasks/release\-lgmind\-0\-4\-0/docs/review\-change\.md |
| lgmind 0\.4\.0 中文发布说明 | other | INFO | \.legion/tasks/release\-lgmind\-0\-4\-0/docs/release\-notes\.md |

## 交付路径

1. engineer 只更新根包版本并建立中文发布说明，不改变 scheduler 或运行时行为
2. verify\-change 独立执行 context audit、完整回归、pack 与关键资产断言，并把分发主张保持为 DEFERRED
3. release\-040\-deferred\-review\-001 完成复核，允许版本准备 PR merge，但不提前证明未来分发
4. review\-change 独立复核版本边界、证据可重算性和供应链风险，给出 PASS 与 attention: review
5. report\-walkthrough 从当前 PASS 证据生成单一报告真源与三份 reviewer artifact
6. legion\-wiki 写回发布前状态，随后完成 commit、rebase、push、PR、checks、review 与 squash merge
7. merge 后锁定 master SHA，通过既有 trusted\-publishing workflow 发布，再恢复 verify\-change \-&gt; review\-change 验证 registry 与干净安装
8. 只有发布后验证 PASS 并完成结果回写后，才可最终清理 worktree、刷新主工作区和声明任务完成

## 变更与决定

- 根 package\.json 的版本从 0\.3\.1 更新为 0\.4\.0；scheduler/package\.json 保持 0\.0\.0 且未改变。
- 验证断言先通过 TRACKED\_DIFF\_ALL 原样输出全部 tracked paths：\.legion/wiki/index\.md、\.legion/wiki/log\.md、package\.json；产品集合的唯一过滤条件是排除 \.legion/\*\*，过滤后仍精确为 package\.json，其他源码路径不会被忽略。
- 新增本任务的中文发布说明、计划、日志、验证、审查、生成报告证据与 wiki writeback；这些 \.legion/\*\* 文件不会进入公开 npm artifact。
- 发布包继续复用现有 prepack、runtime 构建、文件 allowlist 和 trusted\-publishing workflow，没有新增发布脚本分叉或本机 token 路径。
- 0\.4\.0 计划交付主干中已有的注意力协议、认知验证协议、报告 schema/template、Verdict 解析、报告数据校验、subagent 命名器与 context manifest。

## 验证与审查状态

| 检查 | 状态 | 证据 |
| --- | --- | --- |
| REL\-040\-ARTIFACT 已验证为 PASS：待发布包为 lgmind@0\.4\.0，包含 69 项文件与 8 个关键资产 | PASS | \.legion/tasks/release\-lgmind\-0\-4\-0/docs/test\-report\.md |
| npm run audit:context 通过，failures 为空 | PASS | \.legion/tasks/release\-lgmind\-0\-4\-0/reports/audit\-context\.txt |
| 既有原始证据记录 npm run test:regression 为 40/40 PASS 且无 fail 或 skip；本轮有界修订复核未重跑该命令，也未冒充为新执行 | PASS | \.legion/tasks/release\-lgmind\-0\-4\-0/reports/test\-regression\.txt |
| npm run pack:dry\-run 通过，runtime 构建后没有额外 tracked diff | PASS | \.legion/tasks/release\-lgmind\-0\-4\-0/reports/pack\-dry\-run\.txt |
| package 断言通过：全部 tracked paths 原样输出，产品集合仅排除 \.legion/\*\* 后精确为 package\.json；8 个关键资产正负例、版本边界与 bin 断言均通过 | PASS | \.legion/tasks/release\-lgmind\-0\-4\-0/reports/package\-assertions\.txt |
| 发布前 registry 状态为 latest=0\.3\.1 且 0\.4\.0 不存在；这只证明版本唯一性前置条件 | INFO | \.legion/tasks/release\-lgmind\-0\-4\-0/reports/npm\-registry\-preflight\.txt |
| 独立审查确认全部 tracked paths 原样可见、产品集合仅排除 \.legion/\*\* 后精确为 package\.json；40/40 只引用既有原始证据，阶段 Verdict 保持 PASS | PASS | \.legion/tasks/release\-lgmind\-0\-4\-0/docs/review\-change\.md |

## 风险与限制

- 公开 npm 发布不可覆盖；顶层 risk=low 只描述版本准备实现风险，不表示公开发布操作本身低风险。；缓解：发布前重新确认 0\.4\.0 不存在并锁定合并后的 master SHA；只使用既有 trusted\-publishing workflow，发布后立即验证 registry 与干净安装，失败时停止重跑并转入修复版本决策。
- master、trusted publisher 或 registry 状态可能在版本准备证据与正式触发之间漂移。；缓解：触发前重新锁定 SHA、重查版本唯一性并核对 workflow checkout SHA；任一不一致都停止发布或完成声明。
- workflow 成功不等于其他机器已经获得正确资产，真实固定版本安装尚未发生。；缓解：在不依赖仓库的干净临时目录执行 lgmind@0\.4\.0 version、install、verify \-\-strict 和 8 项关键资产检查，并保存原始输出。
- 完整多任务、多模型旧新版本 A/B 尚未执行。；缓解：发布说明只陈述已合并且已由现有回归和 artifact 检查覆盖的能力，不扩大为完整行为效果等价证明。
- PR、发布与最终清理 lifecycle 尚未完成。；缓解：按顺序完成 wiki、版本 PR、合并、发布、发布后验证、结果回写和最终清理；每一阶段分别记录终态证据。

## 审阅清单

- [ ] 首先确认顶层 low 只表示版本准备实现风险，公开 npm 发布不可覆盖风险仍需按 review attention 处理。
- [ ] 确认 test\-report 与 review\-change 都以 PASS 精确指向当前任务文档。
- [ ] 确认唯一未决 claim 是 REL\-040\-DISTRIBUTION=DEFERRED，且 trigger、method、requiredData、stopCondition、successorTask、onPass 与 onFail 完整。
- [ ] 确认 REL\-040\-ARTIFACT=PASS 只出现在 verification 与 evidence，不被重复登记为未决 claim。
- [ ] 确认 release\-040\-deferred\-review\-001 已允许版本准备 PR merge，但未把 workflow、registry 或干净安装提前改写为 PASS。
- [ ] 确认 PR body 明确只是 PR 输入，不证明 checks、review、merge、发布、cleanup 或主工作区刷新已经完成。
- [ ] 确认发布后验证完成前不得声明任务完成、最终清理或更新分发主张为 PASS。

## 渲染交接

- PR-backed：是
- 状态：`local`
- 说明：当前采用仓库内本地预览：\.legion/tasks/release\-lgmind\-0\-4\-0/docs/report\-walkthrough\.html；内容不含秘密或客户数据，版本准备 PR 创建后仍以该 artifact 作为审阅入口。

## 最终状态与下一阶段

- 当前状态：发布前就绪，分发待验证：版本准备实现、artifact 验证与独立审查均为 PASS，公开 npm 发布和真实安装仍为 DEFERRED。
- 下一阶段：先进入 legion\-wiki 与版本准备 PR lifecycle；squash merge 后锁定 master SHA 并发布，再恢复 verify\-change \-&gt; review\-change 完成 workflow、registry 与干净安装验证。
- lifecycle 声明：本报告只是版本准备 PR 的输入，只证明当前版本准备与 artifact 证据通过；不证明 PR checks、review、merge、npm 发布、registry 切换、干净安装、cleanup 或主工作区刷新已经完成。
