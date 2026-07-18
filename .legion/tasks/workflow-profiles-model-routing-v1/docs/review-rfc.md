# RFC 审查：Legion 分层流程与条件化交付

## 审查范围

- `.legion/tasks/workflow-profiles-model-routing-v1/plan.md`
- `.legion/tasks/workflow-profiles-model-routing-v1/docs/research.md`
- `.legion/tasks/workflow-profiles-model-routing-v1/docs/rfc.md`
- profile、walkthrough、安装迁移、刷新与相关行为测试实现

## 独立性

由独立只读上下文 `review-rfc-cosmic-lemur` 完成；该上下文未参与实现、未修改文件，也未派生其他 Agent。

## 审查过程

前两轮均返回 FAIL，阻塞项已修复后第三轮复审：

1. walkthrough 曾未保留 resolved workflow profile，可能丢失 Strict override 或显式设计门；现由 renderer 强制 `workflowProfile` 与 `designRequired`，并按 resolved stage requirements 重新读取证据。
2. `contract-only` 曾不重新读取 plan；现要求 canonical task `plan.md`，并覆盖缺失、跨 task symlink 与仓库外 symlink。
3. retired asset 清理曾可能把缺失源误判为退役；现只处理 `<configDir>/agents/**` 的旧 managed agents，required skill source 缺失在任何写入前 fail closed。
4. Lite 无 change review 时固定 `reviewStatus=NOT_REQUIRED`，不再允许用 evidence item 虚报 PASS。

## Blocking findings

无。

## 残余风险

scheduler 继续使用 legacy report validator，而 walkthrough renderer 使用 resolved policy binding；这个刻意边界必须持续由根回归与 scheduler suite 共同保护。scheduler 源码、prompt、CLI 与 evidence verifier 本任务未改。

## Verification observed by reviewer

- `npm run test:regression`: 44 passed, 0 failed（复审时点）
- `git diff --check`: PASS
- scheduler 源码无 diff
- per-spawn 模型路由仍在范围外

## Verdict

PASS

## 会话注意力摘要

- **阶段**: `review-rfc`
- **阶段结论**: `PASS`
- **注意力等级**: `skim`
- **判断变化**: 两轮报告 contract 与安装迁移 blocker 已全部关闭。
- **关键发现**: resolved policy 已形成 renderer 硬门；contract-only 已绑定当前 plan；旧 agents 迁移 fail closed。
- **阻塞项**: 无。
- **残余风险**: shared legacy validator 与 renderer-specific binding 的边界需继续由回归保护。
- **人类动作**: 知悉。
- **自动下一步**: 继续 verify-change，再做独立 review-change。
- **完整证据**: `.legion/tasks/workflow-profiles-model-routing-v1/docs/review-rfc.md`
