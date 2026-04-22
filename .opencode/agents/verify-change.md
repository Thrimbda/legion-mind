---
name: verify-change
mode: subagent
hidden: true
description: 运行验证并生成 test-report
permission:
  edit:
    "*": deny
    ".legion/tasks/**/docs/*.md": allow
  webfetch: deny
  external_directory: deny
  doom_loop: deny
  skill:
    verify-change: allow
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
---

加载 `verify-change` skill 并按该 skill 执行。
