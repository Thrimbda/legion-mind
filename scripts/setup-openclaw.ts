#!/usr/bin/env node --experimental-strip-types

import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

type Command = 'install' | 'verify';

interface CliOptions {
  command: Command;
  dryRun: boolean;
  json: boolean;
  configDir: string;
  skillsDir: string;
}

interface OpenClawConfig {
  skills?: {
    load?: {
      extraDirs?: string[];
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface CommandResult {
  ok: boolean;
  command: Command;
  configPath: string;
  skillsDir: string;
  changed?: boolean;
  checks?: Record<string, boolean>;
  message: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = dirname(__dirname);

function parseArgs(argv: string[]): CliOptions {
  const commandArg = argv.find((arg) => !arg.startsWith('--'));
  const command = (commandArg ?? 'install') as Command;

  if (!['install', 'verify'].includes(command)) {
    throw new Error(`Unsupported command: ${command}`);
  }

  const getValue = (name: string): string | null => {
    const exact = argv.find((arg) => arg.startsWith(`${name}=`));
    if (exact) {
      return exact.slice(name.length + 1);
    }

    const index = argv.indexOf(name);
    if (index >= 0) {
      const value = argv[index + 1];
      if (value && !value.startsWith('--')) {
        return value;
      }
    }

    return null;
  };

  return {
    command,
    dryRun: argv.includes('--dry-run'),
    json: argv.includes('--json'),
    configDir: resolve(getValue('--config-dir') ?? join(homedir(), '.openclaw')),
    skillsDir: resolve(getValue('--skills-dir') ?? join(PROJECT_ROOT, 'skills')),
  };
}

function assertDirectory(path: string, label: string) {
  if (!existsSync(path)) {
    throw new Error(`${label} does not exist: ${path}`);
  }

  if (!statSync(path).isDirectory()) {
    throw new Error(`${label} is not a directory: ${path}`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function loadConfig(configPath: string): OpenClawConfig {
  if (!existsSync(configPath)) {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(configPath, 'utf-8'));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse existing OpenClaw config JSON: ${message}`);
  }

  if (!isRecord(parsed)) {
    throw new Error(`OpenClaw config must be a JSON object: ${configPath}`);
  }

  return parsed as OpenClawConfig;
}

function getExtraDirs(config: OpenClawConfig, configPath: string): string[] {
  if (config.skills !== undefined && !isRecord(config.skills)) {
    throw new Error(`OpenClaw config has a non-object skills value: ${configPath}`);
  }

  if (config.skills?.load !== undefined && !isRecord(config.skills.load)) {
    throw new Error(`OpenClaw config has a non-object skills.load value: ${configPath}`);
  }

  const extraDirs = config.skills?.load?.extraDirs;

  if (extraDirs === undefined) {
    return [];
  }

  if (!Array.isArray(extraDirs) || extraDirs.some((item) => typeof item !== 'string')) {
    throw new Error(`OpenClaw config has a non-string skills.load.extraDirs value: ${configPath}`);
  }

  return extraDirs;
}

function withSkillsDir(config: OpenClawConfig, skillsDir: string, configPath: string): { config: OpenClawConfig; changed: boolean } {
  const extraDirs = getExtraDirs(config, configPath);
  if (extraDirs.includes(skillsDir)) {
    return { config, changed: false };
  }

  const nextSkills = isRecord(config.skills) ? { ...config.skills } : {};
  const nextLoad = isRecord(nextSkills.load) ? { ...nextSkills.load } : {};

  nextLoad.extraDirs = [...extraDirs, skillsDir];
  nextSkills.load = nextLoad;

  return {
    config: {
      ...config,
      skills: nextSkills,
    },
    changed: true,
  };
}

function writeJsonAtomic(path: string, value: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  const tempPath = `${path}.tmp`;
  writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(tempPath, path);
}

function runInstall(opts: CliOptions): CommandResult {
  assertDirectory(opts.skillsDir, 'Skills directory');
  const configPath = join(opts.configDir, 'openclaw.json');
  const existing = loadConfig(configPath);
  const { config, changed } = withSkillsDir(existing, opts.skillsDir, configPath);

  if (changed && !opts.dryRun) {
    writeJsonAtomic(configPath, config);
  }

  return {
    ok: true,
    command: 'install',
    configPath,
    skillsDir: opts.skillsDir,
    changed,
    message: changed
      ? opts.dryRun
        ? 'OpenClaw config would be updated'
        : 'OpenClaw config updated'
      : 'OpenClaw config already includes the skills directory',
  };
}

function runVerify(opts: CliOptions): CommandResult {
  const configPath = join(opts.configDir, 'openclaw.json');
  const skillsDirExists = existsSync(opts.skillsDir) && statSync(opts.skillsDir).isDirectory();
  const configExists = existsSync(configPath);
  const config = configExists ? loadConfig(configPath) : null;
  const configured = config ? getExtraDirs(config, configPath).includes(opts.skillsDir) : false;
  const ok = skillsDirExists && configExists && configured;

  return {
    ok,
    command: 'verify',
    configPath,
    skillsDir: opts.skillsDir,
    checks: {
      skillsDirExists,
      configExists,
      skillsDirConfigured: configured,
    },
    message: ok ? 'OpenClaw setup verified' : 'OpenClaw setup verification failed',
  };
}

function emitResult(result: CommandResult, asJson: boolean) {
  if (asJson) {
    console.log(JSON.stringify(result));
    return;
  }

  console.log(result.message);
  console.log(`config: ${result.configPath}`);
  console.log(`skills: ${result.skillsDir}`);

  if (result.changed !== undefined) {
    console.log(`changed: ${String(result.changed)}`);
  }

  if (result.checks) {
    for (const [name, passed] of Object.entries(result.checks)) {
      console.log(`${name}: ${passed ? 'ok' : 'missing'}`);
    }
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));

  try {
    const result = opts.command === 'install' ? runInstall(opts) : runVerify(opts);
    emitResult(result, opts.json);

    if (!result.ok) {
      process.exit(1);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (opts.json) {
      console.log(JSON.stringify({ ok: false, command: opts.command, message }));
    } else {
      console.error(message);
    }
    process.exit(1);
  }
}

main();
