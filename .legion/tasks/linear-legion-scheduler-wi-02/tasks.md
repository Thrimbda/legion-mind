# Tasks: Linear Scheduler WI-02

## Contract / Envelope

- [x] 加载 `legion-workflow` 并判断本请求由 Legion 接管 | 验收: 无 bypass，明确 WI-02 目标
- [x] 加载 `brainstorm` / `legion-docs` 并收敛 task contract | 验收: `plan.md` / `tasks.md` 物化在 worktree
- [x] 加载 `git-worktree-pr` 并创建 `.worktrees/linear-legion-scheduler-wi-02/` | 验收: 后续写入均在 worktree 内完成
- [x] 确认执行模式为 approved-design continuation | 验收: RFC review PASS + WI-01 已交付，SQLite 约束写入本 contract

## Engineer

- [x] 新增 SQLite migration / repository 基础设施 | 验收: 七类核心表与关键 constraints/indexes 可在测试 DB 创建
- [x] 实现 run state machine | 验收: 合法 / 非法转换单元测试覆盖
- [x] 实现 transactional claim API | 验收: active run、snapshot revalidation、locks、attempt、events、outbox 在同一事务中完成
- [x] 实现 resource lock acquire / release | 验收: lock conflict 与 release 测试覆盖
- [x] 实现 native / worker outbox 幂等模型 | 验收: AgentSession / activity / external URL / stop / worker dispatch 的 idempotency key 测试覆盖
- [x] 新增 scheduler debug service / command | 验收: 本地可启动并连接 SQLite DB，能执行 empty health / run list
- [x] 更新 WI-02 docs 与 scheduler index | 验收: reviewer 可从设计入口找到 WI-02 交付物，WI-02 acceptance 更新

## Verify

- [x] 运行 targeted scheduler tests | 验收: state machine、claim、snapshot、locks、outbox、timeline 测试 PASS
- [x] 运行 repo regression tests | 验收: `npm run test:regression` PASS 或记录可信 blocker
- [x] 执行 debug service smoke | 验收: 本地 SQLite DB / `:memory:` health PASS
- [x] 写入 `.legion/tasks/linear-legion-scheduler-wi-02/docs/test-report.md` | 验收: 命令、结果、覆盖范围、跳过项完整

## Review / Close

- [x] 执行 `review-change` 并写入 readiness 结论 | 验收: `docs/review-change.md` PASS 或明确 blocker
- [x] 生成 reviewer walkthrough 与 PR body | 验收: `docs/report-walkthrough.md` / `docs/pr-body.md` 存在
- [x] 执行 `legion-wiki` writeback | 验收: wiki task summary / index / patterns / log 更新
- [ ] 完成 git-worktree-pr lifecycle | 验收: commit、fetch+rebase、push、PR、checks/review、auto-merge、cleanup、main refresh 到终态

## 当前状态

- 当前阶段: Git / PR lifecycle
- 当前 owner: OpenAI / Legion agent
- Blocker: 无
