# RFC 对抗审查（最终复审）

## 复审结论

上一轮三项 blocking finding 均已机械闭环；本轮扩展的普通路径仍以“不改变可执行行为、协议或持久状态”为边界，没有放宽高风险行为变更。设计可以进入实现。

## Blocking findings

无。

## 已关闭事项

1. **短 handoff 契约**：RFC 已明确修改原样回传规则，给出文件内完整摘要到五字段投影的唯一映射、冲突失败条件，并新增 `OTCE-FORMAL-005` 验证 attention、风险、停止点和证据入口不丢失。
2. **真实加载预算**：`context-manifest.json` 同时记录根文件、无条件资源和条件资源；14 文件与中风险加载闭包分别具有可重算基线、预算和强制 reference 完备性扫描，不再允许仅把内容搬家后计为节省。
3. **生成工具与 transport 边界**：命名器已把固定权限职责 `agentType`、随机 canonical `displayName` 与可选 `transportId` 分离；OpenCode 继续以已注册 role 选择 subagent，随机实例名不再进入 agent type/权限选择。报告 schema 已增加 profile、attention、claim、verifier 的条件约束，以及安全 locator/URL、上下文转义、确定性和失败清理要求。

## Transport 兼容性复审

- `agentType` 始终是已注册的固定 role，是代理职责与权限选择的唯一输入；随机命名不会新增 agent type，也不会扩大任何阶段权限。
- `displayName` 始终采用 `<role>-<adjective>-<noun>`，只用于 prompt、日志和 handoff 的实例辨识，满足每个 subagent 都有 role-adjective-noun 名称的验收要求。
- `transportId` 只在目标 API 提供独立实例标识字段时传入；Codex 可使用下划线形式的 transport-safe id，但它不能替代 `agentType`。
- OpenCode 仍以 `.opencode/agents/legion.md` 已允许的固定 role/subagent type 派生，随机 `displayName` 仅在 prompt 与交接中回显，因此不会触发 `Unknown agent type`，也不会因随机名称落入未授权 task key 而被拒绝。
- `skills/legion-workflow/SKILL.md`、`SUBAGENT_DISPATCH_MATRIX.md` 与命名 regression 对三者的映射及 OpenCode/Codex 分支形成一致约束；本轮未发现新的设计 blocker。

## 入口语义复核

- 回答、解释、总结、只读审阅/诊断、给出命令，以及不改变含义的文档/格式整理，可以不启动 Legion；复杂只读工作可以使用已命名的只读 subagent，但不因此创建 Legion task 或 worktree。
- 只要修改代码、运行时配置、workflow/schema、协议或持久状态，或者工作属于中高风险、跨模块、安全、数据或外部合约变更，就不能借“文档”或“单步”名义进入普通路径。
- 因此，纯格式化安全文档可以走普通路径；改变安全政策、数据处理约束、运维行为或外部承诺的文字修改仍属于 Legion 路径。分类边界与 contract 的“不得降级”约束一致。

## 非阻塞建议

- handoff fixture 应明确断言“判断变化与关键发现合计最多三条”，避免实现把两者分别计数。
- 报告生成器的失败用例应覆盖临时文件写入、替换阶段和既有产物恢复，证明三份输出不会形成混合版本。
- 入口 fixture 增加一组相邻反例：不改变含义的政策文档格式整理走普通路径，改变政策、数据约束或外部承诺的文字修改进入 Legion。

## Rollback 与兼容性判断

入口升级规则、三种执行模式、阶段链、attention/cognitive 门、PR lifecycle 与 scheduler 独立 `Verdict` 均有明确不变量和回归入口。改动不含数据迁移或第三方依赖，单个 squash commit 整体 `git revert` 足以回到旧契约；禁止脚本失败时手写兜底，避免双真源。

## Verdict

PASS

## 会话注意力摘要

- **阶段**：`review-rfc`
- **阶段结论**：`PASS`
- **注意力等级**：`skim`
- **判断变化**：第一次 `verify-change` 暴露的 OpenCode 动态 agent type 兼容性缺口已由三层身份模型关闭；RFC 结论保持 `PASS`。
- **关键发现**：1. `agentType` 固定为已注册职责并独占权限选择；2. 随机 `displayName` 保持 role-adjective-noun 且只用于实例回显；3. `transportId` 仅供具有独立实例字段的 API 使用，OpenCode 继续使用固定 role/subagent type。
- **阻塞项**：无。
- **残余风险**：后续调用方仍需遵守“不得把 `displayName` 或 `transportId` 填入 OpenCode agent type/subagent type”的契约，并由回归持续守住；这不阻止重新验证。
- **人类动作**：知悉；无需介入。
- **自动下一步**：返回 `verify-change`，重跑命名与 transport 兼容性验证后继续实现链。
- **完整证据**：`.legion/tasks/optimize-token-cognitive-efficiency/docs/review-rfc.md`；`.legion/tasks/optimize-token-cognitive-efficiency/docs/rfc.md`；`tests/regression/token-cognitive-efficiency.test.ts`
