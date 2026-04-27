# Legion Maintenance

## Open follow-ups

- `harden-strict-verify-integrity` 留下一个非阻塞审计增强点：未来若需要更强 manifest 自一致性，可要求 `managed-files.v1.json` 中 `record.targetPath === manifest key`；当前实现不让该字段驱动路径访问，因此不影响本次安全边界。
- `build-vibeharnessbench-mvp` 的“升级 contract verifier”事项已由 `complete-vibeharnessbench-v01` 在 local-first semantic scope 内完成；剩余高保真边界见下一条。
- `complete-vibeharnessbench-v01` 仍未覆盖 Docker-faithful full stack、binary GIF pHash/SSIM、real RPC process harness、browser/ffmpeg/Playwright full-stack checks；这些是 RFC 非阻塞边界，若需要应拆独立任务。
- `complete-vibeharnessbench-v01` 当前 local subprocess isolation 不等同于可安全运行任意恶意 HUT 的 sandbox/container/chroot；如要评估不可信 HUT，应新增 sandbox/container 执行器任务。
- `complete-vibeharnessbench-v01` 可追加 starter/public symlink hardening，拒绝指向 case root、protected dirs 或 repo 外敏感路径的 symlink。
- `harden-v1-kernel-harness` 留下一个非阻塞可读性增强点：未来可小幅重构 `scripts/lib/setup-core.ts` 中 managed root textual/canonical 对应关系，让 `targetWithinManagedRoots` 的 symlink-root 拒绝逻辑更容易审计；当前实现对已验证的破坏性 rollback/uninstall case 保持保守，并已有 regression 覆盖。
