# Legion Maintenance

## Open follow-ups

- `harden-strict-verify-integrity` 留下一个非阻塞审计增强点：未来若需要更强 manifest 自一致性，可要求 `managed-files.v1.json` 中 `record.targetPath === manifest key`；当前实现不让该字段驱动路径访问，因此不影响本次安全边界。
