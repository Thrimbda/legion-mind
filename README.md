# Legion × OpenCode Autopilot Kit

这是一套面向“写代码”的通用 Agent 编排模板（寄宿在 OpenCode 中）：

- Primary agent: `legion`（orchestrator）
- Subagents: `engineer`, `spec-rfc`, `review-rfc`, `review-code`, `review-security`, `run-tests`, `report-walkthrough`
- Skill: `.opencode/skills/legionmind`

## 快速开始（本地）

1) 确保仓库根目录有：
- `opencode.json`
- `AGENTS.md`
- `.opencode/`（agents/commands/skills）

2) 运行 OpenCode：
```bash
opencode
```

3) 直接对话或执行命令：
- `/legion`：一键 Autopilot（设计→实现→测试→评审→报告）
- `/legion-impl`：仅实现→验证→报告
- `/legion-pr`：本地可选提交/开 PR

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
1) `/legion-rfc-heavy` 生成 `task-brief + research + rfc + review-rfc + pr-body`
2) 创建 Draft PR（仅 docs），Merge 视为设计批准
3) Merge 后评论 `continue`，Agent 按 RFC Milestones 进入实现

模板见：
- `.opencode/skills/legionmind/references/TEMPLATE_RFC_HEAVY.md`
- `.opencode/skills/legionmind/references/TEMPLATE_PR_BODY_RFC_ONLY.md`
