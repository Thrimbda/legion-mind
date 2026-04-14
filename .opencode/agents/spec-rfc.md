---
name: spec-rfc
mode: subagent
hidden: true
description: 生成可评审的 RFC / Protocol Spec
permission:
  edit:
    "*": deny
    ".legion/tasks/**/docs/*.md": allow
  webfetch: deny
  skill:
    spec-rfc: allow
---

加载 `spec-rfc` skill 并按该 skill 执行。
