import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { observeLocalGitLifecycle } from '../src/git-lifecycle.ts';

const projectRoot = resolve(new URL('..', import.meta.url).pathname);
const regressionCacheRoot = join(projectRoot, '.cache', 'regression');

function tmpRoot(name: string): string {
  mkdirSync(regressionCacheRoot, { recursive: true });
  return mkdtempSync(join(regressionCacheRoot, `${name}-`));
}

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function createRepo(root: string): { repoPath: string; remotePath: string; head: string } {
  const remotePath = join(root, 'remote.git');
  const repoPath = join(root, 'repo');
  git(root, ['init', '--bare', remotePath]);
  git(root, ['init', '--initial-branch=master', repoPath]);
  git(repoPath, ['config', 'user.name', 'Scheduler Test']);
  git(repoPath, ['config', 'user.email', 'scheduler@example.test']);
  writeFileSync(join(repoPath, 'README.md'), '# lifecycle\n');
  git(repoPath, ['add', 'README.md']);
  git(repoPath, ['commit', '-m', 'initial']);
  git(repoPath, ['remote', 'add', 'origin', remotePath]);
  git(repoPath, ['push', '-u', 'origin', 'master']);
  return { repoPath, remotePath, head: git(repoPath, ['rev-parse', 'HEAD']) };
}

test('direct lifecycle observer proves cleanup, refresh, and merge ancestry from Git', () => {
  const root = tmpRoot('git-lifecycle-pass');
  try {
    const repo = createRepo(root);
    const observation = observeLocalGitLifecycle({
      repoPath: repo.repoPath,
      taskId: 'task-lifecycle-pass',
      remote: 'origin',
      baseBranch: 'master',
      mergeCommitSha: repo.head,
      requireMergeAncestry: true,
    });
    assert.equal(observation.ok, true);
    assert.equal(observation.localBranch, 'master');
    assert.equal(observation.localHead, repo.head);
    assert.equal(observation.remoteHead, repo.head);
    assert.equal(observation.commands.some((command) => command.command.join(' ') === 'git fetch origin master'), true);
    assert.equal(observation.commands.some((command) => command.command.includes('merge-base')), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('direct lifecycle observer blocks registered or remaining task worktree', () => {
  const root = tmpRoot('git-lifecycle-worktree');
  try {
    const repo = createRepo(root);
    const taskId = 'task-lifecycle-worktree';
    const worktreePath = join(repo.repoPath, '.worktrees', taskId);
    mkdirSync(join(repo.repoPath, '.worktrees'), { recursive: true });
    git(repo.repoPath, ['worktree', 'add', '-b', 'task-fixture', worktreePath]);
    const observation = observeLocalGitLifecycle({
      repoPath: repo.repoPath,
      taskId,
      mergeCommitSha: repo.head,
      requireMergeAncestry: true,
    });
    assert.equal(observation.ok, false);
    assert.match(observation.failures.join('\n'), /remains registered/);
    assert.match(observation.failures.join('\n'), /still exists/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('direct lifecycle observer blocks fetch, branch, dirty refresh, remote-base, and ancestry gaps', () => {
  const fetchRoot = tmpRoot('git-lifecycle-fetch');
  const stateRoot = tmpRoot('git-lifecycle-state');
  try {
    const fetchRepo = createRepo(fetchRoot);
    git(fetchRepo.repoPath, ['remote', 'set-url', 'origin', join(fetchRoot, 'missing.git')]);
    const fetchObservation = observeLocalGitLifecycle({
      repoPath: fetchRepo.repoPath,
      taskId: 'task-fetch-failure',
      requireMergeAncestry: false,
    });
    assert.equal(fetchObservation.ok, false);
    assert.match(fetchObservation.failures.join('\n'), /git fetch origin master failed/);

    const stateRepo = createRepo(stateRoot);
    const updaterPath = join(stateRoot, 'updater');
    git(stateRoot, ['clone', '--branch', 'master', stateRepo.remotePath, updaterPath]);
    git(updaterPath, ['config', 'user.name', 'Scheduler Test']);
    git(updaterPath, ['config', 'user.email', 'scheduler@example.test']);
    writeFileSync(join(updaterPath, 'remote.txt'), 'remote update\n');
    git(updaterPath, ['add', 'remote.txt']);
    git(updaterPath, ['commit', '-m', 'remote update']);
    git(updaterPath, ['push', 'origin', 'master']);
    git(stateRepo.repoPath, ['switch', '-c', 'feature']);
    writeFileSync(join(stateRepo.repoPath, 'dirty.txt'), 'dirty\n');
    const unrelated = git(stateRepo.repoPath, ['commit-tree', `${stateRepo.head}^{tree}`, '-m', 'unrelated']);
    const stateObservation = observeLocalGitLifecycle({
      repoPath: stateRepo.repoPath,
      taskId: 'task-state-failure',
      mergeCommitSha: unrelated,
      requireMergeAncestry: true,
    });
    assert.equal(stateObservation.ok, false);
    assert.match(stateObservation.failures.join('\n'), /branch is feature, expected master/);
    assert.match(stateObservation.failures.join('\n'), /does not equal refs\/remotes\/origin\/master/);
    assert.match(stateObservation.failures.join('\n'), /workspace is dirty/);
    assert.match(stateObservation.failures.join('\n'), /is not an ancestor/);
  } finally {
    rmSync(fetchRoot, { recursive: true, force: true });
    rmSync(stateRoot, { recursive: true, force: true });
  }
});
