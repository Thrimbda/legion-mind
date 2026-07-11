# 人类注意力交接与验证路由变更审查（第二轮）

## 阻塞发现

无。

## 上轮阻塞复核

上轮关于 provenance 与 authority 回归仅做关键词检查的阻塞已解决。`tests/regression/attention-verification-protocol.test.ts` 现在包含可执行判定 helper 与表驱动 fixture：

- provenance 正例真实创建并重开 verifier、必要 reference 和原始输出 locator，重算 SHA-256，核对执行记录及 `claim-id` 映射后导出 `PASS`；缺 verifier locator、缺摘要、缺资源清单、缺执行记录、缺原始输出、缺 claim 映射或摘要不一致的七个负例均实际导出 `INCONCLUSIVE`。
- authority 正例读取资质来源与原始证据，核对主体、范围、固定有效期及完整性、真实性、签名校验后导出 `PASS`；证据缺失、过期、范围越界、locator 不可读以及三类校验失败的七个负例均实际导出 `INCONCLUSIVE`。
- 这些断言调用状态判定逻辑并检查可读失败原因，不再以协议关键词存在代替正负路径结果。

## Scope、正确性与可维护性

- 实际变更仍位于 contract 声明的 skill、reference、walkthrough 模板、回归测试和当前 task 文档范围内，未发现 scope 越界。
- `REF_HUMAN_ATTENTION.md` 与 `REF_COGNITIVE_VERIFICATION.md` 分别保持注意力/lifecycle 与认知验证的单一真源；各阶段使用可解析的相对 locator，没有新增 `attention.md`、新 skill、第四种运行模式或必经阶段。
- 三条既有阶段链未改变；`review` 的 auto-merge / merge 门、`decide` 优先于普通 `FAIL` 回退、决定持久化与恢复点边界一致。
- 三轴、五种 claim 状态、领域 verifier、provenance、authority、`DEFERRED` 与 `RECOMMENDATION` 的正负语义完整；walkthrough 与 PR 模板能直接聚合人类动作和证据限制。
- 新增 fixture helper 只服务协议回归，没有被包装成生产 verifier registry 或外部 authority 服务，职责边界清楚。
- 本次新增或改写的人类可读内容使用中文；英文仅保留于技术标识、命令、路径、代码和兼容枚举。

## 验证证据重查

- 独立重跑新增协议单测：7/7 通过，退出码 0。
- 独立重跑 `npm run test:regression`：25/25 通过，退出码 0。
- 独立重跑 `npm --prefix scheduler test`：57/57 通过，退出码 0。
- 独立重跑 `git diff --check`：退出码 0，无输出。
- scheduler fixture 继续真实调用 `verifyLegionEvidence`：只有独立 `## Verdict\n\nPASS` 能通过，claim 表中的细粒度状态不会替代阶段 Verdict。
- 测试报告对第二轮命令、结果、fixture 正负路径与残余限制的描述和实际测试一致，三个 routine claim 的 `PASS` 可由当前证据支持。

## 专业证据与特殊主张审查

- 本任务实际 claim 均为 `routine`，没有真实 `domain` 或 `authority` claim；未加载领域 verifier、没有真实 authority evidence 是正确的“不适用”，不需要伪造 provenance。
- 新增 provenance 与 authority fixture 是协议回归数据，不冒充本任务的专业或权威证据。
- 当前任务没有 `DEFERRED` 或 `RECOMMENDATION` claim；报告写“无”与实际范围一致。
- fixture 证明协议判定语义，不证明真实外部权威服务、生产 verifier registry、未来会话遵循率或注意力节省幅度；这些均是 RFC 已声明的非目标，不阻塞交付。

## 安全视角

本变更调整 orchestrator 与 PR lifecycle 的 protocol boundary，已展开安全视角。`review` 禁止越过 auto-merge / merge / cleanup，`decide` 停止阶段转换并要求决定持久化；未发现鉴权、秘密、用户输入高权限路径、数据暴露或可利用的信任边界问题。安全视角未产生阻塞。

## Verdict

PASS

## 会话注意力摘要

- **阶段**：`review-change`
- **阶段结论**：`PASS`
- **注意力等级**：`skim`
- **判断变化**：上轮 provenance/authority 回归仅做关键词检查的阻塞已解决；第二轮只读重查确认正负 fixture 会实际重开证据、重算摘要并导出规定状态。
- **关键发现**：provenance 与 authority 各自的有效正例导出 `PASS`、七个负例导出 `INCONCLUSIVE`；新增协议单测 7/7、根回归 25/25、scheduler 回归 57/57 与 `git diff --check` 全部通过；scope、阶段链、相对 locator、中文 surface 与 lifecycle 安全边界均符合 RFC。
- **阻塞项**：无。
- **残余风险**：fixture 证明协议判定语义，不等同于真实领域 verifier、外部权威服务或生产会话注意力指标；这些限制已在 RFC 非目标中明确。
- **人类动作**：无动作。
- **自动下一步**：进入 `report-walkthrough` 聚合交付证据。
- **完整证据**：`.legion/tasks/human-attention-verification-routing/docs/review-change.md`
