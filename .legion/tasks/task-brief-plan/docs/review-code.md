# 代码审查报告

## 结论
PASS

## 阻塞问题
- [ ] 无

## 建议（非阻塞）
- `.legion/tasks/task-brief-plan/docs/test-report.md:8` - 建议把固定检索范围补到 `.legion/config.json` 中当前 active task/proposal 的 wording，避免主文档已收敛但任务元数据再次漂移。
- `.legion/tasks/task-brief-plan/context.md:62` - 已记录后续可补自动一致性检查；建议把“当前 active task 的 proposal/scope mirror 也属于检查对象”写得更明确，减少以后只扫 `plan.md`/`docs/**` 的漏检风险。
- `docs/legionmind-usage.md:38` - 现已清楚说明 `config.json` 只是 scope mirror；后续若继续保留历史 proposal，建议在使用/评审说明里顺手强调“历史 proposal 是审计事实，不是当前任务契约”，降低审阅者误读概率。

## 修复指导
1. 当前无需阻塞性修复；本次 `task-brief-plan` 的现行契约、样例任务与核心 LegionMind 文档已经收敛到 plan-only 口径。
2. 若要继续加固，优先新增一条回归检查：扫描 `skills/legionmind/**`、`.opencode/agents/**`、`.opencode/commands/**`、`docs/**`、`.legion/config.json` 中当前 active task 元数据，拦截 `taskBriefPath`、`docs/task-brief.md`、以及把 `task-brief` 表述为现行正式产物的 wording。
3. 对未触达的历史任务目录与历史 proposal，维持“作为历史事实保留、但不参与 LegionMind 核心契约”的处理原则；若后续需要仓库级清理，单独立任务处理，不要在本次 plan-only 契约里重新引入兼容分支。
