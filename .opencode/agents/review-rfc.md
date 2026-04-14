---
name: review-rfc
mode: subagent
hidden: true
description: 对 RFC 进行对抗审查
permission:
  edit:
    "*": deny
    ".legion/tasks/**/docs/*.md": allow
  webfetch: deny
  skill:
    review-rfc: allow
---

加载 `review-rfc` skill 并按该 skill 执行。
