# LegionMind

LegionMind 不是另一个“让智能体多写一点代码”的工作流包。

它试图成为一套面向高级智能体使用者的**多智能体工程操作系统内核**：把任务记忆、设计门禁、评审协议、验证与汇报收敛成一套**可安装、可验证、可迭代**的智能体编排内核，让人类从执行者转向指挥、验收者和系统迭代者。

> 当前状态：`可运行内核 / v1 前硬化中`

## 为什么需要 LegionMind

当我们开始使用 Multi-Agent Vibe Coding 体协作运行起来，最先碰到的问题通常是这些更底层的问题。

- 并行执行能放大 token 吞吐量，但也会把错误方向一起放大。
- 真正的瓶颈会从“写代码”转移到人的上下文管理、验收和决策。
- 智能体最容易翻车的不是世界知识，而是项目里的隐含知识墙，也就是本项目中具备主见的部分：各类历史决策，局部的最佳实践。
- 没有设计门禁（中高风险改动先在 `.legion/tasks/<task-id>/plan.md` / `.legion/tasks/<task-id>/docs/rfc.md` 说清为什么改、影响什么、怎么回滚）、分层验证（把安装校验、任务验证、文档一致性分开检查）和证据化汇报（用 `test-report.md`、`report-walkthrough.md`、`pr-body.md` 带着证据交付），多智能体只会更快地返工。
- 当模型越来越强，工作流不该只靠感觉调参，而要走向证据驱动的工程化迭代。

LegionMind 试图把这些问题当成系统问题来处理，而不是继续堆提示词、堆技能、堆智能体数量。

它的北极星不是“自治更多”，而是三件更朴素的事：

- 尽量少打扰人
- 尽量多产生有效工作
- 尽可能提高可靠性和可验证性

## 它是什么

从目标态上看，LegionMind 应该同时是两样东西：

1. **多智能体工程操作系统内核**
   - 提供稳定的工作主干，而不是依赖会话临场发挥。
   - 明确编排器、子代理、技能、任务记忆和知识库记忆的边界。
   - 把“意图对齐 -> 执行 -> 验证 -> 汇报 -> 记忆”收敛为固定闭环。

2. **可安装的智能体编排内核**
   - 能安装到真实工作环境中，而不只是停留在仓库内工作流。
   - 能通过 `install / verify / rollback` 证明自己不是只会写文档。
   - 当前迭代优先收敛工作流内核本身，而不是同时承诺所有验证层都已经稳定。

## 系统模型

LegionMind 的主模型不是“命令列表”，而是下面这条工程闭环：

```text
Intent -> Plan -> Execute -> Verify -> Report -> Memory
```

当前仓库把这条闭环拆成几层：

- **任务记忆**：`.legion/tasks/**`
  - `plan.md`: 任务契约与设计索引
  - `log.md`: 过程日志与决策记录
  - `tasks.md`: 状态板与阶段进度
- **Wiki 记忆**：`.legion/wiki/**`
  - **它不保存任务过程，而是沉淀跨任务仍然有效的当前知识**
  - 统一收口决策、可复用模式、维护债务和任务摘要
- **规则 / 运行时层**：`skills/**` + `.opencode/**` + OpenClaw 安装入口
  - 工作流真源、技能边界、代理接线，以及本地管理脚本

在由 Legion 管理的仓库中，任何非简单的多步骤工程工作都必须先过 `legion-workflow` 这一 mandatory first gate；在完成入口判断前，不应先做代码、git 或文件探索，也不应开始实现或派生子代理。

会修改仓库文件的开发任务还必须进入 `git-worktree-pr` envelope：从默认 `origin/master` 基线创建 `.worktrees/<task-id>/` worktree，在其中实现并通过 PR lifecycle 交付。进入该 envelope 后，commit、push PR branch、创建或更新 PR、跟进 checks/review/auto-merge、cleanup 和主工作区基线刷新都是默认生命周期动作，不需要用户逐项显式授权；用户沉默不是跳过 commit / push / PR 的理由。只有用户明确要求不提交、不 push、不开 PR、不继续 PR lifecycle，或明确 bypass 时，才改变默认闭环，并记录为 explicit bypass/blocker。push 前必须在 worktree 内 `git fetch origin && git rebase origin/master`。完成不等于“已开 PR”或 blocked handoff，而是 Legion 证据闭环加上 PR 合并/关闭/确认废弃、review/checks 处理完成、worktree 删除和主工作区基线刷新。

这里所说的 active task，只指当前请求明确恢复并继续推进的 `.legion/tasks/<task-id>/` 任务目录，不是 CLI 持久化注册表。

它的核心边界也应该是显式的：

- `legion-workflow` 负责门禁、恢复、路由、写回与只读综合（按当前 schema / wiki / raw docs 给出收敛后的判断）
- `skills/legion-workflow/scripts/legion.ts` 只负责本地初始化、查询和有限更新（不解释工作流阶段）
- `brainstorm` 负责收敛任务契约
- `spec-rfc` / `review-rfc` 负责设计门禁
- `engineer` 负责受边界约束的实现
- `verify-change` / `review-change` 负责验证证据与交付判断
- `report-walkthrough` 负责面向评审者的交付摘要
- `legion-wiki` 负责固定收口写回

换句话说，LegionMind 的重点不是“自动化更多动作”，而是让每个阶段的职责边界清晰、可回放、可审计。

## 核心能力

一个成熟的 LegionMind，至少应该稳定提供这些能力：

- **任务契约优先**
  - 没有稳定契约，就不进入实现。
- **设计门禁**
  - 中高风险任务先过轻量设计或 RFC，而不是先写代码再补文档。
- **评审即协议**
  - 评审不是聊天记录，而是可追踪、可响应、可阻塞的结构化状态。
- **固定收口写回**
  - 任务结束前必须把持久知识从原始任务文档提升到 wiki 层。
- **安装 / 校验 / 回滚**
  - 工作流资产可以安全同步、严格校验、必要时回滚。

## 快速开始

从仓库根目录选择你正在使用的运行时安装一次，然后用 strict verify 证明安装结果可复核。本仓库当前只维护 OpenCode 与 OpenClaw 两条入口；其他运行时不在当前支持面，也没有通用 runtime orchestrator 承诺。OpenCode 安装固定核心 skill set，OpenClaw 动态安装带 `SKILL.md` 的 skills；二者都会记录 managed manifest。

前置要求：Node.js `>=22.6.0`。

```bash
node --version
```

如果你同时使用 OpenCode 和 OpenClaw，可以两条都安装；否则只跑对应小节即可。

### 安装到 OpenCode

OpenCode 安装会同步 `.opencode/agents`、`.opencode/plugins`（如果存在）和固定核心 skill set，并记录 managed manifest / backup index；这是当前带完整 `install / verify / rollback / uninstall` 的路径。

```bash
npm run opencode:install
npm run opencode:verify
```

默认目标：

- config: `~/.config/opencode`
- skills: `~/.opencode/skills`
- managed state: `~/.config/opencode/.legionmind`

如果要先在仓库内隔离目录里试跑：

```bash
node scripts/setup-opencode.ts install --config-dir .cache/opencode-config --opencode-home .cache/opencode-home
node scripts/setup-opencode.ts verify --strict --config-dir .cache/opencode-config --opencode-home .cache/opencode-home
```

回滚最近一次由安装脚本创建的备份：

```bash
npm run opencode:rollback
```

卸载由 manifest 管理且未漂移的文件：

```bash
npm run opencode:uninstall
```

### 安装到 OpenClaw

OpenClaw 文档支持从 `~/.openclaw/skills`、workspace `skills/` 和 `skills.load.extraDirs` 发现 skills。本仓库的 OpenClaw 安装脚本现在把 local skills root 作为主路径，并保留 `extraDirs` 兼容；文件资产的 `install / verify / rollback / uninstall` 语义与 OpenCode 对齐：

- 默认把 `skills/<name>/` 安装到 `~/.openclaw/skills/<name>/`
- 同时把当前 checkout 的 `skills/` 加入 `~/.openclaw/openclaw.json` 的 `skills.load.extraDirs`（可用 `--no-extra-dir` 跳过）
- 在 `~/.openclaw/.legionmind` 记录 managed manifest / backup index
- 用 strict verify 校验 managed ownership 与 checksum drift
- rollback 只恢复 backup index 记录的 managed skills 文件；uninstall 默认只删除 manifest 管理且未本地漂移的文件，`--force` 才删除漂移目标
- `openclaw.json` 不作为 managed file 管理，安装只追加缺失的 `skills.load.extraDirs`，回滚/卸载不会删除用户配置；extraDirs 兼容项在 verify 中保持 warning-only，可用 `--no-extra-dir` 跳过

```bash
npm run openclaw:install
npm run openclaw:verify
npm run openclaw:rollback
npm run openclaw:uninstall

npm run test:regression
```

如果只是想在当前 repo workspace 中试用 OpenClaw，OpenClaw 本身也会扫描 `<workspace>/skills`；全局安装的价值是让这些 skills 在其他 workspace 也可用。

仓库内隔离目录试跑：

```bash
node --experimental-strip-types scripts/setup-openclaw.ts install --config-dir .cache/openclaw-home
node --experimental-strip-types scripts/setup-openclaw.ts verify --strict --config-dir .cache/openclaw-home
```

回滚或卸载 managed skills 文件：

```bash
npm run openclaw:rollback
npm run openclaw:uninstall
```

遇到已有本地文件冲突时，安装默认会 safe-skip；确认要备份并覆盖后再使用：

```bash
npm run openclaw:install -- --force
```

如果只想把 skills 安装到 OpenClaw local root，而不改 `openclaw.json`：

```bash
npm run openclaw:install -- --no-extra-dir
```

### 常用脚本

```bash
npm run opencode:install
npm run opencode:verify
npm run opencode:rollback
npm run opencode:uninstall

npm run openclaw:install
npm run openclaw:verify
npm run openclaw:rollback
npm run openclaw:uninstall

npm run test:regression
```

当前 npm package 暴露的 bin 是 `legion-mind-opencode`，对应 OpenCode 安装脚本；正式发布入口仍以发行包文档为准。

### 本地管理命令

CLI 在当前架构里更适合被理解为 `.legion/tasks/**` 的本地初始化、查询和更新薄工具，而不是状态注册表或审计层；真正的入口门禁与阶段主干真源仍然是 `legion-workflow`。

`init` 当前只保证 `.legion/tasks/` 存在；`.legion/wiki/**` 由后续 writeback 按需建立。

```bash
node --experimental-strip-types "${OPENCODE_HOME:-$HOME/.opencode}/skills/legion-workflow/scripts/legion.ts" init
node --experimental-strip-types "${OPENCODE_HOME:-$HOME/.opencode}/skills/legion-workflow/scripts/legion.ts" task list --format json
node --experimental-strip-types "${OPENCODE_HOME:-$HOME/.opencode}/skills/legion-workflow/scripts/legion.ts" status --task-id your-task-id --format json
```

### GitHub Actions 入口

把 `.github/workflows/opencode.yml` 放进目标仓库后，可以在 issue/PR 评论里使用：

- `/oc fix this`
- `/opencode implement ...`

## 验证模型

LegionMind 不应该靠“看起来能跑”来证明自己，而应该把检查拆层：先看能不能安装和回滚，再看任务级证据是否完整，最后看当前真源文档是否一致。

当前验证模型分成三层:

1. **安装 / 严格校验 / 回滚**
    - 证明它能安全进入用户环境，也能在失败时恢复。
2. **任务级验证证据**
    - 证明具体任务留下了 `test-report.md`、`review-change.md`、`report-walkthrough.md` 这类可复核交付物，而不是只说“已经测过”。
3. **真源收敛**
    - 证明 README、AGENTS、工作流内核、`.legion/wiki/**`、skills 与 benchmark README 对当前入口和阶段主干的说法一致。

核心本地回归入口：

```bash
npm run test:regression
```

当前核心迭代**不**把已删除的工作流本地回归脚本视为默认验收路径；验证叙事只承认当前仍存在的安装 / 校验 / 回滚主路径。

## 当前现实

如果把北极星目标放在前面，那这里必须诚实写现实。

### 已经成型的部分

- 有明确的工作流内核：`legion-workflow` 负责入口门禁、恢复、路由、写回与只读综合，阶段技能围绕它形成稳定分工。
- 有任务记忆 / wiki 记忆 / 规则层的三层分工：`.legion/tasks/**` 保存任务证据，`.legion/wiki/**` 沉淀当前知识，`skills/**` 与 runtime 配置承载执行规则。
- OpenCode / OpenClaw 两条维护入口已经对齐到共享 setup core，具备 managed manifest、strict verify、rollback / uninstall 等安装资产 lifecycle。
- `npm run test:regression` 已经覆盖 setup lifecycle、skill surface、CLI 文件系统不变量，以及 destructive rollback / uninstall path safety。
- VibeHarnessBench v0.1 已经落地为 local-first semantic benchmark，用来给工作流内核演化提供可重复的本地评估入口。
- 有 GitHub Actions OpenCode 接线，可以把 LegionMind 工作流带到仓库外的 issue / PR 评论入口中运行。
- 根 `docs/` 历史材料已经退出 current truth；当前真源收敛到 README、`.legion/wiki/**`、`skills/**` 与 `vibe-harness-bench/README.md`。

### 还没有毕业的部分

- 发布、CI 和“默认可发布”信号还没有形成完整闭环，当前不能按成熟 OS 或稳定发行包来理解。
- 还需要更多真实项目、长周期任务和多人协作场景的压力测试，验证这套门禁和记忆机制在仓库外持续成立。
- CLI 仍然是 `.legion/tasks/**` 的本地初始化、查询和有限更新薄工具，不是 runtime orchestrator、状态注册表或审计层。
- 当前维护的 runtime 支持面只有 OpenCode 与 OpenClaw；不要把 README 解读成对其他代理运行时的泛化支持承诺。
- VibeHarnessBench 仍是 local-first v0.1，不是完整 sandbox、完整 full-stack benchmark，也不是生产级隔离执行平台。
- 低摩擦产品化和 onboarding 还需要继续打磨，真实使用者仍可能需要理解 wiki、阶段技能和 PR lifecycle 才能顺畅使用。

所以今天更准确的说法不是“LegionMind 已经是一套成熟的智能体操作系统”，而是：

> LegionMind 已经跨过了想法阶段，进入了可运行的编排内核阶段。

## 通往 v1

如果要把这个仓库推进到真正可交付的 v1，我会用下面这些硬门槛来判断：

1. 入口门禁、README / wiki 叙事、阶段技能、本地 CLI 薄工具和实际行为持续一致。
2. OpenCode / OpenClaw 安装后的 `verify --strict`、rollback / uninstall 与 `npm run test:regression` 成为稳定默认验收路径。
3. 除本地回归和 smoke 外，存在可重复、可审计的 CI / release 信号，能判断一次变更是否真的可发布。
4. 发布、回滚、兼容性和 CI 形成完整闭环，而不是只在本地仓库里证明能跑。
5. 真实项目压力测试覆盖足够多的任务类型、失败路径和多人协作场景。
6. 真实使用者不需要读任务原始文档，也能通过 README + wiki + onboarding 理解系统怎么安装、怎么开工、怎么验收。
7. 如果要扩展 runtime 支持或把 CLI 做成 orchestrator，必须按独立设计问题重新进入门禁，而不是从当前 OpenCode / OpenClaw 支持面自然外推。

README 在这个仓库里不只是入口文档，也应该是这个 v1 的目标约束。

## 适用对象

- 已经使用 OpenCode 或 OpenClaw 承载工程代理工作流的人
- 已经意识到提示词工程不足以解决上下文、验证、汇报和治理问题的人
- 需要设计门禁、交付物、评审协议和可持续记忆的复杂工程项目
- 想把“我自己怎么扩展”变成“系统如何扩展我”的人

## 不适用对象

- 只想要一个轻量提示词包或技能集合的人
- 只做一次性小任务、不需要持久化记忆与治理闭环的人
- 不愿意接受设计门禁、结构化评审、交付证据这些约束的人
- 只关心模型多聪明，不关心系统是否可验证、可维护、可迭代的人

## 相关文档

- 产品入口与支持边界：`README.md`
- wiki 当前知识：`.legion/wiki/**`
- 工作流内核与阶段真源：`skills/**`
- benchmark 当前真源：`vibe-harness-bench/README.md`

## 最后再说一句

LegionMind 的真正目标，从来不是“让智能体更像人”。

它更像是在反过来逼人类承认几件事：注意力比 token 更贵，返工比失败更痛，隐含知识比代码更容易让系统翻车，而真正可用的自治，必须建立在设计门禁、分层验证和证据化汇报之上。

如果这套系统最终成立，它成立的标志不会是“它看起来很聪明”，而是：

- 它更少打扰人
- 它能稳定多做事
- 它的错误能更早暴露
- 它的结论能被更低成本地验收
- 它能随着模型变强一起向上演化，而不是被下一波海浪拍死
