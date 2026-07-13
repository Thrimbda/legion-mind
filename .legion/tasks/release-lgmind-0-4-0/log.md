# 发布 `lgmind` 0.4.0 日志

## 2026-07-13

- 用户要求把 `lgmind` 更新为 `0.4.0`，提交、推送并发布。
- 只读前置确认：`origin/master=3f71e5a`，根包与 npm `latest` 均为 `0.3.1`；本机 npm CLI 未登录，但现有 GitHub Actions trusted-publishing 工作流具备 `id-token: write`，且历史发布多次成功。
- 选择任务 ID `release-lgmind-0-4-0`，采用 approved-design continuation；发布设计沿用既有路径，无需重做 RFC。
- 已从最新 `origin/master` 创建 `.worktrees/release-lgmind-0-4-0/`，分支为 `codex/release-lgmind-0-4-0`。

### 决定 `release-040-publish-authority-001`

- 关联：公开 npm 发布的不可覆盖风险，以及 `REL-040-DISTRIBUTION` 的延后验证。
- 唯一问题：是否允许在版本准备 PR 合并并完成发布前检查后，通过现有 trusted-publishing workflow 公开发布 `lgmind@0.4.0`。
- 选项：A. 合并后立即按既有 workflow 发布并验证；B. 仅准备代码，停止在发布前。
- 决定人/时间：用户，2026-07-13。
- 选择：A；用户明确要求“现在更新 0.4.0 吧然后发布，提交推送代码”。
- 接受的风险：npm 版本成功发布后不可覆盖；若发布后的包存在问题，需要使用后续修复版本。
- 不接受的风险：未经完整 pack/回归验证、来源不是合并后 `master`、registry 状态不明时重跑发布，或使用本机 token 绕过现有流程。
- 恢复阶段：版本准备验证通过后允许推进 PR 合并；合并后触发发布并重跑 `verify-change -> review-change` 的发布结果收口验证。

### 当前交接

- 已完成：contract、风险边界、发布授权、worktree 准备、根版本更新与中文发布说明。
- `engineer-nimble-otter` 直接检查通过：CLI 读取版本为 `0.4.0`，runtime JS 构建无意外 diff，`git diff --check` 通过。
- 进行中：派生 `verify-change` 执行正式发布前验证。
- 阻塞：无。
- 下一步：运行 context audit、完整回归、pack 内容断言与 npm 版本唯一性检查。

### 验证交接

- `verify-change-gentle-otter` 判定发布前阶段 `PASS`、`attention: review`。
- `REL-040-ARTIFACT=PASS`：context audit 无 failure，完整回归 40/40，通过 69 项 pack 清单与 8 个关键资产的正负断言。
- `REL-040-DISTRIBUTION=DEFERRED`：当前 registry 仍为 `latest=0.3.1`，且 `0.4.0` 不存在；该主张只能在 merge 与 publish 后验证。

### 复核 `release-040-deferred-review-001`

- 关联：`verify-change` 的 `REL-040-DISTRIBUTION=DEFERRED` 与 `attention: review`。
- 复核依据：用户已通过 `release-040-publish-authority-001` 明确授权合并后公开发布；验证已证明发布前 artifact 与 registry 唯一性门满足。
- 结论：允许继续 `review-change`、walkthrough、wiki、commit、push、PR、checks 与版本准备 PR merge；允许 merge 后从锁定的 `master` SHA 触发既有 trusted-publishing workflow。
- 风险边界：该复核不把未来分发事实改写为 PASS；发布后的 workflow、registry 与干净安装验证完成前，禁止任务完成声明和最终清理。
- 恢复阶段：`review-change`。

### 独立审查交接

- `review-change-lively-penguin` 独立重算后判定 `PASS`、`attention: review`，无 blocker。
- 审查确认产品 diff 仅根版本、scheduler 边界未变、40/40 回归与 pack/资产/bin/runtime 证据可重算。
- 供应链视角确认没有 token、OTP、tarball 或 cache 进入变更；发布只能来自合并后锁定 SHA 的 trusted workflow。
- `REL-040-DISTRIBUTION` 继续保持 `DEFERRED`；已落盘复核允许版本准备 PR merge，但禁止在发布后验证前声明任务完成。
- 下一步：生成单一 `report-data.json` 及其 HTML、Markdown、PR body 投影，然后写回 wiki。

### Walkthrough 交接

- `report-walkthrough-zesty-quokka` 已从当前 task 的 PASS 证据生成 v1.1 `report-data.json` 及 HTML、Markdown、PR body，首次 check、正式 render 与二次 check 均通过。
- 报告顶部明确并列：版本准备阶段 PASS、`attention: review`、`REL-040-DISTRIBUTION=DEFERRED`、已完成的发布顺序复核，以及发布后验证前不得完成的停止点。
- `pr-html-render` 选择仓库内本地预览，render 状态为 `local`；预览入口为 `docs/report-walkthrough.html`。
- 下一步：`legion-wiki` 写回发布前当前真相，然后进入 commit/rebase/push/PR lifecycle。

### Wiki 交接

- `legion-wiki-plucky-falcon` 新增 `wiki/tasks/release-lgmind-0-4-0.md`，并更新 wiki index/log。
- Wiki 将任务保持为 `active`、整体风险 `medium`，明确 `REL-040-ARTIFACT=PASS`、`REL-040-DISTRIBUTION=DEFERRED`，没有写成已经发布。
- 复用既有 npm 发布模式，无新的跨任务模式或决定，因此未重复修改 `patterns.md` 或 `decisions.md`。
- 下一步：提交 scope 内变更，push 前 fetch/rebase 最新 `origin/master`，随后创建版本准备 PR。

### 验证修订交接

- 提交前复跑发现任务内 `assert-package.mjs` 把 closing stage 合法新增的 `.legion/wiki/**` 误判为产品 tracked diff，断言出现假阳性；产品实现本身没有失败。
- `verify-change-brisk-falcon` 将断言收紧为：完整保留并输出全部 changed paths，只在产品 diff 集合中排除 `.legion/**`，随后仍精确要求产品 tracked diff 只有 `package.json`。
- 修订后 8 个关键资产正负断言、版本边界、bin 与产品 diff 断言全部通过；renderer check 与 `git diff --check` 通过，40/40 原始回归证据未重写。
- 下一步：按会话隔离要求重新派生 `review-change` 复核本次验证修订，再恢复 Git / PR lifecycle。

### 验证修订审查交接

- `review-change-sunny-badger` 独立确认过滤条件只排除 `.legion/**`；任何 `scripts/**`、`skills/**`、`scheduler/**` 或其他源码路径仍会导致断言失败。
- 当前全部 tracked paths 被原样输出，产品 diff 仍精确为 `package.json`；8 项资产正负检查、版本、bin、renderer/diff check 通过。
- 本轮没有把 40/40 描述为重新执行；它继续引用首次完整验证的原始输出。
- Verdict 保持 `PASS`、attention 保持 `review`、分发主张保持 `DEFERRED`；下一步同步更新 walkthrough，再恢复 Git / PR lifecycle。

### 验证修订收口

- `report-walkthrough-zesty-quokka` 已把产品 diff 过滤边界与“40/40 未重跑”同步进单一 report-data，并完成 `--check -> render -> --check`。
- `legion-wiki-plucky-falcon` 再次核对后确认发布状态未变，现有 wiki 仍准确，因此没有制造额外 wiki 改动。
- 当前 closing stages 均通过；恢复 Git / PR lifecycle，提交前再次运行有界证据脚本与报告 check。

### 提交后生命周期验证与越界回退

- 已创建版本准备提交 `be761a8 chore: 准备 lgmind 0.4.0 发布`，尚未 push。
- 提交后复跑发现验证脚本仍把 `HEAD` 当作 0.3.1 基线，无法在提交后重算；`verify-change-brisk-falcon` 已将版本与 diff 基线改为 `origin/master`，changed paths 改为 `origin/master...HEAD` 与 working diff 的去重并集。
- 为满足“验证重跑后新 reviewer”，尝试通过 OpenCode transport 派生 `review-change-gentle-badger`；该尝试因 subagent 不能作为 primary 且凭据刷新 401 失败，不计为审查证据。
- 失败的 OpenCode 启动同时把已跟踪的 `.opencode/package-lock.json` 从既有 1.4.7 lock 更新为 1.17.7 依赖图；新 reviewer `review-change-quick-koala` 正确检出越界并给出 `FAIL + attention: review`，因此停止 commit 后续动作、push 与 PR。
- root 使用 apply_patch 将该 lockfile 精确恢复到 `HEAD`；`engineer-nimble-otter` 只读确认文件哈希与 `HEAD` 一致、`.opencode/**` 无其他副作用、产品 diff 仍仅 `package.json`。
- 当前旧 test/review 文档仍含 FAIL 后状态；下一步必须重新执行 `verify-change -> review-change`，不得直接改回 PASS。

### 越界修复重验与审查

- `verify-change-brisk-falcon` 在 lockfile 恢复后重跑：断言 exit 0，完整路径并集不含 `.opencode/**`，仅排除 `.legion/**` 后产品集合精确为 `package.json`；40/40 仍引用首次原始输出，未冒充重跑。
- `review-change-sunny-badger` 独立复核并保留双时态事实：quick-koala 对当时越界的 FAIL 正确；当前 lockfile 与 HEAD 哈希一致，OpenCode 副作用已清除，`REL-040-ARTIFACT` 恢复 PASS。
- 当前 review Verdict 为 `PASS`、attention 为 `review`；`REL-040-DISTRIBUTION` 继续 `DEFERRED`。既有发布授权仍只允许在无 scope blocker、锁定合并后 SHA 且发布前检查通过时推进。
- 下一步：同步 report-data/walkthrough 与 wiki，再恢复 PR lifecycle。

### 越界恢复收口

- `report-walkthrough-zesty-quokka` 已把历史正确 FAIL 与当前恢复 PASS 的双时态写入单一 report-data，并完成 `--check -> render -> --check`；当前 artifact PASS、distribution DEFERRED。
- `legion-wiki-plucky-falcon` 在 task summary 与 wiki log 中保留 task-local transport 审计：外部 transport 前后比较 `git status --porcelain`，未批准的 scope 漂移 fail closed；未无条件提升为全局 pattern。
- 当前无 `.opencode/**` 差异；版本准备、验证、审查、walkthrough 与 wiki closing stages 已恢复有效 PASS。
- 下一步：提交验证修订与恢复证据，随后 fetch/rebase 最新 `origin/master`，重跑有界检查后 push 并创建 PR。

### 版本准备 PR 与公开发布

- 版本准备分支最终包含 `be761a8` 与 `825646d` 两个提交；push 前重跑 40/40 regression、69 项 pack 清单与报告一致性门均通过。
- PR #53 `chore: 发布 lgmind 0.4.0` 已 squash merge；合并提交为 `ff4c7009f967b7a897715b077ffb3a3dba76a2b3`，`origin/master` 与发布前锁定提交一致。
- 从 `master` 手动触发 GitHub Actions `Publish npm package` run `29242902972`；checkout、Node 设置、npm identity surface、regression、pack 与 publish 步骤全部成功，workflow `headSha` 精确等于锁定合并提交。
- npm registry 已返回 `lgmind@0.4.0`，且 `dist-tags.latest=0.4.0`；registry 元数据包含 `lgmind -> bin/lgmind.js` 与 `setup-opencode -> bin/setup-opencode.js` 两个 bin。
- 在仓库内隔离 HOME 与 npm cache 的测试环境中，固定版本 npx 输出 `0.4.0`；首次安装为 `copied=49 skipped=0 warnings=0 failures=0`，strict verify 为 `READY`，只有可选 MCP 未配置这一条非阻塞 warning；8 项关键资产均与合并源码逐字节一致。
- 首次 smoke 目录没有独立 `package.json` 边界，npm 把上层同名源码包识别为本地 `lgmind@0.4.0`，因源码根没有 npx bin 链接而出现一次 `command not found` 假阳性。确认 registry bin、pack bin 与 npm 解析日志后，为 smoke 目录建立独立 package 边界并从空 cache 重跑通过；该次失败不作为成功证据，也未被隐藏。
- 已从合并后的 `origin/master` 创建 `.worktrees/record-lgmind-0-4-0-publish/` 与 `codex/record-lgmind-0-4-0-publish`，只回写发布后证据；下一步执行新的 `verify-change -> review-change`，随后更新 walkthrough、wiki，并完成发布结果收口 PR。

### 发布后验证与字段回退

- `verify-change-gentle-marten` 独立重算 workflow、registry、隔离安装、幂等复跑与 8 项资产，登记新的 `REL-040-DISTRIBUTION-RESULT=PASS`；发布前 `REL-040-DISTRIBUTION=DEFERRED` 继续保留为历史时点事实。
- `review-change-eager-marten` 首轮确认发布事实成立，但检出新 claim 使用认知协议不存在的 `blocking-policy=block-completion`，因此正确给出 `FAIL / attention: skim` 并退回验证阶段。
- `verify-change-gentle-marten` 只把 `docs/test-report.md` 与 `docs/publish-result.md` 两处字段修成协议允许且符合收口语义的 `block-stage`，并保留首轮 FAIL 审计轨迹。
- 新实例 `review-change-jolly-penguin` 再次独立复核后给出当前 `PASS / attention: skim`：非法字段已清零，workflow/SHA、registry、隔离安装、幂等 `skipped=49`、strict verify 与 8 项资产证据闭环，无当前 blocker。
- 下一步：更新 report-data 及其三份投影，写回 wiki，然后进入发布结果收口 PR lifecycle。

### 发布结果材料收口

- `report-walkthrough-zesty-quokka` 已把当前分发结果写入单一 `report-data.json`：`stageConclusion=PASS`、`reviewStatus=PASS`、`attention=skim`、`claims=[]`，并通过 `--check -> render -> --check` 生成 HTML、Markdown 与 PR body。
- `legion-wiki-plucky-falcon` 已把 npm `latest=0.4.0`、workflow、隔离安装、幂等跳过和双时态审计写回任务摘要、wiki index 与 wiki log；任务在收口 PR merge 与 worktree/main 刷新前继续保持 `active`。
- 隔离 smoke 的 HOME、npm cache、安装树、prefix 与临时 package 边界已从工作树删除；git 未跟踪其中任何文件。
- 收口分支重跑 `npm run test:regression` 为 40/40 PASS，报告 `--check` 返回 `CHECK_OK release-lgmind-0-4-0`，`git diff --check` 通过。
- 下一步：由当前 reviewer 补充核对 wiki closing diff 与 smoke 已清理的最终 scope，再刷新报告投影，随后 commit、rebase、push 与收口 PR。
