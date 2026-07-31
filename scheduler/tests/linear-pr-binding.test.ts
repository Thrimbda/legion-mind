import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { openSchedulerStore } from '../src/sqlite-store.ts';
import type { WorkItemSnapshotInput } from '../src/sqlite-store.ts';

const projectRoot = resolve(new URL('..', import.meta.url).pathname);
const regressionCacheRoot = join(projectRoot, '.cache', 'regression');

function tmpDb(name: string) {
  mkdirSync(regressionCacheRoot, { recursive: true });
  const root = mkdtempSync(join(regressionCacheRoot, `${name}-`));
  return { root, dbPath: join(root, 'scheduler.sqlite') };
}

function snapshot(identifier: string, repoKey = 'legion-mind'): WorkItemSnapshotInput {
  return {
    linearIssueId: `issue-${identifier}`,
    linearIdentifier: identifier,
    linearProjectId: 'project-pr-binding',
    title: `PR binding ${identifier}`,
    stateName: 'Ready',
    stateType: 'unstarted',
    labels: ['agent:ready', 'contract:stable', `repo:${repoKey}`],
    blockers: [],
    repoKey,
    risk: 'high',
    contractState: 'stable',
    resourceHints: [`area:${identifier.toLowerCase()}`],
    linearUpdatedAt: '2026-07-31T00:00:00.000Z',
  };
}

function claim(store: ReturnType<typeof openSchedulerStore>, identifier: string, taskId: string, repoKey = 'legion-mind') {
  const current = snapshot(identifier, repoKey);
  const result = store.claimReadyWorkItem({
    readySnapshot: current,
    currentSnapshot: current,
    taskId,
    lockKeys: [`mutex:${identifier.toLowerCase()}`],
  });
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error('claim failed');
  return result;
}

function bindInChild(dbPath: string, runId: string, prUrl: string): Promise<unknown> {
  const storeModule = pathToFileURL(join(projectRoot, 'src', 'sqlite-store.ts')).href;
  const source = `
    import { openSchedulerStore } from ${JSON.stringify(storeModule)};
    const store = openSchedulerStore(${JSON.stringify(dbPath)});
    try {
      process.stdout.write(JSON.stringify(store.compareAndBindTaskPr(${JSON.stringify(runId)}, ${JSON.stringify(prUrl)})));
    } finally {
      store.close();
    }
  `;
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(process.execPath, [
      '--experimental-strip-types',
      '--experimental-sqlite',
      '--input-type=module',
      '--eval',
      source,
    ], {
      cwd: dirname(dbPath),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf-8');
    child.stderr.setEncoding('utf-8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', rejectPromise);
    child.on('close', (code) => {
      if (code !== 0) {
        rejectPromise(new Error(`binding child exited ${code}: ${stderr}`));
        return;
      }
      resolvePromise(JSON.parse(stdout));
    });
  });
}

test('task PR binding is write-once, canonical, idempotent, and durable', () => {
  const { root, dbPath } = tmpDb('pr-binding-durable');
  let runId = '';
  try {
    const store = openSchedulerStore(dbPath);
    const claimed = claim(store, 'PR-BIND-1', 'task-pr-bind-1');
    runId = claimed.runId;
    const first = store.compareAndBindTaskPr(runId, 'https://GitHub.com/Thrimbda/legion-mind/pull/101/?utm=ignored');
    assert.equal(first.ok, true);
    assert.equal(first.ok && first.status, 'bound');
    assert.equal(first.binding.pr_identity, 'github.com/thrimbda/legion-mind#101');
    assert.equal(first.binding.pr_url, 'https://github.com/Thrimbda/legion-mind/pull/101');
    assert.equal(first.binding.pr_state, 'open');

    const same = store.compareAndBindTaskPr(runId, 'https://github.com/thrimbda/LEGION-MIND/pull/101');
    assert.equal(same.ok, true);
    assert.equal(same.ok && same.status, 'already_bound');
    assert.equal(store.getRun(runId)?.pr_url, first.binding.pr_url);

    const conflict = store.compareAndBindTaskPr(runId, 'https://github.com/Thrimbda/legion-mind/pull/102');
    assert.equal(conflict.ok, false);
    assert.equal(!conflict.ok && conflict.reason, 'pr_identity_conflict');
    assert.equal(store.getRun(runId)?.pr_url, first.binding.pr_url);
    store.close();

    const reopened = openSchedulerStore(dbPath);
    assert.equal(reopened.getTaskPrBindingForRun(runId)?.pr_identity, first.binding.pr_identity);
    assert.equal(reopened.getTaskPrBindingForRun(runId)?.pr_url, first.binding.pr_url);
    reopened.close();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('v5 PR binding migration marks ambiguous legacy rows unknown and historical done rows merged', () => {
  const { root, dbPath } = tmpDb('pr-binding-v5-migration');
  try {
    const store = openSchedulerStore(dbPath);
    const ambiguous = claim(store, 'PR-MIGRATE-UNKNOWN', 'task-pr-migrate-unknown');
    const completed = claim(store, 'PR-MIGRATE-DONE', 'task-pr-migrate-done');
    store.transitionRun(completed.runId, 'running', { actor: 'test' });
    store.transitionRun(completed.runId, 'in_review', { actor: 'test' });
    store.transitionRun(completed.runId, 'done', { actor: 'test' });
    store.close();

    const legacy = new DatabaseSync(dbPath);
    legacy.exec(`
      DROP INDEX IF EXISTS task_pr_bindings_state_idx;
      DROP TABLE task_pr_bindings;
      CREATE TABLE task_pr_bindings (
        repo_key TEXT NOT NULL,
        task_id TEXT NOT NULL,
        binding_state TEXT NOT NULL CHECK (binding_state IN ('bound', 'conflicted')),
        pr_identity TEXT,
        pr_url TEXT,
        pr_state TEXT NOT NULL DEFAULT 'open' CHECK (pr_state IN ('open', 'merged', 'closed')),
        bound_run_id TEXT REFERENCES runs(id),
        conflict_json TEXT,
        bound_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (repo_key, task_id),
        CHECK (
          (binding_state = 'bound' AND pr_identity IS NOT NULL AND pr_url IS NOT NULL AND conflict_json IS NULL)
          OR
          (binding_state = 'conflicted' AND pr_identity IS NULL AND pr_url IS NULL AND conflict_json IS NOT NULL)
        )
      ) STRICT;
      DELETE FROM schema_migrations WHERE version = 6;
    `);
    const insertLegacy = legacy.prepare(`
      INSERT INTO task_pr_bindings(
        repo_key, task_id, binding_state, pr_identity, pr_url, pr_state,
        bound_run_id, conflict_json, bound_at, updated_at
      ) VALUES (?, ?, 'bound', ?, ?, 'open', ?, NULL, ?, ?)
    `);
    const timestamp = '2026-07-31T00:00:00.000Z';
    insertLegacy.run(
      'legion-mind',
      'task-pr-migrate-unknown',
      'github.com/thrimbda/legion-mind#140',
      'https://github.com/Thrimbda/legion-mind/pull/140',
      ambiguous.runId,
      timestamp,
      timestamp,
    );
    insertLegacy.run(
      'legion-mind',
      'task-pr-migrate-done',
      'github.com/thrimbda/legion-mind#141',
      'https://github.com/Thrimbda/legion-mind/pull/141',
      completed.runId,
      timestamp,
      timestamp,
    );
    legacy.close();

    const migrated = openSchedulerStore(dbPath);
    assert.equal(migrated.getTaskPrBinding('legion-mind', 'task-pr-migrate-unknown')?.pr_state, 'unknown');
    assert.equal(migrated.getTaskPrBinding('legion-mind', 'task-pr-migrate-done')?.pr_state, 'merged');
    migrated.close();

    const verified = new DatabaseSync(dbPath);
    const migration = verified.prepare('SELECT name FROM schema_migrations WHERE version = 6').get() as { name: string } | undefined;
    assert.equal(migration?.name, 'task_pr_binding_unknown_state');
    const table = verified.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'task_pr_bindings'").get() as { sql: string };
    assert.match(table.sql, /'unknown'/);
    verified.close();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('terminal binding applies to a later run for the same repo and task', () => {
  const store = openSchedulerStore(':memory:');
  try {
    const first = claim(store, 'PR-TERM-1', 'task-pr-terminal');
    const bound = store.compareAndBindTaskPr(first.runId, 'https://github.com/Thrimbda/legion-mind/pull/110');
    assert.equal(bound.ok, true);
    store.observeTaskPrState(first.runId, 'merged');
    store.requestNativeStop(first.runId, 'finish first scheduler run', { actor: 'test' });

    const second = claim(store, 'PR-TERM-2', 'task-pr-terminal');
    const same = store.compareAndBindTaskPr(second.runId, 'https://github.com/thrimbda/legion-mind/pull/110');
    assert.equal(same.ok, true);
    assert.equal(same.binding.pr_state, 'merged');
    const replacement = store.compareAndBindTaskPr(second.runId, 'https://github.com/Thrimbda/legion-mind/pull/111');
    assert.equal(replacement.ok, false);
    assert.equal(store.getTaskPrBindingForRun(second.runId)?.pr_identity, 'github.com/thrimbda/legion-mind#110');
  } finally {
    store.close();
  }
});

test('multiple legacy run identities freeze the task binding instead of choosing one', () => {
  const { root, dbPath } = tmpDb('pr-binding-legacy-conflict');
  try {
    const store = openSchedulerStore(dbPath);
    const first = claim(store, 'PR-LEGACY-1', 'task-pr-legacy');
    store.requestNativeStop(first.runId, 'legacy run complete', { actor: 'test' });
    const second = claim(store, 'PR-LEGACY-2', 'task-pr-legacy');
    store.requestNativeStop(second.runId, 'legacy run complete', { actor: 'test' });
    store.close();

    const legacy = new DatabaseSync(dbPath);
    legacy.prepare('UPDATE runs SET pr_url = ? WHERE id = ?').run('https://github.com/Thrimbda/legion-mind/pull/120', first.runId);
    legacy.prepare('UPDATE runs SET pr_url = ? WHERE id = ?').run('https://github.com/Thrimbda/legion-mind/pull/121', second.runId);
    legacy.close();

    const migrated = openSchedulerStore(dbPath);
    const result = migrated.compareAndBindTaskPr(second.runId, 'https://github.com/Thrimbda/legion-mind/pull/120');
    assert.equal(result.ok, false);
    assert.equal(!result.ok && result.reason, 'pr_binding_conflicted');
    assert.equal(result.binding.binding_state, 'conflicted');
    assert.equal(result.binding.pr_identity, null);
    assert.match(result.binding.conflict_json ?? '', /legacy_pr_identity_conflict/);
    const retry = migrated.compareAndBindTaskPr(second.runId, 'https://github.com/Thrimbda/legion-mind/pull/120');
    assert.equal(retry.ok, false);
    assert.equal(!retry.ok && retry.reason, 'pr_binding_conflicted');
    migrated.close();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('concurrent first bind serializes on the task primary key and accepts only one identity', async () => {
  const { root, dbPath } = tmpDb('pr-binding-concurrent');
  try {
    const store = openSchedulerStore(dbPath);
    const claimed = claim(store, 'PR-RACE-1', 'task-pr-race');
    store.close();

    const results = await Promise.all([
      bindInChild(dbPath, claimed.runId, 'https://github.com/Thrimbda/legion-mind/pull/130'),
      bindInChild(dbPath, claimed.runId, 'https://github.com/Thrimbda/legion-mind/pull/131'),
    ]) as Array<{ ok: boolean; binding: { pr_identity: string | null } }>;
    assert.equal(results.filter((result) => result.ok).length, 1);
    assert.equal(results.filter((result) => !result.ok).length, 1);

    const reopened = openSchedulerStore(dbPath);
    const binding = reopened.getTaskPrBindingForRun(claimed.runId);
    assert.equal(binding?.binding_state, 'bound');
    assert.ok([
      'github.com/thrimbda/legion-mind#130',
      'github.com/thrimbda/legion-mind#131',
    ].includes(binding?.pr_identity ?? ''));
    reopened.close();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
