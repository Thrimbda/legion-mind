import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const repoRoot = resolve(new URL('../..', import.meta.url).pathname);
const regressionCacheRoot = join(repoRoot, '.cache', 'regression');

function tmpRoot(name: string) {
  mkdirSync(regressionCacheRoot, { recursive: true });
  return mkdtempSync(join(regressionCacheRoot, `legion-${name}-`));
}

function nodeScript(script: string, args: string[]) {
  return execFileSync(process.execPath, [script, ...args], {
    cwd: repoRoot,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function setupOpencodeBin(args: string[]) {
  return execFileSync(process.execPath, ['bin/setup-opencode.js', ...args], {
    cwd: repoRoot,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function lgmindBin(args: string[], options: { cwd?: string; input?: string } = {}) {
  return execFileSync(process.execPath, [join(repoRoot, 'bin', 'lgmind.js'), ...args], {
    cwd: options.cwd ?? repoRoot,
    encoding: 'utf-8',
    input: options.input,
    stdio: [options.input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'],
  });
}

function npmPackDryRun() {
  const npmCache = join(repoRoot, '.cache', 'npm');
  mkdirSync(npmCache, { recursive: true });
  return JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: repoRoot,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      npm_config_cache: npmCache,
      npm_config_loglevel: 'silent',
      npm_config_update_notifier: 'false',
    },
  }));
}

function copyDryRunPackage(packageRoot: string) {
  const [pack] = npmPackDryRun();
  for (const file of pack.files as Array<{ path: string }>) {
    const source = join(repoRoot, file.path);
    const target = join(packageRoot, file.path);
    mkdirSync(resolve(target, '..'), { recursive: true });
    cpSync(source, target, { recursive: true });
  }
}

function installedPackageBin(packageRoot: string, binName: 'lgmind' | 'setup-opencode', args: string[], options: { cwd?: string; input?: string } = {}) {
  return execFileSync(process.execPath, [join(packageRoot, 'bin', `${binName}.js`), ...args], {
    cwd: options.cwd ?? packageRoot,
    encoding: 'utf-8',
    input: options.input,
    stdio: [options.input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'],
  });
}

function readJson(path: string) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function writeJson(path: string, value: unknown) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

test('OpenCode setup lifecycle works in isolated directories', () => {
  const root = tmpRoot('opencode');
  try {
    const configDir = join(root, 'config');
    const homeDir = join(root, 'home');
    const common = ['--config-dir', configDir, '--opencode-home', homeDir];

    nodeScript('scripts/setup-opencode.ts', ['install', ...common]);
    assert.match(nodeScript('scripts/setup-opencode.ts', ['verify', '--strict', ...common]), /READY/);

    const target = join(configDir, 'agents', 'legion.md');
    writeFileSync(target, 'local unmanaged content\n');
    assert.throws(() => nodeScript('scripts/setup-opencode.ts', ['verify', '--strict', ...common]));

    nodeScript('scripts/setup-opencode.ts', ['install', '--force', ...common]);
    assert.match(nodeScript('scripts/setup-opencode.ts', ['verify', '--strict', ...common]), /READY/);

    nodeScript('scripts/setup-opencode.ts', ['rollback', ...common]);
    assert.equal(readFileSync(target, 'utf-8'), 'local unmanaged content\n');

    nodeScript('scripts/setup-opencode.ts', ['install', '--force', ...common]);
    nodeScript('scripts/setup-opencode.ts', ['uninstall', ...common]);
    assert.equal(existsSync(join(homeDir, 'skills', 'legion-workflow', 'SKILL.md')), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('lgmind npm bin exposes help and version', () => {
  const pkg = readJson(join(repoRoot, 'package.json'));

  assert.match(lgmindBin(['--help']), /Install scope:\n  --scope <project\|global>/);
  assert.match(lgmindBin(['help']), /npx lgmind@latest install --scope project/);
  assert.match(setupOpencodeBin(['--help']), /Use lgmind install --scope project\|global/);
  assert.equal(setupOpencodeBin(['--version']).trim(), pkg.version);
  assert.equal(lgmindBin(['--version']).trim(), pkg.version);
  assert.equal(setupOpencodeBin(['version']).trim(), pkg.version);
});

test('lgmind npm bin runs lifecycle in isolated directories', () => {
  const root = tmpRoot('opencode-bin');
  try {
    const configDir = join(root, 'config');
    const homeDir = join(root, 'home');
    const common = ['--config-dir', configDir, '--opencode-home', homeDir];

    lgmindBin(['setup', '--agent', 'opencode', ...common]);
    assert.match(lgmindBin(['verify', '--agent', 'opencode', '--strict', ...common]), /READY opencode/);
    lgmindBin(['uninstall', '--agent', 'opencode', ...common]);
    assert.equal(existsSync(join(homeDir, 'skills', 'legion-workflow', 'SKILL.md')), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('lgmind interactive install prompts for project scope only', () => {
  const root = tmpRoot('interactive-project');
  try {
    const output = lgmindBin(['install', '--interactive', '--dry-run', '--verbose'], {
      cwd: root,
      input: '1\n',
    });

    assert.doesNotMatch(output, /Choose an agent runtime to configure:/);
    assert.doesNotMatch(output, /OpenCode/);
    assert.doesNotMatch(output, /OpenClaw/);
    assert.match(output, /Choose an install scope:/);
    assert.match(output, /Install scope \[1\/project\]:/);
    assert.match(output, /OK_INSTALL opencode/);
    assert.match(output, new RegExp(escapeRegExp(join(root, '.legionmind', 'opencode', 'config', 'agents', 'legion.md'))));
    assert.match(output, new RegExp(escapeRegExp(join(root, '.legionmind', 'opencode', 'home', 'skills', 'legion-workflow', 'SKILL.md'))));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('lgmind project scope maps runtime installs to project-local roots', () => {
  const root = tmpRoot('scope-project');
  try {
    const opencodeOutput = lgmindBin(['install', '--agent', 'opencode', '--scope', 'project', '--dry-run', '--verbose'], { cwd: root });
    assert.match(opencodeOutput, /OK_INSTALL opencode/);
    assert.match(opencodeOutput, new RegExp(escapeRegExp(join(root, '.legionmind', 'opencode', 'config', 'agents', 'legion.md'))));

    const openclawOutput = lgmindBin(['install', '--agent', 'openclaw', '--scope', 'project', '--dry-run', '--verbose', '--no-extra-dir'], { cwd: root });
    assert.match(openclawOutput, /OK_INSTALL openclaw/);
    assert.match(openclawOutput, new RegExp(escapeRegExp(join(root, '.legionmind', 'openclaw', 'skills', 'legion-workflow', 'SKILL.md'))));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('lgmind selects OpenClaw runtime non-interactively', () => {
  const root = tmpRoot('lgmind-openclaw');
  try {
    const configDir = join(root, 'openclaw');
    const common = ['--agent', 'openclaw', '--config-dir', configDir, '--openclaw-home', configDir, '--no-extra-dir'];

    assert.match(lgmindBin(['setup', ...common]), /OK_INSTALL openclaw/);
    assert.match(lgmindBin(['verify', '--strict', ...common]), /READY openclaw/);
    lgmindBin(['uninstall', ...common]);
    assert.equal(existsSync(join(configDir, 'skills', 'legion-workflow', 'SKILL.md')), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('default text output is quiet and verbose/json keep details', () => {
  const root = tmpRoot('lgmind-quiet');
  try {
    const configDir = join(root, 'config');
    const homeDir = join(root, 'home');
    const common = ['--agent', 'opencode', '--config-dir', configDir, '--opencode-home', homeDir];

    const installOutput = lgmindBin(['setup', ...common]);
    assert.match(installOutput, /OK_INSTALL opencode/);
    assert.doesNotMatch(installOutput, /OK_SYNC/);

    const verboseOutput = lgmindBin(['verify', '--verbose', ...common]);
    assert.match(verboseOutput, /OK_VERIFY/);
    assert.match(verboseOutput, /READY opencode/);

    const jsonLines = lgmindBin(['verify', '--json', ...common]).trim().split('\n').map((line) => JSON.parse(line));
    assert.equal(jsonLines.some((line) => line.code === 'OK_VERIFY'), true);
    assert.equal(jsonLines.at(-1).code, 'READY');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('npm dry-run package includes CLI and install assets only', () => {
  const [pack] = npmPackDryRun();
  const pkg = readJson(join(repoRoot, 'package.json'));
  assert.equal(pack.name, 'lgmind');
  assert.equal(pkg.bin.lgmind, 'bin/lgmind.js');
  assert.equal(pkg.bin['setup-opencode'], 'bin/setup-opencode.js');
  assert.equal(pkg.publishConfig.access, 'public');

  const files = new Set(pack.files.map((file: { path: string }) => file.path));
  for (const expected of [
    'bin/lgmind.js',
    'bin/setup-opencode.js',
    'scripts/build-runtime-js.mjs',
    'scripts/lgmind.js',
    'scripts/setup-opencode.js',
    'scripts/setup-openclaw.js',
    'scripts/lib/setup-core.js',
    '.opencode/agents/legion.md',
    'skills/legion-workflow/SKILL.md',
    'README.md',
    'LICENSE',
    'package.json',
  ]) {
    assert.equal(files.has(expected), true, `${expected} should be included in npm package`);
  }

  for (const excludedRuntimeTs of [
    'scripts/lgmind.ts',
    'scripts/setup-opencode.ts',
    'scripts/setup-openclaw.ts',
    'scripts/lib/setup-core.ts',
  ]) {
    assert.equal(files.has(excludedRuntimeTs), false, `${excludedRuntimeTs} should not be used as npm runtime`);
  }

  for (const excludedPrefix of ['.legion/', '.worktrees/', 'tests/', '.cache/']) {
    assert.equal([...files].some((path) => path.startsWith(excludedPrefix)), false, `${excludedPrefix} should not be packaged`);
  }
});

test('packed npm package bins run from node_modules without TypeScript stripping', () => {
  const root = tmpRoot('packed-node-modules');
  try {
    const packageRoot = join(root, 'node_modules', 'lgmind');
    mkdirSync(packageRoot, { recursive: true });
    copyDryRunPackage(packageRoot);

    const pkg = readJson(join(packageRoot, 'package.json'));
    assert.equal(installedPackageBin(packageRoot, 'lgmind', ['--version']).trim(), pkg.version);
    assert.match(installedPackageBin(packageRoot, 'setup-opencode', ['--help']), /Use lgmind install --scope project\|global/);

    const opencodeRoot = join(root, 'opencode');
    assert.match(installedPackageBin(packageRoot, 'lgmind', [
      'install',
      '--dry-run',
      '--config-dir',
      join(opencodeRoot, 'config-default'),
      '--opencode-home',
      join(opencodeRoot, 'home-default'),
    ]), /OK_INSTALL opencode/);

    const projectOutput = installedPackageBin(packageRoot, 'lgmind', [
      'install',
      '--agent',
      'opencode',
      '--scope',
      'project',
      '--dry-run',
      '--verbose',
    ], { cwd: root });
    assert.match(projectOutput, /OK_INSTALL opencode/);
    assert.match(projectOutput, new RegExp(escapeRegExp(join(root, '.legionmind', 'opencode', 'config', 'agents', 'legion.md'))));

    assert.match(installedPackageBin(packageRoot, 'lgmind', [
      'setup',
      '--agent',
      'opencode',
      '--dry-run',
      '--config-dir',
      join(opencodeRoot, 'config'),
      '--opencode-home',
      join(opencodeRoot, 'home'),
    ]), /OK_INSTALL opencode/);

    const openclawRoot = join(root, 'openclaw');
    assert.match(installedPackageBin(packageRoot, 'lgmind', [
      'setup',
      '--agent',
      'openclaw',
      '--dry-run',
      '--config-dir',
      openclawRoot,
      '--openclaw-home',
      openclawRoot,
      '--no-extra-dir',
    ]), /OK_INSTALL openclaw/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('rollback --to selects requested backup batch', () => {
  const root = tmpRoot('rollback-to');
  try {
    const configDir = join(root, 'config');
    const homeDir = join(root, 'home');
    const common = ['--config-dir', configDir, '--opencode-home', homeDir];
    const target = join(configDir, 'agents', 'legion.md');

    nodeScript('scripts/setup-opencode.ts', ['install', ...common]);
    const original = readFileSync(target, 'utf-8');
    writeFileSync(target, 'first local version\n');
    nodeScript('scripts/setup-opencode.ts', ['install', '--force', ...common]);
    const firstBackupId = readJson(join(configDir, '.legionmind', 'backup-index.v1.json')).backups.at(-1).backupId;

    writeFileSync(target, 'second local version\n');
    nodeScript('scripts/setup-opencode.ts', ['install', '--force', ...common]);
    assert.notEqual(readJson(join(configDir, '.legionmind', 'backup-index.v1.json')).backups.at(-1).backupId, firstBackupId);

    nodeScript('scripts/setup-opencode.ts', ['rollback', '--to', firstBackupId, ...common]);
    assert.equal(readFileSync(target, 'utf-8'), 'first local version\n');
    assert.notEqual(readFileSync(target, 'utf-8'), original);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('uninstall safe-skips drift and force removes managed drift', () => {
  const root = tmpRoot('uninstall-drift');
  try {
    const configDir = join(root, 'config');
    const homeDir = join(root, 'home');
    const common = ['--config-dir', configDir, '--opencode-home', homeDir];
    const target = join(homeDir, 'skills', 'legion-workflow', 'SKILL.md');

    nodeScript('scripts/setup-opencode.ts', ['install', ...common]);
    writeFileSync(target, 'local drift\n');
    nodeScript('scripts/setup-opencode.ts', ['uninstall', ...common]);
    assert.equal(readFileSync(target, 'utf-8'), 'local drift\n');

    nodeScript('scripts/setup-opencode.ts', ['uninstall', '--force', ...common]);
    assert.equal(existsSync(target), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('tampered manifest and backup paths are rejected safely', () => {
  const root = tmpRoot('tamper');
  try {
    const configDir = join(root, 'config');
    const homeDir = join(root, 'home');
    const common = ['--config-dir', configDir, '--opencode-home', homeDir];
    const manifestPath = join(configDir, '.legionmind', 'managed-files.v1.json');
    const backupIndexPath = join(configDir, '.legionmind', 'backup-index.v1.json');
    const target = join(configDir, 'agents', 'legion.md');

    nodeScript('scripts/setup-opencode.ts', ['install', ...common]);
    const manifest = readJson(manifestPath);
    const originalFiles = manifest.files;
    manifest.files = { [join(configDir, 'agents')]: { ...Object.values(originalFiles)[0], targetPath: join(configDir, 'agents') } };
    writeJson(manifestPath, manifest);
    assert.throws(() => nodeScript('scripts/setup-opencode.ts', ['uninstall', '--force', ...common]));
    assert.equal(existsSync(join(configDir, 'agents')), true);

    writeFileSync(target, 'backup me\n');
    nodeScript('scripts/setup-opencode.ts', ['install', '--force', ...common]);
    const backupIndex = readJson(backupIndexPath);
    backupIndex.backups[0].entries[0].backupPath = join(root, 'outside-backup');
    writeJson(backupIndexPath, backupIndex);
    assert.throws(() => nodeScript('scripts/setup-opencode.ts', ['rollback', ...common]));
    assert.equal(existsSync(join(root, 'outside-backup')), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('symlinked managed root destructive operations are refused', () => {
  const root = tmpRoot('symlink-root');
  try {
    const configDir = join(root, 'config');
    const homeDir = join(root, 'home');
    const outside = join(root, 'outside-skills');
    mkdirSync(homeDir, { recursive: true });
    mkdirSync(outside, { recursive: true });
    symlinkSync(outside, join(homeDir, 'skills'));
    const common = ['--config-dir', configDir, '--openclaw-home', homeDir, '--no-extra-dir'];
    const target = join(homeDir, 'skills', 'legion-workflow', 'SKILL.md');
    mkdirSync(join(outside, 'legion-workflow'), { recursive: true });
    writeFileSync(target, 'outside target through symlink\n');
    mkdirSync(join(homeDir, '.legionmind'), { recursive: true });
    writeJson(join(homeDir, '.legionmind', 'managed-files.v1.json'), {
      version: 1,
      updatedAt: new Date().toISOString(),
      files: {
        [target]: {
          targetPath: target,
          sourcePath: join(repoRoot, 'skills', 'legion-workflow', 'SKILL.md'),
          checksum: 'tampered-checksum',
          installedAt: new Date().toISOString(),
          lastAction: 'install',
        },
      },
    });

    assert.equal(existsSync(target), true);
    assert.throws(() => nodeScript('scripts/setup-openclaw.ts', ['uninstall', '--force', ...common]));
    assert.equal(existsSync(target), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('invalid backup-index schema blocks rollback', () => {
  const root = tmpRoot('invalid-backup-index');
  try {
    const configDir = join(root, 'config');
    const homeDir = join(root, 'home');
    const common = ['--config-dir', configDir, '--opencode-home', homeDir];

    nodeScript('scripts/setup-opencode.ts', ['install', ...common]);
    writeJson(join(configDir, '.legionmind', 'backup-index.v1.json'), { version: 1, updatedAt: new Date().toISOString(), backups: 'not-an-array' });
    assert.throws(() => nodeScript('scripts/setup-opencode.ts', ['rollback', ...common]));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('OpenClaw setup lifecycle matches managed manifest semantics without owning openclaw.json', () => {
  const root = tmpRoot('openclaw');
  try {
    const configDir = join(root, 'config');
    const homeDir = join(root, 'home');
    mkdirSync(configDir, { recursive: true });
    writeFileSync(join(configDir, 'openclaw.json'), `${JSON.stringify({ userSetting: true, skills: { load: { extraDirs: ['/keep/me'] } } }, null, 2)}\n`);
    const common = ['--config-dir', configDir, '--openclaw-home', homeDir];

    nodeScript('scripts/setup-openclaw.ts', ['install', ...common]);
    assert.match(nodeScript('scripts/setup-openclaw.ts', ['verify', '--strict', ...common]), /READY/);

    const config = JSON.parse(readFileSync(join(configDir, 'openclaw.json'), 'utf-8'));
    assert.equal(config.userSetting, true);
    assert.deepEqual(config.skills.load.extraDirs.includes('/keep/me'), true);
    assert.deepEqual(config.skills.load.extraDirs.includes(join(repoRoot, 'skills')), true);

    const target = join(homeDir, 'skills', 'legion-workflow', 'SKILL.md');
    writeFileSync(target, 'local unmanaged content\n');
    assert.throws(() => nodeScript('scripts/setup-openclaw.ts', ['verify', '--strict', ...common]));

    nodeScript('scripts/setup-openclaw.ts', ['install', '--force', ...common]);
    assert.match(nodeScript('scripts/setup-openclaw.ts', ['verify', '--strict', ...common]), /READY/);

    nodeScript('scripts/setup-openclaw.ts', ['rollback', ...common]);
    assert.equal(readFileSync(target, 'utf-8'), 'local unmanaged content\n');

    nodeScript('scripts/setup-openclaw.ts', ['install', '--force', '--no-extra-dir', ...common]);
    assert.match(nodeScript('scripts/setup-openclaw.ts', ['verify', '--strict', '--no-extra-dir', ...common]), /READY/);
    nodeScript('scripts/setup-openclaw.ts', ['uninstall', ...common]);
    assert.equal(existsSync(target), false);

    const after = JSON.parse(readFileSync(join(configDir, 'openclaw.json'), 'utf-8'));
    assert.equal(after.userSetting, true);
    assert.deepEqual(after.skills.load.extraDirs.includes('/keep/me'), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
