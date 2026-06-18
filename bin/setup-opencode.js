#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const scriptPath = resolve(__dirname, '..', 'scripts', 'setup-opencode.js');

const result = spawnSync(
  process.execPath,
  [scriptPath, ...process.argv.slice(2)],
  { stdio: 'inherit' },
);

if (result.error) {
  console.error(`Failed to start setup-opencode: ${result.error.message}`);
  process.exit(1);
}

if (typeof result.status === 'number') {
  process.exit(result.status);
}

if (result.signal) {
  console.error(`setup-opencode exited after signal ${result.signal}`);
}
process.exit(1);
