#!/usr/bin/env node --experimental-strip-types --experimental-sqlite

import { readFileSync } from 'node:fs';
import {
  cancelRun,
  inspectRun,
  listRuns as listAdminRuns,
  pauseProject,
  projectHealth,
  releaseLock,
  resumeProject,
  retryRun,
  scannerConfigWithProjectControls,
} from './admin.ts';
import { redactSecrets } from './observability.ts';
import {
  StaticPullRequestClient,
  createGitHubRestPullRequestClient,
  pullRequestSnapshotFromFixture,
  trackPrDelivery,
} from './pr-tracker.ts';
import { createDebugService, openSchedulerStore } from './sqlite-store.ts';
import { dispatchParallelWorkItems } from './dispatcher.ts';
import { fetchLinearProjectSnapshot, scanLinearProject } from './scanner.ts';
import { processOpenCodeWorkerDispatch } from './worker-runner.ts';
import type { DispatchConfig } from './dispatcher.ts';
import type { LinearProjectSnapshotInput, ScannerConfig } from './scanner.ts';

function printHelp() {
  console.log(`linear-scheduler debug service

Usage:
  npm run debug -- health [--db <path|:memory:>]
  npm run debug -- reconcile --project <linear-project-id> [--db <path|:memory:>] [--token-env LINEAR_API_KEY]
  npm run debug -- runs list [--db <path|:memory:>]
  npm run debug -- run inspect <run-id> [--db <path|:memory:>]
  npm run debug -- run retry <run-id> --reason <reason> [--db <path|:memory:>]
  npm run debug -- run cancel <run-id> --reason <reason> [--db <path|:memory:>]
  npm run debug -- locks list [--db <path|:memory:>]
  npm run debug -- locks release <lock-key> --run <run-id> --reason <reason> [--db <path|:memory:>]
  npm run debug -- project pause <project-id> --reason <reason> [--db <path|:memory:>]
  npm run debug -- project resume <project-id> --reason <reason> [--db <path|:memory:>]
  npm run debug -- project health <project-id> [--db <path|:memory:>]
  npm run debug -- events list --run <run-id> [--db <path|:memory:>]
  npm run debug -- scan project --project <linear-project-id> [--db <path|:memory:>] [--token-env LINEAR_API_KEY]
  npm run debug -- scan fixture --fixture <snapshot.json> [--db <path|:memory:>]
  npm run debug -- dispatch fixture --fixture <snapshot.json> [--db <path|:memory:>] [--global-concurrency <n>] [--per-project-concurrency <n>] [--per-repo-concurrency <n>]
  npm run debug -- worker dispatch --run <run-id> --attempt <attempt-id> --repo <repo-path> [--db <path|:memory:>] [--timeout-ms <ms>]
  npm run debug -- delivery track --run <run-id> --repo <repo-path> [--pr-url <url>] [--fixture <pr-snapshot.json>] [--db <path|:memory:>] [--token-env GITHUB_TOKEN]

Commands:
  health        Apply migrations and print DB health as JSON
  reconcile     Fetch/scan one Linear project and print ready/skipped report; respects durable pause/security controls
  runs list     List scheduler runs as JSON, optionally filtered by --project
  run inspect   Inspect run timeline, attempts, locks, outbox, native AgentSession and terminal reason
  run retry     Retry a non-terminal run; requires --reason and writes audit event
  run cancel    Cancel a non-terminal run; requires --reason, writes audit event and releases locks
  locks list    List scheduler resource locks
  locks release Release one held lock for a run; requires --reason and writes audit event
  project pause/resume  Persist project control state; pause blocks new workers but not active-run inspection
  project health Print project control, runs, locks, pending outbox and skipped/waiting evidence
  events list   List one run timeline as JSON
  scan project  Fetch a Linear project snapshot, persist work_item_snapshots, print dry-run ready/skipped report
  scan fixture  Load a repo-local fixture snapshot and print the same scanner report without Linear API access
  dispatch fixture  Plan and claim multiple ready fixture WIs under capacity/resource locks without launching workers
  worker dispatch  Launch one pending OpenCode worker dispatch outbox row; native startup outbox must already be sent
  delivery track  Observe one PR snapshot, update run delivery state, and enqueue idempotent Linear native writeback rows
`);
}

function printJson(value: unknown) {
  console.log(JSON.stringify(redactSecrets(value), null, 2));
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
  const parallelRepos = valueAfter(argv, '--parallel-repos');
  return {
    delegateAppUserId: valueAfter(argv, '--delegate'),
    schedulerRunUrlBase: valueAfter(argv, '--scheduler-run-url-base') ?? undefined,
    defaultRepoKey: valueAfter(argv, '--default-repo'),
    knownRepoKeys: knownRepos ? knownRepos.split(',').map((repo) => repo.trim()).filter(Boolean) : undefined,
    pausedProjectIds: valueAfter(argv, '--project-paused') ? [valueAfter(argv, '--project-paused') as string] : undefined,
    pausedRepoKeys: pausedRepo ? [pausedRepo] : undefined,
    parallelRepoKeys: parallelRepos ? parallelRepos.split(',').map((repo) => repo.trim()).filter(Boolean) : undefined,
  };
}

function optionalNumber(argv: string[], name: string): number | undefined {
  const value = valueAfter(argv, name);
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive number.`);
  }
  return parsed;
}

function positional(argv: string[], index: number, description: string): string {
  const value = argv[index];
  if (!value || value.startsWith('--')) {
    throw new Error(`Missing ${description}.`);
  }
  return value;
}

function dispatchConfig(argv: string[]): DispatchConfig {
  return {
    ...scannerConfig(argv),
    traceId: valueAfter(argv, '--trace-id') ?? undefined,
    lockTtlMs: optionalNumber(argv, '--lock-ttl-ms'),
    limits: {
      globalConcurrency: optionalNumber(argv, '--global-concurrency'),
      perProjectConcurrency: optionalNumber(argv, '--per-project-concurrency'),
      perRepoConcurrency: optionalNumber(argv, '--per-repo-concurrency'),
    },
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

    printJson(scanLinearProject(snapshot, { store, config: scannerConfigWithProjectControls(store, scannerConfig(argv)) }));
  } finally {
    store.close();
  }
}

async function runDispatch(argv: string[], dbPath: string) {
  const mode = argv[1];
  if (mode !== 'fixture') {
    throw new Error('dispatch requires mode `fixture`.');
  }
  const fixturePath = valueAfter(argv, '--fixture');
  if (!fixturePath) {
    throw new Error('dispatch fixture requires --fixture <snapshot.json>.');
  }
  const store = openSchedulerStore(dbPath);
  try {
    const snapshot = loadFixture(fixturePath);
    const outcome = dispatchParallelWorkItems(store, { project: snapshot, config: dispatchConfig(argv) });
    printJson(outcome);
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
    printJson(result);
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
    printJson(result);
  } finally {
    store.close();
  }
}

async function runReconcile(argv: string[], dbPath: string) {
  const store = openSchedulerStore(dbPath);
  try {
    const fixturePath = valueAfter(argv, '--fixture');
    let snapshot: LinearProjectSnapshotInput;
    if (fixturePath) {
      snapshot = loadFixture(fixturePath);
    } else {
      const projectId = valueAfter(argv, '--project');
      if (!projectId) {
        throw new Error('reconcile requires --project <linear-project-id> or --fixture <snapshot.json>.');
      }
      const tokenEnv = valueAfter(argv, '--token-env') ?? 'LINEAR_API_KEY';
      const apiKey = process.env[tokenEnv];
      if (!apiKey) {
        throw new Error(`reconcile requires ${tokenEnv} to contain a Linear API key.`);
      }
      snapshot = await fetchLinearProjectSnapshot({ apiKey, projectId, endpoint: valueAfter(argv, '--endpoint') ?? undefined });
    }
    printJson(scanLinearProject(snapshot, { store, config: scannerConfigWithProjectControls(store, scannerConfig(argv)) }));
  } finally {
    store.close();
  }
}

async function runAdminCommand(command: string, argv: string[], dbPath: string): Promise<boolean> {
  const store = openSchedulerStore(dbPath);
  try {
    if (command === 'runs' && argv[1] === 'list') {
      printJson(listAdminRuns(store, valueAfter(argv, '--project')));
      return true;
    }
    if (command === 'run' && argv[1] === 'inspect') {
      printJson(inspectRun(store, positional(argv, 2, 'run id')));
      return true;
    }
    if (command === 'run' && argv[1] === 'retry') {
      printJson(retryRun(store, { runId: positional(argv, 2, 'run id'), reason: valueAfter(argv, '--reason') ?? '', traceId: valueAfter(argv, '--trace-id') }));
      return true;
    }
    if (command === 'run' && argv[1] === 'cancel') {
      printJson(cancelRun(store, { runId: positional(argv, 2, 'run id'), reason: valueAfter(argv, '--reason') ?? '', traceId: valueAfter(argv, '--trace-id') }));
      return true;
    }
    if (command === 'locks' && argv[1] === 'list') {
      printJson(store.listResourceLocks());
      return true;
    }
    if (command === 'locks' && argv[1] === 'release') {
      const runId = valueAfter(argv, '--run');
      if (!runId) throw new Error('locks release requires --run <run-id>.');
      printJson(releaseLock(store, { lockKey: positional(argv, 2, 'lock key'), runId, reason: valueAfter(argv, '--reason') ?? '', traceId: valueAfter(argv, '--trace-id') }));
      return true;
    }
    if (command === 'project' && argv[1] === 'pause') {
      printJson(pauseProject(store, { projectId: positional(argv, 2, 'project id'), reason: valueAfter(argv, '--reason') ?? '', traceId: valueAfter(argv, '--trace-id') }));
      return true;
    }
    if (command === 'project' && argv[1] === 'resume') {
      printJson(resumeProject(store, { projectId: positional(argv, 2, 'project id'), reason: valueAfter(argv, '--reason') ?? '', traceId: valueAfter(argv, '--trace-id') }));
      return true;
    }
    if (command === 'project' && argv[1] === 'health') {
      printJson(projectHealth(store, positional(argv, 2, 'project id')));
      return true;
    }
    return false;
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
  if (command === 'reconcile') {
    await runReconcile(argv, dbPath);
    return;
  }
  if (command === 'dispatch') {
    await runDispatch(argv, dbPath);
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

  if (await runAdminCommand(command, argv, dbPath)) {
    return;
  }

  const service = createDebugService(dbPath);
  try {
    if (command === 'health') {
      printJson(service.health());
      return;
    }
    if (command === 'events' && argv[1] === 'list') {
      const runId = valueAfter(argv, '--run');
      if (!runId) {
        throw new Error('events list requires --run <run-id>.');
      }
      printJson(service.timeline(runId));
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
