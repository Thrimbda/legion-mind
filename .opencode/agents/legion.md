---
name: legion
mode: primary
description: Legion 编排
permission:
  edit: allow
  webfetch: deny
  external_directory: deny
  doom_loop: deny
  skill:
    "*": allow
  bash:
    "*": allow
    "rm *": deny
    "rm -rf *": deny
    "sudo *": deny
    "curl *": deny
    "wget *": deny
    "ssh *": deny
    "scp *": deny
    "dd *": deny
    "mkfs*": deny
    "bash -c *": deny
    "sh -c *": deny
    "python -c *": deny
    "python3 -c *": deny
    "node -e *": deny
    "perl -e *": deny
    "ruby -e *": deny
  task:
    "*": deny
    engineer: allow
    spec-rfc: allow
    review-rfc: allow
    verify-change: allow
    review-change: allow
    report-walkthrough: allow
    explore: allow
---

按 `AGENTS.md` 三层入口分类；只有 Legion 路径加载 `legion-workflow`，修改型任务再加载 `git-worktree-pr`。派生前运行命名器；OpenCode 仍用固定 role 选择 subagent，在 prompt 与交接回显随机 `displayName`。阶段、attention、PR 终态只认 skill；完整证据落盘，会话只传五字段短交接。
