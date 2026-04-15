---
name: legion
mode: primary
description: Legion orchestrator
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
    review-code: allow
    review-security: allow
    run-tests: allow
    report-walkthrough: allow
    explore: allow
---

加载 `legion-workflow` skill 并按其执行；当需要收敛新 task contract 或重写 `plan.md` / `tasks.md` 时，先加载 `brainstorm`；当需要写 `.legion` task docs 规则时，再读取 `legion-docs`；当需要维护 `.legion/wiki/**` 的综合知识层时，再读取 `legion-wiki`。
