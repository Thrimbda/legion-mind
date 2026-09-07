import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const repoRoot = resolve(new URL('../..', import.meta.url).pathname);
const cacheRoot = join(repoRoot, '.cache', 'regression');
const renderer = join(repoRoot, 'skills', 'report-walkthrough', 'scripts', 'render-report.mjs');
const outputs = ['report-walkthrough.html', 'report-walkthrough.md', 'pr-body.md'];

function fixtureRoot(name: string) {
  mkdirSync(cacheRoot, { recursive: true });
  return mkdtempSync(join(cacheRoot, `report-${name}-`));
}

function data(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: '2.0',
    title: 'Standalone review',
    summary: 'Evidence-backed summary.',
    status: 'complete',
    scope: { included: ['skills'], excluded: ['deployment'] },
    changes: ['Removed orchestration coupling.'],
    decisions: ['Skills remain independently callable.'],
    evidence: [{ label: 'Regression', status: 'pass', detail: 'All checks passed.', locator: 'tests/regression' }],
    risks: [],
    nextSteps: [],
    render: { kicker: 'Capability review', reviewer: 'Maintainer', url: 'https://example.com/preview' },
    ...overrides,
  };
}

function writeInput(root: string, value: unknown) {
  const input = join(root, 'report-data.json');
  writeFileSync(input, `${JSON.stringify(value, null, 2)}\n`);
  return input;
}

function run(input: string, options: { check?: boolean; env?: NodeJS.ProcessEnv } = {}) {
  return spawnSync(process.execPath, [renderer, '--input', input, ...(options.check ? ['--check'] : [])], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, ...options.env },
  });
}

test('standalone report validates without task or workflow artifacts', () => {
  const root = fixtureRoot('check');
  try {
    const input = writeInput(root, data());
    const result = run(input, { check: true });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /CHECK_OK Standalone review/);
    for (const output of outputs) assert.equal(existsSync(join(root, output)), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('renderer escapes untrusted content and produces deterministic outputs', () => {
  const root = fixtureRoot('render');
  try {
    const input = writeInput(root, data({
      title: '<script>alert(1)</script>',
      summary: 'A & B',
      evidence: [{ label: '<img src=x onerror=alert(1)>', status: 'info', url: 'https://example.com/evidence' }],
    }));
    const first = run(input);
    assert.equal(first.status, 0, first.stderr);
    const snapshot = Object.fromEntries(outputs.map((name) => [name, readFileSync(join(root, name), 'utf8')]));
    assert.match(snapshot['report-walkthrough.html'], /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    assert.doesNotMatch(snapshot['report-walkthrough.html'], /<script>alert\(1\)<\/script>/);
    assert.match(snapshot['pr-body.md'], /does not prove checks, review, merge, release, or deployment/);

    const second = run(input);
    assert.equal(second.status, 0, second.stderr);
    for (const name of outputs) assert.equal(readFileSync(join(root, name), 'utf8'), snapshot[name]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('schema rejects legacy workflow data, unsafe references and false completion', () => {
  const root = fixtureRoot('invalid');
  try {
    for (const value of [
      data({ schemaVersion: '1.1' }),
      data({ evidence: [] }),
      data({ evidence: [{ label: 'Broken', status: 'fail' }] }),
      data({ evidence: [{ label: 'Unsafe', status: 'info', locator: '../secret' }] }),
      data({ evidence: { label: 'Wrong shape' } }),
      data({ evidence: [{ label: 'Unsafe code span', status: 'info', locator: 'docs/`escape`' }] }),
      data({ render: { url: 'http://example.com' } }),
      { schemaVersion: '2.0', title: 'Missing fields' },
    ]) {
      const result = run(writeInput(root, value), { check: true });
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /validation failed/);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('transactional render restores prior outputs after an injected failure', () => {
  const root = fixtureRoot('rollback');
  try {
    const input = writeInput(root, data());
    for (const name of outputs) writeFileSync(join(root, name), `old-${name}\n`);
    const result = run(input, { env: { NODE_ENV: 'test', REPORT_WALKTHROUGH_FAIL_AT: 'after-first-install' } });
    assert.notEqual(result.status, 0);
    for (const name of outputs) assert.equal(readFileSync(join(root, name), 'utf8'), `old-${name}\n`);
    assert.equal(readdirSync(root).some((name) => name.startsWith('.report-render-')), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
