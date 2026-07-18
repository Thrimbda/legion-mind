# 验证报告：Legion 分层流程与条件化交付

## 验证范围

- profile 与 disposition 行为
- walkthrough resolved-policy 与 canonical evidence 门
- OpenCode custom agents 清理、权限和安装迁移
- 主工作区安全刷新
- runtime JS 同步、root regression、scheduler compatibility、context budget 与 npm package surface

## 执行证据

### 1. Runtime JS 生成

```sh
npm run build:runtime-js
```

结果：PASS。TypeScript setup core 与发布用 JS 已同步。

### 2. 根回归

```sh
npm run test:regression
```

结果：PASS，44 passed / 0 failed。

覆盖的新增关键行为：

- low/medium/high 默认映射 Lite/Standard/Strict，override 只升不降。
- profile/workflow/delivery/wiki/design/rfc 控制标签拼写错误 fail-closed；无关 labels 仍可透传。
- Strict、显式 Strict、`design:rfc` 与 attention walkthrough 不会在报告阶段降级。
- Strict `brainstorm_only` 仍要求 walkthrough，不存在 runKind 特例降级。
- Lite/Standard/Strict walkthrough 分别要求当前 profile 的最低证据；Lite design-only contract 不伪造 RFC/review。
- walkthrough 缺 `workflowProfile`/`designRequired`、contract plan 缺失、跨 task symlink 或仓库外 symlink 均失败。
- Lite 不得虚报 review PASS。
- OpenCode package/install 不再包含 custom agents；危险 shell deny 保留。
- clean legacy agent 可回滚迁移，用户漂移保留；损坏 package 缺 required source 时不删除已安装 skill。
- detached HEAD 刷新回本地 master 并 fast-forward；本地/远端分叉时失败且保留本地 commit。

### 3. Scheduler compatibility

```sh
npm --prefix scheduler test
```

结果：PASS，59 passed / 0 failed。scheduler 源码无 diff；legacy validator 路径保持现有行为。

### 4. 上下文预算

```sh
npm run audit:context
```

结果：PASS，failures 为空；hot 24,795 / 42,000，medium closure 35,938 / 59,000。

### 5. npm package surface

```sh
npm run pack:dry-run
```

结果：PASS，64 entries；包含 refresh/profile policy scripts，不包含 `.opencode/agents/**`、task docs、tests 或 worktrees。

### 6. Patch hygiene

```sh
git diff --check
git diff --exit-code -- scheduler/src/pr-tracker.ts scheduler/src/worker-runner.ts
```

结果：PASS。无 whitespace error，scheduler 两个源码文件保持基线。

## 限制与延期

- 未进行真实效率 benchmark；按用户要求延期。
- 未实现 Codex/OpenCode per-spawn 模型路由；当前派生调用面不支持自由指定 model。
- 未修改 scheduler prompt、CLI 参数或 evidence verifier；仅运行现有 scheduler suite 验证共享组件兼容。
- npm 输出包含本机 `Unknown env config "tmp"` warning，不影响命令退出码或验证结论。

## Verdict

PASS

## 会话注意力摘要

- **阶段**: `verify-change`
- **阶段结论**: `PASS`
- **注意力等级**: `skim`
- **判断变化**: 两轮 RFC blocker 已转化为机器负路径并全部通过；scheduler compatibility 保持 59/59。
- **关键发现**: profile/disposition、retired migration、refresh 和 package surface 均有行为证据。
- **阻塞项**: 无。
- **残余风险**: renderer-specific resolved binding 与 scheduler legacy binding 必须继续由两套回归共同保护。
- **人类动作**: 知悉。
- **自动下一步**: 进入独立 `review-change`。
- **完整证据**: `.legion/tasks/workflow-profiles-model-routing-v1/docs/test-report.md`
