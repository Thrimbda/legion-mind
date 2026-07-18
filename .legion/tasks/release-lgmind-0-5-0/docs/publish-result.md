# `lgmind` 0.5.0 发布结果

## 发布来源

- 版本准备 PR：[#57](https://github.com/Thrimbda/legion-mind/pull/57)
- Squash merge / locked `master` SHA：`11890ac495e51f744e68897374a395e26e1dfa08`
- Trusted-publishing workflow：[run 29640042610](https://github.com/Thrimbda/legion-mind/actions/runs/29640042610)
- Workflow `headSha`：`11890ac495e51f744e68897374a395e26e1dfa08`
- Workflow conclusion：`success`

## Registry

- `npm view lgmind@0.5.0 version`：`0.5.0`
- `npm view lgmind version`：`0.5.0`
- `dist-tags.latest`：`0.5.0`
- Integrity：`sha512-EWVH5CGcV/eTT8JzH/nHwwypA4/EadAmF4IhzBmJOaIr06ogr0W5h2zW0XrLTZQqpzWD8hSfFep0FwE20bUzIA==`
- Shasum：`97ec4a99380cff0d08d3d74670b4c9c848f418dc`

## 干净安装验证

在 repo-local 隔离 package、HOME、npm cache 与 project scope 中固定执行 `lgmind@0.5.0`：

- `npx --yes --package=lgmind@0.5.0 -- lgmind version`：`0.5.0`
- 首次 `install --scope project --agent opencode --verbose`：`copied=44 linked=0 skipped=0 warnings=0 failures=0`
- 二次幂等安装：`copied=0 linked=0 skipped=44 warnings=0 failures=0`
- `verify --scope project --agent opencode --strict --verbose`：`READY`，`failures=0`；仅有预期的 optional MCP warning。
- 安装后的 `profile-policy.mjs`、`refresh-main-workspace.mjs` 与 `legion-workflow/SKILL.md` 均与 locked `master` 逐字节一致。
- 安装树不存在 `.legionmind/opencode/config/agents`；custom agents 未恢复。
- 对安装版 policy 的 low/medium/high 重算分别得到 Lite/Standard/Strict，Strict delivery 为 walkthrough。

## 失败与恢复

- 首轮 smoke 使用 `npm init -y --prefix ...`，该 npm 命令没有在目标目录建立 package boundary，反而给主工作区 `package.json` 添加默认字段，随后 `npx` 报 `lgmind: command not found`。
- 安装在该点停止；主工作区 `package.json` 已精确恢复到 `HEAD` 并用 `git diff --exit-code -- package.json` 证明无残留。
- 改用显式隔离 `package.json` 与 `npx --package=lgmind@0.5.0 -- lgmind ...` 后完整通过。失败保留为 smoke fixture 证据，不影响已发布 artifact。
- 隔离 smoke 目录已移入 macOS 废纸篓，没有遗留仓库状态。

## 结论

`REL-050-DISTRIBUTION-RESULT=PASS`：固定版本、`latest`、workflow SHA、首次安装、幂等复跑、strict verify 与关键资产内容全部一致。发布完成。
