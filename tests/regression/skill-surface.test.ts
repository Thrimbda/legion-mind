import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const repoRoot = resolve(new URL('../..', import.meta.url).pathname);
const requiredPhaseSkills = [
  'brainstorm',
  'legion-workflow',
  'git-worktree-pr',
  'spec-rfc',
  'review-rfc',
  'engineer',
  'verify-change',
  'review-change',
  'report-walkthrough',
  'legion-wiki',
  'legion-docs',
];

function opencodeInstalledSkills(): string[] {
  const source = readFileSync(join(repoRoot, 'scripts', 'setup-opencode.ts'), 'utf-8');
  const match = source.match(/const INSTALLED_SKILLS = \[([\s\S]*?)\] as const;/);
  assert.ok(match, 'setup-opencode.ts should declare INSTALLED_SKILLS');
  return [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1]).sort();
}

function openclawDiscoveredSkills(): string[] {
  return readdirSync(join(repoRoot, 'skills'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => existsSync(join(repoRoot, 'skills', name, 'SKILL.md')))
    .sort();
}

test('OpenCode installed skill list exists on disk and includes required phase skills', () => {
  const opencode = opencodeInstalledSkills();
  for (const skill of opencode) {
    assert.equal(existsSync(join(repoRoot, 'skills', skill, 'SKILL.md')), true, `${skill} should have SKILL.md`);
  }
  for (const skill of requiredPhaseSkills) {
    assert.equal(opencode.includes(skill), true, `OpenCode should install ${skill}`);
  }
});

test('OpenClaw dynamic skill surface is an OpenCode superset', () => {
  const opencode = opencodeInstalledSkills();
  const openclaw = openclawDiscoveredSkills();
  for (const skill of opencode) {
    assert.equal(openclaw.includes(skill), true, `OpenClaw skill surface should include ${skill}`);
  }
});
