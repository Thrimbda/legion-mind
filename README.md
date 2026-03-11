# Legion × OpenCode Autopilot Kit

这是一套面向“写代码”的通用 Agent 编排模板（寄宿在 OpenCode 中）：

- Primary agent: `legion`（orchestrator）
- Subagents: `engineer`, `spec-rfc`, `review-rfc`, `review-code`, `review-security`, `run-tests`, `report-walkthrough`
- Skill: `skills/legionmind`

## 快速开始（本地）

1) 确保仓库根目录有：
- `opencode.json`
- `AGENTS.md`
- `.opencode/`（agents/commands/plugins）

2) 运行 OpenCode：
```bash
opencode
```

3) 直接对话或执行命令：
- `/legion`：一键 Autopilot（设计→实现→测试→评审→报告）
- `/legion-impl`：仅实现→验证→报告
- `/legion-rfc-heavy`：高风险/Epic 任务先做重 RFC（仅设计）
- `/legion-pr`：本地可选提交/开 PR
- `/legion-bootstrap`：初始化或更新 `.legion/playbook.md`

一站式使用说明：`docs/legionmind-usage.md`

Benchmark 基线入口：`docs/benchmark.md`

流程产物默认路径：`.legion/tasks/<task-id>/docs/`（根目录 `docs/` 仅保留长期文档）。

## 一键安装（发布就绪）

最短路径（本地仓库）：

```bash
node scripts/setup-opencode.ts install
node scripts/setup-opencode.ts verify --strict
```

回滚到最近一次备份：

```bash
node scripts/setup-opencode.ts rollback
```

发布入口（npm 发布后可直接用）：

```bash
bunx legion-mind-opencode install
```

说明：

- 默认 `safe-overwrite`：只覆盖“托管且未被用户修改”的文件
- 若目标是 `user-modified` 或 `unmanaged-existing`，默认跳过；用 `--force` 才覆盖
- 只同步白名单资产：`.opencode/{agents,commands,plugins}` 与 `skills/legionmind`
- 安装状态文件位于 `~/.config/opencode/.legionmind/`：
  - `install-state.v1.json`
  - `managed-files.v1.json`
  - `backup-index.v1.json`
- `verify --strict` 仅两种结果：`READY`（0）或 `E_VERIFY_STRICT`（非 0）
- 本地隔离测试可使用：`--config-dir <dir> --opencode-home <dir>`

## GitHub 上使用

把 `.github/workflows/opencode.yml` 提交到仓库，并在 issue/PR 里评论：

- `/oc fix this`
- `/opencode implement ...`

OpenCode 会在 Actions runner 执行并产出 PR（取决于 workflow 权限和 token 设置）。


## 大任务（RFC Heavy）怎么用

当你希望先走“重 RFC”设计阶段（不写生产代码）：

- 直接运行命令：`/legion-rfc-heavy`
- 或在 GitHub 评论里加标签让 `legion` 自动切档：
  - `rfc:heavy` / `epic` / `risk:high`
  - `plan-only`（只做设计）
  - 设计 PR merge 后：`continue`（继续进入实现）

推荐流程：
1) `/legion-rfc-heavy` 生成 `task-brief + research + rfc + review-rfc + report-walkthrough + pr-body`
2) 创建 Draft PR（仅 docs），Merge 视为设计批准
3) Merge 后评论 `continue`，Agent 按 RFC Milestones 进入实现

说明：上述阶段产物默认落盘到 `.legion/tasks/<task-id>/docs/`。

## Harbor Benchmark Baseline

快速命令：

```bash
npm run benchmark:preflight
npm run benchmark:smoke
npm run benchmark:full
npm run benchmark:score -- --run <RUN_ID>
npm run benchmark:report -- --run <RUN_ID>
```

详细运行说明、评分口径和排障见 `docs/benchmark.md`。

模板见：
- `.opencode/skills/legionmind/references/TEMPLATE_RFC_HEAVY.md`
- `.opencode/skills/legionmind/references/TEMPLATE_PR_BODY_RFC_ONLY.md`
