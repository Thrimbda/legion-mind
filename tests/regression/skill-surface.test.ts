import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { INSTALLED_SKILLS } from '../../scripts/lib/skill-library.ts';

const repoRoot = resolve(new URL('../..', import.meta.url).pathname);
const expectedSkills = [
  'brainstorm',
  'git-worktree-pr',
  'legion-docs',
  'legion-wiki',
  'llm-wiki',
  'pr-html-render',
  'report-walkthrough',
  'review-change',
  'review-rfc',
  'spec-rfc',
  'verify-change',
].sort();

function discoveredSkills(): string[] {
  return readdirSync(join(repoRoot, 'skills'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => existsSync(join(repoRoot, 'skills', name, 'SKILL.md')))
    .sort();
}

test('OpenCode and OpenClaw expose the same independent skill library', () => {
  assert.deepEqual([...INSTALLED_SKILLS].sort(), expectedSkills);
  assert.deepEqual(discoveredSkills(), expectedSkills);
  for (const skill of expectedSkills) {
    assert.equal(existsSync(join(repoRoot, 'skills', skill, 'SKILL.md')), true);
  }
});

test('retired orchestration skills are absent from the active source surface', () => {
  for (const skill of ['legion-workflow', 'engineer']) {
    assert.equal(existsSync(join(repoRoot, 'skills', skill, 'SKILL.md')), false, `${skill} must not remain discoverable`);
  }
});

test('active skill entrypoints do not depend on the retired task workflow', () => {
  const forbidden = [
    'REF_HUMAN_ATTENTION',
    'workflowProfile',
    '.legion/tasks/',
    'profile-policy',
    '交回 `legion-workflow`',
    '退回 `engineer`',
  ];
  for (const skill of expectedSkills) {
    const source = readFileSync(join(repoRoot, 'skills', skill, 'SKILL.md'), 'utf-8');
    for (const token of forbidden) {
      assert.equal(source.includes(token), false, `${skill} must not depend on ${token}`);
    }
  }
});

test('repository policy keeps git-worktree-pr as the sole mandatory delivery shell', () => {
  const agents = readFileSync(join(repoRoot, 'AGENTS.md'), 'utf8');
  const gitSkill = readFileSync(join(repoRoot, 'skills', 'git-worktree-pr', 'SKILL.md'), 'utf8');
  assert.match(agents, /会修改仓库的任务必须使用 `git-worktree-pr`/);
  assert.match(agents, /squash PR、checks、合并、cleanup 与主工作区刷新/);
  assert.doesNotMatch(gitSkill, /legion-workflow|profile|attention|plan\.md|tasks\.md|log\.md/);
  assert.match(gitSkill, /squash merge/);
});
