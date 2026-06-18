#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { stripTypeScriptTypes } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const runtimeFiles = [
  ['scripts/lib/setup-core.ts', 'scripts/lib/setup-core.js'],
  ['scripts/setup-opencode.ts', 'scripts/setup-opencode.js'],
  ['scripts/setup-openclaw.ts', 'scripts/setup-openclaw.js'],
  ['scripts/lgmind.ts', 'scripts/lgmind.js'],
];

function toRuntimeJs(source, relativeSourcePath) {
  let output = stripTypeScriptTypes(source, { mode: 'strip' });
  output = output.replace(/^#!\/usr\/bin\/env node --experimental-strip-types\n/, '#!/usr/bin/env node\n');

  if (relativeSourcePath === 'scripts/setup-opencode.ts' || relativeSourcePath === 'scripts/setup-openclaw.ts') {
    output = output.replace("from './lib/setup-core.ts';", "from './lib/setup-core.js';");
  }
  if (relativeSourcePath === 'scripts/lgmind.ts') {
    output = output
      .replace("opencode: 'setup-opencode.ts'", "opencode: 'setup-opencode.js'")
      .replace("openclaw: 'setup-openclaw.ts'", "openclaw: 'setup-openclaw.js'")
      .replace("['--experimental-strip-types', scriptPath, command, ...args]", "[scriptPath, command, ...args]");
  }

  return `${output.split('\n').map((line) => line.trimEnd()).join('\n').trimEnd()}\n`;
}

for (const [relativeSourcePath, relativeTargetPath] of runtimeFiles) {
  const sourcePath = join(root, relativeSourcePath);
  const targetPath = join(root, relativeTargetPath);
  const source = readFileSync(sourcePath, 'utf-8');
  const output = toRuntimeJs(source, relativeSourcePath);
  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, output);
}
