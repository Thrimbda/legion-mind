#!/usr/bin/env node --experimental-strip-types --experimental-sqlite

import { readFileSync } from 'node:fs';
import {
  StaticPullRequestClient,
  createGitHubRestPullRequestClient,
  pullRequestSnapshotFromFixture,
  trackPrDelivery,
} from './pr-tracker.ts';
import { createDebugService, openSchedulerStore } from './sqlite-store.ts';
import { fetchLinearProjectSnapshot, scanLinearProject } from './scanner.ts';
import { processOpenCodeWorkerDispatch } from './worker-runner.ts';
import type { LinearProjectSnapshotInput, ScannerConfig } from './scanner.ts';

function printHelp() {
  console.log(`linear-scheduler debug service

Usage:
  npm run debug -- health [--db <path|:memory:>]
  npm run debug -- runs list [--db <path|:memory:>]
  npm run debug -- events list --run <run-id> [--db <path|:memory:>]
  npm run debug -- scan project --project <linear-project-id> [--db <path|:memory:>] [--token-env LINEAR_API_KEY]
  npm run debug -- scan fixture --fixture <snapshot.json> [--db <path|:memory:>]
  npm run debug -- worker dispatch --run <run-id> --attempt <attempt-id> --repo <repo-path> [--db <path|:memory:>] [--timeout-ms <ms>]
  npm run debug -- delivery track --run <run-id> --repo <repo-path> [--pr-url <url>] [--fixture <pr-snapshot.json>] [--db <path|:memory:>] [--token-env GITHUB_TOKEN]

Commands:
  health        Apply migrations and print DB health as JSON
  runs list     List scheduler runs as JSON
  events list   List one run timeline as JSON
  scan project  Fetch a Linear project snapshot, persist work_item_snapshots, print dry-run ready/skipped report
  scan fixture  Load a repo-local fixture snapshot and print the same scanner report without Linear API access
  worker dispatch  Launch one pending OpenCode worker dispatch outbox row; native startup outbox must already be sent
  delivery track  Observe one PR snapshot, update run delivery state, and enqueue idempotent Linear native writeback rows
`);
}

function valueAfter(argv: string[], name: string): string | null {
  const exact = argv.find((arg) => arg.startsWith(`${name}=`));
  if (exact) {
    return exact.slice(name.length + 1);
  }
  const index = argv.indexOf(name);
  if (index >= 0) {
    return argv[index + 1] ?? null;
  }
  return null;
}

function scannerConfig(argv: string[]): ScannerConfig {
  const pausedRepo = valueAfter(argv, '--repo-paused');
  const knownRepos = valueAfter(argv, '--known-repos');
  return {
    delegateAppUserId: valueAfter(argv, '--delegate'),
    schedulerRunUrlBase: valueAfter(argv, '--scheduler-run-url-base') ?? undefined,
    defaultRepoKey: valueAfter(argv, '--default-repo'),
    knownRepoKeys: knownRepos ? knownRepos.split(',').map((repo) => repo.trim()).filter(Boolean) : undefined,
    pausedProjectIds: valueAfter(argv, '--project-paused') ? [valueAfter(argv, '--project-paused') as string] : undefined,
    pausedRepoKeys: pausedRepo ? [pausedRepo] : undefined,
  };
}

function loadFixture(path: string): LinearProjectSnapshotInput {
  return JSON.parse(readFileSync(path, 'utf-8')) as LinearProjectSnapshotInput;
}

async function runScan(argv: string[], dbPath: string) {
  const mode = argv[1];
  const store = openSchedulerStore(dbPath);
  try {
    let snapshot: LinearProjectSnapshotInput;
    if (mode === 'fixture') {
      const fixturePath = valueAfter(argv, '--fixture');
      if (!fixturePath) {
        throw new Error('scan fixture requires --fixture <snapshot.json>.');
      }
      snapshot = loadFixture(fixturePath);
    } else if (mode === 'project') {
      const projectId = valueAfter(argv, '--project');
      if (!projectId) {
        throw new Error('scan project requires --project <linear-project-id>.');
      }
      const tokenEnv = valueAfter(argv, '--token-env') ?? 'LINEAR_API_KEY';
      const apiKey = process.env[tokenEnv];
      if (!apiKey) {
        throw new Error(`scan project requires ${tokenEnv} to contain a Linear API key.`);
      }
      snapshot = await fetchLinearProjectSnapshot({ apiKey, projectId, endpoint: valueAfter(argv, '--endpoint') ?? undefined });
    } else {
      throw new Error('scan requires mode `project` or `fixture`.');
    }

    console.log(JSON.stringify(scanLinearProject(snapshot, { store, config: scannerConfig(argv) }), null, 2));
  } finally {
    store.close();
  }
}

async function runWorker(argv: string[], dbPath: string) {
  const mode = argv[1];
  if (mode !== 'dispatch') {
    throw new Error('worker requires mode `dispatch`.');
  }
  const runId = valueAfter(argv, '--run');
  const attemptId = valueAfter(argv, '--attempt');
  const repoPath = valueAfter(argv, '--repo');
  if (!runId || !attemptId || !repoPath) {
    throw new Error('worker dispatch requires --run <run-id> --attempt <attempt-id> --repo <repo-path>.');
  }
  const store = openSchedulerStore(dbPath);
  try {
    const row = store.pendingOutbox().find((entry) => entry.outbox_kind === 'worker_dispatch' && entry.run_id === runId && entry.attempt_id === attemptId);
    if (!row) {
      throw new Error(`No pending worker dispatch outbox row for run ${runId} attempt ${attemptId}.`);
    }
    const result = await processOpenCodeWorkerDispatch(store, row, {
      repoPath,
      baseRef: valueAfter(argv, '--base-ref') ?? 'origin/master',
      timeoutMs: Number(valueAfter(argv, '--timeout-ms') ?? 60 * 60 * 1000),
    });
    console.log(JSON.stringify(result, null, 2));
  } finally {
    store.close();
  }
}

async function runDelivery(argv: string[], dbPath: string) {
  const mode = argv[1];
  if (mode !== 'track') {
    throw new Error('delivery requires mode `track`.');
  }
  const runId = valueAfter(argv, '--run');
  const repoPath = valueAfter(argv, '--repo');
  if (!runId || !repoPath) {
    throw new Error('delivery track requires --run <run-id> --repo <repo-path>.');
  }

  const fixturePath = valueAfter(argv, '--fixture');
  const explicitPrUrl = valueAfter(argv, '--pr-url');
  const store = openSchedulerStore(dbPath);
  try {
    const fixtureSnapshot = fixturePath ? pullRequestSnapshotFromFixture(JSON.parse(readFileSync(fixturePath, 'utf-8'))) : null;
    const client = fixtureSnapshot
      ? new StaticPullRequestClient(fixtureSnapshot)
      : createGitHubRestPullRequestClient({ token: process.env[valueAfter(argv, '--token-env') ?? 'GITHUB_TOKEN'] });
    const result = await trackPrDelivery(store, client, {
      runId,
      prUrl: explicitPrUrl ?? fixtureSnapshot?.url ?? null,
      repoPath,
      traceId: valueAfter(argv, '--trace-id'),
    });
    console.log(JSON.stringify(result, null, 2));
  } finally {
    store.close();
  }
}

async function main(argv: string[]) {
  const command = argv[0] ?? 'help';
  if (command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  const dbPath = valueAfter(argv, '--db') ?? ':memory:';
  if (command === 'scan') {
    await runScan(argv, dbPath);
    return;
  }
  if (command === 'worker') {
    await runWorker(argv, dbPath);
    return;
  }
  if (command === 'delivery') {
    await runDelivery(argv, dbPath);
    return;
  }

  const service = createDebugService(dbPath);
  try {
    if (command === 'health') {
      console.log(JSON.stringify(service.health(), null, 2));
      return;
    }
    if (command === 'runs' && argv[1] === 'list') {
      console.log(JSON.stringify(service.listRuns(), null, 2));
      return;
    }
    if (command === 'events' && argv[1] === 'list') {
      const runId = valueAfter(argv, '--run');
      if (!runId) {
        throw new Error('events list requires --run <run-id>.');
      }
      console.log(JSON.stringify(service.timeline(runId), null, 2));
      return;
    }

    printHelp();
    process.exitCode = 1;
  } finally {
    service.close();
  }
}

try {
  await main(process.argv.slice(2));
} catch (error) {
  process.exitCode = 1;
  console.error(error instanceof Error ? error.message : String(error));
}
