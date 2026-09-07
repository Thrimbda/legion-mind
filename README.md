# LegionMind

LegionMind 是一组可安装、可独立调用的 Agent 能力。

它不接管 Agent 的默认工作方式，不提供统一阶段链，也不要求普通工程任务创建任务台账。安装后，每个 skill 只在用户明确调用或请求与其 description 直接匹配时发挥作用。

## 产品边界

LegionMind 提供：

- 需求探索与方向比较；
- RFC 编写和设计审查；
- 变更验证与只读代码审查；
- 工程文档与长期知识维护；
- worktree、PR 和 HTML review 等专门交付能力；
- 安装、校验、回滚和卸载这些能力的本地工具。

LegionMind 不提供：

- mandatory first gate；
- Lite / Standard / Strict 工作流；
- 固定阶段跳转或 attention 状态机；
- 自动创建 `.legion/tasks/**`、`plan.md`、`log.md` 或 `tasks.md`；
- 因加载一个 skill 而自动触发另一个 skill；
- 未经用户或宿主策略授权的 GitHub、发布或部署动作。

## 能力目录

| Skill | 用途 |
|---|---|
| `brainstorm` | 在目标、验收或方向存在真实歧义时收敛问题 |
| `spec-rfc` | 为有设计分叉、迁移或回滚风险的工作编写 RFC |
| `review-rfc` | 独立检查设计中的弱假设、复杂度与验证缺口 |
| `verify-change` | 为已有改动选择并执行比例化验证 |
| `review-change` | 只读审查 correctness、scope、维护性与安全风险 |
| `legion-docs` | 创建和整理面向工程读者的文档 |
| `report-walkthrough` | 从一个数据文件确定性生成 HTML、Markdown 与 PR body |
| `pr-html-render` | 为已有 HTML artifact 选择安全的 review 路径 |
| `llm-wiki` | 维护受宿主约束的通用 Markdown wiki |
| `legion-wiki` | 维护使用 `.legion/wiki` 布局的可选知识库 |
| `git-worktree-pr` | 在隔离 worktree 中完成安全的 PR lifecycle |

这些 skills 彼此独立。一个任务可以只使用其中一个，也可以由 Agent 根据实际需要组合多个；组合不是固定流程。

## 安装

需要 Node.js `>=22.6.0`。

```bash
npx lgmind@latest install --scope project
npx lgmind@latest install --scope global
npx lgmind@latest verify --strict
```

TTY 中省略 `--scope` 时会询问安装到当前项目还是全局位置；非交互环境默认使用 global。默认目标仍为 OpenCode-compatible shared skill home，OpenClaw 可通过显式兼容参数使用。

```bash
npx lgmind@latest install --agent openclaw --scope project
npx lgmind@latest verify --agent openclaw --strict
```

常用生命周期命令：

```bash
npx lgmind@latest install
npx lgmind@latest verify --strict
npx lgmind@latest rollback
npx lgmind@latest uninstall
```

- `install`/`setup`：安装或更新能力；
- `verify --strict`：校验 managed ownership 与内容完整性；
- `rollback`：恢复最近一次备份；
- `uninstall`：移除未漂移的 managed assets；
- `--force`：仅在审阅本地漂移后使用，操作前仍会备份。

### 从 0.5.0 升级

升级器会把由 LegionMind 管理的 `legion-workflow`、`engineer` 以及保留 skill 内已废弃的旧协议文件退出活动路径，并保留可回滚备份。用户修改过的受管文件同样先备份再禁用，不会被静默丢弃。`verify --strict` 也会拒绝仍然活动但不受 manifest 管理的旧 workflow 入口；它会报告位置，但不会擅自删除陌生文件。

如果某个项目自己的 `AGENTS.md`、prompt 或第三方配置仍显式要求 `legion-workflow`，安装器不会擅自改写这些用户文件；请在升级后移除对应引用。

## 开发与验证

```bash
npm run build:runtime-js
npm run test:regression
npm run pack:dry-run
```

回归重点覆盖：fresh install、strict verify、rollback、uninstall、0.5.0 受管技能的安全退役、skill 独立性、standalone report 以及 npm package-like 执行。

## 历史材料

`.legion/**` 中的旧任务与路线图保留为 0.5.x 及更早版本的历史证据，不再构成当前产品承诺或执行规则。旧 Linear scheduler、Pi runtime distribution、workflow 和旧报告 schema 的源码已退出当前树；需要复现时使用提交 `83f7fd1` 或 `lgmind@0.5.0`。
