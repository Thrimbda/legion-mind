#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

function usage() {
  return 'Usage: refresh-main-workspace.mjs --repo <path> [--remote origin] [--branch master]';
}

function parseArgs(argv) {
  const options = { repo: null, remote: 'origin', branch: 'master' };
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!['--repo', '--remote', '--branch'].includes(key)) throw new Error(`Unknown option: ${key}\n${usage()}`);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${key}\n${usage()}`);
    options[key.slice(2)] = value;
    index += 1;
  }
  if (!options.repo) throw new Error(`--repo is required\n${usage()}`);
  if (!/^[A-Za-z0-9._-]+$/.test(options.remote)) throw new Error('remote must be a simple git remote name');
  return options;
}

function git(repo, args, options = {}) {
  const result = spawnSync('git', ['-C', repo, ...args], { encoding: 'utf8' });
  if (options.allowFailure) return result;
  if (result.status !== 0) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join('');
    throw new Error(`git ${args.join(' ')} failed\n${detail}`);
  }
  return result;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const repo = resolve(options.repo);
  if (!existsSync(repo)) throw new Error(`repo does not exist: ${repo}`);

  const topLevel = git(repo, ['rev-parse', '--show-toplevel']).stdout.trim();
  if (resolve(topLevel) !== repo) throw new Error(`--repo must be the main workspace root: ${repo}`);
  git(repo, ['check-ref-format', '--branch', options.branch]);
  git(repo, ['remote', 'get-url', options.remote]);
  git(repo, ['fetch', options.remote]);

  const localRef = `refs/heads/${options.branch}`;
  const remoteRef = `refs/remotes/${options.remote}/${options.branch}`;
  const hasLocal = git(repo, ['show-ref', '--verify', '--quiet', localRef], { allowFailure: true }).status === 0;
  if (hasLocal) {
    git(repo, ['switch', options.branch]);
  } else {
    const hasRemote = git(repo, ['show-ref', '--verify', '--quiet', remoteRef], { allowFailure: true }).status === 0;
    if (!hasRemote) throw new Error(`remote branch does not exist: ${options.remote}/${options.branch}`);
    git(repo, ['switch', '--track', '-c', options.branch, `${options.remote}/${options.branch}`]);
  }

  git(repo, ['merge', '--ff-only', `${options.remote}/${options.branch}`]);
  process.stdout.write(git(repo, ['status', '--short', '--branch']).stdout);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
