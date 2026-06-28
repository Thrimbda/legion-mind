# Scheduler 生产验收检查表

在 sandbox-first production-like acceptance 之前和过程中使用这份 checklist。

## 1. 前置检查

- [ ] 已指定 acceptance owner。
- [ ] 已确认 sandbox 时间窗口。
- [ ] 仓库位于预期 branch / commit。
- [ ] Node version 为 `>=22.6.0`。
- [ ] 只有计划运行 Stage 5 时，才检查 `opencode` 是否可用。
- [ ] Scheduler DB path 是 repo-local 且 sandbox-only。
- [ ] 操作人理解 `--db <file>` 可能创建或迁移 SQLite 文件。

## 2. Secrets 检查

- [ ] 已安装 `sops`。
- [ ] `age` private key 存在于 repo 外。
- [ ] 已配置 `SOPS_AGE_KEY_FILE` 或等价 key access。
- [ ] 真实文件是 `secrets/linear-scheduler.sops.yaml`，并且已加密。
- [ ] Secret values 仅用于 sandbox。
- [ ] 命令使用 `sops exec-env`，不会创建 plaintext secret file。
- [ ] 共享 evidence 时会 redacts token、account 和 project identifiers。

## 3. Linear Sandbox

- [ ] Sandbox team / project 已存在。
- [ ] 已记录 project ID / name / team key。
- [ ] 必需 labels 已存在。
- [ ] 必需 issue scenarios 已存在。
- [ ] Blocker relations 已设置并人工检查。
- [ ] State names / types 已知。
- [ ] 未使用 production project。

## 4. GitHub Sandbox

- [ ] Sandbox repo 已存在。
- [ ] Token 是 least-privilege，并且只 scoped to sandbox repo。
- [ ] Open PR scenario 已存在。
- [ ] Draft PR scenario 已存在，或已记录为 unavailable。
- [ ] Checks-failing PR scenario 已存在，或已记录限制。
- [ ] Review changes-requested scenario 已存在，或已记录限制。
- [ ] Merged PR scenario 已存在。
- [ ] Closed-unmerged PR scenario 已存在。
- [ ] 未使用 production repo。

## 5. Local Baseline

- [ ] `npm --prefix scheduler test` 通过。
- [ ] `npm --prefix scheduler run health -- --db :memory:` 通过。
- [ ] 使用 `npm --prefix scheduler` 时，`scan fixture` + `tests/fixtures/project.json` 通过。
- [ ] 使用 `npm --prefix scheduler` 时，`dispatch fixture` + `tests/fixtures/project.json` 通过。
- [ ] 结果已附到 evidence record。

## 6. Live Read-Path

- [ ] `scan project` 通过 `sops exec-env` 只针对 sandbox project 运行。
- [ ] ready / skipped 输出与预期 issue scenarios 一致。
- [ ] `delivery track --pr-url` 通过 `sops exec-env` 只针对 sandbox PR 运行。
- [ ] open / pending PR 不会变成 Done。
- [ ] checks / review / closed / merged 状态与预期 scheduler decisions 一致。
- [ ] DB writes 只发生在选定的 sandbox DB path。

## 7. 必须记录的已知 Blockers

- [ ] 缺 production Linear native writeback adapter。
- [ ] 缺 live `dispatch project`。
- [ ] 缺 packaged webhook server / outbox runner。
- [ ] production metrics / exporter / retention 未证明。
- [ ] 真实 worker 下的 native stop / cancel cleanup-before-lock-release 未证明。

## 8. 停止条件

- [ ] 观察到 duplicate active run。
- [ ] 观察到没有 `run_terminal_success` 的 downstream unlock。
- [ ] PR open / failed / missing evidence 被标记 Done。
- [ ] Worker 触碰 non-sandbox scope。
- [ ] Secret 出现在 logs / output / evidence 中。
- [ ] 操作人无法解释某个 running / waiting / blocked state。

如果以上任一项被勾选，立即停止验收，并记录 `FAIL` 或 `BLOCKED`。

## 9. 签署记录

| 字段 | 值 |
|---|---|
| 日期 | |
| 操作人 | |
| Sandbox Linear 项目 | |
| Sandbox GitHub 仓库 | |
| Scheduler DB | |
| 最终决策 | PASS / FAIL / BLOCKED |
| 剩余 blockers | |
| 下一步 owner | |
