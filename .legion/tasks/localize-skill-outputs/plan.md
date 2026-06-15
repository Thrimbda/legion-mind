# 全仓库 Skill 中文输出约束

## 任务名称

全仓库 Skill 中文输出约束

## Task ID

`localize-skill-outputs`

## 任务目标

为本仓库 `skills/*/SKILL.md` 中的所有 skill 增加明确输出语言约束：默认用中文回答；如果该 skill 会产出文档、报告、RFC、review、wiki、PR body、handoff 或其他人类阅读型文档产物，也默认用中文输出。各 skill 需按自身职责保留必要英文技术 token、命令、路径、配置字段和外部平台术语，避免因为中文化要求破坏触发、执行或验证语义。

## 问题陈述

仓库当前主体文档与 Legion workflow 任务证据已经以中文为主，但各 skill 对回答语言和文档产物语言没有一致的显式约束。用户要求“给本仓库所有的 skill 加一个约束为使用中文回答并输出文档产物（如果有），根据各个 skill 的实际情况来加”。如果只在全局规则里说明，未来安装到 OpenCode/OpenClaw 或独立加载某个 skill 时仍可能丢失该约束；因此需要把约束落到每个 skill 的 `SKILL.md` 内，并按不同 skill 的输出形态调节措辞。

## 验收标准

- `skills/*/SKILL.md` 下 13 个仓库 skill 都有明确中文回答约束。
- 对会产出 `.legion/tasks/**/docs/*.md`、wiki、review、walkthrough、PR body、HTML/report 等文档产物的 skill，约束中明确这些产物默认使用中文。
- 约束不要求翻译代码、命令、路径、frontmatter 字段、API/CLI 名称、错误消息、Git/GitHub/Linear 术语或用户明确要求保留的原文。
- 各 skill 的新增约束与其职责一致：只回答/评审/验证的 skill 不虚构文档产物；文档型 skill 明确文档输出语言；workflow/envelope skill 明确 task docs 与 lifecycle 记录语言。
- 不改变 skill frontmatter schema、运行模式、阶段顺序、Git lifecycle、验证流程或安装脚本语义。
- 完成 RFC / review-rfc 设计门、实现、验证、review-change、report-walkthrough、legion-wiki 写回和 PR lifecycle。

## 假设

- “本仓库所有的 skill”指仓库内可安装的 `skills/*/SKILL.md`，不包括用户本机全局 skill 副本或 `.opencode/agents`。
- 中文是默认输出语言；若用户明确指定其他语言，或外部接口/错误原文/规范要求使用英文，则按任务上下文保留原文或双语说明。
- 文档产物指人类阅读型持久产物，不包括可执行脚本、JSON schema、YAML 字段名、命令输出原文等机器可读内容。
- 当前改动是 skill 文档/行为约束变更，不需要改安装脚本或测试 fixture，除非验证发现安装 surface 依赖了具体文案。

## 约束

- 必须遵循 `legion-workflow` 与 `git-worktree-pr`；开发在 `.worktrees/localize-skill-outputs/` 内完成。
- 默认 base ref 为 `origin/master`，分支为 `legion/localize-skill-outputs-chinese-docs`。
- 需要按 `legion-docs` 维护 `.legion/tasks/localize-skill-outputs/**` 证据。
- 修改 skill 时保留触发关键词、英文技术 token 和安全/边界规则。
- 修改 OpenCode/OpenClaw 可加载 skill 后，交付说明需提醒用户重启运行时或重新安装/同步后新约束才会被加载。

## 风险

- 触及所有核心 workflow skill，若措辞过宽可能误改阶段语义或 Git lifecycle 语义。
- 若完全中文化关键 description/token，可能降低 skill 自动触发率；本任务应仅新增输出语言约束，不大规模重写 description。
- 若对文档产物定义过宽，可能误导 agent 翻译机器可读配置或第三方原文，导致可执行内容失效。

## 范围

- 修改 `skills/*/SKILL.md` 中与输出语言/文档产物语言相关的说明。
- 新增并维护 `.legion/tasks/localize-skill-outputs/**` 的 plan、RFC、日志、验证、review、walkthrough、PR body 等任务证据。
- 必要时更新 `.legion/wiki/**` 中与 skill 文档语言约束有关的当前知识。

## 非范围

- 不修改用户本机 `~/.opencode`、`~/.agents`、`~/.openclaw` 等全局安装副本。
- 不重写所有 skill 主体文案，不把英文技术名词全部翻译成中文。
- 不改变 `legion-workflow` 阶段链、`git-worktree-pr` lifecycle、安装脚本、测试 harness 或 agent 配置。
- 不为每个 skill 新增大规模 eval；本任务以静态 smoke checks、diff check 和现有 regression 为主。

## 推荐方向

采用“统一原则 + 按 skill 定制落点”的轻量设计：先在 RFC 中定义通用语言约束模板和例外规则，再把约束插入每个 `SKILL.md` 的高可见位置。文档型/流程型 skill 用更明确的“文档产物也用中文”措辞；实现/验证/评审型 skill 同时说明命令输出、错误原文、代码标识符保持原样。

## Design Summary

- 统一约束：默认中文回答；文档产物默认中文；保留机器可读内容、外部原文和用户指定语言。
- 定制方式：每个 skill 使用符合自身职责的标题或段落，避免复制一个与 skill 不匹配的模板。
- 设计门：该任务跨 13 个核心 skill，按中风险文档行为变更处理，先产出 RFC 并跑 `review-rfc`。
- 验证：用静态搜索确认每个 skill 有约束，用 `git diff --check` 和现有 regression 确认没有格式/安装 surface 回退。

## 阶段拆分

1. Brainstorm：收敛并物化 task contract。
2. Spec RFC：定义统一语言约束、例外和 per-skill 落点。
3. Review RFC：对设计做对抗审查并确认可实现。
4. Engineer：在 worktree 内更新 13 个 `SKILL.md`。
5. Verify Change：运行静态 smoke checks、`git diff --check` 和 regression。
6. Review Change：确认改动符合 scope，未破坏 skill 触发/安全/流程语义。
7. Report Walkthrough：生成 reviewer-facing 交付摘要与 PR body。
8. Legion Wiki：写回跨任务当前知识。
9. Git / PR lifecycle：commit、rebase、push、PR、checks/review、merge、cleanup、主工作区刷新。
