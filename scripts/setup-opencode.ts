#!/usr/bin/env node --experimental-strip-types

import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  renameSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import { dirname, join, relative, resolve } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = dirname(__dirname);

const SOURCE_OPENCODE = join(PROJECT_ROOT, '.opencode');
const TARGET_OPENCODE_CONFIG_DIR = join(homedir(), '.config', 'opencode');
const TARGET_OPENCODE_HOME_DIR = join(homedir(), '.opencode');
const TARGET_OPENCODE_SKILLS = join(TARGET_OPENCODE_HOME_DIR, 'skills');

const PROJECT_OPENCODE_CONFIG = join(SOURCE_OPENCODE, 'opencode.json');
const OPENCODE_CONFIG_PATHS = [
  join(TARGET_OPENCODE_CONFIG_DIR, 'opencode.json'),
  join(TARGET_OPENCODE_HOME_DIR, 'opencode.json'),
];

const SKILLS_SOURCE_CANDIDATES = [
  join(PROJECT_ROOT, 'skills'),
  join(PROJECT_ROOT, '.claude', 'skills'),
];

const LINK_IGNORE = new Set([
  'node_modules',
  '.git',
  'antigravity-accounts.json',
  'bun.lock',
  'package.json',
]);

interface OpencodeConfig {
  mcp?: Record<string, {
    type: 'local' | 'remote';
    command?: string[];
    environment?: Record<string, string>;
    enabled?: boolean;
    timeout?: number;
  }>;
  [key: string]: unknown;
}

function backupExisting(path: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
  const backupPath = `${path}.backup-${timestamp}`;
  renameSync(path, backupPath);
  return backupPath;
}

function resolvedLinkTarget(linkPath: string): string {
  return resolve(dirname(linkPath), readlinkSync(linkPath));
}

function ensureSymlink(sourcePath: string, targetPath: string) {
  if (existsSync(targetPath)) {
    const stat = lstatSync(targetPath);
    if (stat.isSymbolicLink() && resolvedLinkTarget(targetPath) === resolve(sourcePath)) {
      console.log(`跳过: ${relative(TARGET_OPENCODE_CONFIG_DIR, targetPath)}`);
      return;
    }

    const backupPath = backupExisting(targetPath);
    console.log(`已备份: ${backupPath}`);
  }

  mkdirSync(dirname(targetPath), { recursive: true });
  symlinkSync(sourcePath, targetPath);
  console.log(`已链接: ${relative(TARGET_OPENCODE_CONFIG_DIR, targetPath)} -> ${relative(SOURCE_OPENCODE, sourcePath)}`);
}

function linkOpencodeDirectory(sourceDir: string, targetDir: string) {
  mkdirSync(targetDir, { recursive: true });

  const entries = readdirSync(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    if (LINK_IGNORE.has(entry.name)) {
      continue;
    }

    const sourcePath = join(sourceDir, entry.name);
    const targetPath = join(targetDir, entry.name);

    if (entry.isDirectory()) {
      if (existsSync(targetPath)) {
        const stat = lstatSync(targetPath);
        if (!stat.isDirectory() || stat.isSymbolicLink()) {
          const backupPath = backupExisting(targetPath);
          console.log(`已备份: ${backupPath}`);
        }
      }

      mkdirSync(targetPath, { recursive: true });
      linkOpencodeDirectory(sourcePath, targetPath);
      continue;
    }

    ensureSymlink(sourcePath, targetPath);
  }
}

function linkProjectOpencodeConfig() {
  if (!existsSync(SOURCE_OPENCODE)) {
    throw new Error(`源目录不存在: ${SOURCE_OPENCODE}`);
  }

  mkdirSync(dirname(TARGET_OPENCODE_CONFIG_DIR), { recursive: true });

  if (existsSync(TARGET_OPENCODE_CONFIG_DIR)) {
    const stat = lstatSync(TARGET_OPENCODE_CONFIG_DIR);
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      const backupPath = backupExisting(TARGET_OPENCODE_CONFIG_DIR);
      console.log(`已备份: ${backupPath}`);
    }
  }

  mkdirSync(TARGET_OPENCODE_CONFIG_DIR, { recursive: true });
  linkOpencodeDirectory(SOURCE_OPENCODE, TARGET_OPENCODE_CONFIG_DIR);
}

function resolveSkillsSource(): string | null {
  for (const candidate of SKILLS_SOURCE_CANDIDATES) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function removeTarget(path: string) {
  const stat = lstatSync(path);
  if (stat.isDirectory() && !stat.isSymbolicLink()) {
    rmSync(path, { recursive: true, force: true });
    return;
  }
  unlinkSync(path);
}

function linkSkillsToOpencode(skillsSource: string) {
  mkdirSync(TARGET_OPENCODE_SKILLS, { recursive: true });

  const entries = readdirSync(skillsSource, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const sourcePath = join(skillsSource, entry.name);
    const targetPath = join(TARGET_OPENCODE_SKILLS, entry.name);

    if (existsSync(targetPath)) {
      const stat = lstatSync(targetPath);
      if (stat.isSymbolicLink() && resolvedLinkTarget(targetPath) === resolve(sourcePath)) {
        console.log(`跳过 skill: ${entry.name}`);
        continue;
      }
      removeTarget(targetPath);
    }

    symlinkSync(sourcePath, targetPath);
    console.log(`已链接 skill: ${entry.name}`);
  }
}

function readMcpPathFromProjectConfig(): string | null {
  if (!existsSync(PROJECT_OPENCODE_CONFIG)) {
    return null;
  }

  try {
    const config = JSON.parse(readFileSync(PROJECT_OPENCODE_CONFIG, 'utf-8')) as OpencodeConfig;
    const command = config.mcp?.legionmind?.command;
    if (!command || command.length < 2) {
      return null;
    }
    return resolve(command[1]);
  } catch {
    return null;
  }
}

function resolveMcpPath(): string | null {
  const candidates = [
    process.env.LEGIONMIND_MCP_PATH,
    join(PROJECT_ROOT, 'mcp-servers', 'legionmind-mcp', 'dist', 'index.js'),
    join(PROJECT_ROOT, '..', 'mcp-servers', 'mcp-servers', 'legionmind-mcp', 'dist', 'index.js'),
    readMcpPathFromProjectConfig(),
  ].filter((candidate): candidate is string => !!candidate);

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return resolve(candidate);
    }
  }

  return null;
}

function updateOpencodeConfig(configPath: string, mcpPath: string) {
  mkdirSync(dirname(configPath), { recursive: true });

  let config: OpencodeConfig = {};
  if (existsSync(configPath)) {
    try {
      config = JSON.parse(readFileSync(configPath, 'utf-8')) as OpencodeConfig;
    } catch {
      console.log(`跳过 (无法解析): ${configPath}`);
      return;
    }
  }

  const expectedServer = {
    type: 'local' as const,
    command: ['node', mcpPath],
  };

  const currentServer = config.mcp?.legionmind;
  if (
    currentServer &&
    currentServer.type === expectedServer.type &&
    JSON.stringify(currentServer.command ?? []) === JSON.stringify(expectedServer.command)
  ) {
    console.log(`MCP 已是最新: ${configPath}`);
    return;
  }

  if (!config.mcp) {
    config.mcp = {};
  }
  config.mcp.legionmind = expectedServer;
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`MCP 已更新: ${configPath}`);
}

function main() {
  console.log(`项目根目录: ${PROJECT_ROOT}`);

  console.log('\n=== 链接 .opencode 到 ~/.config/opencode ===');
  linkProjectOpencodeConfig();

  const skillsSource = resolveSkillsSource();
  if (!skillsSource) {
    console.log('\n跳过 skills: 未找到 skills 源目录');
  } else {
    console.log(`\n=== 链接 skills 到 ~/.opencode/skills (${skillsSource}) ===`);
    linkSkillsToOpencode(skillsSource);
  }

  const mcpPath = resolveMcpPath();
  if (!mcpPath) {
    console.log('\n跳过 MCP 更新: 未找到 legionmind-mcp dist/index.js');
    console.log('可通过 LEGIONMIND_MCP_PATH 指定绝对路径');
  } else {
    console.log(`\n=== 更新 OpenCode MCP 配置 (${mcpPath}) ===`);
    for (const configPath of OPENCODE_CONFIG_PATHS) {
      updateOpencodeConfig(configPath, mcpPath);
    }
  }

  console.log('\n完成');
}

main();
