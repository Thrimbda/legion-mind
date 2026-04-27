# Test Report: refresh-readme-current-reality

日期：2026-04-27

## 结论

PASS

README 的 `当前现实` / v1 边界更新与 `harden-v1-kernel-harness` 后的仓库真相一致；没有重新引入 Claude / Codex / Cursor / Gemini 泛化 runtime 支持叙事；仍明确保持 OpenCode / OpenClaw-only 支持边界和 CLI-thin / non-orchestrator 现实；未发现 setup scripts、tests 或 package 脚本变更；`npm run test:regression` 通过。

## 验证依据

### 读取的真源

- `.legion/tasks/refresh-readme-current-reality/plan.md`
- `README.md`
- `.legion/wiki/tasks/harden-v1-kernel-harness.md`
- `git status --short --untracked-files=all`
- `git diff --stat && git diff -- README.md && git diff --name-only`

### 命令与结果

1. `git status --short && git diff --stat && git diff -- README.md && git diff --name-only`
   - 结果：PASS / exit 0。
   - 证据：tracked diff 仅为 `README.md`；README diff 只修改 `当前现实` 与 `通往 v1` 相关叙事。

2. `git status --short --untracked-files=all`
   - 结果：PASS / exit 0。
   - 证据：执行验证前 untracked 仅为当前 Legion 任务 evidence 文件：`log.md`、`plan.md`、`tasks.md`；后续本报告新增 `docs/test-report.md`。

3. README 静态支持边界检查：

   ```bash
   python3 - <<'PYCODE'
   from pathlib import Path
   text = Path('README.md').read_text()
   errors = []
   for forbidden in ['Claude', 'Codex', 'Cursor', 'Gemini']:
       if forbidden in text:
           errors.append(f'forbidden runtime mention found: {forbidden}')
   required = [
       'OpenCode / OpenClaw 两条维护入口已经对齐到共享 setup core',
       '当前维护的 runtime 支持面只有 OpenCode 与 OpenClaw',
       'CLI 仍然是 `.legion/tasks/**` 的本地初始化、查询和有限更新薄工具',
       '不是 runtime orchestrator、状态注册表或审计层',
       '`npm run test:regression` 已经覆盖 setup lifecycle、skill surface、CLI 文件系统不变量，以及 destructive rollback / uninstall path safety',
       'VibeHarnessBench v0.1 已经落地为 local-first semantic benchmark',
       '根 `docs/` 历史材料已经退出 current truth',
       'VibeHarnessBench 仍是 local-first v0.1，不是完整 sandbox、完整 full-stack benchmark，也不是生产级隔离执行平台',
   ]
   for phrase in required:
       if phrase not in text:
           errors.append(f'missing required phrase: {phrase}')
   if errors:
       print('\n'.join(errors))
       raise SystemExit(1)
   print('README static support-boundary/current-reality checks PASS')
   PYCODE
   ```

   - 结果：PASS / exit 0。
   - 输出：`README static support-boundary/current-reality checks PASS`。
   - 证明力：直接验证 forbidden runtime names 未出现在 README，且 current-reality 必要事实均存在。

4. 变更范围静态检查：

   ```bash
   python3 - <<'PYCODE'
   from pathlib import Path
   changed = [line.strip() for line in __import__('subprocess').check_output(['git','diff','--name-only'], text=True).splitlines() if line.strip()]
   forbidden_prefixes = ('scripts/', 'tests/', '.github/',)
   forbidden_files = {'package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'}
   violations = [p for p in changed if p.startswith(forbidden_prefixes) or p in forbidden_files]
   print('tracked changed files:', ', '.join(changed) if changed else '(none)')
   if violations:
       print('forbidden setup/test/script/package changes:', ', '.join(violations))
       raise SystemExit(1)
   print('No tracked setup scripts/tests/package changes PASS')
   PYCODE
   ```

   - 结果：PASS / exit 0。
   - 输出：`tracked changed files: README.md`；`No tracked setup scripts/tests/package changes PASS`。
   - 证明力：确认没有 setup scripts、tests、GitHub Actions 或 package/lockfile 变更。

5. `npm run test:regression`
   - 结果：PASS / exit 0。
   - 输出摘要：Node test runner 执行 `tests/regression/*.test.ts`，10 tests / 10 pass / 0 fail，duration 约 3096ms。
   - 备注：npm 输出 `Unknown env config "tmp"` warning；该 warning 未导致测试失败，且与 README-only 变更无关。

## 人工一致性审阅

- 与 `.legion/wiki/tasks/harden-v1-kernel-harness.md` 对照，README 已反映：OpenCode / OpenClaw-only 维护入口、共享 setup lifecycle、strict verify、rollback / uninstall、regression suite、root `docs/` 退出 current truth、GitHub Actions OpenCode 接线，以及 VibeHarnessBench v0.1 的 local-first benchmark 定位。
- README 的未毕业项明确保留：发布 / CI 闭环不足、真实项目压力测试不足、CLI 只是本地薄工具、runtime 支持面仅 OpenCode / OpenClaw、benchmark 不是完整 sandbox / full-stack / 生产隔离平台、onboarding 仍需打磨。
- README 没有把 CLI 描述为 orchestrator，也没有把当前 OpenCode / OpenClaw 支持面外推为其他 runtime 的通用支持。

## 选择这些命令的理由

- README-only 文档变更最直接的验证是 diff/status + 文本边界静态检查；这比仅跑全量回归更能证明支持边界没有漂移。
- `npm run test:regression` 是计划指定的核心 regression smoke，能证明 README-only 变更后当前 setup lifecycle、skill surface、CLI 文件系统不变量和 destructive path safety 仍通过。
- 变更范围检查用于覆盖验收标准中的“无 setup scripts/tests changed”。

## 限制

- 未执行真实 GitHub Actions workflow，也未验证发布 / CI release pipeline；README 本身也把这些列为未毕业项。
- 未运行 OpenCode / OpenClaw 全局安装到真实用户目录；本任务只要求 README current-reality 验证与 regression suite。
- 静态检查验证的是 README 文本中的关键事实和禁用 runtime names，不等价于对所有未来文案解释空间的形式化证明。
