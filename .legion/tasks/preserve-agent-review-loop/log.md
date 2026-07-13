# 保留多 Agent 评审循环并修复报告语义 - 日志

## 会话进展 (2026-07-13)

### ✅ 已完成

- 已物化稳定任务契约并创建隔离 worktree。
- 已形成 `docs/rfc.md`，覆盖报告状态一致性、缺 verifier 收口、OpenCode 权限和多 Agent 循环。
- 独立 `review-rfc-zesty-lemur` 给出 FAIL，确认真实 Verdict 未绑定、阶段身份不可验证和无 verifier attention 可降级三个 blocker。
- 已按 review 退回 RFC，补充真实阶段文档重读、编排器阶段执行清单和无 verifier 至少 `review` 的设计。
- 第二个独立 `review-rfc-zesty-penguin` 确认阶段执行清单方向可实施，但指出 `DEFERRED` 仍缺所需数据、未来证据落点和成功/失败更新字段；RFC 已再次补齐结构化触发协议。
- 后续独立 `review-rfc-cosmic-sparrow` 判定 FAIL：scheduler 仍可能匹配历史 PASS、跨 transport receipt 没有真实生产与信任边界、schema v1.0 兼容承诺与强制 provenance 迁移冲突。
- 新的 `spec-rfc` Agent 已据此重写方案：renderer 与 scheduler 共用严格 current Verdict parser；报告 schema 升级到 v1.1；旧 v1.0 artifact 只读保留；阶段循环继续强制真实派生，但不虚构 receipt/attestation 或身份机械证明。
- `DEFERRED` 触发后不回写旧报告；owner 必须用原始触发证据创建或恢复后续 task，并重新派生 `verify-change -> review-change`。
- 独立 `review-rfc-fizzy-raven` 继续识别 renderer 风险真源与无 verifier attention 的机器约束缺口，RFC 已补齐风险绑定、`review` 最低注意力与正反例。
- 独立 `review-rfc-nimble-marten` 指出 OpenCode 权限描述误称“只有 JSON 可写”；新的 `spec-rfc` Agent 已改为保留现有 `docs/*.md` allow，只精确新增 `docs/report-data.json` allow，并把禁止手写生成物限定为流程约束。
- 独立 `review-rfc-nimble-ferret` 最终给出 PASS；确认共享 current Verdict、根级 risk 与 scheduler 外部绑定、无 verifier attention、v1.1 迁移/回滚和真实阶段派生边界均可进入实现。

### ✅ 实现、验证与验收

- 正式 `engineer-witty-panda` 已接管并审计并发草稿，完成共享 Verdict、v1.1 风险/profile、无 verifier 报告、OpenCode 权限与阶段派生实现；本地定向检查 32/32。
- 独立 `verify-change-quick-falcon` 判定 FAIL：定向 33/33、根回归 38/38、scheduler 58/58、上下文预算与 diff 均通过，但 worker 必需结果块遗漏 `legionEvidence.reportData`，真实 scheduler 收口路径不可达。
- 已退回新的 engineer，只修 worker 返回合同并补直接回归；完成后必须重新派生 verify-change。
- `engineer-gentle-yak` 已完成返修：补齐 worker 必需结果块中的 `legionEvidence.reportData`，并对 renderer/scheduler 共享门、无 verifier 语义、DEFERRED 双 task 重入和旧校验迁移重新审计。定向回归 33/33 PASS，`git diff --check` PASS。
- 返修仅恢复批准 RFC 已定义的可达路径，没有新增 scheduler 自动唤醒、receipt 或 attestation；下一步必须派生新的 `verify-change` Agent，不能复用上一轮 FAIL reviewer。
- 新的独立 `verify-change-lively-panda` 给出 PASS：定向 33/33、根回归 38/38、scheduler 58/58、context audit、pack dry-run 与 `git diff --check` 全部通过。
- 上一轮 blocker 已用成对证据关闭：真实 worker prompt 必需结果块包含 `reportData` 时完整证据通过，只删除该字段后 scheduler 以 `legion_evidence_missing` fail-closed。验证同时确认三种模式、独立作者/reviewer、三个 FAIL 回退、attention gate、ownership/security 均未因 token 优化被删减。
- 独立 `review-change-lucky-bison` 判定 FAIL：renderer 可接受仓库外 PASS symlink，scheduler 可接受跨 task PASS symlink；固定 locator 尚未绑定当前 task 的规范 realpath。
- 已退回新的 engineer 统一修复 renderer/scheduler 路径信任边界并补 symlink 负例；修复后必须重新派生 verify-change 与独立 review-change。
- `engineer-clever-bison` 已完成路径信任返修：renderer 与 scheduler 共用固定 locator 的规范 realpath 校验，拒绝跨 task、仓库外、同 task 其他文件及 report-data symlink，同时保留 repo root 本身通过 symlink 访问的合法场景。定向组合 36/36 PASS，`git diff --check` PASS。
- 普通文件系统检查后的 TOCTOU 仍是诚实保留的残余边界；本次未扩张为新的安全或 attestation 系统。下一步必须使用新的 verify-change 与 review-change 实例重验。
- 新的独立 `verify-change-witty-koala` 给出 PASS：定向 36/36、根回归 40/40、scheduler 59/59、context audit、pack dry-run 与 `git diff --check` 全部通过；额外真实 symlink 反例也确认中间目录、同 task 其他 report-data/阶段文件均被拒绝。
- 验证确认合法相对 `--input`、普通 worktree 与 repo root symlink 正例不受影响；返修前的 `review-change.md` 已过时，必须由新的独立 reviewer 覆盖。
- 新的独立 `review-change-cosmic-beaver` 给出 PASS：固定 locator、canonical repo root 与 exact realpath 没有已发现的静态路径旁路；三项原始缺陷、worker reportData 全路径和多 Agent 大循环均通过复审。
- 普通文件系统 TOCTOU 与恶意内容伪造继续作为非 attestation 边界保留；辅助验证文件出现不同 displayName 的排障噪音，但名称不是身份 attestation，交付报告只引用当前 PASS 阶段证据，不以实例名证明真实性。
- `report-walkthrough-zesty-badger` 已从 v1.1 `report-data.json` 生成 HTML、Markdown 与 PR body，并把“真实多任务、多模型 A/B 效果完全等价”保留为无 verifier 的 `INCONCLUSIVE`。
- `legion-wiki-quick-beaver` 已完成中文 wiki writeback；当前只剩 PR lifecycle。报告为 `attention: review`，允许准备 commit、push、PR 和 checks，但人类复核边界落盘前禁止 auto-merge/merge。
- 上述 A/B claim 是报告阶段自行引入的范围外判断，不是 RFC、验证或独立审查登记的当前 claim；后续报告收口已将它移出当前完成门，仅保留为可选、非阻塞的未来效果评估建议。
- 新的 `report-walkthrough-brisk-fox` 已重建唯一机器真源及三份派生产物：当前 `stageConclusion/reviewStatus` 均为 `PASS`、`claims=[]`、`attention: skim`。报告没有用 A/B 建议覆盖当前阶段证据，也没有虚构领域 verifier。
- `pr-html-render` 检查确认仓库没有现成的受控 HTML 预览机制；当前明确记录 `render.state=local`，未擅自新增公共 Pages 或发布权限，待维护者提供受控预览或明确批准后再恢复 rendered URL。
- `legion-wiki-eager-capybara` 已按当前权威报告重新收口 wiki：旧的 A/B 阻塞叙述已改为可选非阻塞后续，固定 locator 的精确 canonical realpath 与 symlink fail-closed 模式已写入查询层；任务状态保持 `active`，未虚构 PR/merge 终态。
- 提交前串行复跑确认定向 `36/36`、根回归 `40/40`、scheduler `59/59` 与上下文审计均通过；最初并行启动定向/根回归时曾因两个进程复用仓库内 fixture 互相删除而失败，改为仓库既有假设下的串行运行后全部恢复通过，不计为产品失败。
- 最终 `git diff --check` 发现当前生成 HTML 有一处行尾空格：`claims=[]` 时模板中的 `MISSING_VERIFIER_ALERT` 空占位符只留下缩进。该问题不改变报告语义，但会阻断提交质量门，已按循环退回新的 engineer 做源头返修；修复后必须重新派生 verify-change、review-change 并重建 walkthrough。
- `engineer-sunny-raven` 已完成有界返修：HTML 渲染出口统一清除每行末尾的空格与 Tab，并新增空 verifier 提示场景的直接回归断言；相关回归 `6/6` 与实现范围 diff check 均通过，未改变报告状态或验证语义。
- 新的独立 `verify-change-fizzy-sparrow` 给出 PASS：直接回归 `2/2`、定向 `36/36`、根回归 `40/40`、scheduler `59/59` 均通过；以两个隔离 task 实际生成的 `claims=[]` 与缺 verifier HTML 行尾空白均为 `0`。旧正式 staged HTML 属于待报告阶段重建的历史 artifact，不作为新 renderer 失败。
- 新的独立 `review-change-quick-koala` 给出 PASS：行尾规范化只删除每行末尾空格/Tab，保留换行与 HTML 内容；回归直接覆盖 `claims=[]` 的空提示场景，报告一致性、无 verifier、scheduler 与多 Agent 大循环语义均未改变。旧 A/B 报告被明确判为 stale artifact，必须由新报告阶段整体重建后才能通过最终质量门。
- 新的 `report-walkthrough-cosmic-otter` 已按 `--check -> render -> --check` 整体重建正式报告：当前 `claims=[]`、`attention: skim`、`render.state=local`，A/B 仅保留为范围外的非阻塞后续；三份产物均引用最新验证/审查，工作树 diff check 通过，新 HTML 行尾空白为 `0`。暂存区旧版本由编排器统一重新暂存后复查。
- 遗留写入曾在 16:35 把 wiki 回放为旧 A/B 阻塞叙述；`legion-wiki-eager-capybara` 已再次按当前权威 JSON 覆盖：A/B 是可选非阻塞后续，任务保持 `active` 的唯一原因是 PR lifecycle 尚未终态。stale 文字扫描与 wiki diff check 均通过。

### ⚠️ 历史运行噪音（已处理）

- 内置协作通道曾有 `spec-rfc` 实例未产生文件，OpenCode 回退路径也曾因 `Token refresh failed: 401` 不可用。后续 RFC 已经多轮独立 review-rfc 并最终 PASS，该故障不再是当前 blocker。
- 设计复审期间曾出现并发实现草稿与失败 fixture；正式 engineer 已接管，后续经新 verifier 和新 review-change 独立重验为 PASS，该草稿不计入完成证据。

---

## 关键文件

- `.legion/tasks/preserve-agent-review-loop/docs/rfc.md`
- `.legion/tasks/preserve-agent-review-loop/docs/test-report.md`
- `.legion/tasks/preserve-agent-review-loop/docs/review-change.md`
- `.legion/tasks/preserve-agent-review-loop/docs/report-data.json`
- `.legion/tasks/preserve-agent-review-loop/docs/report-walkthrough.html`

---

## 关键决策

| 决策 | 原因 | 替代方案 | 日期 |
|------|------|----------|------|
| 保留 `report-data.json` 作为单一中间真源 | 一次机器校验后生成三份人类产物，减少重复 token 与漂移 | 恢复三份手写报告；拒绝，因为会重新形成多真源 | 2026-07-13 |
| PASS walkthrough 对当前失败证据 fail-closed | `report-walkthrough` 是通过 review 后的收口报告，不是失败报告聚合器 | 动态推导 PASS/FAIL；拒绝，因为会与阶段 Verdict 真源重叠 | 2026-07-13 |
| Token 优化不取消阶段 Agent 隔离 | 用户明确要求保留 RFC 写审与验证验收大循环 | 同一 Agent 依次加载各 skill；拒绝，因为会退化为自写自审 | 2026-07-13 |
| ~~用 transport 实例 ID 和编排器执行清单证明阶段隔离~~（已推翻） | 后续审查确认仓库没有统一 receipt producer 或跨 transport 信任根；实现会制造伪证明 | 保留真实派生运行契约，并诚实声明实例隔离未机械证明 | 2026-07-13 |
| 报告生成器重读真实阶段 Verdict | JSON 自报 PASS 可以与实际阶段文档冲突 | 只收紧 JSON enum；拒绝，因为仍可重标 | 2026-07-13 |
| renderer 与 scheduler 共用严格 current Verdict parser | 两条完成门若各自解释 Verdict，历史 PASS 仍可绕过当前 FAIL | 只修 renderer；拒绝，因为 scheduler 仍会放行 | 2026-07-13 |
| report schema 升级到 v1.1，v1.0 只读保留 | 新旧输入语义与外部证据要求不应藏在同一版本中 | 保持 v1.0 并隐式收紧；拒绝，因为迁移不可判定 | 2026-07-13 |
| 不新增跨 transport attestation | 当前没有可信采集点；随机名称、session id 或自报清单不能证明身份真实性 | 伪造通用 receipt adapter；拒绝，因为会夸大保证 | 2026-07-13 |

---

## 快速交接

**下次继续从这里开始：**

1. 提交、rebase、push 并创建 PR，跟进 required checks。
2. checks 与 review 通过后完成 squash merge、worktree cleanup 与主工作区刷新；当前没有未决 claim 阻塞 auto-merge/merge。

**注意事项：**

- 当前报告没有无 verifier 的未决 claim；未来若真实登记 domain/authority 的 `INCONCLUSIVE` 或 `DEFERRED`，仍必须与阶段 Verdict 分层表达并提升人类注意力。
- 普通文件系统 TOCTOU 与跨 transport 身份 attestation 仍是明确的非目标；真实多任务、多模型 A/B 只是一项非阻塞的未来效果评估，不是本次任务的当前 claim 或 merge gate。

---

*最后更新: 2026-07-13 16:24 by Codex*
