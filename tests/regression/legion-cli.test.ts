import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const repoRoot = resolve(new URL('../..', import.meta.url).pathname);
const legionCli = join(repoRoot, 'skills', 'legion-workflow', 'scripts', 'legion.ts');
const regressionCacheRoot = join(repoRoot, '.cache', 'regression');

function tmpRepo() {
  mkdirSync(regressionCacheRoot, { recursive: true });
  return mkdtempSync(join(regressionCacheRoot, 'legion-cli-'));
}

function runCli(cwd: string, args: string[]) {
  return JSON.parse(execFileSync(process.execPath, [legionCli, ...args, '--cwd', cwd], {
    cwd: repoRoot,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }));
}

test('Legion CLI preserves filesystem invariants for init/create/status/list', () => {
  const cwd = tmpRepo();
  try {
    const taskId = 'regression-cli-task';
    const payload = {
      taskId,
      name: 'Regression CLI Task',
      goal: 'Exercise thin filesystem CLI invariants.',
      phases: [{ name: 'Phase 1', tasks: [{ description: 'Create task files', acceptance: 'Required files exist' }] }],
    };

    const init = runCli(cwd, ['init']);
    assert.equal(init.success, true);
    assert.equal(existsSync(join(cwd, '.legion', 'tasks')), true);

    const created = runCli(cwd, ['task', 'create', '--json', JSON.stringify(payload)]);
    assert.equal(created.success, true);

    const taskRoot = join(cwd, '.legion', 'tasks', taskId);
    assert.equal(existsSync(join(taskRoot, 'plan.md')), true);
    assert.equal(existsSync(join(taskRoot, 'log.md')), true);
    assert.equal(existsSync(join(taskRoot, 'tasks.md')), true);
    assert.equal(existsSync(join(taskRoot, 'docs')), true);
    assert.deepEqual(readdirSync(join(cwd, '.legion', 'tasks')).filter((name) => name.startsWith('.tmp-')), []);

    const status = runCli(cwd, ['status', '--task-id', taskId, '--format', 'json']);
    assert.equal(status.success, true);
    assert.equal(status.data.taskId, taskId);

    const list = runCli(cwd, ['task', 'list', '--format', 'json']);
    assert.equal(list.success, true);
    assert.deepEqual(list.data.tasks.map((item: { taskId: string }) => item.taskId), [taskId]);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
