---
name: engineer
mode: subagent
hidden: true
description: 实现代码 + 测试
permission:
  edit: allow
  webfetch: deny
  external_directory: deny
  doom_loop: deny
  skill:
    engineer: allow
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
---

加载 `engineer` skill 并按该 skill 执行。
