import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, existsSync, linkSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const repoRoot = resolve(new URL('../..', import.meta.url).pathname);
const regressionRoot = join(repoRoot, '.cache', 'regression');

function tmpRoot(name: string) {
  mkdirSync(regressionRoot, { recursive: true });
  return mkdtempSync(join(regressionRoot, `legion-pi-matrix-${name}-`));
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

function packageRoot(base: string, name: string) {
  return join(base, 'node_modules', ...name.split('/'));
}

function createMatrixProfile(profile: string, probeExit = 0) {
  const config = readJson(join(repoRoot, 'legion-pi', 'legion-pi.json'));
  const runtime = exactSpec(config.packages.pi);
  const runtimeRoot = packageRoot(join(profile, 'runtime'), runtime.name);
  const runtimeDist = join(runtimeRoot, 'dist');
  mkdirSync(runtimeDist, { recursive: true });
  writeJson(join(runtimeRoot, 'package.json'), { ...runtime, type: 'module', main: './dist/index.js', bin: { pi: 'dist/cli.js' } });
  mkdirSync(join(runtimeDist, 'core'), { recursive: true });
  writeFileSync(join(runtimeDist, 'core', 'auth-storage.js'), "export class AuthStorage { static inMemory() { return { kind: 'in-memory' }; } }\n");
  writeFileSync(join(runtimeDist, 'index.js'), `
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const forbiddenEnvironment = ['OPENAI_API_KEY', 'DEEPSEEK_API_KEY', 'KIMI_API_KEY', 'SSH_AUTH_SOCK', 'KUBECONFIG', 'DOCKER_CONFIG', 'NPM_CONFIG_USERCONFIG', 'GNUPGHOME', 'GPG_AGENT_INFO', 'PGPASSFILE', 'CI_JOB_JWT', 'AZURE_CONFIG_DIR', 'NODE_OPTIONS'];
if (forbiddenEnvironment.some((name) => process.env[name])) throw new Error('matrix probe inherited credential environment');
function parseSpec(source) {
  const spec = source.slice(4);
  const separator = spec.lastIndexOf('@');
  return spec.slice(0, separator);
}
export class DefaultResourceLoader {
  constructor({ agentDir }) { this.agentDir = agentDir; this.loaded = { extensions: [], errors: [] }; }
  async reload() {
    const settings = JSON.parse(readFileSync(join(this.agentDir, 'settings.json'), 'utf-8'));
    this.loaded = {
      extensions: (settings.packages || []).map((source) => {
        const name = parseSpec(source);
        return { path: name === 'pi-lens'
          ? join(this.agentDir, 'npm', 'node_modules', 'pi-lens', 'dist', 'index.js')
          : join(this.agentDir, 'npm', 'node_modules', ...name.split('/'), 'index.ts') };
      }),
      errors: [],
    };
  }
  getExtensions() { return this.loaded; }
}
export const SessionManager = { inMemory() { return {}; } };
export class ModelRuntime {
  static async create(options) {
    if (options?.credentials?.kind !== 'in-memory' || options.modelsPath !== null || options.refreshOnCreate !== false) {
      throw new Error('matrix probe did not isolate model credentials');
    }
    return { credentialMode: 'in-memory' };
  }
}
export async function createAgentSession({ resourceLoader, modelRuntime }) {
  if (modelRuntime?.credentialMode !== 'in-memory') throw new Error('matrix probe omitted isolated model runtime');
  const tools = ['read', 'bash', 'edit', 'write'].map((name) => ({ name }));
  for (const extension of resourceLoader.getExtensions().extensions) {
    if (extension.path.includes('pi-subagents')) tools.push({ name: 'subagent' }, { name: 'subagent_wait' });
    if (extension.path.includes('pi-mcp-adapter')) tools.push({ name: 'mcpScript' }, { name: 'mcp' });
    if (extension.path.includes('pi-lens')) tools.push({ name: 'lens_diagnostics' });
  }
  return {
    session: {
      agent: { state: { tools } },
      dispose() { if (${probeExit}) process.exitCode = ${probeExit}; },
    },
  };
}
`);
  const cliPath = join(runtimeDist, 'cli.js');
  writeFileSync(cliPath, '#!/usr/bin/env node\n');
  chmodSync(cliPath, 0o755);
  const binDir = join(profile, 'runtime', 'node_modules', '.bin');
  mkdirSync(binDir, { recursive: true });
  symlinkSync(cliPath, join(binDir, 'pi'));

  const packageStore = join(profile, 'agent', 'npm');
  for (const source of config.packages.extensions) {
    const extension = exactSpec(source);
    const root = packageRoot(packageStore, extension.name);
    mkdirSync(root, { recursive: true });
    const entrypoint = extension.name === 'pi-lens' ? './dist/index.js' : './index.ts';
    writeJson(join(root, 'package.json'), { ...extension, type: 'module', pi: { extensions: [entrypoint] } });
    const entrypointPath = join(root, entrypoint);
    mkdirSync(resolve(entrypointPath, '..'), { recursive: true });
    writeFileSync(entrypointPath, 'export default {};\n');
  }
  writeJson(join(profile, '.legionmind', 'active-config.v1.json'), config);
  mkdirSync(join(profile, '.legionmind', 'npm-cache'), { recursive: true });
  return { config, runtimeRoot, packageStore };
}

function runMatrix(args: string[], env: NodeJS.ProcessEnv = {}) {
  return execFileSync(process.execPath, ['--experimental-strip-types', 'scripts/verify-pi-startup-matrix.ts', ...args], {
    cwd: repoRoot,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
  });
}

test('startup matrix binds evidence to exact installed package manifests and roots', () => {
  const root = tmpRoot('packages');
  try {
    const profile = join(root, 'profile');
    const output = join(root, 'matrix.md');
    const fixture = createMatrixProfile(profile);
    runMatrix(['--profile-dir', profile, '--output', output], {
      OPENAI_API_KEY: 'must-not-reach-matrix-probe',
      DEEPSEEK_API_KEY: 'must-not-reach-matrix-probe',
      KIMI_API_KEY: 'must-not-reach-matrix-probe',
      KUBECONFIG: '/must/not/reach/matrix-probe',
      DOCKER_CONFIG: '/must/not/reach/matrix-probe',
      CI_JOB_JWT: 'must-not-reach-matrix-probe',
      NODE_OPTIONS: '--no-warnings',
    });
    assert.equal((readFileSync(output, 'utf-8').match(/\| PASS \|/g) ?? []).length, 8);

    const runtimeManifest = join(fixture.runtimeRoot, 'package.json');
    writeJson(runtimeManifest, { ...readJson(runtimeManifest), version: '9.9.9' });
    assert.throws(() => runMatrix(['--profile-dir', profile, '--output', output]));
    writeJson(runtimeManifest, { ...readJson(runtimeManifest), version: exactSpec(fixture.config.packages.pi).version });

    const extension = exactSpec(fixture.config.packages.extensions[0]);
    const extensionRoot = packageRoot(fixture.packageStore, extension.name);
    writeJson(join(extensionRoot, 'package.json'), { ...extension, version: '9.9.9' });
    assert.throws(() => runMatrix(['--profile-dir', profile, '--output', output]));
    writeJson(join(extensionRoot, 'package.json'), extension);

    const redirectedRoot = join(root, 'redirected-extension');
    mkdirSync(redirectedRoot, { recursive: true });
    writeJson(join(redirectedRoot, 'package.json'), extension);
    writeFileSync(join(redirectedRoot, 'index.js'), 'export default {};\n');
    rmSync(extensionRoot, { recursive: true, force: true });
    symlinkSync(redirectedRoot, extensionRoot);
    assert.throws(() => runMatrix(['--profile-dir', profile, '--output', output]));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('startup matrix rejects option typos and symlinked destructive roots', () => {
  const root = tmpRoot('paths');
  try {
    assert.throws(() => runMatrix(['--profle-dir', join(root, 'unused')]));
    assert.throws(() => runMatrix(['--profile-dir']));

    const outsideProfile = join(root, 'outside-profile');
    createMatrixProfile(outsideProfile);
    const victim = join(outsideProfile, '.legionmind', 'startup-matrix', 'victim.txt');
    mkdirSync(resolve(victim, '..'), { recursive: true });
    writeFileSync(victim, 'keep\n');
    const linkedProfile = join(root, 'linked-profile');
    symlinkSync(outsideProfile, linkedProfile);
    assert.throws(() => runMatrix(['--profile-dir', linkedProfile]));
    assert.equal(readFileSync(victim, 'utf-8'), 'keep\n');

    const profile = join(root, 'profile');
    createMatrixProfile(profile);
    const outsideMatrix = join(root, 'outside-matrix');
    mkdirSync(outsideMatrix, { recursive: true });
    const matrixVictim = join(outsideMatrix, 'victim.txt');
    writeFileSync(matrixVictim, 'keep\n');
    symlinkSync(outsideMatrix, join(profile, '.legionmind', 'startup-matrix'));
    assert.throws(() => runMatrix(['--profile-dir', profile]));
    assert.equal(readFileSync(matrixVictim, 'utf-8'), 'keep\n');

    const overlapProfile = join(root, 'overlap-profile');
    const overlapFixture = createMatrixProfile(overlapProfile);
    const scratchRoot = join(overlapProfile, '.legionmind', 'startup-matrix');
    const configPath = join(scratchRoot, 'legion-pi.json');
    const outputPath = join(scratchRoot, 'report.md');
    writeJson(configPath, overlapFixture.config);
    writeFileSync(outputPath, 'keep-output\n');
    assert.throws(() => runMatrix([
      '--profile-dir', overlapProfile,
      '--config', configPath,
      '--output', outputPath,
    ]));
    assert.equal(existsSync(configPath), true);
    assert.equal(readFileSync(outputPath, 'utf-8'), 'keep-output\n');

    const identityProfile = join(root, 'identity-profile');
    const identityFixture = createMatrixProfile(identityProfile);
    const identityConfig = join(root, 'identity-config.json');
    const identityOutput = join(root, 'identity-output.md');
    writeJson(identityConfig, identityFixture.config);
    linkSync(identityConfig, identityOutput);
    const identityBefore = readFileSync(identityConfig, 'utf-8');
    assert.throws(() => runMatrix([
      '--profile-dir', identityProfile,
      '--config', identityConfig,
      '--output', identityOutput,
    ]));
    assert.equal(readFileSync(identityConfig, 'utf-8'), identityBefore);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('startup matrix fails when a probe exits nonzero after a structured payload', () => {
  const root = tmpRoot('status');
  try {
    const profile = join(root, 'profile');
    const output = join(root, 'matrix.md');
    createMatrixProfile(profile, 7);
    assert.throws(() => runMatrix(['--profile-dir', profile, '--output', output]));
    assert.equal(existsSync(output), true);
    assert.equal((readFileSync(output, 'utf-8').match(/\| FAIL \|/g) ?? []).length, 8);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
