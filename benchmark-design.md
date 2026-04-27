# VibeHarnessBench v0.1 设计文档

## 0. 文档目的

本文档不是让 coding agent 去完成“画鹈鹕”“做 2048”“做 MapReduce / KV server”的题。

**本文档的唯一目的，是让一个实现型 coding agent 去构建一套 benchmark 系统，用来评测另一个 agent harness 的能力。**

本设计先收敛到 **3 个 task family**：

1. `pelican-bike-gif-v1`：鹈鹕骑自行车循环动图
2. `game-2048-v1`：带持久化与 replay 的 2048 小游戏
3. `systems-go-v1`：一个 systems family，包含两个 atomic cases
   - `mr-full-v1`
   - `kvsrv-core-v1`

> 说明：为了保持“这次先做三个 task”的口径，第三项设计成一个 **family**，内部再拆成两个原子 case。runner 和报告层面同时支持 family 视图和 atomic case 视图。

---

## 1. 给“实现 benchmark 的 coding agent”的角色约束（最重要）

### 1.1 角色定义

- **Benchmark Builder Agent**：收到本文档并负责编写 benchmark 系统的 agent。
- **Evaluated Agent / Harness Under Test (HUT)**：未来真正被 benchmark 的目标 agent/harness。
- **Runner**：组织一次 benchmark run 的调度器。
- **Verifier**：对任务结果做 visible / hidden 验证的程序。
- **Oracle Solution**：仅用于 benchmark 自检的“标准可通过实现”；不得暴露给 HUT。

### 1.2 Builder Agent 的核心职责

Builder Agent 必须交付：

1. benchmark runner
2. adapter interface（用于接入被测 harness）
3. 3 个 task family 的任务包
4. 每个任务包的：
   - starter workspace
   - visible tests
   - hidden verifier
   - oracle solution（保护目录）
   - 文档与配置
5. report 与 compare 工具

### 1.3 Builder Agent 的禁止事项

Builder Agent **不得**：

1. 把 starter repo 直接写成已完成解。
2. 把 oracle solution 放到被测 agent 可见的 workspace。
3. 把 hidden tests、hidden seeds、golden outputs 泄露到被测 agent 运行环境。
4. 把自己当成被测 agent，直接“做题并提交产物”。
5. 为了让 benchmark 更容易通过而弱化 hidden verifier。

### 1.4 必须写进 Builder Agent 的系统提示词

实现 benchmark 的 agent 的系统提示词必须包含如下约束（可原文使用）：

```text
You are building benchmark infrastructure, not solving benchmark tasks.
Your job is to create runner code, task packs, visible tests, hidden verifiers,
protected oracle solutions, reports, and docs.
Do not complete the benchmark tasks inside the starter workspaces.
Any fully working task implementation must live only in protected oracle paths
that are never mounted into the evaluated agent container.
Preserve intentional TODOs and incomplete starter code for future evaluated agents.
```

---

## 2. 范围与非目标

### 2.1 本期范围

本期只做一个最小可用 benchmark：

- Docker 化执行
- 可接一个外部 harness adapter
- 支持 smoke / gate / nightly 三种运行模式
- 支持 family 级别与 atomic case 级别报告
- 支持 hidden verification
- 支持 benchmark 自检（oracle 必须能过）

### 2.2 非目标

这期不做：

- 通用云调度平台
- 多机分布式执行
- UI leaderboard 网站
- 人工审美打分工作流
- 自动生成新 benchmark 题
- 复杂权限系统

---

## 3. 设计原则

1. **先求硬验证，再求开放性。**
2. **所有 task 都要有 deterministic contract。**
3. **public tests 只做 debug 引导，hidden verifier 才是最终裁决。**
4. **starter、visible tests、oracle、hidden verifier 必须物理隔离。**
5. **family 少但要精；每个 family 都要能稳定区分 harness 版本。**
6. **每个 task 都必须有正向控制（oracle）和负向控制（known-bad implementation）。**
7. **systems family 参考当前 MIT 6.5840 的 Lab 1 MapReduce 与 Lab 2 Key/Value Server 的能力边界，但 benchmark 实现应使用 clean-room 派生版本，而不是直接照搬课程分发包。**

---

## 4. 参考上下文（供设计对齐）

当前 MIT 6.5840（Spring 2026）课程安排中，Lab 1 是 MapReduce，Lab 2 是 Key/Value Server。MapReduce lab 的核心是：单机上运行一个 coordinator 和多个 worker，worker 通过 RPC 取任务，coordinator 在 worker 长时间未完成时重分配任务；官方测试关注正确性、并行性和 crash recovery。Key/Value Server lab 的核心是：单机 KV 服务，`Put(key, value, version)` / `Get(key)` 通过 Clerk 发起 RPC，要求 `Put` 至少满足 at-most-once 语义下的歧义处理，并保证客户端视角线性一致；官方说明还明确给了 skeleton code 和 tests。[^mit-sched] [^mit-mr] [^mit-kv]

这意味着：

- `mr-full-v1` 应该保留 “coordinator + worker + RPC + task lease / reassign + crash recovery” 这一能力面。
- `kvsrv-core-v1` 应该保留 “versioned Put/Get + unreliable network retries + ErrMaybe 语义 + linearizable externally-visible behavior” 这一能力面。
- 但 benchmark 实现应改写包名、测试组织、fixture、命令入口与 hidden tests，避免直接把官方 lab 作为公开题复刻。

---

## 5. 总体架构

### 5.1 组件

- **Runner（Python 3.11）**
  - 负责准备 workspace
  - 调起被测 harness adapter
  - 收集运行元数据
  - 调起 hidden verifier
  - 生成结果 report

- **Adapter**
  - 把 benchmark runner 与具体 harness 接起来
  - 统一成“给 prompt + workspace + budget，返回 trace + summary”的接口

- **Task Pack**
  - 一个 task family 或 atomic case 的打包单元
  - 内含 starter、visible tests、hidden verifier、oracle、自检脚本、文档

- **Agent Runtime Container**
  - 运行被测 harness
  - 只能看到 starter workspace + public prompt + visible tests + public fixtures
  - 完全看不到 hidden verifier / oracle / hidden seeds

- **Verifier Container**
  - 只在被测 harness 退出后启动
  - 拿最终 workspace snapshot 和 protected verifier 进行裁决

- **Report Generator**
  - 把一次 run 归档为 JSON + Markdown 摘要

### 5.2 运行时序

一次 atomic case 的执行时序：

1. runner 读取 case config。
2. 从 `starter/` 复制出新的可写 workspace。
3. 生成本次 run 的 seed、budget、环境变量。
4. 启动 agent runtime container。
5. adapter 将 prompt / visible tests 路径 / workspace 路径 / budget 传给 HUT。
6. HUT 在 budget 内操作 workspace。
7. HUT 退出后，runner 固化 workspace snapshot。
8. runner 在独立 verifier container 中执行 hidden verifier。
9. runner 汇总：
   - functional verdict
   - visible / hidden 测试结果
   - 时间 / token / 命令数 / 修改文件数
   - artifacts 路径
10. runner 生成 `run.json`、`summary.md`、可选 `trace.jsonl`。

---

## 6. 仓库结构

```text
vibe-harness-bench/
  README.md
  pyproject.toml
  bench/
    runner/
      __init__.py
      cli.py
      engine.py
      docker_exec.py
      reporting.py
      schema.py
    adapters/
      schema.py
      examples/
        noop.yaml
        shell-agent.yaml
    suites/
      core-v1.yaml
      smoke-v1.yaml
      nightly-v1.yaml
  tasks/
    pelican-bike-gif-v1/
      family.yaml
      cases/
        pelican-bike-gif-v1/
          task.yaml
          prompt.md
          starter/
          public/
          verifier/
          oracle/
          negative_controls/
          docs/
          Dockerfile.agent
          Dockerfile.verifier
    game-2048-v1/
      family.yaml
      cases/
        game-2048-v1/
          ...
    systems-go-v1/
      family.yaml
      cases/
        mr-full-v1/
          ...
        kvsrv-core-v1/
          ...
  results/
  tools/
    selfcheck.py
    compare_runs.py
```

---

## 7. Adapter 接口规范

### 7.1 目标

runner 不直接耦合某一个具体 agent harness。任何 harness 只要能适配到这个接口，就可以被 benchmark。

### 7.2 Adapter YAML

示例：

```yaml
id: my-harness
mode: command
command:
  - python
  - -m
  - my_harness.run
args:
  - --prompt-file
  - "{BENCH_PROMPT_FILE}"
  - --workspace
  - "{BENCH_WORKSPACE_DIR}"
  - --public-dir
  - "{BENCH_PUBLIC_DIR}"
  - --artifact-dir
  - "{BENCH_ARTIFACT_DIR}"
  - --budget-file
  - "{BENCH_BUDGET_FILE}"
  - --summary-out
  - "{BENCH_SUMMARY_OUT}"
  - --trace-out
  - "{BENCH_TRACE_OUT}"
timeout_grace_sec: 10
supports_metrics: true
```

### 7.3 Runner 向 Adapter 注入的环境变量

- `BENCH_TASK_FAMILY_ID`
- `BENCH_CASE_ID`
- `BENCH_TASK_SEED`
- `BENCH_PROMPT_FILE`
- `BENCH_PUBLIC_DIR`
- `BENCH_WORKSPACE_DIR`
- `BENCH_ARTIFACT_DIR`
- `BENCH_BUDGET_FILE`
- `BENCH_SUMMARY_OUT`
- `BENCH_TRACE_OUT`

### 7.4 Adapter 输出约定

Adapter 至少要写出 `summary.json`：

```json
{
  "agent_name": "my-harness",
  "status": "completed",
  "tokens_input": null,
  "tokens_output": null,
  "tool_calls": null,
  "shell_commands": 14,
  "files_modified": 9,
  "public_tests_run": 2,
  "notes": "optional"
}
```

如果 harness 无法提供 token / tool 调用数，允许为 `null`。

### 7.5 最低兼容要求

- adapter 能启动 HUT
- HUT 能读 prompt 与 visible tests
- HUT 能在 workspace 中写入文件
- adapter 能在结束时落一个 `summary.json`

---

## 8. Task Pack 规范

每个 atomic case 必须包含：

```text
<case>/
  task.yaml
  prompt.md
  starter/
  public/
  verifier/
  oracle/
  negative_controls/
  docs/
  Dockerfile.agent
  Dockerfile.verifier
```

### 8.1 `task.yaml` 必填字段

```yaml
id: pelican-bike-gif-v1
family_id: pelican-bike-gif-v1
kind: artifact | app | systems
language_stack: node | go
entry_hint: "pnpm render -- --out artifacts/pelican.gif --seed $BENCH_TASK_SEED"
workspace_subdir: starter
public_dir: public
artifact_dir: artifacts
visible_verify_cmd:
  - bash
  - /ro/public/run_visible.sh
hidden_verify_cmd:
  - bash
  - /protected/verifier/run_hidden.sh
budgets:
  wall_time_sec: 900
  max_steps: 80
  max_input_tokens: 250000
resources:
  cpu: 4
  memory_mb: 8192
seed_mode: fixed | per_run
gate_seeds: [11]
nightly_seeds: [11, 29, 47]
read_only_mounts:
  - /ro/prompt
  - /ro/public
```

### 8.2 目录可见性规则

- `starter/`：被测 agent 可写
- `public/`：被测 agent 可读不可写
- `prompt.md`：被测 agent 可读不可写
- `verifier/`：被测 agent 不可见
- `oracle/`：被测 agent 不可见
- `negative_controls/`：被测 agent 不可见

### 8.3 自检要求

每个 case 必须有：

- `oracle/`：正确解，`bench selfcheck` 时应通过 hidden verifier
- `negative_controls/`：至少一个 known-bad 解，`bench selfcheck` 时应失败

---

## 9. 评分与报告

### 9.1 Verdict 层级

- `PASS`：hidden verifier 通过
- `FAIL_VISIBLE`：visible tests 未通过，且 hidden verifier 无需继续
- `FAIL_HIDDEN`：visible 通过但 hidden 未通过
- `ERROR_AGENT`：adapter/HUT 异常退出
- `ERROR_INFRA`：runner/verifier/docker 级别错误

### 9.2 主指标

**主指标只看 hidden pass rate。**

- family score：family 内 atomic cases 的平均 hidden pass rate
- suite score：所有 family score 的平均值

### 9.3 诊断指标

- wall time
- tokens in/out（如可得）
- shell commands
- files modified
- public tests run count
- self-check discipline（是否主动运行 public tests）
- flail ratio（重复失败命令占比，可选）

### 9.4 报告 JSON 结构

```json
{
  "suite_id": "core-v1",
  "adapter_id": "my-harness",
  "started_at": "2026-04-25T12:00:00Z",
  "ended_at": "2026-04-25T12:18:03Z",
  "family_results": [
    {
      "family_id": "pelican-bike-gif-v1",
      "score": 1.0,
      "cases": [
        {
          "case_id": "pelican-bike-gif-v1",
          "seed": 11,
          "verdict": "PASS",
          "metrics": {
            "wall_time_sec": 311,
            "shell_commands": 16,
            "files_modified": 7
          }
        }
      ]
    }
  ]
}
```

---

## 10. 执行模式

### 10.1 `smoke`

用途：本地开发 benchmark 本身。

- 每个 case 只跑 1 个 seed
- 只跑 visible tests
- 可选跳过 heavy hidden verifier

### 10.2 `gate`

用途：回归门禁。

- 每个 family 跑 gate seed
- 跑完整 hidden verifier
- 每个 atomic case 1 次

### 10.3 `nightly`

用途：评估 harness 稳定性。

- 多 seed
- systems family 额外跑 2~3 次重复
- 输出 stable pass rate

---

## 11. Docker 约束

### 11.1 共通约束

- agent runtime container 默认 `--network none`
- verifier container 默认 `--network none`
- 所有依赖预烘焙进镜像
- Node / Go 任务都不得在运行时联网安装依赖
- host 到 container 只做必要 volume mount

### 11.2 挂载建议

- `/workspace`：可写 starter copy
- `/ro/prompt`：只读 prompt
- `/ro/public`：只读 visible tests / public fixtures
- `/protected/verifier`：仅 verifier container 可见
- `/protected/oracle`：仅 selfcheck 与 verifier 可见
- `/artifacts`：runner 可收集

### 11.3 推荐资源配额

- `pelican-bike-gif-v1`：4 CPU / 8 GB / 15 min
- `game-2048-v1`：4 CPU / 8 GB / 15 min
- `mr-full-v1`：2 CPU / 4 GB / 20 min
- `kvsrv-core-v1`：2 CPU / 4 GB / 20 min

---

## 12. Task Family 1：`pelican-bike-gif-v1`

### 12.1 目的

测：

- artifact 产出能力
- 按 spec 实现动画逻辑
- 构建 / 渲染 / 导出闭环
- 在 starter repo 中补齐前端/渲染代码

**这不是开放式审美题。** 这是一道“有创意表象，但验收高度工程化”的 deterministic artifact 题。

### 12.2 技术栈

- Node 22
- pnpm
- Playwright（Chromium）
- ffmpeg
- TypeScript
- HTML Canvas

### 12.3 Starter Repo 结构

```text
starter/
  package.json
  pnpm-lock.yaml
  tsconfig.json
  src/
    main.ts
    render.ts
    scene.ts
    motion.ts
    manifest.ts
  assets/
    pelican_body.svg
    pelican_head.svg
    bike_frame.svg
    wheel.svg
    road.svg
    sky.svg
    sea.svg
  artifacts/
```

设计原则：

- 渲染管线、CLI 和编码流程由 starter 提供。
- 被测 agent 主要补 `scene.ts`、`motion.ts` 与必要 UI glue。
- 资产固定，防止题目过度开放而难以验证。

### 12.4 暴露给被测 agent 的任务 prompt

`prompt.md` 建议如下：

```md
# Task: pelican-bike-gif-v1

You are working on a benchmark task workspace.
Implement the missing code to render a seamless looping GIF of a pelican riding a bicycle.

Requirements:

- Output path must be configurable via CLI flag `--out`.
- Seed must be configurable via CLI flag `--seed`.
- Output GIF must be 512x512, 4 seconds, 24 fps, seamless loop.
- Use the provided SVG assets.
- Scene must include sky, sea, road, bicycle, and pelican.
- Bicycle wheels must rotate continuously.
- Pedal motion must stay synchronized with wheel motion.
- Pelican body must have a small vertical bob.
- Pelican head must have a small secondary motion.
- Write `artifacts/scene_manifest.json` alongside the GIF.
- Keep the provided file/layout contracts stable.

Deliverables:

- `artifacts/pelican.gif`
- `artifacts/scene_manifest.json`

Helpful command:

- `pnpm render -- --out artifacts/pelican.gif --seed $BENCH_TASK_SEED`
```

### 12.5 输出契约

#### GIF 契约

- 文件名：`artifacts/pelican.gif`
- 分辨率：`512x512`
- 时长：`4.0s`
- 帧率：`24 fps`
- 帧数：`96`

#### Manifest 契约

```json
{
  "seed": 11,
  "width": 512,
  "height": 512,
  "fps": 24,
  "frame_count": 96,
  "frames": [
    {
      "frame": 0,
      "wheel_deg": 0,
      "pedal_deg": 0,
      "pelican_body_y": 0,
      "head_deg": 0
    }
  ]
}
```

### 12.6 Visible Tests

`public/run_visible.sh` 要做：

1. `pnpm install --offline`（镜像内已有 store）
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm render -- --out artifacts/pelican.gif --seed $BENCH_TASK_SEED`
5. 检查：
   - GIF 存在
   - manifest 存在
   - GIF 尺寸 / 帧数正确
   - manifest schema 正确
   - 至少有 20 个相邻帧 hash 不同（防止静态图）

### 12.7 Hidden Verifier

hidden verifier 需要做两类检查：

#### A. Contract 检查

- 文件与 schema 完整
- 输出尺寸 / 帧数 / 时长严格正确
- manifest 与 seed 一致

#### B. Motion 语义检查

- 对关键帧（0 / 24 / 48 / 72 / 95）抽帧
- 用 oracle 参考输出进行容差比对：
  - pHash 距离阈值
  - SSIM 下限阈值
- 从 manifest 检查：
  - `wheel_deg` 单调变化并闭环
  - `pedal_deg` 与 `wheel_deg` 同步
  - `pelican_body_y` 在合理振幅区间
  - `head_deg` 有次级摆动且幅度合理

> 说明：这里允许少量实现差异，但由于资产固定且 starter 已提供渲染骨架，关键帧与运动学应与 oracle 接近。

### 12.8 Oracle 与负向控制

#### Oracle

- 一份完整正确实现，位于 `oracle/`。
- `bench selfcheck --case pelican-bike-gif-v1` 时必须 pass。

#### Negative Controls

至少两个：

1. `static-scene/`：输出静态 GIF，应 fail hidden。
2. `desync-motion/`：轮子与踏板不同步，应 fail hidden。

### 12.9 通过标准

- gate：seed = `11`
- nightly：seeds = `11, 29, 47`

---

## 13. Task Family 2：`game-2048-v1`

### 13.1 目的

测：

- 小产品交付能力
- UI + 状态机 + 持久化 + replay
- 交互与逻辑分层
- Playwright 可回放验证

### 13.2 技术栈

- Node 22
- pnpm
- Vite
- React + TypeScript
- Vitest
- Playwright

### 13.3 产品范围

必须实现：

- 4x4 2048 棋盘
- 键盘方向键移动
- 页面按钮移动（Up/Down/Left/Right）
- 分数显示
- New Game
- Undo（仅 1 步）
- localStorage 持久化
- Export Replay（JSON）
- Import Replay（JSON）
- Win / Game Over overlay
- 可传 seed，保证初始随机与后续 spawn 可复现

### 13.4 Starter Repo 结构

```text
starter/
  package.json
  tsconfig.json
  vite.config.ts
  src/
    main.tsx
    App.tsx
    game/
      engine.ts
      replay.ts
      storage.ts
      types.ts
    components/
      Board.tsx
      Controls.tsx
      Overlay.tsx
  public/
  artifacts/
```

设计原则：

- `engine.ts` 留 TODO，要求被测 agent 实现纯逻辑 reducer。
- 组件骨架给出，但不完整。
- UI 与逻辑可以分别测试。

### 13.5 暴露给被测 agent 的任务 prompt

```md
# Task: game-2048-v1

Implement a playable 2048 web app in the provided workspace.

Requirements:

- 4x4 board.
- Support arrow keys and on-screen direction buttons.
- Show score.
- Support New Game.
- Support one-step Undo.
- Persist current state to localStorage.
- Support Export Replay as JSON.
- Support Import Replay from JSON.
- Support deterministic seed-based behavior.
- Show win and game-over overlays.
- Keep the provided `data-testid` contract stable.

Data-testid contract:

- `board`
- `cell-r-c`
- `score-value`
- `btn-up`, `btn-down`, `btn-left`, `btn-right`
- `btn-new`
- `btn-undo`
- `btn-export`
- `input-import`
- `overlay-win`
- `overlay-gameover`

Deliverable:

- a working app that passes public tests and hidden verification
```

### 13.6 Visible Tests

#### Logic tests（Vitest）

- fixed seed + move sequence => expected board
- score increments correctly
- import/export replay round-trip

#### E2E tests（Playwright）

- keyboard move works
- button move works
- refresh restores state
- export replay then import replay reconstructs terminal board

### 13.7 Hidden Verifier

hidden verifier 需要覆盖“容易做错但 public tests 不一定完全覆盖”的规则：

1. **单次 sweep 不能双重合并**
   - `[2,2,2,0]` 左移 => `[4,2,0,0]`
2. **无效移动不应生成新 tile**
3. **Undo 语义正确**
   - undo 后再新动作，旧 redo 分支不得隐式残留
4. **seed + replay 决定性**
   - 相同 seed + 相同 replay 必须得到相同终局
5. **localStorage 恢复后状态一致**
6. **win/game-over overlay 时机正确**

### 13.8 Oracle 与负向控制

#### Oracle

- 完整通过实现放在 `oracle/`

#### Negative Controls

至少三个：

1. `double-merge-bug/`：实现错误的合并规则
2. `spawn-on-noop/`：无效 move 也生成 tile
3. `bad-undo/`：undo 只回滚棋盘，不回滚分数或随机状态

### 13.9 通过标准

- gate：seed = `42`
- nightly：seeds = `7, 42, 99`

---

## 14. Task Family 3：`systems-go-v1`

### 14.1 目的

测：

- 读已有代码 skeleton 的能力
- Go + RPC + 并发调试能力
- log / test 驱动修复能力
- systems 风格长期任务执行能力

### 14.2 设计原则

此 family 参考当前 MIT 6.5840 的 Lab 1 和 Lab 2 能力边界：MapReduce 的 coordinator/worker/RPC/reassignment/crash recovery，以及单机 KV server 的 versioned Put/Get、retry、ErrMaybe、linearizable behavior。[^mit-mr] [^mit-kv]

但 benchmark 包必须是 **clean-room 派生版**：

- 改包名
- 改目录结构
- 改 fixture
- 改测试组织
- public 与 hidden 测试重写
- 不直接 vendor 课程的测试文件

### 14.3 原子 case A：`mr-full-v1`

#### 14.3.1 技术栈

- Go 1.22
- `go test`
- 本地文件系统

#### 14.3.2 Starter Repo 结构

```text
starter/
  go.mod
  main/
    coordinator/main.go
    worker/main.go
  mapr/
    coordinator.go
    worker.go
    rpc.go
    types.go
  apps/
    wc.go
    index.go
    crash.go
  fixtures/
    chapter-*.txt
  out/
```

#### 14.3.3 被测 agent 任务 prompt

```md
# Task: mr-full-v1

Implement a single-machine distributed MapReduce runtime.

Requirements:

- One coordinator process.
- One or more worker processes.
- Workers request tasks via RPC.
- Coordinator assigns map tasks, then reduce tasks.
- Workers write intermediate partitions and final reduce outputs.
- Coordinator must reassign a task if a worker does not complete it within the lease timeout.
- The system must tolerate crashy workers.
- Keep file/output contracts stable.

Expected final outputs:

- reduce outputs under `out/`

You may inspect public tests for exact expected behavior.
```

#### 14.3.4 Visible Tests

1. word count correctness
2. indexer correctness
3. map parallelism
4. reduce parallelism
5. single crashy worker recovery

#### 14.3.5 Hidden Verifier

1. straggler reassignment 后，重复完成结果不得污染最终输出
2. late worker completion 必须被 coordinator 安全忽略
3. 多小文件输入不应卡死
4. 输出命名与排序应保持 deterministic
5. worker 提前退出后 job 不应永久挂起

#### 14.3.6 Negative Controls

1. `no-reassign/`：worker 超时后不重分配
2. `double-commit/`：重复完成会覆盖或重复统计输出
3. `serial-only/`：逻辑正确但无并行性，应 fail visible/hidden parallel checks

#### 14.3.7 说明

官方 MapReduce lab 文档明确指出：worker 通过 RPC 向 coordinator 取任务，coordinator 需要在 worker 长时间未完成（文档示例为 10 秒）时将任务交给其他 worker，官方 tests 还检查正确输出、并行性和 crash recovery。[^mit-mr]

### 14.4 原子 case B：`kvsrv-core-v1`

#### 14.4.1 技术栈

- Go 1.22
- `go test`
- 本地单进程 KV 服务 + RPC 模拟不可靠网络

#### 14.4.2 Starter Repo 结构

```text
starter/
  go.mod
  kvcore/
    client.go
    server.go
    types.go
  rpcsim/
    client.go
    network.go
    errors.go
  cmd/
    kvsrv/main.go
```

#### 14.4.3 API 契约

- `Get(key)` -> `(value, version, err)`
- `Put(key, value, version)` -> `err`

语义：

1. key 不存在时，`Get` 返回 `ErrNoKey`
2. 新建 key 只能 `Put(..., version=0)`
3. version 匹配时更新成功并递增版本
4. version 不匹配时返回 `ErrVersion`
5. unreliable network 下，client 必须重试直到收到回复
6. 如果 retransmitted `Put` 的第一次调用可能已经成功，但后续重试收到 `ErrVersion`，client 必须向上层暴露 `ErrMaybe`
7. 从 Clerk 视角，外部可观察行为必须线性一致

#### 14.4.4 被测 agent 任务 prompt

```md
# Task: kvsrv-core-v1

Implement a single-machine RPC key/value server and client clerk.

Requirements:

- Support `Get(key)` and `Put(key, value, version)`.
- Enforce version semantics.
- Retry requests when the network drops or delays messages.
- Surface `ErrMaybe` for ambiguous retried `Put` operations.
- Provide linearizable behavior from the clerk/client point of view.
- Keep the provided API and file layout stable.

You may inspect public tests for exact expectations.
```

#### 14.4.5 Visible Tests

1. reliable single-client Put/Get
2. missing-key and version mismatch semantics
3. unreliable network retry basics
4. basic concurrent Put legality

#### 14.4.6 Hidden Verifier

1. ambiguous retried Put => `ErrMaybe`，不能错误返回 `ErrVersion`
2. 多 client history 通过线性一致性检查
3. 重试/重复回复不应导致内存无限增长
4. delayed duplicate replies 不应破坏外部语义

#### 14.4.7 Negative Controls

1. `retry-no-errmaybe/`：重试后直接把歧义情况错误映射为 `ErrVersion`
2. `non-linearizable/`：并发下暴露非线性一致行为
3. `leaky-client-state/`：高重试下内存增长过快

#### 14.4.8 说明

当前官方 Lab 2 明确要求单机 KV server 的 `Put`/`Get`、version 语义、retries、`ErrMaybe` 情况和客户端视角线性一致性，并说明 skeleton code 与 tests 是公开提供的。[^mit-kv]

### 14.5 Family 级别报告规则

`systems-go-v1` 对外作为一个 family 报告：

- `family_score = 0.5 * mr-full-v1 + 0.5 * kvsrv-core-v1`
- gate 模式下，若任一 atomic case `FAIL_HIDDEN`，family 视为未通过

---

## 15. Suite 定义

### 15.1 `smoke-v1`

```yaml
id: smoke-v1
families:
  - pelican-bike-gif-v1
  - game-2048-v1
  - systems-go-v1
mode: smoke
```

### 15.2 `core-v1`

```yaml
id: core-v1
families:
  - pelican-bike-gif-v1
  - game-2048-v1
  - systems-go-v1
mode: gate
```

### 15.3 `nightly-v1`

```yaml
id: nightly-v1
families:
  - pelican-bike-gif-v1
  - game-2048-v1
  - systems-go-v1
mode: nightly
repeats_per_case: 3
```

---

## 16. 命令行接口

### 16.1 核心命令

```bash
bench run --suite core-v1 --adapter adapters/examples/shell-agent.yaml
bench run --family pelican-bike-gif-v1 --adapter adapters/examples/shell-agent.yaml
bench run --case mr-full-v1 --adapter adapters/examples/shell-agent.yaml --seed 11
bench compare results/run_a results/run_b
bench selfcheck --suite core-v1
bench doctor
```

### 16.2 期望输出

每次 run 生成：

```text
results/<run_id>/
  run.json
  summary.md
  traces/
    <case_id>.jsonl
  artifacts/
    <case_id>/...
  workspace_snapshots/
    <case_id>.tar.zst
```

---

## 17. 反作弊与隔离

1. HUT 无法看到 hidden verifier。
2. HUT 无法看到 oracle。
3. public tests 只读。
4. 运行时禁网。
5. hidden seeds 不写入 prompt，不写入 public 目录。
6. final verdict 只信 hidden verifier，不信 agent 自报。
7. runner 对 `/ro` 下内容校验 checksum；若被篡改直接 `ERROR_AGENT`。
8. systems family 的 clean-room 派生版不得直接把官方测试文件打包给 HUT。

---

## 18. Benchmark 自检（必须实现）

### 18.1 正向自检

对每个 case：

- 用 `oracle/` 作为 workspace 运行 hidden verifier
- 结果必须 PASS

### 18.2 负向自检

对每个 case：

- 用每个 `negative_controls/*` 运行 hidden verifier
- 结果必须 FAIL

### 18.3 Smoke 自检

- 用 `noop` adapter 跑 `smoke-v1`
- runner 应能正常给出失败报告，而不是 infra 崩溃

---

## 19. Builder Agent 的分阶段实施顺序

### Phase 1：Runner 与 Adapter

交付：

- `bench run`
- `bench selfcheck`
- `bench compare`
- adapter schema
- docker 执行框架

### Phase 2：`pelican-bike-gif-v1`

交付：

- starter
- visible tests
- hidden verifier
- oracle
- 2 个 negative controls

### Phase 3：`game-2048-v1`

交付：

- starter
- visible tests（logic + e2e）
- hidden verifier
- oracle
- 3 个 negative controls

### Phase 4：`systems-go-v1`

先做 `mr-full-v1`，再做 `kvsrv-core-v1`。

交付：

- clean-room 派生 starter
- visible tests
- hidden verifier
- oracle
- negative controls

### Phase 5：自检与文档

交付：

- `bench selfcheck --suite core-v1` 通过
- README
- 每个 case 的 `docs/authoring-notes.md`

---

## 20. Done Definition（本期完成标准）

Builder Agent 交付的 benchmark 系统必须满足：

1. `bench doctor` 成功。
2. `bench selfcheck --suite core-v1` 全通过。
3. `noop` adapter 可以完整跑完并输出失败报告。
4. 每个 case 的 oracle 可以 pass。
5. 每个 case 至少一个 negative control 会 fail。
6. `core-v1` 可以在一台有 Docker 的机器上离线运行。
7. HUT 看不到 hidden verifier / oracle。
8. runner 能输出 family 级与 atomic case 级报告。

---

## 21. 关键实现建议（给 Builder Agent）

1. **runner 用 Python 写**：最容易编排 Docker、文件、JSON report。
2. **Node 任务都用预烘焙镜像**：别让 HUT 运行时联网装依赖。
3. **systems family 不要直接复制官方 6.5840 分发包**：只保留能力边界，重新组织代码与测试。
4. **先把自检做出来**：没有 oracle/negative-control 自检，benchmark 很容易形同虚设。
5. **public tests 别过多泄露 hidden verifier 判据**：尤其是 2048 合并规则边角、MR 的重复完成、KVSRV 的 ErrMaybe 歧义判定。
6. **报告先做 JSON，再做 Markdown 摘要**。

---

## 22. 本期建议默认实现决策

为了减少 Builder Agent 纠结，实现时默认采用以下决策：

- runner：Python 3.11
- report：JSON + Markdown
- pelican / 2048：Node 22 + pnpm + Playwright
- systems：Go 1.22
- family 视角保留，atomic case 也保留
- hidden verifier 全部独立 Docker image
- `core-v1` 是本期主回归套件

---

## 23. 附录 A：最小 `task.yaml` 示例

```yaml
id: game-2048-v1
family_id: game-2048-v1
kind: app
language_stack: node
entry_hint: "pnpm test && pnpm build"
workspace_subdir: starter
public_dir: public
artifact_dir: artifacts
visible_verify_cmd:
  - bash
  - /ro/public/run_visible.sh
hidden_verify_cmd:
  - bash
  - /protected/verifier/run_hidden.sh
budgets:
  wall_time_sec: 900
  max_steps: 80
resources:
  cpu: 4
  memory_mb: 8192
seed_mode: fixed
gate_seeds: [42]
nightly_seeds: [7, 42, 99]
```

---

## 24. 附录 B：实现型 agent 的工作清单

Builder Agent 应把自己的 TODO 收敛成
