#!/usr/bin/env node --experimental-strip-types --experimental-sqlite

import { createDebugService } from './sqlite-store.ts';

function printHelp() {
  console.log(`linear-scheduler debug service

Usage:
  npm run debug -- health [--db <path|:memory:>]
  npm run debug -- runs list [--db <path|:memory:>]
  npm run debug -- events list --run <run-id> [--db <path|:memory:>]

Commands:
  health       Apply migrations and print DB health as JSON
  runs list    List scheduler runs as JSON
  events list  List one run timeline as JSON
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

function main(argv: string[]) {
  const command = argv[0] ?? 'help';
  if (command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  const dbPath = valueAfter(argv, '--db') ?? ':memory:';
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
  main(process.argv.slice(2));
} catch (error) {
  process.exitCode = 1;
  console.error(error instanceof Error ? error.message : String(error));
}
