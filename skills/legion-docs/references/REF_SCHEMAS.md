# Legion 文档结构

仅在需要目录、必需标题或 Review 语法时读取。

## 目录

```text
.legion/
├── wiki/{index,decisions,patterns,maintenance,log}.md
├── wiki/tasks/<task-id>.md
└── tasks/<task-id>/
    ├── plan.md
    ├── log.md
    ├── tasks.md
    ├── docs/{research,rfc,review-rfc,implementation-plan,test-report,review-change}.md
    ├── docs/report-data.json
    ├── docs/{report-walkthrough,pr-body}.md
    ├── docs/report-walkthrough.html
    └── reports/
```

raw task docs 不兼任 wiki；wiki 按需建立。文档默认使用用户/agent 工作语言，仓库有约定时从其约定。

## `plan.md`

唯一任务契约与执行索引，读多写少。必须保留：

- `## 目标`
- `## 问题陈述`
- `## 验收标准`
- `## 假设 / 约束 / 风险`
- `## 要点`
- `## 范围`
- `## 阶段概览`

存在 design-lite/RFC 时还需 `## 设计索引`，指向设计真源并给摘要。`plan.md` 只保留问题、验收、scope、风险和摘要级方向，不粘贴设计正文、迁移步骤、测试矩阵或日志；不创建 `task-brief.md`。`## 范围` 是唯一人类可读授权边界。

## 设计证据

- `docs/research.md`：heavy profile 的现状、证据定位和 `Unverified` 项。
- `docs/rfc.md`：设计真源；standard 至少有 Options/Decision/Verification，heavy 另含 milestones、rollback/observability。
- `docs/implementation-plan.md`、`risk-register.md`、`appendix-*.md`：仅在复杂里程碑、风险或细节会挤占 RFC 时使用。
- `docs/test-report.md`、`review-*.md`、report artifacts：阶段证据，不能混入 `log.md`。

## `log.md`

append-only 活体记录：按日期写已完成、进行中、阻塞；登记关键文件、决定与快速交接。不要写成背景资料袋或复制长输出。

## `tasks.md`

机器可读状态板，至少含当前阶段、当前检查项、进度和分阶段 checklist。阶段状态：0 项完成为 `NOT STARTED`；部分完成为 `IN PROGRESS`；全部完成为 `COMPLETE`。

## Wiki 路由

`index.md` 只导航；跨任务当前规则写 `decisions.md`，可复用做法写 `patterns.md`，待补证据/迁移写 `maintenance.md`，任务摘要写 `tasks/<task-id>.md` 并链接 raw evidence。

## Review 语法

```markdown
> [REVIEW] 普通评论
> [REVIEW:blocking] 必须修复
> [REVIEW:question] 问题
> [REVIEW:suggestion] 建议
> [RESPONSE] 回复
> [STATUS:resolved]
```

状态：`open|resolved|wontfix|need-info`。
