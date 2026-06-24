# Extract Linear Scheduler into an Independent npm Project

## 目标

把当前误放在根项目 `scripts/` 与根项目测试目录中的 Linear scheduler 运行时代码，迁移到仓库根的独立 npm 项目 `scheduler/`。迁移后 scheduler 应拥有自己的 `package.json`、源码目录、测试入口和调试脚本，不再作为 `lgmind` 根 npm package 的脚本/运行时组成部分出现。

## 问题陈述

WI-02 的 SQLite scheduler core 原型已经完成，但当前交付形态把 scheduler CLI 放在 `scripts/linear-scheduler.ts`，把核心代码放在 `scripts/lib/linear-scheduler/`，并把测试放在根项目 `tests/regression/`。这会让 scheduler 看起来像 `lgmind` npm 包的内部维护脚本，而不是独立调度器项目；同时也污染 root package 的 scripts、测试面和发布边界。

用户明确要求：scheduler 不应放在 `scripts` 目录下，而应单开文件夹作为一个单独的 npm 项目。

## 验收标准

- [ ] 仓库根新增独立 npm 项目目录 `scheduler/`，包含自己的 `package.json`、源码、测试和最小说明。
- [ ] 原 scheduler 源码从 `scripts/linear-scheduler.ts` 与 `scripts/lib/linear-scheduler/**` 迁出到 `scheduler/` 内，不再以根项目 `scripts/` 作为 scheduler 代码承载位置。
- [ ] 原 scheduler 测试从根项目 `tests/regression/linear-scheduler-core.test.ts` 迁出到 `scheduler/` 自己的测试目录，并能通过该项目的 npm script 运行。
- [ ] 根 `package.json` 不再直接声明 `scheduler:debug` / `test:linear-scheduler` 这类把 scheduler 当根项目脚本的入口；若保留任何根级便捷入口，必须只是显式委派到 `scheduler/` 项目，且不影响 root package 发布边界。
- [ ] 文档中引用的交付路径、运行命令和测试命令更新为 `scheduler/` 项目形态。
- [ ] 相关验证通过，并把验证证据写入本任务 `docs/test-report.md`。
- [ ] 完成 `review-change`、`report-walkthrough`、`legion-wiki` 写回，并通过 `git-worktree-pr` PR lifecycle 交付。

## 范围

- `scheduler/**` 独立 npm 项目结构。
- 根 `package.json` 中与 scheduler 相关的 npm scripts / publish files 边界。
- 从 `scripts/` 与根 `tests/regression/` 迁出的 scheduler 源码、CLI 和测试 import 路径。
- `docs/linear-legion-scheduler/**` 中 WI-02 交付路径、命令和项目结构说明。
- `.legion/tasks/extract-linear-scheduler-npm-project/**` 阶段证据。
- `.legion/wiki/**` 中必要的当前结论/维护知识写回。

## 非目标

- 不重新设计 scheduler 数据模型、state machine、claim transaction 或 outbox 语义。
- 不连接真实 Linear API、GitHub API、OpenCode worker 或 webhook server。
- 不把 scheduler 合并进 root package 的 publish artifact。
- 不改变 `legion-workflow`、`git-worktree-pr` 或既有 WI-02 已验证的运行时语义。
- 不引入 monorepo workspace 管理器，除非现有结构已经需要；本任务优先保持最小独立 npm 项目。

## 假设

- 独立项目目录采用用户表述的自然命名 `scheduler/`。
- scheduler 仍使用 Node.js `--experimental-strip-types --experimental-sqlite` 直接运行 TypeScript，保持 WI-02 的零构建原型约束。
- 根项目与 scheduler 项目可以各自拥有 npm scripts；根项目无需安装 scheduler 依赖即可发布 `lgmind`。
- 当前任务属于 WI-02 交付形态修正，不扩大到后续 WI-03 scanner / WI-04 worker runner。

## 约束

- 修改必须在 `.worktrees/extract-linear-scheduler-npm-project/` 中完成，并通过 PR lifecycle 交付。
- push 前必须在 worktree 内执行 `git fetch origin && git rebase origin/master`。
- 不得在主工作区做实现改动或提交。
- `plan.md` 保持技术概要设计，不承载逐文件迁移手册；具体验证输出写入 `docs/test-report.md`。

## 风险

- **路径引用遗漏**：测试、文档或 import 仍引用旧 `scripts/` 路径。缓解：全仓搜索 `linear-scheduler` / `scheduler:debug` / `test:linear-scheduler` 并更新。
- **根包发布边界漂移**：把 `scheduler/` 误加入 root package files 会让它仍像 root package 组成部分。缓解：保持 root `files` 不包含 scheduler，必要时文档说明 scheduler 是独立项目。
- **验证命令漂移**：root regression test 不再覆盖 scheduler 后，CI/本地可能不知道如何运行 scheduler 测试。缓解：在 `scheduler/package.json` 和文档中明确 `npm --prefix scheduler test`。
- **过度重构**：迁移目录时顺手改业务语义会扩大风险。缓解：保持源码逻辑等价，只调整项目边界和路径。

## 设计摘要

- 在仓库根新增 `scheduler/`，其中 `src/` 承载 CLI、state machine、SQLite store，`tests/` 承载 scheduler 自己的 regression/integration 测试。
- `scheduler/package.json` 声明独立 npm project 元数据与 scripts：`debug`、`test`、可选 `health` smoke；命令直接运行项目内 TypeScript 文件。
- 根 `package.json` 移除 scheduler 作为 root runtime script 的入口，避免 root `lgmind` package 将 scheduler 误表达为内部脚本。
- 文档把 WI-02 的 delivered source、debug command、验证命令更新到 `scheduler/` 结构。

## 阶段拆分

1. **Contract / Envelope**：完成本 contract，确认 worktree 与分支。
2. **Engineer**：迁移 scheduler 项目结构、修正 imports / npm scripts / docs。
3. **Verify**：运行 scheduler 项目测试与必要的 root regression 验证，记录 `docs/test-report.md`。
4. **Review**：执行 `review-change`，检查 scope、发布边界、路径引用、安全与文档一致性。
5. **Close**：生成 walkthrough / PR body，执行 wiki writeback，commit、rebase、push、PR、checks/review、cleanup、主工作区刷新。

---
*Created: 2026-06-24*
