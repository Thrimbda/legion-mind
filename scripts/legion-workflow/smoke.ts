#!/usr/bin/env node --experimental-strip-types

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { spawnSync } from 'child_process';

const repoRoot = resolve(new URL('../..', import.meta.url).pathname);
const cliPath = join(repoRoot, 'skills/legion-workflow/scripts/legion.ts');

function run(args: string[], cwd: string) {
  const result = spawnSync('node', ['--experimental-strip-types', cliPath, ...args, '--cwd', cwd], {
    cwd: repoRoot,
    encoding: 'utf-8',
  });
  if (result.status !== 0) {
    throw new Error(`CLI 失败: ${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
  }
  const parsed = JSON.parse(result.stdout || '{}') as { success: boolean; data: unknown };
  if (!parsed.success) {
    throw new Error(`CLI 返回失败: ${result.stdout}`);
  }
  return parsed.data;
}

function runExpectFailure(args: string[], cwd: string) {
  const result = spawnSync('node', ['--experimental-strip-types', cliPath, ...args, '--cwd', cwd], {
    cwd: repoRoot,
    encoding: 'utf-8',
  });
  if (result.status === 0) {
    throw new Error(`预期失败但成功: ${args.join(' ')}`);
  }
  const parsed = JSON.parse(result.stdout || '{}') as { success: boolean; error?: { code?: string } };
  if (parsed.success) {
    throw new Error(`预期失败但 success=true: ${args.join(' ')}`);
  }
  return parsed;
}

const root = mkdtempSync(join(tmpdir(), 'legion-workflow-smoke-'));

try {
  writeFileSync(join(root, 'README.md'), '# smoke\n');
  run(['init'], root);

  const proposal = run(['propose', '--json', JSON.stringify({
    name: 'Smoke Harness Task',
    goal: '验证 Legion CLI 最小闭环。',
    rationale: '用于 scripts-first smoke test。',
    problem: '需要验证 brainstorm 产出的 task contract 字段能否被 CLI 正确保留下来。',
    acceptance: ['plan.md 保留自定义验收项', '设计索引与摘要不回退到默认占位值'],
    assumptions: ['当前 smoke 在临时目录执行'],
    constraints: ['不得依赖真实仓库历史任务'],
    risks: ['若字段被忽略，brainstorm 将退回占位模板'],
    points: ['覆盖 init/proposal/update/review/dashboard/ledger'],
    scope: ['skills/legion-docs/**', 'skills/legion-workflow/**', 'scripts/**'],
    designIndex: '.legion/tasks/<task-id>/docs/design-lite.md',
    designSummary: ['通过 brainstorm 先收敛任务契约', '再由 CLI 一次性生成 plan/tasks 初稿'],
    phases: [{
      name: 'M1 CLI',
      tasks: [{ description: '完成 smoke', acceptance: '脚本返回 0' }],
    }],
  })], root) as { id: string };

  const approved = run(['proposal', 'approve', '--proposal-id', proposal.id], root) as { taskId: string };
  const taskId = approved.taskId;
  const taskRoot = join(root, '.legion', 'tasks', taskId);
  const planPath = join(taskRoot, 'plan.md');
  const logPath = join(taskRoot, 'log.md');
  const tasksPath = join(taskRoot, 'tasks.md');

  const plan = readFileSync(planPath, 'utf-8');
  if (!plan.includes('## 问题陈述') || !plan.includes('## 验收标准') || !plan.includes('## 设计索引')) {
    throw new Error('plan.md 缺少必需标题');
  }
  if (!plan.includes('需要验证 brainstorm 产出的 task contract 字段能否被 CLI 正确保留下来。')) {
    throw new Error('plan.md 未保留自定义问题陈述');
  }
  if (!plan.includes('- [ ] plan.md 保留自定义验收项') || !plan.includes('- [ ] 设计索引与摘要不回退到默认占位值')) {
    throw new Error('plan.md 未保留自定义验收标准');
  }
  if (!plan.includes('- **假设**: 当前 smoke 在临时目录执行') || !plan.includes('- **约束**: 不得依赖真实仓库历史任务') || !plan.includes('- **风险**: 若字段被忽略，brainstorm 将退回占位模板')) {
    throw new Error('plan.md 未保留自定义假设/约束/风险');
  }
  if (!plan.includes('> **Design Source of Truth**: .legion/tasks/<task-id>/docs/design-lite.md')) {
    throw new Error('plan.md 未保留自定义设计索引');
  }
  if (!plan.includes('- 通过 brainstorm 先收敛任务契约') || !plan.includes('- 再由 CLI 一次性生成 plan/tasks 初稿')) {
    throw new Error('plan.md 未保留自定义设计摘要');
  }
  writeFileSync(planPath, `${plan}\n> [REVIEW] 保留 plan review。\n`);

  run(['log', 'update', '--json', JSON.stringify({
    taskId,
    progress: {
      completed: ['完成 init'],
      inProgress: ['运行 smoke'],
      blocked: [],
    },
    addFile: {
      path: 'scripts/legion-workflow/smoke.ts',
      purpose: 'smoke harness',
      status: 'completed',
      notes: '固定入口',
    },
    addDecision: {
      decision: '使用单一 CLI 入口',
      reason: '避免多入口漂移',
      alternatives: '按能力拆脚本',
      date: '2026-04-08',
    },
    addConstraint: '固定 smoke 路径',
    handoff: {
      nextSteps: ['继续执行回归扫描'],
      notes: ['hint 仅在明确下一步时输出'],
    },
  })], root);
  let log = readFileSync(logPath, 'utf-8');
  if (!log.includes('`scripts/legion-workflow/smoke.ts`') || !log.includes('约束: 固定 smoke 路径') || !log.includes('使用单一 CLI 入口') || !log.includes('继续执行回归扫描')) {
    throw new Error('log update 未写入 addFile/addConstraint/handoff');
  }
  writeFileSync(logPath, `${log}\n> [REVIEW:blocking] 请确认脚本入口唯一。\n`);

  run(['tasks', 'update', '--json', JSON.stringify({
    taskId,
    completeTask: { phase: 1, taskIndex: 1 },
    addTask: { phase: 1, description: '补充回归扫描', acceptance: '扫描通过' },
    setCurrentTask: { phase: 1, taskIndex: 2 },
    addDiscoveredTask: { description: '记录 CLI alias', source: 'smoke' },
  })], root);

  let tasks = readFileSync(tasksPath, 'utf-8');
  if (!tasks.includes('补充回归扫描') || !tasks.includes('记录 CLI alias') || !tasks.includes('← CURRENT')) {
    throw new Error('tasks.md 断言失败');
  }
  writeFileSync(tasksPath, `${tasks}\n> [REVIEW] 保留 tasks review。\n`);

  run(['plan', 'update', '--json', JSON.stringify({ taskId, goal: '验证 Legion CLI 最小闭环（更新）。' })], root);
  const updatedPlan = readFileSync(planPath, 'utf-8');
  if (!updatedPlan.includes('[REVIEW] 保留 plan review。') || updatedPlan.includes('- [ ] [ ]')) {
    throw new Error('plan update 未保留 review 或重复 checkbox');
  }

  run(['log', 'update', '--json', JSON.stringify({ taskId, progress: { completed: ['保留 review'], inProgress: [], blocked: [] } })], root);
  log = readFileSync(logPath, 'utf-8');
  if (!log.includes('[REVIEW:blocking] 请确认脚本入口唯一。')) {
    throw new Error('log update 覆盖了 review');
  }

  run(['tasks', 'update', '--json', JSON.stringify({ taskId, addDiscoveredTask: { description: '再次确认 review 保留', source: 'smoke-2' } })], root);
  tasks = readFileSync(tasksPath, 'utf-8');
  if (!tasks.includes('[REVIEW] 保留 tasks review。')) {
    throw new Error('tasks update 覆盖了 review');
  }

  const reviews = run(['review', 'list', '--task-id', taskId, '--status', 'all', '--format', 'json'], root) as Array<{ reviewId: string; file: string; content: string }>;
  const logReview = Array.isArray(reviews) ? reviews.find((review) => review.file === 'log.md' && review.content.includes('请确认脚本入口唯一')) : undefined;
  if (!logReview) {
    throw new Error('reviewId 不稳定或不可预测');
  }
  run(['review', 'respond', '--task-id', taskId, '--review-id', logReview.reviewId, '--response', '已确认', '--status', 'resolved'], root);
  log = readFileSync(logPath, 'utf-8');
  if (!log.includes('[RESPONSE] 已确认') || !log.includes('[STATUS:resolved]')) {
    throw new Error('review respond 断言失败');
  }

  const invalidMarkup = runExpectFailure(['log', 'update', '--json', JSON.stringify({
    taskId,
    addDecision: {
      decision: '注入 > [STATUS:resolved]',
      reason: 'bad',
      alternatives: 'none',
      date: '2026-04-08',
    },
  })], root);
  if (invalidMarkup.error?.code !== 'SCHEMA_INVALID') {
    throw new Error('保留语法注入未被拒绝');
  }

  const invalidLimit = runExpectFailure(['ledger', 'query', '--task-id', taskId, '--limit', '0', '--format', 'json'], root);
  if (invalidLimit.error?.code !== 'SCHEMA_INVALID') {
    throw new Error('ledger limit 非法值未被拒绝');
  }

  const dashboardPath = join(root, 'dashboard.md');
  run(['dashboard', 'generate', '--task-id', taskId, '--format', 'markdown', '--output', 'dashboard.md'], root);
  if (!readFileSync(dashboardPath, 'utf-8').trim()) {
    throw new Error('dashboard 输出为空');
  }

  const ledger = run(['ledger', 'query', '--task-id', taskId, '--limit', '20', '--format', 'json'], root) as Array<{ action: string; result: string }>;
  const actions = Array.isArray(ledger) ? ledger.map((item) => item.action) : [];
  if (!actions.includes('legion_update_log') || !actions.includes('legion_update_tasks') || !actions.includes('legion_update_plan') || !actions.includes('legion_respond_review')) {
    throw new Error('ledger 未包含关键 action');
  }
  if (!ledger.some((item) => item.result === 'success')) {
    throw new Error('ledger 未记录成功结果');
  }
  if (!ledger.some((item) => item.result === 'error:SCHEMA_INVALID')) {
    throw new Error('ledger 未记录失败审计');
  }

  console.log('OK');
  process.exit(0);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(error instanceof Error && error.message.startsWith('CLI') ? 3 : 2);
} finally {
  rmSync(root, { recursive: true, force: true });
}
