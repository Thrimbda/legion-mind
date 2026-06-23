# RFC Review: Linear + Legion 自动调度器

> 本 PR 仅包含设计产物和后续 Work Items，无 scheduler 运行时代码变更。  
> Merge 视为设计批准，不代表实现已完成。  
> 本 PR body 只是 PR 创建/更新输入，不代表 checks/review/merge 或 PR lifecycle 已完成。

## 交付内容

- 总体 RFC：`docs/linear-legion-scheduler/rfc.md`
- Reviewer 入口：`docs/linear-legion-scheduler/index.md`
- 8 个合并后的实现 WI：`docs/linear-legion-scheduler/work-items/*.md`
- Legion 任务证据：`.legion/tasks/linear-legion-scheduler-rfc/**`
- RFC review：第一轮 FAIL 后已迭代，第二轮 PASS。

## 核心设计

- Linear 管 WI、依赖、优先级和人机协作状态。
- Scheduler DB 管 run、attempt、resource lock、event、webhook dedupe 和幂等。
- Legion 管每个 WI 的 contract、设计门、实现、验证、review、walkthrough 和 wiki writeback。
- GitHub PR 管代码交付、checks、review 和 merge / close 终态。

## 评审重点

- [ ] 是否接受 “Scheduler 不直接改代码，worker 必须进入 Legion workflow”。
- [ ] 是否接受 MVP implementation-ready 必须 `contract:stable`。
- [ ] 是否接受 downstream unlock 使用 `isBlockerSatisfied()`，而不是只看 Linear Done。
- [ ] 是否接受 scheduler-side Legion evidence verifier，防止 PR URL only 被误判 Done。
- [ ] 是否接受 8 个 WI 的粒度和依赖顺序。

## 证据链接

- Plan: `.legion/tasks/linear-legion-scheduler-rfc/plan.md`
- Research: `.legion/tasks/linear-legion-scheduler-rfc/docs/research.md`
- RFC: `docs/linear-legion-scheduler/rfc.md`
- RFC review: `.legion/tasks/linear-legion-scheduler-rfc/docs/review-rfc.md`
- Walkthrough: `.legion/tasks/linear-legion-scheduler-rfc/docs/report-walkthrough.md`
- Walkthrough HTML: `.legion/tasks/linear-legion-scheduler-rfc/docs/report-walkthrough.html`

## 下一步

- PR merge 后，把该设计视为调度器项目的总体方案。
- 后续实现按 8 个 WI 分别进入 Legion workflow，每个 WI 独立 task/worktree/PR。
