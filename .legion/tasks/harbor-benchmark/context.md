# 设计并实现一键启动的 Harbor Benchmark 基线 - 上下文

## 会话进展 (2026-03-05)

### ✅ 已完成

- 实现 scripts/benchmark preflight/run/score 与共享工具模块
- 新增 deterministic profile 配置与 benchmark 文档入口（README + docs/benchmark.md）
- 完成 benchmark 脚本安全加固：run-id 与 write path 防穿越校验
- 完成测试报告（PASS）并验证 traversal guard 行为
- 完成代码评审与安全评审复核（均 PASS）
- 生成 report-walkthrough 与 pr-body 交付文档
- 完成阶段 3 全部任务（测试/代码评审/安全评审均闭环）
- 按用户反馈将 preflight 鉴权改为 model-auth：无 API key 时自动执行 `opencode run --model` 探测
- 将默认 benchmark model 调整为 `opencode/big-pickle`，支持无单独 provider key 的本地基线试跑
- 新增 `shell.nix`（nix-darwin）并通过 uv tool run 提供 harbor 命令
- 在 nix-shell 内验证 preflight 全绿（含 harbor-cli/harbor-health/model-auth）
- 在 nix-shell 内验证 smoke dry-run 可执行并产出 run artifact
- 修复 preflight Docker 检查：由 CLI 存在性升级为 daemon 可用性检查（`docker info`）
- 修复 Harbor 结果解析误判：优先解析 Harbor `result.json`，避免把进度串 `89/89` 误识别为通过率
- 新增人类可读报告命令 `benchmark:report`，生成 `report.md` 并自动标注 scorecard/raw 日志不一致


### 🟡 进行中

(暂无)


### ⚠️ 阻塞/待定

(暂无)


---

## 关键文件

(暂无)

---

## 关键决策

| 决策 | 原因 | 替代方案 | 日期 |
|------|------|----------|------|
| 本任务分级为 Medium（非 Epic/High），执行 standard RFC + review-rfc 后再实现 | 涉及公开 benchmark 入口与多模块协同，需先收敛接口与评分口径；但可回滚且不触及高风险域 | Low 风险 design-lite 直接实现（放弃，评分口径与执行边界易发散） | 2026-03-05 |
| 采用 Harbor baseline v1 固定命令映射与 profileId/sampleSetId 契约 | 确保 one-command 评测在不同执行者之间保持可复现与可比较 | 仅文档说明手工命令（被放弃，难以保证一致性） | 2026-03-05 |
| 统一使用 resolve+isWithin 路径边界校验并引入 sanitizeRunId | 关闭 review-code/review-security 阻塞项，确保输出工件与写文件目标不会越界到仓库外 | 仅在调用点做字符串黑名单过滤（放弃，易遗漏且不稳健） | 2026-03-05 |
| Preflight 不再硬依赖 OPENAI/ANTHROPIC key，改为“API key 或 opencode model probe 任一通过” | 对齐用户期望：以 OpenCode 选模/鉴权为主，不额外强制 provider 环境变量 | 继续仅支持 provider key（放弃，和本地 opencode 使用习惯不一致） | 2026-03-05 |
| 在 shell.nix 内通过 `uv tool run --from harbor harbor` 提供 Harbor CLI | nixpkgs 当前无 harbor 包；该方案最小改动且可在 nix-shell 内立即使用 | A) 直接从 nixpkgs 安装 harbor（不可用）；B) shellHook 执行 `uv tool install`（受 PATH/版本差异影响） | 2026-03-05 |
| 将 Harbor result.json 作为首选统计来源，raw 文本仅作为降级兜底 | Harbor 控制台进度输出可能与真实 reward 统计混杂，纯文本正则易产生假阳性高分 | 继续依赖通用文本正则解析（已证实会把全错运行误判为 100 分） | 2026-03-05 |

---

## 快速交接

**下次继续从这里开始：**

1. 在具备 Harbor CLI + API Key + Docker 的环境执行 `npm run benchmark:smoke` 与 `npm run benchmark:full` 获取真实基准分
2. 将 `.legion/tasks/harbor-benchmark/docs/pr-body.md` 直接作为 PR 描述发起评审/合并

**注意事项：**

- 当前 test-report 以安全防护与失败语义验证为主（环境未安装 Harbor）
- review-code 与 review-security 均为 PASS，无阻塞项

---

*最后更新: 2026-03-05 21:54 by Claude*
