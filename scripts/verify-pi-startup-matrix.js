#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import {
  lstatSync,
  mkdirSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertRealDirectoryPath,
  assertSafeLegionPiProfileRoot,
  credentialFreeEnvironment,
  defaultLegionPiProfileDir,

  jsonFingerprint,
  loadLegionPiConfig,
  PI_CORE_TOOLS,
  PI_EXTENSION_TOOL_SENTINELS,
  renderActiveConfig,
  renderRestrictedSubagentConfig,
  resolveLegionPiProfilePaths,
  validateInstalledLegionPiPackages,
} from './lib/pi-distro.js';






















const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = dirname(__dirname);
const VALUE_OPTIONS = new Set(['--profile-dir', '--config', '--output']);

function parseArgs(argv          )                {
  const values = new Map                ();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) throw new Error(`Unexpected positional argument: ${arg}`);
    const equals = arg.indexOf('=');
    const name = equals >= 0 ? arg.slice(0, equals) : arg;
    if (!VALUE_OPTIONS.has(name)) throw new Error(`Unsupported option: ${name}`);
    if (values.has(name)) throw new Error(`Duplicate option: ${name}`);
    const value = equals >= 0 ? arg.slice(equals + 1) : argv[++index];
    if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`);
    values.set(name, value);
  }
  return {
    profileDir: resolve(values.get('--profile-dir') ?? defaultLegionPiProfileDir()),
    configPath: values.has('--config') ? resolve(values.get('--config') ) : null,
    outputPath: values.has('--output') ? resolve(values.get('--output') ) : null,
  };
}

function parseProbe(stdout        )                      {
  const marker = stdout.split(/\r?\n/).find((line) => line.startsWith('LEGION_PI_PROBE='));
  if (!marker) return null;
  try {
    return JSON.parse(marker.slice('LEGION_PI_PROBE='.length))                ;
  } catch {
    return null;
  }
}

function isWithin(path        , root        ) {
  return path === root || path.startsWith(`${root}${sep}`);
}

function canonicalPotentialPath(path        , label        ) {
  const absolute = resolve(path);
  let cursor = absolute;
  const suffix           = [];
  while (true) {
    try {
      const stat = lstatSync(cursor);
      if (cursor === absolute && stat.isSymbolicLink()) throw new Error(`${label} must not be a symlink: ${absolute}`);
      return resolve(realpathSync(cursor), ...suffix);
    } catch (error) {
      if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error;
      const parent = dirname(cursor);
      if (parent === cursor) throw new Error(`Cannot resolve a safe parent for ${label}: ${absolute}`);
      suffix.unshift(basename(cursor));
      cursor = parent;
    }
  }
}

function assertScratchPathsDoNotOverlap(input




 ) {
  const matrixRoot = canonicalPotentialPath(input.matrixRoot, 'matrix scratch root');
  const configPath = canonicalPotentialPath(input.configPath, 'matrix config');
  if (isWithin(configPath, matrixRoot) || isWithin(matrixRoot, configPath)) {
    throw new Error(`Matrix config must not overlap scratch root: ${input.configPath}`);
  }
  if (!input.outputPath) return;
  const outputPath = canonicalPotentialPath(input.outputPath, 'matrix output');
  const profileDir = canonicalPotentialPath(input.profileDir, 'Legion Pi profile');
  if (isWithin(outputPath, profileDir)) {
    throw new Error(`Matrix output must be outside the Legion Pi profile: ${input.outputPath}`);
  }
  if (outputPath === configPath) {
    throw new Error(`Matrix output must not overwrite its config: ${input.outputPath}`);
  }
  try {
    const configIdentity = statSync(input.configPath);
    const outputIdentity = statSync(input.outputPath);
    if (configIdentity.dev === outputIdentity.dev && configIdentity.ino === outputIdentity.ino) {
      throw new Error(`Matrix output must not share file identity with its config: ${input.outputPath}`);
    }
  } catch (error) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error;
  }
}

function writeOutputAtomic(path        , content        ) {
  const parent = dirname(path);
  mkdirSync(parent, { recursive: true });
  const temporaryPath = join(parent, `.legion-pi-matrix-${process.pid}-${randomUUID()}.tmp`);
  try {
    writeFileSync(temporaryPath, content, { encoding: 'utf-8', flag: 'wx', mode: 0o600 });
    renameSync(temporaryPath, path);
  } finally {
    rmSync(temporaryPath, { recursive: true, force: true });
  }
}

function assertFileWithin(path        , root        , label        , allowFinalSymlink         ) {
  let entryStat                              ;
  try {
    entryStat = lstatSync(path);
  } catch {
    throw new Error(`${label} is missing: ${path}`);
  }
  if (!allowFinalSymlink && entryStat.isSymbolicLink()) throw new Error(`${label} must not be a symlink: ${path}`);
  const canonical = realpathSync(path);
  if (!statSync(canonical).isFile() || !isWithin(canonical, root)) {
    throw new Error(`${label} must resolve to a file inside ${root}: ${path}`);
  }
  return canonical;
}

function validateRow(selected                , payload                     , processError        , extensionRoots                     )           {
  if (!payload) return [processError || 'startup probe returned no structured payload'];
  const problems           = [];
  if (processError) problems.push(processError);
  if (payload.errors.length > 0) problems.push(`${payload.errors.length} extension loader error(s)`);
  if (payload.duplicates.length > 0) problems.push(`duplicate tools: ${payload.duplicates.join(', ')}`);
  const loadedNames = new Set        ();
  const loadedPaths = new Set        ();
  const unexpected           = [];
  for (const path of payload.extensions) {
    try {
      const canonical = realpathSync(path);
      if (!statSync(canonical).isFile()) throw new Error('extension entrypoint is not a file');
      if (loadedPaths.has(canonical)) problems.push(`duplicate extension path: ${canonical}`);
      loadedPaths.add(canonical);
      const matched = selected.find((item) => isWithin(canonical, extensionRoots.get(item.name) ));
      if (matched) loadedNames.add(matched.name);
      else unexpected.push(path);
    } catch {
      unexpected.push(path);
    }
  }
  const missing = selected.filter((item) => !loadedNames.has(item.name));
  const requiredTools = [
    ...PI_CORE_TOOLS,
    ...selected.flatMap((item) => PI_EXTENSION_TOOL_SENTINELS[item.name                                            ]),
  ];
  const missingTools = requiredTools.filter((name) => !payload.tools.includes(name));
  if (missing.length > 0) problems.push(`missing: ${missing.map((item) => item.name).join(', ')}`);
  if (missingTools.length > 0) problems.push(`missing tools: ${missingTools.join(', ')}`);
  if (unexpected.length > 0) problems.push(`unexpected extension(s): ${unexpected.join(', ')}`);
  return problems;
}

function renderMatrix(reviewedAt        , runtime              , rows             ) {
  const table = rows.map((row) => {
    const packages = row.packages.length > 0 ? row.packages.map((item) => `\`${item.spec}\``).join('<br>') : '(core only)';
    const toolCount = row.payload?.tools.length ?? 0;
    return `| \`${row.mask}\` | ${packages} | ${toolCount} | ${row.status} | ${row.detail || 'No loader errors or duplicate tools'} |`;
  }).join('\n');
  const inventories = rows.map((row) => {
    const tools = row.payload?.tools.join(', ') || '(probe failed)';
    return `### ${row.mask}\n\n${tools}`;
  }).join('\n\n');
  return `# Legion Pi extension startup matrix

Review date: ${reviewedAt}

Runtime: \`${runtime.spec}\`

Probe: credential-free Pi SDK session creation in isolated HOME, XDG, agent, session, and workspace directories. Each row starts in a fresh Node.js process and must load exactly the selected extensions with unique tool names.

| Mask | Extensions | Tool count | Result | Detail |
|---|---|---:|---|---|
${table}

Mask order: \`pi-subagents\`, \`pi-mcp-adapter\`, \`pi-lens\`.

## Tool inventory

${inventories}
`;
}

function run() {
  const major = Number(process.versions.node.split('.')[0]);
  if (!Number.isInteger(major) || major < 24) throw new Error(`Legion Pi matrix requires Node.js 24 or newer; found ${process.versions.node}`);

  const argv = process.argv.slice(2);
  const opts = parseArgs(argv);
  const paths = resolveLegionPiProfilePaths(opts.profileDir);
  assertSafeLegionPiProfileRoot(paths.profileDir, PROJECT_ROOT, false);
  if (!assertRealDirectoryPath(paths.stateDir)) throw new Error(`Legion Pi state directory is missing: ${paths.stateDir}`);
  if (!assertRealDirectoryPath(paths.npmCacheDir)) throw new Error(`Legion Pi npm cache directory is missing: ${paths.npmCacheDir}`);
  assertFileWithin(paths.activeConfigPath, paths.stateDir, 'Active Legion Pi config', false);
  const configPath = opts.configPath ?? paths.activeConfigPath;
  const matrixRoot = join(paths.stateDir, 'startup-matrix');
  assertRealDirectoryPath(matrixRoot, 'Legion Pi matrix scratch directory');
  assertScratchPathsDoNotOverlap({
    configPath,
    outputPath: opts.outputPath,
    matrixRoot,
    profileDir: paths.profileDir,
  });
  const config = loadLegionPiConfig(configPath);
  const activeConfig = loadLegionPiConfig(paths.activeConfigPath);
  if (jsonFingerprint(renderActiveConfig(config)) !== jsonFingerprint(renderActiveConfig(activeConfig))) {
    throw new Error(`Requested config differs from active Legion Pi profile: ${configPath}`);
  }
  const { packageStore, extensionRoots } = validateInstalledLegionPiPackages(config, paths);
  const probeScript = join(PROJECT_ROOT, 'scripts', 'pi-startup-probe.mjs');

  rmSync(matrixRoot, { recursive: true, force: true });
  mkdirSync(matrixRoot, { recursive: true });
  const rows              = [];
  try {
    for (let maskValue = 0; maskValue < 2 ** config.packages.extensions.length; maskValue += 1) {
      const mask = maskValue.toString(2).padStart(config.packages.extensions.length, '0');
      const selected = config.packages.extensions.filter((_, index) => mask[index] === '1');
      const rowRoot = join(matrixRoot, mask);
      const agentDir = join(rowRoot, 'agent');
      const sessionDir = join(rowRoot, 'sessions');
      const workspaceDir = join(rowRoot, 'workspace');
      const homeDir = join(rowRoot, 'home');
      const tempDir = join(rowRoot, 'tmp');
      const xdgDir = join(rowRoot, 'xdg');
      mkdirSync(agentDir, { recursive: true });
      mkdirSync(sessionDir, { recursive: true });
      mkdirSync(workspaceDir, { recursive: true });
      mkdirSync(homeDir, { recursive: true });
      mkdirSync(tempDir, { recursive: true });
      mkdirSync(join(xdgDir, 'config'), { recursive: true });
      mkdirSync(join(xdgDir, 'data'), { recursive: true });
      mkdirSync(join(xdgDir, 'cache'), { recursive: true });
      symlinkSync(packageStore, join(agentDir, 'npm'), process.platform === 'win32' ? 'junction' : 'dir');
      writeFileSync(join(agentDir, 'settings.json'), `${JSON.stringify({ packages: selected.map((item) => `npm:${item.spec}`) }, null, 2)}\n`);
      if (selected.some((item) => item.name === 'pi-subagents')) {
        const subagentDir = join(agentDir, 'extensions', 'subagent');
        mkdirSync(subagentDir, { recursive: true });
        writeFileSync(join(subagentDir, 'config.json'), `${JSON.stringify(renderRestrictedSubagentConfig(), null, 2)}\n`);
      }

      const result = spawnSync(process.execPath, [probeScript, paths.runtimeDir, agentDir], {
        cwd: workspaceDir,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
        env: credentialFreeEnvironment({
          ...process.env,
          HOME: homeDir,
          XDG_CONFIG_HOME: join(xdgDir, 'config'),
          XDG_DATA_HOME: join(xdgDir, 'data'),
          XDG_CACHE_HOME: join(xdgDir, 'cache'),
          TMPDIR: tempDir,
          TMP: tempDir,
          TEMP: tempDir,
          PI_CODING_AGENT_DIR: agentDir,
          PI_CODING_AGENT_SESSION_DIR: sessionDir,
          PI_LENS_HOME: join(rowRoot, 'lens'),
          PI_SUBAGENT_PI_BINARY: join(paths.runtimeDir, 'node_modules', '.bin', process.platform === 'win32' ? 'pi.cmd' : 'pi'),
          PI_OFFLINE: '1',
          PI_SKIP_VERSION_CHECK: '1',
          PI_TELEMETRY: '0',
          npm_config_cache: paths.npmCacheDir,
          npm_config_ignore_scripts: 'true',
        }),
      });
      const payload = parseProbe(String(result.stdout));
      const processError = result.error?.message
        || (result.status === 0 ? '' : String(result.stderr).trim().split(/\r?\n/).at(-1) || `exit ${result.status}`);
      const problems = validateRow(selected, payload, processError, extensionRoots);
      rows.push({
        mask,
        packages: selected,
        payload,
        status: problems.length === 0 ? 'PASS' : 'FAIL',
        detail: problems.join('; '),
      });
    }

    const markdown = renderMatrix(config.reviewedAt, config.packages.pi, rows);
    if (opts.outputPath) {
      writeOutputAtomic(opts.outputPath, markdown);
      console.log(opts.outputPath);
    } else {
      process.stdout.write(markdown);
    }
  } finally {
    rmSync(matrixRoot, { recursive: true, force: true });
  }

  if (rows.some((row) => row.status === 'FAIL')) process.exit(1);
}

run();
