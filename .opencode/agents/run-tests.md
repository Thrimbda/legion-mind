---
name: run-tests
mode: subagent
hidden: true
description: 执行测试并汇总失败
permission:
  edit:
    "*": deny
    ".legion/tasks/**/docs/*.md": allow
  webfetch: deny
  external_directory: deny
  doom_loop: deny
  skill:
    run-tests: allow
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

加载 `run-tests` skill 并按该 skill 执行。
