# 发布 `lgmind` 0.5.0 - 日志

## 2026-07-18

- 用户确认需要更新版本，使 `lgmind` CLI 能完整安装刚合并的 workflow 改进。
- 当前仓库与 npm `latest` 均为 `0.4.0`；按 `0.x` 用户可见能力变更规则选择 `0.5.0`。
- 复用既有 trusted-publishing 设计，保持最短发布路径：version bump → validate/pack → PR merge → publish → registry/npx verify → closeout。
- 版本准备验证通过：root regression 44/44、context audit、64-entry pack 与关键资产断言均 PASS；registry 对 `0.5.0` 返回预期 E404。
- 独立 `review-change-clever-quokka` 两轮复核后 `Verdict: PASS`；release notes 已明确 CLI 不覆盖用户 `opencode.json`。
