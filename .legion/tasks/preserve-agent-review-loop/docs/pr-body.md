# 实现交付审查

> 本报告只证明当前 task 的设计、实现、验证与独立审查证据已通过，不证明 PR checks、review、merge、cleanup 或主工作区刷新已经完成。
> 本文只是 PR 创建或更新输入，不证明 checks、review、merge、cleanup 或主工作区刷新已完成。

## 交付视角与结论

- 交付类型：`implementation`
- 风险：`high`
- 阶段结论：`PASS`
- 审查状态：`PASS`
- 最终状态：实现、最新独立验证与最新独立变更审查均为 PASS；正式报告从当前证据重建，当前没有未决 claim 或 merge gate。

三项原始缺陷、worker 到 scheduler 的 reportData 证据链、固定 locator 的精确 realpath 与 symlink 边界，以及 HTML 行尾空白返修均已完成实现、独立验证和独立变更审查。当前正式证据一致为 PASS，未登记需要人类裁决的未决 claim；维护者只需快速浏览交付摘要与风险边界。

## 人类注意力与当前动作

- 聚合注意力：`skim`
- 当前唯一人类动作：快速浏览交付摘要、验证计数与范围外边界，然后继续正常 PR lifecycle。
- lifecycle 边界：报告生成不代表 PR checks、review、merge、cleanup 或主工作区刷新已经完成；这些步骤仍按正常 lifecycle 执行。
- 停止点：报告生成不代表 PR checks、review、merge、cleanup 或主工作区刷新已经完成；这些步骤仍按正常 lifecycle 执行。
- 摘要：最新独立验证与独立审查均为 PASS，没有当前 blocker、未决 claim 或需要人类决定的事项。
- 证据：\.legion/tasks/preserve\-agent\-review\-loop/docs/test\-report\.md、\.legion/tasks/preserve\-agent\-review\-loop/docs/review\-change\.md


## 未解决的认知状态

当前证据未登记需要单独聚合的未解决 claim。

## 领域验证摘要

当前证据未登记领域或权威 verifier。

## 范围

### 范围内

- 报告 v1\.1 状态一致性、严格当前 Verdict 与 fail\-closed 阶段门
- 无 verifier 的领域或权威主张的诚实表达协议
- OpenCode 报告 Agent 对 docs/report\-data\.json 的精确写权限
- worker 到 scheduler 的 reportData 必需证据链
- renderer 与 scheduler 的固定 locator、精确规范 realpath 和 symlink 安全边界
- RFC 作者与独立评审、实现与验证、验证与独立验收循环及 FAIL 回退
- 按需加载、共享校验器与五字段短交接的 token 优化
- renderer 生成 HTML 的行尾空格与 Tab 规范化

### 范围外

- 真实多任务、多模型旧新版本 A/B 效果评估；这是可选的后续评估，不是当前 claim 或 merge gate
- 跨 transport 身份证明或密码学执行证明
- 恶意本机并发替换下的文件句柄级原子读取
- 自动调度 DEFERRED 触发与后续任务
- 为本地 HTML 新增公开 Pages 或其他预览基础设施

## 证据地图

| 证据 | 类型 | 状态 | locator |
| --- | --- | --- | --- |
| 任务合同 | plan | INFO | \.legion/tasks/preserve\-agent\-review\-loop/plan\.md |
| 高风险实现 RFC | rfc | PASS | \.legion/tasks/preserve\-agent\-review\-loop/docs/rfc\.md |
| review\-rfc\-nimble\-ferret 独立 RFC 对抗审查 | review\-rfc | PASS | \.legion/tasks/preserve\-agent\-review\-loop/docs/review\-rfc\.md |
| verify\-change\-fizzy\-sparrow 独立验证报告 | test\-report | PASS | \.legion/tasks/preserve\-agent\-review\-loop/docs/test\-report\.md |
| review\-change\-quick\-koala 独立变更与安全审查 | review\-change | PASS | \.legion/tasks/preserve\-agent\-review\-loop/docs/review\-change\.md |

## 交付路径

1. spec\-rfc 编写高风险设计，新的独立 review\-rfc Agent 对抗审查后才准入实现
2. engineer Agent 实现报告协议、scheduler 证据门、精确权限与阶段运行契约
3. verify\-change Agent 独立运行直接回归、定向组合、根回归、scheduler 全量与真实 HTML fixture
4. review\-change Agent 独立复核正确性、范围、可维护性、安全边界与大循环不变性
5. 任一验证或审查 FAIL 都回到对应实现或设计阶段，返修后重新派生新的独立 Agent
6. report\-walkthrough 只从当前 PASS 证据填写单一 report\-data\.json，再原子生成三份审阅产物
7. 本地 HTML、wiki 与 PR lifecycle 分别继续收口，不把报告生成冒充 merge 终态

## 变更与决定

- 报告 schema 升级为 v1\.1，evidence 与 verification 只接受 PASS 或 INFO；renderer 与 scheduler 共用严格 current Verdict 解析器，当前 FAIL、重复或缺失 Verdict、历史 PASS 冒充当前结论均会 fail\-closed。
- domain 或 authority 的 INCONCLUSIVE、DEFERRED 主张可以在没有真实 verifier 时如实生成；详细产物明确显示未获得 verifier、证据缺口、升级或延后验证路径，只有当前未决项才提升人类 attention。
- OpenCode 报告 Agent 保留既有 Markdown 写权限，只精确新增 \.legion/tasks/\*\*/docs/report\-data\.json；该 JSON 是 schema 校验后的机器生成真源，不是需要人类阅读或手工同步的第四份报告。
- worker 的必需结果块新增规范 reportData locator，scheduler 将其纳入最终完整证据门，并与当前 task、profile、risk 和固定阶段文档绑定；缺失或偏离都会拒绝。
- renderer 与 scheduler 要求固定 repo\-relative locator 的 realpath 精确等于仓库内预期文件，拒绝仓库外、跨 task、同 task 其他文件和中间目录 symlink 重定向。
- spec\-rfc 与 review\-rfc、engineer 与 verify\-change、verify\-change 与 review\-change 继续由不同阶段 Agent 执行；三条 FAIL 回退、attention 门、阶段归属和五字段交接均保留。
- token 效率来自按需加载、共享验证逻辑和五字段判断增量；完整命令、diff、测试与审查证据仍落盘，没有删除 RFC、验证或独立审查阶段。
- report\-data\.json 通过 schema、语义、当前 Verdict、taskId 与路径门后，由 renderer 事务式原子派生 HTML、Markdown 与 PR body，并在 HTML 出口删除每行末尾的空格和 Tab。

## 验证与审查状态

| 检查 | 状态 | 证据 |
| --- | --- | --- |
| 两项 HTML 行尾空白与无 verifier 直接回归 2/2 | PASS | \.legion/tasks/preserve\-agent\-review\-loop/docs/test\-report\.md |
| 报告、scheduler、attention、权限与阶段契约定向组合 36/36 | PASS | \.legion/tasks/preserve\-agent\-review\-loop/docs/test\-report\.md |
| 根回归 40/40 | PASS | \.legion/tasks/preserve\-agent\-review\-loop/docs/test\-report\.md |
| scheduler 全量测试 59/59 | PASS | \.legion/tasks/preserve\-agent\-review\-loop/docs/test\-report\.md |
| claims 为空与缺 verifier 两类实际 HTML 的行尾空白行均为 0，预期 verifier 提示均保留 | PASS | \.legion/tasks/preserve\-agent\-review\-loop/docs/test\-report\.md |
| review\-change\-quick\-koala 独立变更审查与安全视角通过 | PASS | \.legion/tasks/preserve\-agent\-review\-loop/docs/review\-change\.md |

## 风险与限制

- 真实多任务、多模型旧新版本 A/B 的完整效果等价未在本任务中评估；缓解：只陈述本轮已验证的协议、门禁、回退、路径安全与阶段不变性；将 A/B 保留为可选的后续评估，不注册为当前 claim，也不阻塞 merge。
- 普通文件系统在 realpath 检查完成后仍存在 TOCTOU 窗口；缓解：当前只承诺固定 locator 与精确规范路径绑定，不把结果扩大为文件句柄级原子读取或抵抗恶意本机并发替换的保证。
- 阶段派生事件和 Agent 名称不是跨 transport 身份 attestation；缓解：名称与 session id 只作审计线索；工作流只宣称可观察的真实派生、不同阶段会话和独立审查合同。
- PR lifecycle 尚未完成；缓解：继续执行 wiki、commit、push、checks、review、merge、cleanup 与主工作区刷新，并分别记录终态证据。

## 审阅清单

- [ ] 快速确认页面顶部显示 implementation、high、PASS、skim、唯一当前动作和 PR lifecycle 边界。
- [ ] 确认 claims 为空，真实多任务、多模型 A/B 只在范围外与风险边界中作为非阻塞后续评估出现。
- [ ] 确认三项原始修复、worker reportData、精确 realpath 与 symlink 边界都能回到最新 test\-report 和 review\-change。
- [ ] 确认两项直接回归、36/36、40/40、59/59、两类 HTML 行尾空白为 0 与独立审查 PASS 均清晰可见。
- [ ] 确认 RFC、独立 review\-rfc、engineer、独立 verify\-change 与独立 review\-change 大循环及 FAIL 回退没有因 token 优化减少。
- [ ] 确认 HTML、Markdown 与 PR body 均由同一 report\-data\.json 原子生成，且 PR body 不冒充 lifecycle 终态。

## 渲染交接

- PR-backed：是
- 状态：`local`
- 说明：仓库当前没有受控的 HTML preview 机制，因此保留仓库内本地 HTML 审阅产物且未新增公开 Pages；未来在受控机制可用或维护者明确批准 Pages 后，可恢复 rendered URL。

## 最终状态与下一阶段

- 当前状态：实现、最新独立验证与最新独立变更审查均为 PASS；正式报告从当前证据重建，当前没有未决 claim 或 merge gate。
- 下一阶段：维护者快速浏览仓库内本地 HTML，随后进入 wiki 与正常 PR lifecycle。
- lifecycle 声明：本报告只证明当前 task 的设计、实现、验证与独立审查证据已通过，不证明 PR checks、review、merge、cleanup 或主工作区刷新已经完成。
