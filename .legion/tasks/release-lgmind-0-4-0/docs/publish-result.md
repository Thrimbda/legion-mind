# `lgmind` 0.4.0 发布后验证结果

## 结论

- 当前继任主张：`REL-040-DISTRIBUTION-RESULT=PASS`。
- 历史主张 `REL-040-DISTRIBUTION=DEFERRED` 仍保留为“发布前尚不能验证”的当时事实，不做追溯改写。
- `lgmind@0.4.0` 已从锁定的合并提交发布，npm 固定版本与 `latest` 均为 `0.4.0`；隔离环境中的固定版本 npx、首次安装、重复安装、strict verify 与 8 项关键资产检查均通过。

## 主张登记

- 单一主张：从合并提交 `ff4c7009f967b7a897715b077ffb3a3dba76a2b3` 触发的可信发布，已经把可安装且可严格校验的 `lgmind@0.4.0` 交付到公开 npm registry。
- 三轴：`objective / now / routine`。
- `domain-id`：`npm-registry-distribution`。
- `required-method`：GitHub Actions run 与 checkout SHA 核对、公开 registry 固定版本与 dist-tag 查询、带独立 package 边界和隔离 HOME/cache 的固定版本 npx 安装、strict verify、关键资产逐字节比较。
- `criticality`：`high`；`risk-if-wrong`：公开版本已占用但其他机器无法获得完整资产；`blocking-policy`：`block-stage`；owner：`verify-change`。
- 状态：`PASS`；独立性：`high`；置信度：`high`。

## 可重算证据

| 检查 | 结果 |
|---|---|
| 版本准备 PR | PR #53 已 squash merge；合并提交为 `ff4c7009f967b7a897715b077ffb3a3dba76a2b3` |
| 发布 workflow | GitHub Actions run `29242902972` 为 `success`；`event=workflow_dispatch`、`headBranch=master`、`headSha=ff4c7009f967b7a897715b077ffb3a3dba76a2b3` |
| workflow 步骤 | checkout、Node 设置、npm identity surface、regression、pack 与 `npm publish` 全部成功 |
| npm 固定版本 | `npm view lgmind@0.4.0 version` 返回 `0.4.0` |
| npm dist-tag | `npm view lgmind version dist-tags --json` 返回 `version=0.4.0`、`latest=0.4.0` |
| npm bin 元数据 | `lgmind -> bin/lgmind.js`；`setup-opencode -> bin/setup-opencode.js` |
| 固定版本 npx | 空 npm cache 下 `npx --yes lgmind@0.4.0 --version` 返回 `0.4.0` |
| 首次隔离安装 | `npx --yes lgmind@0.4.0 install --force --strict --verbose` 返回 `copied=49 linked=0 skipped=0 warnings=0 failures=0` |
| 重复安装 | 相同固定版本再次安装返回 `copied=0 linked=0 skipped=49 warnings=0 failures=0`，证明 `skipped` 表示目标内容已一致 |
| strict verify | `npx --yes lgmind@0.4.0 verify --strict` 返回 `READY`、`failures=0`；只有可选 MCP 未配置这一条 warning |
| 关键资产 | report verdict 解析、report-data 校验、schema、HTML template、认知验证协议、注意力协议、subagent 命名器与 context manifest 共 8 项均存在，并与合并提交源码逐字节一致 |

发布工作流：https://github.com/Thrimbda/legion-mind/actions/runs/29242902972

版本准备 PR：https://github.com/Thrimbda/legion-mind/pull/53

## 首次 smoke 假阳性

首次把 smoke 目录直接放在本仓库 package 树内且没有独立 `package.json`。npm 因而向上发现同名源码包 `lgmind@0.4.0`，把它当作已满足的本地 package，却没有可供 npx 调用的安装态 bin 链接，命令返回 `lgmind: command not found`。

该结果触发了停止与诊断，没有被当作发布成功证据。随后分别确认公开 registry 的 `bin` 元数据、发布 tarball 中两个可执行 bin，以及 npm debug log 没有下载 package 的事实；再为 smoke 目录建立独立 `package.json` 边界，清空 npm cache，并隔离 `HOME` 与 npm prefix 后重跑。重跑完整通过，因此该失败属于测试夹具边界错误，不是 registry artifact 缺陷。

## 残余边界

- 审计双时态：`review-change-eager-marten` 首轮因 successor claim 使用协议外门禁值给出 `FAIL`；本轮已把两处登记统一修正为协议允许的 `block-stage`。该 `FAIL` 与字段修复均保留为审查轨迹，不改变历史 `REL-040-DISTRIBUTION=DEFERRED`，也不替代后续重新审查。
- `W_MCP_OPTIONAL` 表示可选 MCP 未配置；filesystem-backed CLI 与本次安装资产仍可用，不阻塞本主张。
- npm 版本不可覆盖的风险已经由锁定 SHA、trusted publishing、registry 查询与真实安装共同验证；后续若发现新的产品问题，应发布新 patch 版本，不得尝试覆盖 `0.4.0`。
- smoke HOME、npm cache、安装树和临时配置均未纳入 git。

## Verdict

PASS

本 Verdict 只证明上述锁定提交对应的 `lgmind@0.4.0` 已成功分发并可安装，不外推为未来版本或所有运行时环境的保证。

## 会话注意力摘要

- 阶段：`verify-change` 发布后继任验证。
- 阶段结论：`PASS`。
- 注意力等级：`skim`。
- 判断变化：历史 `REL-040-DISTRIBUTION=DEFERRED` 已按触发协议产生新的 `REL-040-DISTRIBUTION-RESULT=PASS`，不是追溯修改旧状态。
- 关键发现：workflow SHA、registry、首次安装、幂等重复安装、strict verify 与 8 项关键资产一致性形成闭环；首次 `command not found` 已定位为缺少独立 package 边界的夹具假阳性。
- 阻塞项：无。
- 人类动作：无需新增决策；可快速查看 workflow、registry 与隔离安装摘要。
- 自动下一步：交给新的 `review-change` 独立审查，再更新 walkthrough、wiki 与发布结果收口 PR。
- 完整证据：本文件与 GitHub Actions run `29242902972`。
