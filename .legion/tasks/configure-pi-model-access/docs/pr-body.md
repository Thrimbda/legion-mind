# 实现交付审查

> 本报告只证明当前工作树的实现、验证、独立审查与reviewer artifacts已准备，不证明PR已创建、checks/review已满足、PR已合并、worktree已清理或主工作区已刷新。
> 本文只是 PR 创建或更新输入，不证明 checks、review、merge、cleanup 或主工作区刷新已完成。

## 交付视角与结论

- 交付类型：`implementation`
- Workflow profile：`strict`
- 风险：`high`
- 阶段结论：`PASS`
- 审查状态：`PASS`
- 最终状态：Legion Pi schema v2 model policy、live provider access、rollback/idempotence、独立验证、安全复审、walkthrough 与 Wiki writeback已达到delivery\-ready；PR lifecycle尚未完成。

Legion Pi manifest 已升级为 schema v2，默认 openai\-codex/gpt\-5\.6\-sol，selector 精确包含 7 个 Codex、2 个 DeepSeek 与 Kimi k3/k3\-256k；schema v1 继续支持 install、verify 与 rollback。Startup probe 使用空 in\-memory auth 且禁止 refresh，setup\-pi 不拥有 auth\.json。61/61 regression、7/7 TS/JS parity、72\-file pack、三 provider bounded smoke、live v1 rollback/v2 reinstall/idempotence、独立验证与安全复审均为 PASS。

## 人类注意力与当前动作

- 聚合注意力：`skim`
- 当前唯一人类动作：快速浏览关键变更与验证摘要，然后按仓库保护规则审阅并合并当前 delivery PR。
- lifecycle 边界：允许继续 commit、rebase、push、PR、checks/review、merge、cleanup 与主工作区刷新；本报告不证明这些 PR lifecycle 步骤已完成。
- 停止点：允许继续 commit、rebase、push、PR、checks/review、merge、cleanup 与主工作区刷新；本报告不证明这些 PR lifecycle 步骤已完成。
- 摘要：实现、live rollout、独立验证与安全复审均通过；reviewer 只需快速确认模型策略、credential boundary、回滚锚点和非阻塞运行风险。
- 证据：\.legion/tasks/configure\-pi\-model\-access/docs/test\-report\.md、\.legion/tasks/configure\-pi\-model\-access/docs/verify\-change\.md、\.legion/tasks/configure\-pi\-model\-access/docs/review\-change\.md


## 未解决的认知状态

当前证据未登记需要单独聚合的未解决 claim。

## 领域验证摘要

当前证据未登记领域或权威 verifier。

## 范围

### 范围内

- Schema v2 精确 default/selector model policy 与 schema v1 compatibility parser
- Generated active config/settings、model\-switch drift reconciliation 与 explicit rollback
- Credential\-free startup probe、strict validation、migration/idempotence regression 与 operator 文档
- Live DeepSeek/Kimi command references、Pi 独立 Codex OAuth、selector/default/smoke 验收
- Reviewer walkthrough、Wiki current\-truth writeback 与 PR delivery evidence

### 范围外

- Pi、extension 或 PI WEB package 升级
- OpenCode auth 内容、OAuth state 或安装面修改
- Credential 写入 manifest、Git、generated settings 或 Nix
- PI WEB 网络、FRP、TLS、Origin guard 或其他 dotfiles 拓扑变更
- 多用户/multi\-writer credential bridge 产品化或其他 provider/model 扩展

## 证据地图

| 证据 | 类型 | 状态 | locator |
| --- | --- | --- | --- |
| 稳定任务合同与高风险验收边界 | plan | PASS | \.legion/tasks/configure\-pi\-model\-access/plan\.md |
| 批准的 schema、auth、rollout 与 rollback RFC | rfc | PASS | \.legion/tasks/configure\-pi\-model\-access/docs/rfc\.md |
| review\-rfc\-swift\-sparrow 独立设计审查 | review\-rfc | PASS | \.legion/tasks/configure\-pi\-model\-access/docs/review\-rfc\.md |
| Repository 与 live verification report | test\-report | PASS | \.legion/tasks/configure\-pi\-model\-access/docs/test\-report\.md |
| verify\-change\-playful\-dolphin 独立验证 | other | PASS | \.legion/tasks/configure\-pi\-model\-access/docs/verify\-change\.md |
| review\-change\-clever\-otter 安全复审 | review\-change | PASS | \.legion/tasks/configure\-pi\-model\-access/docs/review\-change\.md |

## 交付路径

1. 确认 Pi 0\.84\.2 pinned catalog 已包含全部目标模型，并把 manifest/auth/provider catalog 分成独立责任层
2. 通过 Standard RFC 与两轮独立设计审查关闭 schema rollback、settings drift、auth ownership 与 catalog oracle 风险
3. 实现 schema v1/v2 parser、精确 policy rendering、in\-memory startup credentials、generated JS、tests 与 operator docs
4. 在停服单 writer 窗口升级 live profile、配置 runtime references、完成 Pi 独立 OAuth 与三 provider smoke
5. 执行 v2\-to\-v1\-to\-v2 live rollback、READY\-v2 idempotence、secret scan、独立验证和安全复审
6. 生成 reviewer artifacts 与 Wiki writeback后进入 squash PR lifecycle

## 变更与决定

- legion\-pi\.json 使用 schema v2，固定 defaultProvider、defaultModel 与四项 ordered enabledModels policy。
- pi\-distro parser 继续接受严格 v1，并对 v2 provider/model/pattern literal、顺序、大小写、空格、缺失、重复、附加值和未知字段 fail closed。
- active config 保留 schema；settings 对 v1 不写 model fields，对 v2 写入完整 policy。
- startup probe 注入 AuthStorage\.inMemory\(\) 与 refreshOnCreate=false，避免 setup 验证触碰 live auth 或网络 refresh。
- Regression 新增 v1\-v2\-v1\-v2、READY\-v2 no\-op reinstall、model\-switch drift、auth non\-ownership 与 credential isolation。
- README 明确 Pi 独立 OAuth、API\-key/runtime\-reference boundary 与 PI WEB quiesce/reconcile/restart/fresh\-session 流程。
- Wiki current truth 由旧的 no\-model manifest 边界更新为 schema v2 policy，并沉淀 catalog/selector/credential 分层模式。

## 验证与审查状态

| 检查 | 状态 | 证据 |
| --- | --- | --- |
| 完整 regression suite 61/61 与 startup matrix | PASS | \.legion/tasks/configure\-pi\-model\-access/docs/test\-report\.md |
| Generated TS/JS parity 7/7、npm pack 72 files、context audit 与 diff check | PASS | \.legion/tasks/configure\-pi\-model\-access/docs/verify\-change\.md |
| Pinned 11\-model oracle、exact selector、fresh default 与三 provider smoke | PASS | \.legion/tasks/configure\-pi\-model\-access/docs/test\-report\.md |
| Live schema v1 rollback、v2 reinstall、READY\-v2 no\-op install 与 final anchor | PASS | \.legion/tasks/configure\-pi\-model\-access/docs/test\-report\.md |
| Exact\-secret exclusion、resolver fail\-closed matrix 与 ambient credential denylist | PASS | \.legion/tasks/configure\-pi\-model\-access/docs/verify\-change\.md |
| 当前实现快照的独立 security\-aware change review | PASS | \.legion/tasks/configure\-pi\-model\-access/docs/review\-change\.md |

## 风险与限制

- Provider entitlement、OAuth expiry 与上游服务可用性仍会随时间变化。；缓解：当前三 provider bounded smoke 与 auth/selector/default checks 已通过；运行故障按 provider readiness 排查，不复制 token 或扩大 selector 作为 fallback。
- Command\-backed keys 依赖 host OpenCode auth path/schema，结果按 Pi process lifetime cache。；缓解：Resolver 固定 source/selector并对 file type/owner/mode fail closed；服务无 ambient fallback，schema/key rotation 后必须重新配置并重启。
- Pi model switch 会持久化 managed global settings。；缓解：文档要求关闭 disposable session、隔离 settings writer、force reconcile、重启、verify 与 fresh\-session default；regression 和 live no\-op reinstall覆盖该边界。
- PR checks、review、merge、worktree cleanup 与主工作区刷新尚未完成。；缓解：继续 squash PR lifecycle；terminal 前只声明 delivery\-ready，不预写 merge 或 cleanup 状态。

## 审阅清单

- [ ] 确认 schema v2 policy 与 exact 11\-model selector一致，legacy Kimi 只存在于 full catalog。
- [ ] 确认 schema v1 compatibility、explicit rollback 与 READY\-v2 idempotence都有 committed regression和 live evidence。
- [ ] 确认 startup probe 使用 in\-memory auth且不读取/执行 live credential或 OAuth refresh。
- [ ] 确认 credential未进入 Git/generated settings/Nix/report，OpenCode OAuth未复制，service env无 ambient fallback。
- [ ] 确认 PI WEB model switch reconciliation包含 session close、service quiesce/restart、READY与fresh default。
- [ ] 确认当前 final rollback anchor为1787113970531\-7675a002，旧 anchor已消费。
- [ ] 确认本报告只表示 delivery\-ready，PR checks/merge/cleanup/main refresh仍需 lifecycle完成。

## 渲染交接

- PR-backed：是
- 状态：`local`
- 说明：使用仓库内本地 HTML artifact；reviewer可在PR中查看由同一report\-data\.json生成的HTML、Markdown与PR body，不新增公开托管面。

## 最终状态与下一阶段

- 当前状态：Legion Pi schema v2 model policy、live provider access、rollback/idempotence、独立验证、安全复审、walkthrough 与 Wiki writeback已达到delivery\-ready；PR lifecycle尚未完成。
- 下一阶段：完成closing hygiene checks，commit、rebase、push并创建squash PR，跟进checks/review/merge、cleanup与主工作区刷新。
- lifecycle 声明：本报告只证明当前工作树的实现、验证、独立审查与reviewer artifacts已准备，不证明PR已创建、checks/review已满足、PR已合并、worktree已清理或主工作区已刷新。
