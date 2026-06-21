#!/usr/bin/env node

import { spawnSync } from 'child_process';
import { readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { createInterface } from 'readline/promises';
import { fileURLToPath } from 'url';







const VALUE_OPTIONS = new Set([
  '--agent',
  '--runtime',
  '--scope',
  '--strategy',
  '--to',
  '--config-dir',
  '--opencode-home',
  '--openclaw-home',
  '--skills-dir',
]);

const COMMANDS = new Set(['setup', 'install', 'verify', 'rollback', 'uninstall']);
const RUNTIME_SCRIPTS                          = {
  opencode: 'setup-opencode.js',
  openclaw: 'setup-openclaw.js',
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = dirname(__dirname);






function packageVersion()         {
  try {
    const parsed = JSON.parse(readFileSync(join(PROJECT_ROOT, 'package.json'), 'utf-8'))                         ;
    return typeof parsed.version === 'string' ? parsed.version : '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function printVersion() {
  console.log(packageVersion());
}

function printHelp() {
  console.log(`lgmind ${packageVersion()}

Set up LegionMind assets for supported coding agent runtimes.

Usage:
  lgmind setup [--agent opencode|openclaw] [options]
  lgmind <install|verify|rollback|uninstall> [--agent opencode|openclaw] [options]
  lgmind install --scope project
  npx lgmind@latest setup

Commands:
  setup       Guided first-run setup; installs selected runtime assets
  install     Install or update selected runtime assets
  verify      Check selected runtime assets; use --strict for checksum ownership checks
  rollback    Restore latest backup batch, or --to <backup-id>
  uninstall   Remove managed, non-drifted assets
  help        Show this help
  version     Print the CLI version

Runtime selection:
  --agent <opencode|openclaw>   Target runtime (default: opencode; install/setup prompt in TTY)
  --runtime <opencode|openclaw> Alias for --agent

Install scope:
  --scope <project|global>      Install to this project or runtime-global defaults
                               TTY install/setup prompts when omitted; non-TTY defaults to global
  --interactive                 Prompt even when stdio is not a TTY
  --no-interactive              Disable prompts even in a TTY

Common options:
  --config-dir <path>       Runtime config directory
  --strategy <copy|symlink> Install strategy (default: copy)
  --to <backup-id>          Backup id for rollback
  --strict                  Enforce strict verify checks
  --dry-run                 Show intended writes without changing files
  --force                   Back up and overwrite/remove drifted managed targets
  --verbose                 Show detailed lifecycle events in text mode
  --json                    Emit machine-readable events and result
  --help, -h                Show this help
  --version, -v             Print the CLI version

Runtime-specific options:
  OpenCode: --opencode-home <path>
  OpenClaw: --openclaw-home <path> --skills-dir <path> --no-extra-dir

Examples:
  npx lgmind@latest setup
  npx lgmind@latest install
  npx lgmind@latest install --scope project
  npx lgmind@latest setup --agent opencode
  npx lgmind@latest setup --agent openclaw --scope global
  npx lgmind@latest verify --agent opencode --strict
  npx lgmind@latest install --agent openclaw --scope project --no-extra-dir

Use setup-opencode for the direct OpenCode-only alias.
`);
}

function isValueOption(arg        )          {
  return VALUE_OPTIONS.has(arg);
}

function findCommandArg(argv          )                    {
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg || arg.startsWith('--')) {
      continue;
    }
    if (index > 0 && isValueOption(argv[index - 1])) {
      continue;
    }
    return { value: arg, index };
  }
  return null;
}

function getValue(argv          , name                                     )                {
  const exact = argv.find((arg) => arg.startsWith(`${name}=`));
  if (exact) {
    const value = exact.slice(name.length + 1);
    if (!value) {
      throw new Error(`${name} requires a value: opencode or openclaw.`);
    }
    return value;
  }
  const index = argv.indexOf(name);
  if (index >= 0) {
    if (!argv[index + 1] || argv[index + 1].startsWith('--')) {
      throw new Error(`${name} requires a value: opencode or openclaw.`);
    }
    return argv[index + 1];
  }
  return null;
}

function normalizeRuntime(value        )          {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'opencode' || normalized === 'oc' || normalized === '1') {
    return 'opencode';
  }
  if (normalized === 'openclaw' || normalized === 'claw' || normalized === '2') {
    return 'openclaw';
  }
  throw new Error(`Unsupported agent runtime: ${value}. Expected opencode or openclaw.`);
}

function normalizeScope(value        )               {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'project' || normalized === 'local' || normalized === 'p' || normalized === '1') {
    return 'project';
  }
  if (normalized === 'global' || normalized === 'g' || normalized === '2') {
    return 'global';
  }
  throw new Error(`Unsupported install scope: ${value}. Expected project or global.`);
}

function isInstallLike(rawCommand               )          {
  return rawCommand === 'setup' || rawCommand === 'install';
}

function shouldPrompt(argv          , rawCommand               )          {
  if (!isInstallLike(rawCommand) || argv.includes('--no-interactive') || argv.includes('--json')) {
    return false;
  }
  if (argv.includes('--interactive')) {
    return true;
  }
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

async function ask(rl                        , scriptedAnswers                 , prompt        )                  {
  if (scriptedAnswers) {
    process.stdout.write(prompt);
    return scriptedAnswers.shift() ?? '';
  }
  if (!rl) {
    return '';
  }
  return rl.question(prompt);
}

async function promptRuntime(rl                        , scriptedAnswers                 )                   {
  console.log('Choose an agent runtime to configure:');
  console.log('  1) OpenCode  - install LegionMind agents and core skills');
  console.log('  2) OpenClaw  - install LegionMind skills into OpenClaw local skills root');
  const answer = await ask(rl, scriptedAnswers, 'Agent runtime [1/opencode]: ');
  return normalizeRuntime(answer.trim() || 'opencode');
}

async function promptScope(rl                        , scriptedAnswers                 )                        {
  const projectRoot = resolve(process.cwd(), '.legionmind');
  console.log('Choose an install scope:');
  console.log(`  1) Project - install under ${projectRoot}`);
  console.log('  2) Global  - install to runtime default locations');
  const answer = await ask(rl, scriptedAnswers, 'Install scope [1/project]: ');
  return normalizeScope(answer.trim() || 'project');
}

function stripLgmindArgs(argv          , commandArg                   )           {
  const next           = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (commandArg && index === commandArg.index) {
      continue;
    }
    if (arg === '--agent' || arg === '--runtime' || arg === '--scope') {
      index += 1;
      continue;
    }
    if (arg.startsWith('--agent=') || arg.startsWith('--runtime=') || arg.startsWith('--scope=')) {
      continue;
    }
    if (arg === '--interactive' || arg === '--no-interactive') {
      continue;
    }
    next.push(arg);
  }
  return next;
}

async function selectRuntime(argv          , shouldPromptForMissing         , rl                        , scriptedAnswers                 )                   {
  const agentValue = getValue(argv, '--agent');
  const runtimeValue = getValue(argv, '--runtime');
  if (agentValue && runtimeValue) {
    const agent = normalizeRuntime(agentValue);
    const runtime = normalizeRuntime(runtimeValue);
    if (agent !== runtime) {
      throw new Error(`Conflicting runtime selection: --agent ${agentValue} and --runtime ${runtimeValue}.`);
    }
    return agent;
  }
  const runtime = agentValue ?? runtimeValue;
  if (runtime) {
    return normalizeRuntime(runtime);
  }
  if (shouldPromptForMissing) {
    return promptRuntime(rl, scriptedAnswers);
  }
  return 'opencode';
}

async function selectScope(argv          , rawCommand               , shouldPromptForMissing         , rl                        , scriptedAnswers                 )                        {
  const scopeValue = getValue(argv, '--scope');
  if (scopeValue) {
    return normalizeScope(scopeValue);
  }
  if (shouldPromptForMissing) {
    return promptScope(rl, scriptedAnswers);
  }
  return 'global';
}

function hasValueOption(argv          , name        )          {
  return argv.some((arg) => arg === name || arg.startsWith(`${name}=`));
}

function withDefaultValueOption(argv          , name        , value        )           {
  if (hasValueOption(argv, name)) {
    return argv;
  }
  return [...argv, name, value];
}

function applyInstallScope(runtime         , scope              , args          )           {
  if (scope !== 'project') {
    return args;
  }

  const projectRoot = resolve(process.cwd(), '.legionmind');
  if (runtime === 'opencode') {
    let next = withDefaultValueOption(args, '--config-dir', join(projectRoot, 'opencode', 'config'));
    next = withDefaultValueOption(next, '--opencode-home', join(projectRoot, 'opencode', 'home'));
    return next;
  }

  const openclawRoot = join(projectRoot, 'openclaw');
  let next = withDefaultValueOption(args, '--config-dir', openclawRoot);
  next = withDefaultValueOption(next, '--openclaw-home', openclawRoot);
  return next;
}

function dispatch(runtime         , command                                 , args          )         {
  const scriptPath = resolve(__dirname, RUNTIME_SCRIPTS[runtime]);
  const result = spawnSync(process.execPath, [scriptPath, command, ...args], { stdio: 'inherit' });

  if (result.error) {
    console.error(`Failed to start ${runtime} setup: ${result.error.message}`);
    return 1;
  }
  if (typeof result.status === 'number') {
    return result.status;
  }
  if (result.signal) {
    console.error(`${runtime} setup exited after signal ${result.signal}`);
  }
  return 1;
}

async function run() {
  const argv = process.argv.slice(2);
  const commandArg = findCommandArg(argv);

  if (argv.includes('--help') || argv.includes('-h') || commandArg?.value === 'help') {
    printHelp();
    return;
  }
  if (argv.includes('--version') || argv.includes('-v') || commandArg?.value === 'version') {
    printVersion();
    return;
  }

  const rawCommand = (commandArg?.value ?? 'setup')                 ;
  if (!COMMANDS.has(rawCommand)) {
    throw new Error(`Unsupported command: ${rawCommand}`);
  }

  const interactive = shouldPrompt(argv, rawCommand);
  const scriptedAnswers = interactive && !process.stdin.isTTY ? readFileSync(0, 'utf-8').split(/\r?\n/) : null;
  const promptInterface = interactive && scriptedAnswers === null ? createInterface({ input: process.stdin, output: process.stdout }) : null;
  let runtime         ;
  let scope              ;
  try {
    runtime = await selectRuntime(argv, interactive && getValue(argv, '--agent') === null && getValue(argv, '--runtime') === null, promptInterface, scriptedAnswers);
    scope = await selectScope(argv, rawCommand, interactive && getValue(argv, '--scope') === null, promptInterface, scriptedAnswers);
  } finally {
    promptInterface?.close();
  }
  const command = rawCommand === 'setup' ? 'install' : rawCommand;
  const args = applyInstallScope(runtime, scope, stripLgmindArgs(argv, commandArg));
  const exitCode = dispatch(runtime, command, args);
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  console.error('Run lgmind --help for usage.');
  process.exit(1);
});
