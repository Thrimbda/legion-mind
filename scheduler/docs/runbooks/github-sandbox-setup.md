# GitHub Sandbox 设置运行手册

## 目标

创建 GitHub PR scenarios，让 scheduler PR tracker 能读取真实 PR / check / review 状态，同时不触碰生产仓库。

## 仓库准备

推荐 repo name：

- `linear-legion-scheduler-sandbox`

保持它与 production repos 隔离。只包含 README 的仓库也足够做 read-path acceptance。

## Token 权限要求

使用只 scoped 到 sandbox repo 的 fine-grained token。它应能读取：

- Pull requests。
- Check runs / checks。
- Reviews。
- PR status 需要的 commit metadata。

不要使用 admin token，也不要绕过 branch protection。

## 必需 PR Scenarios

| 场景 | 用途 | 预期 scheduler decision |
|---|---|---|
| Open PR with pending checks/review | 基础 in-review 状态 | `in_review`，不是 Done |
| Draft PR | draft gate | `in_review`，不是 Done |
| Checks failing | failure gate | `blocked` / `pr_blocked` |
| Review changes requested | review gate | `blocked` / `pr_blocked` |
| Merged PR | terminal success candidate | 只有 Legion evidence 和 lifecycle evidence 都通过时才 Done |
| Closed unmerged PR | terminal non-success | terminal non-success，downstream 不满足 |

如果 sandbox repo 没有配置 branch protection 或 checks，应记录限制，不要伪造 production readiness。

## Naming Convention

必要时在 PR title 或 branch name 中包含对应 Linear sandbox issue identifier：

```text
SBOX-PR-OPEN: open PR acceptance case
SBOX-PR-MERGED: merged PR acceptance case
```

## Live Read-Path 命令

```bash
sops exec-env secrets/linear-scheduler.sops.yaml 'npm --prefix scheduler run debug -- delivery track --run "$SCHEDULER_RUN_ID" --repo "$SCHEDULER_REPO_PATH" --pr-url "$GITHUB_OPEN_PR_URL" --db "$SCHEDULER_DB"'
```

注意：

- 执行 `delivery track` 之前，scheduler run row 必须已经存在。
- 该命令会写 scheduler DB state，并 enqueue native writeback rows。
- 因为没有 production native adapter，它不会发送 Linear native writeback。

## 需要记录的证据

- Repo owner / name。
- PR URL / number。
- Head SHA。
- Draft / open / merged / closed state。
- Checks summary。
- Review decision。
- Scheduler decision 和 run state。
- Delivery / evidence gate status。

## 停止条件

- PR merge 前被解释为 Done。
- failed checks 或 changes requested 没有进入 blocked。
- closed-unmerged PR 满足 downstream。
- Token 需要超出 sandbox repo read-path 的权限。
