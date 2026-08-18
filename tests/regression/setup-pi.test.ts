import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const repoRoot = resolve(new URL('../..', import.meta.url).pathname);
const regressionRoot = join(repoRoot, '.cache', 'regression');

function tmpRoot(name: string) {
  mkdirSync(regressionRoot, { recursive: true });
  return mkdtempSync(join(regressionRoot, `legion-pi-${name}-`));
}

function writeJson(path: string, value: unknown) {
  mkdirSync(resolve(path, '..'), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(path: string) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function exactSpec(spec: string) {
  const separator = spec.lastIndexOf('@');
  return { name: spec.slice(0, separator), version: spec.slice(separator + 1) };
}

function createFakePackageCommands(root: string) {
  const fakeNpm = join(root, 'fake-npm.mjs');
  const fakePi = join(root, 'fake-pi.mjs');
  const fakeRuntime = join(root, 'fake-runtime.js');
  writeFileSync(fakeNpm, `#!/usr/bin/env node
import { chmodSync, copyFileSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const args = process.argv.slice(2);
const prefixIndex = args.indexOf('--prefix');
const prefix = args[prefixIndex + 1];
const spec = args.at(-1);
const separator = spec.lastIndexOf('@');
const name = spec.slice(0, separator);
const version = spec.slice(separator + 1);
const packageDir = join(prefix, 'node_modules', ...name.split('/'));
mkdirSync(packageDir, { recursive: true });
writeFileSync(join(packageDir, 'package.json'), JSON.stringify({ name, version, type: 'module', main: './dist/index.js', bin: { pi: 'dist/cli.js' } }, null, 2) + '\\n');
if (process.env.LEGION_PI_FAKE_NO_RUNTIME !== '1') {
  const distDir = join(packageDir, 'dist');
  mkdirSync(distDir, { recursive: true });
  copyFileSync(process.env.LEGION_PI_FAKE_RUNTIME_SOURCE, join(distDir, 'index.js'));
  copyFileSync(process.env.LEGION_PI_FAKE_PI_SOURCE, join(distDir, 'cli.js'));
  chmodSync(join(distDir, 'cli.js'), 0o755);
}
const binDir = join(prefix, 'node_modules', '.bin');
const piBin = join(binDir, 'pi');
mkdirSync(binDir, { recursive: true });
rmSync(piBin, { force: true });
symlinkSync(join(packageDir, 'dist', 'cli.js'), piBin);
`);
  writeFileSync(fakePi, `#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const [command, source] = process.argv.slice(2);
if (command !== 'install' || !source?.startsWith('npm:')) process.exit(2);
const spec = source.slice(4);
const separator = spec.lastIndexOf('@');
const name = spec.slice(0, separator);
const version = spec.slice(separator + 1);
const packageDir = join(process.env.PI_CODING_AGENT_DIR, 'npm', 'node_modules', ...name.split('/'));
mkdirSync(packageDir, { recursive: true });
const entrypoint = name === 'pi-lens' ? './dist/index.js' : './index.ts';
writeFileSync(join(packageDir, 'package.json'), JSON.stringify({ name, version, type: 'module', pi: { extensions: [entrypoint] } }, null, 2) + '\\n');
const entrypointPath = join(packageDir, entrypoint);
mkdirSync(join(entrypointPath, '..'), { recursive: true });
writeFileSync(entrypointPath, 'export default {};\\n');
`);
  writeFileSync(fakeRuntime, `
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const forbiddenEnvironment = ['OPENAI_API_KEY', 'SSH_AUTH_SOCK', 'KUBECONFIG', 'DOCKER_CONFIG', 'NPM_CONFIG_USERCONFIG', 'GNUPGHOME', 'GPG_AGENT_INFO', 'PGPASSFILE', 'CI_JOB_JWT', 'AZURE_CONFIG_DIR', 'NODE_OPTIONS'];
if (forbiddenEnvironment.some((name) => process.env[name])) throw new Error('startup probe inherited credential environment');
function packageName(source) {
  const spec = source.slice(4);
  return spec.slice(0, spec.lastIndexOf('@'));
}
export class DefaultResourceLoader {
  constructor({ agentDir }) { this.agentDir = agentDir; this.loaded = { extensions: [], errors: [] }; }
  async reload() {
    const settings = JSON.parse(readFileSync(join(this.agentDir, 'settings.json'), 'utf-8'));
    this.loaded = {
      extensions: (settings.packages || []).map((source) => ({
        path: packageName(source) === 'pi-lens'
          ? join(this.agentDir, 'npm', 'node_modules', 'pi-lens', 'dist', 'index.js')
          : join(this.agentDir, 'npm', 'node_modules', ...packageName(source).split('/'), 'index.ts'),
      })),
      errors: [],
    };
  }
  getExtensions() { return this.loaded; }
}
export const SessionManager = { inMemory() { return {}; } };
export async function createAgentSession({ resourceLoader }) {
  const tools = ['read', 'bash', 'edit', 'write'].map((name) => ({ name }));
  for (const extension of resourceLoader.getExtensions().extensions) {
    if (extension.path.includes('pi-subagents')) tools.push({ name: 'subagent' }, { name: 'subagent_wait' });
    if (extension.path.includes('pi-mcp-adapter')) tools.push({ name: 'mcpScript' }, { name: 'mcp' });
    if (extension.path.includes('pi-lens')) tools.push({ name: 'lens_diagnostics' });
  }
  return { session: { agent: { state: { tools } }, dispose() {} } };
}
`);
  chmodSync(fakeNpm, 0o755);
  chmodSync(fakePi, 0o755);
  return { fakeNpm, fakePi, fakeRuntime };
}

function setupPi(args: string[], env: NodeJS.ProcessEnv) {
  return execFileSync(process.execPath, ['--experimental-strip-types', 'scripts/setup-pi.ts', ...args], {
    cwd: repoRoot,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
  });
}

test('Legion Pi config pins the required package set exactly', () => {
  const config = readJson(join(repoRoot, 'legion-pi', 'legion-pi.json'));
  assert.equal(config.schemaVersion, 1);
  assert.match(config.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.deepEqual(exactSpec(config.packages.pi), {
    name: '@earendil-works/pi-coding-agent',
    version: '0.84.2',
  });
  assert.deepEqual(config.packages.extensions.map((spec: string) => exactSpec(spec).name), [
    'pi-subagents',
    'pi-mcp-adapter',
    'pi-lens',
  ]);
  assert.equal(Object.hasOwn(config, 'defaultProvider'), false);
  assert.equal(Object.hasOwn(config, 'defaultModel'), false);
  assert.equal(Object.hasOwn(config, 'tools'), false);
});

test('setup-pi lifecycle works from one config in an isolated profile', () => {
  const root = tmpRoot('lifecycle');
  try {
    const profile = join(root, 'profile');
    const { fakeNpm, fakePi, fakeRuntime } = createFakePackageCommands(root);
    const env = {
      LEGION_PI_NPM_BIN: fakeNpm,
      LEGION_PI_FAKE_PI_SOURCE: fakePi,
      LEGION_PI_FAKE_RUNTIME_SOURCE: fakeRuntime,
      OPENAI_API_KEY: 'must-not-reach-startup-probe',
      KUBECONFIG: '/must/not/reach/startup-probe',
      DOCKER_CONFIG: '/must/not/reach/startup-probe',
      CI_JOB_JWT: 'must-not-reach-startup-probe',
      NODE_OPTIONS: '--no-warnings',
    };

    assert.match(setupPi(['install', '--profile-dir', profile], env), /OK_INSTALL/);
    assert.match(setupPi(['verify', '--profile-dir', profile], env), /READY/);

    const source = readJson(join(repoRoot, 'legion-pi', 'legion-pi.json'));
    assert.deepEqual(readJson(join(profile, 'agent', 'settings.json')), {
      packages: source.packages.extensions.map((spec: string) => `npm:${spec}`),
      skills: source.skills,
    });
    assert.deepEqual(readJson(join(profile, 'agent', 'extensions', 'subagent', 'config.json')), {
      asyncByDefault: false,
      maxSubagentDepth: 1,
      maxSubagentSpawnsPerSession: 4,
      maxSubagentSpawnsPerRun: 2,
      maxActiveAsyncRunsPerSession: 1,
      scheduledRuns: { enabled: false },
      missions: { enabled: false, globalIndex: false },
      authorityPolicy: {
        discardWorktree: 'confirm',
        destructiveCleanup: 'confirm',
        spawnBudgetGrant: 'confirm',
        scheduleCreate: 'forbid',
      },
    });
    assert.equal(Object.keys(readJson(join(profile, '.legionmind', 'managed-files.v1.json')).files).length, 3);

    const explicitStateConfig = join(profile, '.legionmind', 'install-state.v1.json');
    writeJson(explicitStateConfig, source);
    const explicitStateBefore = readFileSync(explicitStateConfig, 'utf-8');
    assert.throws(() => setupPi(['verify', '--profile-dir', profile, '--config', explicitStateConfig], env));
    assert.equal(readFileSync(explicitStateConfig, 'utf-8'), explicitStateBefore);

    const settingsPath = join(profile, 'agent', 'settings.json');
    const drifted = { ...readJson(settingsPath), userSetting: true };
    writeJson(settingsPath, drifted);
    assert.throws(() => setupPi(['install', '--profile-dir', profile], env));
    assert.deepEqual(readJson(settingsPath), drifted);

    assert.match(setupPi(['install', '--force', '--profile-dir', profile], env), /OK_INSTALL/);
    assert.equal(readJson(settingsPath).userSetting, undefined);
    const afterBackup = { ...readJson(settingsPath), afterBackup: true };
    writeJson(settingsPath, afterBackup);
    const backupCount = readJson(join(profile, '.legionmind', 'backup-index.v1.json')).backups.length;
    assert.throws(() => setupPi(['rollback', '--profile-dir', profile], env));
    assert.deepEqual(readJson(settingsPath), afterBackup);
    assert.equal(readJson(join(profile, '.legionmind', 'backup-index.v1.json')).backups.length, backupCount);

    assert.match(setupPi(['rollback', '--force', '--profile-dir', profile], env), /OK_ROLLBACK/);
    assert.deepEqual(readJson(settingsPath), drifted);
    const safetyIndex = readJson(join(profile, '.legionmind', 'backup-index.v1.json'));
    const safetyEntry = safetyIndex.backups.at(-1).entries.find((entry: { targetPath: string }) => entry.targetPath === settingsPath);
    assert.equal(safetyEntry.reason, 'rollback-force-current-drift');
    assert.deepEqual(readJson(safetyEntry.backupPath), afterBackup);

    const activeConfigPath = join(profile, '.legionmind', 'active-config.v1.json');
    const invalidActiveConfig = '{"userContent":true}\n';
    writeFileSync(activeConfigPath, invalidActiveConfig);
    assert.match(setupPi(['install', '--force', '--profile-dir', profile], env), /OK_INSTALL/);
    assert.throws(() => setupPi(['rollback', '--profile-dir', profile], env));
    assert.equal(readFileSync(activeConfigPath, 'utf-8'), invalidActiveConfig);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('setup-pi rejects package files that resolve outside the profile', () => {
  const root = tmpRoot('package-containment');
  try {
    const profile = join(root, 'profile');
    const { fakeNpm, fakePi, fakeRuntime } = createFakePackageCommands(root);
    const env = {
      LEGION_PI_NPM_BIN: fakeNpm,
      LEGION_PI_FAKE_PI_SOURCE: fakePi,
      LEGION_PI_FAKE_RUNTIME_SOURCE: fakeRuntime,
    };
    setupPi(['install', '--profile-dir', profile], env);

    const runtimeRoot = join(profile, 'runtime', 'node_modules', '@earendil-works', 'pi-coding-agent');
    const runtimeEntrypoint = join(runtimeRoot, 'dist', 'index.js');
    const outsideRuntime = join(root, 'outside-runtime.js');
    renameSync(runtimeEntrypoint, outsideRuntime);
    symlinkSync(outsideRuntime, runtimeEntrypoint);
    const runtimeBefore = readFileSync(outsideRuntime, 'utf-8');
    assert.throws(() => setupPi(['install', '--profile-dir', profile], env));
    assert.throws(() => setupPi(['verify', '--profile-dir', profile], env));
    assert.equal(readFileSync(outsideRuntime, 'utf-8'), runtimeBefore);
    rmSync(runtimeEntrypoint, { force: true });
    renameSync(outsideRuntime, runtimeEntrypoint);

    const piBinary = join(profile, 'runtime', 'node_modules', '.bin', 'pi');
    rmSync(piBinary, { force: true });
    symlinkSync(fakePi, piBinary);
    assert.throws(() => setupPi(['install', '--profile-dir', profile], env));
    assert.throws(() => setupPi(['verify', '--profile-dir', profile], env));
    rmSync(piBinary, { force: true });
    symlinkSync(join(runtimeRoot, 'dist', 'cli.js'), piBinary);

    const extensionEntrypoint = join(profile, 'agent', 'npm', 'node_modules', 'pi-subagents', 'index.ts');
    const outsideExtension = join(root, 'outside-extension.ts');
    renameSync(extensionEntrypoint, outsideExtension);
    symlinkSync(outsideExtension, extensionEntrypoint);
    const extensionBefore = readFileSync(outsideExtension, 'utf-8');
    assert.throws(() => setupPi(['install', '--profile-dir', profile], env));
    assert.throws(() => setupPi(['verify', '--profile-dir', profile], env));
    assert.equal(readFileSync(outsideExtension, 'utf-8'), extensionBefore);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('setup-pi rollback keeps incomplete backup batches', () => {
  const root = tmpRoot('rollback-preflight');
  try {
    const profile = join(root, 'profile');
    const { fakeNpm, fakePi, fakeRuntime } = createFakePackageCommands(root);
    const env = {
      LEGION_PI_NPM_BIN: fakeNpm,
      LEGION_PI_FAKE_PI_SOURCE: fakePi,
      LEGION_PI_FAKE_RUNTIME_SOURCE: fakeRuntime,
    };
    setupPi(['install', '--profile-dir', profile], env);
    const settingsPath = join(profile, 'agent', 'settings.json');
    writeJson(settingsPath, { ...readJson(settingsPath), userSetting: true });
    setupPi(['install', '--force', '--profile-dir', profile], env);

    const indexPath = join(profile, '.legionmind', 'backup-index.v1.json');
    const before = readJson(indexPath);
    const batch = before.backups.at(-1);
    rmSync(batch.entries[0].backupPath, { recursive: true, force: true });
    assert.throws(() => setupPi(['rollback', '--profile-dir', profile], env));
    const after = readJson(indexPath);
    assert.equal(after.backups.some((item: { backupId: string }) => item.backupId === batch.backupId), true);
    assert.equal(readJson(settingsPath).userSetting, undefined);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('setup-pi state writes do not follow predictable temporary symlinks', () => {
  const root = tmpRoot('atomic-writes');
  try {
    const profile = join(root, 'profile');
    const stateDir = join(profile, '.legionmind');
    const generatedDir = join(stateDir, 'generated');
    const outsideDir = join(root, 'outside');
    mkdirSync(generatedDir, { recursive: true });
    mkdirSync(outsideDir, { recursive: true });
    const temporaryPaths = [
      join(generatedDir, 'active-config.v1.json.tmp'),
      join(generatedDir, 'settings.json.tmp'),
      join(generatedDir, 'subagent-config.json.tmp'),
      join(stateDir, 'managed-files.v1.json.tmp'),
      join(stateDir, 'backup-index.v1.json.tmp'),
      join(stateDir, 'install-state.v1.json.tmp'),
    ];
    const sentinels = temporaryPaths.map((temporaryPath, index) => {
      const outsidePath = join(outsideDir, `sentinel-${index}.json`);
      writeFileSync(outsidePath, `keep-${index}\n`);
      symlinkSync(outsidePath, temporaryPath);
      return { temporaryPath, outsidePath, content: `keep-${index}\n` };
    });
    const { fakeNpm, fakePi, fakeRuntime } = createFakePackageCommands(root);
    assert.match(setupPi(['install', '--profile-dir', profile], {
      LEGION_PI_NPM_BIN: fakeNpm,
      LEGION_PI_FAKE_PI_SOURCE: fakePi,
      LEGION_PI_FAKE_RUNTIME_SOURCE: fakeRuntime,
    }), /OK_INSTALL/);
    for (const sentinel of sentinels) {
      assert.equal(readFileSync(sentinel.outsidePath, 'utf-8'), sentinel.content);
      assert.equal(lstatSync(sentinel.temporaryPath).isSymbolicLink(), true);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('setup-pi cannot skip startup verification through its environment', () => {
  const root = tmpRoot('probe-required');
  try {
    const profile = join(root, 'profile');
    const { fakeNpm, fakePi, fakeRuntime } = createFakePackageCommands(root);
    const env = {
      LEGION_PI_NPM_BIN: fakeNpm,
      LEGION_PI_FAKE_PI_SOURCE: fakePi,
      LEGION_PI_FAKE_RUNTIME_SOURCE: fakeRuntime,
      LEGION_PI_FAKE_NO_RUNTIME: '1',
      LEGION_PI_SKIP_STARTUP_PROBE: '1',
    };
    assert.throws(() => setupPi(['install', '--profile-dir', profile], env));
    assert.equal(existsSync(join(profile, 'runtime', 'node_modules', '@earendil-works', 'pi-coding-agent', 'dist', 'index.js')), false);
    assert.throws(() => setupPi(['verify', '--profile-dir', profile], env));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('setup-pi rejects extra config surfaces and floating versions', () => {
  const root = tmpRoot('config-validation');
  try {
    const { fakeNpm, fakePi, fakeRuntime } = createFakePackageCommands(root);
    const env = {
      LEGION_PI_NPM_BIN: fakeNpm,
      LEGION_PI_FAKE_PI_SOURCE: fakePi,
      LEGION_PI_FAKE_RUNTIME_SOURCE: fakeRuntime,
    };
    const base = readJson(join(repoRoot, 'legion-pi', 'legion-pi.json'));
    const expanded = join(root, 'expanded.json');
    writeJson(expanded, { ...base, defaultProvider: 'example' });
    assert.throws(() => setupPi(['install', '--profile-dir', join(root, 'expanded-profile'), '--config', expanded], env));

    const floating = join(root, 'floating.json');
    writeJson(floating, {
      ...base,
      packages: { ...base.packages, extensions: [...base.packages.extensions.slice(0, 2), 'pi-lens@latest'] },
    });
    assert.throws(() => setupPi(['install', '--profile-dir', join(root, 'floating-profile'), '--config', floating], env));

    const duplicate = join(root, 'duplicate.json');
    writeJson(duplicate, {
      ...base,
      packages: { ...base.packages, extensions: [...base.packages.extensions, base.packages.extensions[2]] },
    });
    assert.throws(() => setupPi(['install', '--profile-dir', join(root, 'duplicate-profile'), '--config', duplicate], env));
    assert.throws(() => setupPi(['install', '--profle-dir', join(root, 'typo-profile')], env));
    assert.throws(() => setupPi(['install', '--profile-dir', join(root, 'one'), '--profile-dir', join(root, 'two')], env));
    assert.throws(() => setupPi(['verify', '--force', '--profile-dir', join(root, 'unused')], env));
    assert.throws(() => setupPi(['install', '--to', 'backup-id', '--profile-dir', join(root, 'unused')], env));

    const overlapProfile = join(root, 'overlap-profile');
    const overlapConfig = join(overlapProfile, '.legionmind', 'generated', 'settings.json');
    writeJson(overlapConfig, base);
    const overlapBefore = readFileSync(overlapConfig, 'utf-8');
    assert.throws(() => setupPi(['install', '--force', '--profile-dir', overlapProfile, '--config', overlapConfig], env));
    assert.equal(readFileSync(overlapConfig, 'utf-8'), overlapBefore);

    const symlinkProfile = join(root, 'symlink-overlap-profile');
    const externalConfig = join(root, 'external-config.json');
    const linkedConfig = join(symlinkProfile, '.legionmind', 'generated', 'settings.json');
    writeJson(externalConfig, base);
    mkdirSync(resolve(linkedConfig, '..'), { recursive: true });
    symlinkSync(externalConfig, linkedConfig);
    assert.throws(() => setupPi(['install', '--force', '--profile-dir', symlinkProfile, '--config', linkedConfig], env));
    assert.equal(lstatSync(linkedConfig).isSymbolicLink(), true);
    assert.deepEqual(readJson(externalConfig), base);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('setup-pi rejects symlinked profile-owned directories before writing through them', () => {
  const root = tmpRoot('symlink-safety');
  try {
    const profile = join(root, 'profile');
    const outside = join(root, 'outside');
    mkdirSync(profile, { recursive: true });
    mkdirSync(outside, { recursive: true });
    symlinkSync(outside, join(profile, 'agent'));
    assert.throws(() => setupPi(['install', '--profile-dir', profile], {}));
    assert.equal(existsSync(join(outside, 'settings.json')), false);

    const danglingProfile = join(root, 'dangling-profile');
    const danglingTarget = join(outside, 'dangling-settings.json');
    const settingsPath = join(danglingProfile, 'agent', 'settings.json');
    mkdirSync(join(danglingProfile, 'agent'), { recursive: true });
    symlinkSync(danglingTarget, settingsPath);
    assert.throws(() => setupPi(['install', '--profile-dir', danglingProfile], {}));
    assert.equal(existsSync(danglingTarget), false);
    assert.equal(lstatSync(settingsPath).isSymbolicLink(), true);

    const parentLink = join(root, 'linked-parent');
    symlinkSync(outside, parentLink);
    assert.throws(() => setupPi(['install', '--profile-dir', join(parentLink, 'escaped-profile')], {}));
    assert.equal(existsSync(join(outside, 'escaped-profile')), false);

    const probeProfile = join(root, 'probe-profile');
    const outsideProbe = join(outside, 'startup-probe');
    mkdirSync(join(probeProfile, '.legionmind'), { recursive: true });
    mkdirSync(outsideProbe, { recursive: true });
    symlinkSync(outsideProbe, join(probeProfile, '.legionmind', 'startup-probe'));
    assert.throws(() => setupPi(['install', '--profile-dir', probeProfile], {}));
    assert.equal(existsSync(join(outsideProbe, 'home')), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
