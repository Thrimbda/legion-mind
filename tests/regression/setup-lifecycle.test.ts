import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
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

function readJson(path: string) {
  return JSON.parse(readFileSync(path, 'utf-8'));
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
