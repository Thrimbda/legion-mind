# 生产验收准备文档中文化

## 契约

- **Name**: 生产验收准备文档中文化
- **Task ID**: `localize-production-acceptance-docs`
- **Goal**: 把上一轮生产验收准备包中由我新增或改动的人类阅读文档改为中文，避免操作者在高风险生产验收场景中被英文说明干扰或误解。
- **Problem**: PR #44 交付的 runbook、checklist、模板、README 段落、Legion task/wiki 证据大量使用英文，不符合仓库与用户当前中文沟通要求；生产验收又是高风险操作，文档必须清晰、直接、中文优先。

## 验收标准

1. 中文化 PR #44 新增/改动的人类阅读文档，包括 production acceptance runbook、scheduler docs、templates、README 新增/相关段落、docs index 链接说明、task evidence 和 wiki summary。
2. 保留机器可读字段原文：命令、路径、文件名、环境变量、JSON/YAML key、状态枚举、label、URL、代码符号和英文产品名。
3. 不修改 scheduler runtime code，不改真实 secret，不执行 live acceptance。
4. 通过本地无 secret 验证：fixture scan、fixture dispatch、health、scheduler tests；并补充中英残留检查说明。
5. 完成 review、walkthrough、wiki writeback 和 PR lifecycle。

## 范围

- `docs/linear-legion-scheduler/production-acceptance-runbook.md`
- `docs/linear-legion-scheduler/index.md`
- `docs/linear-legion-scheduler/parallel-dispatch-locks.md`
- `docs/linear-legion-scheduler/delivery-pr-writeback.md`
- `scheduler/README.md`
- `scheduler/docs/**`
- `.legion/tasks/prepare-linear-scheduler-production-acceptance/**`
- `.legion/wiki/tasks/prepare-linear-scheduler-production-acceptance.md`
- `.legion/wiki/index.md`, `.legion/wiki/maintenance.md`, `.legion/wiki/log.md`
- 当前任务证据 `.legion/tasks/localize-production-acceptance-docs/**`

## 非目标

- 不翻译命令、路径、env var、JSON/YAML key、status enum、label、URL、代码符号。
- 不重写生产验收方案。
- 不实现 native writeback / live dispatch / webhook server。
- 不运行任何真实 Linear / GitHub / OpenCode live acceptance。

## 假设

- 用户要求“文档全部翻译成中文”指 PR #44 我交付的生产验收准备包及其 Legion/wiki 证据中的人类阅读文档。
- 保留英文技术 token 是必要的，否则会破坏命令可执行性或 schema 可读性。

## 约束

- 所有改动在 `.worktrees/localize-production-acceptance-docs/` 内完成。
- 交付仍走 PR lifecycle。
- 翻译时保持原有安全边界和 blocker 表述，不弱化风险。

## 风险

- 过度翻译会破坏命令或 schema；必须保留机器 token。
- 漏翻 task/wiki 证据会继续留下英文 reviewer-facing 内容。
- 只做语言修正，不能顺手扩大生产验收能力范围。

## 阶段

1. 创建 worktree 与任务契约。
2. 中文化生产验收准备包文档和对应 Legion/wiki 证据。
3. 检查残留英文是否属于允许保留的机器 token。
4. 运行本地验证并记录 test-report。
5. 完成交付 review、walkthrough、wiki writeback 和 PR lifecycle。
