import { spawnSync } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';

export interface GitCommandObservation {
  command: string[];
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

export interface LocalLifecycleObservation {
  ok: boolean;
  failureType: 'lifecycle_blocked';
  failures: string[];
  repoPath: string;
  taskId: string;
  worktreePath: string;
  remote: string;
  baseBranch: string;
  localBranch: string | null;
  localHead: string | null;
  remoteHead: string | null;
  mergeCommitSha: string | null;
  commands: GitCommandObservation[];
  observedAt: string;
}

export interface ObserveLocalLifecycleOptions {
  repoPath: string;
  taskId: string;
  remote?: string;
  baseBranch?: string;
  mergeCommitSha?: string | null;
  requireMergeAncestry?: boolean;
  now?: string;
}

function normalizeOutput(value: string | Buffer | null | undefined): string {
  return typeof value === 'string' ? value.trim() : value ? value.toString('utf-8').trim() : '';
}

function canonicalExistingPath(path: string): string {
  try {
    return realpathSync(path);
  } catch {
    return resolve(path);
  }
}

function listedWorktreePaths(porcelain: string): string[] {
  return porcelain
    .split('\n')
    .filter((line) => line.startsWith('worktree '))
    .map((line) => canonicalExistingPath(line.slice('worktree '.length).trim()));
}

export function observeLocalGitLifecycle(options: ObserveLocalLifecycleOptions): LocalLifecycleObservation {
  const repoPath = canonicalExistingPath(options.repoPath);
  const worktreePath = resolve(repoPath, '.worktrees', options.taskId);
  const remote = options.remote ?? 'origin';
  const baseBranch = options.baseBranch ?? 'master';
  const commands: GitCommandObservation[] = [];
  const failures: string[] = [];

  const git = (args: string[]): GitCommandObservation => {
    const result = spawnSync('git', args, {
      cwd: repoPath,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const observation = {
      command: ['git', ...args],
      exitCode: result.status,
      stdout: normalizeOutput(result.stdout),
      stderr: normalizeOutput(result.stderr || result.error?.message),
    };
    commands.push(observation);
    return observation;
  };

  const worktreeList = git(['worktree', 'list', '--porcelain']);
  if (worktreeList.exitCode !== 0) {
    failures.push(`git worktree list failed: ${worktreeList.stderr || `exit ${worktreeList.exitCode}`}`);
  } else if (listedWorktreePaths(worktreeList.stdout).includes(canonicalExistingPath(worktreePath))) {
    failures.push(`task worktree remains registered: ${worktreePath}`);
  }
  if (existsSync(worktreePath)) {
    failures.push(`task worktree path still exists: ${worktreePath}`);
  }

  const fetch = git(['fetch', remote, baseBranch]);
  if (fetch.exitCode !== 0) {
    failures.push(`git fetch ${remote} ${baseBranch} failed: ${fetch.stderr || `exit ${fetch.exitCode}`}`);
  }

  const branch = git(['symbolic-ref', '--quiet', '--short', 'HEAD']);
  const localBranch = branch.exitCode === 0 ? branch.stdout : null;
  if (localBranch !== baseBranch) {
    failures.push(`main workspace branch is ${localBranch ?? 'detached'}, expected ${baseBranch}`);
  }

  const head = git(['rev-parse', '--verify', 'HEAD']);
  const localHead = head.exitCode === 0 ? head.stdout : null;
  if (!localHead) {
    failures.push(`cannot resolve local HEAD: ${head.stderr || `exit ${head.exitCode}`}`);
  }

  const remoteRef = `refs/remotes/${remote}/${baseBranch}`;
  const remoteHeadResult = git(['rev-parse', '--verify', remoteRef]);
  const remoteHead = remoteHeadResult.exitCode === 0 ? remoteHeadResult.stdout : null;
  if (!remoteHead) {
    failures.push(`cannot resolve remote base ${remoteRef}: ${remoteHeadResult.stderr || `exit ${remoteHeadResult.exitCode}`}`);
  } else if (localHead && localHead !== remoteHead) {
    failures.push(`main workspace HEAD ${localHead} does not equal ${remoteRef} ${remoteHead}`);
  }

  const status = git(['status', '--porcelain']);
  if (status.exitCode !== 0) {
    failures.push(`git status failed: ${status.stderr || `exit ${status.exitCode}`}`);
  } else if (status.stdout) {
    failures.push('main workspace is dirty and cannot prove a safe refresh');
  }

  const mergeCommitSha = options.mergeCommitSha?.trim() || null;
  if (options.requireMergeAncestry) {
    if (!mergeCommitSha) {
      failures.push('GitHub merged snapshot is missing merge_commit_sha');
    } else if (localHead) {
      const ancestry = git(['merge-base', '--is-ancestor', mergeCommitSha, localHead]);
      if (ancestry.exitCode !== 0) {
        failures.push(`merge commit ${mergeCommitSha} is not an ancestor of local HEAD ${localHead}`);
      }
    }
  }

  return {
    ok: failures.length === 0,
    failureType: 'lifecycle_blocked',
    failures,
    repoPath,
    taskId: options.taskId,
    worktreePath,
    remote,
    baseBranch,
    localBranch,
    localHead,
    remoteHead,
    mergeCommitSha,
    commands,
    observedAt: options.now ?? new Date().toISOString(),
  };
}
