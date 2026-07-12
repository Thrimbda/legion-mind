#!/usr/bin/env node

import { randomInt } from "node:crypto";

const adjectives = [
  "brisk", "calm", "cheery", "clever", "cosmic", "curious", "dapper", "eager",
  "fizzy", "gentle", "glowing", "jolly", "lively", "lucky", "merry", "nimble",
  "playful", "plucky", "quick", "quiet", "sunny", "swift", "witty", "zesty",
];

const nouns = [
  "badger", "beaver", "bison", "capybara", "dolphin", "falcon", "ferret", "fox",
  "gecko", "heron", "koala", "lemur", "lynx", "marten", "otter", "owl",
  "panda", "penguin", "puffin", "quokka", "raven", "seal", "sparrow", "yak",
];

const transports = new Set(["codex", "opencode", "raw"]);

function fail(message) {
  process.stderr.write(`错误：${message}\n`);
  process.exitCode = 1;
}

function usage() {
  return [
    "用法：subagent-name.mjs <role> [--count <n>] [--json] [--transport <codex|opencode|raw>]",
    "role 必须是 1-40 字符的小写 ASCII slug，例如 engineer 或 review-rfc。",
  ].join("\n");
}

function parse(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write(`${usage()}\n`);
    process.exit(0);
  }

  let role;
  let count = 1;
  let json = false;
  let transport = "raw";

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--json") {
      json = true;
    } else if (argument === "--count") {
      const value = argv[index + 1];
      if (value === undefined) throw new Error("--count 缺少数值");
      count = Number(value);
      index += 1;
    } else if (argument === "--transport") {
      const value = argv[index + 1];
      if (value === undefined) throw new Error("--transport 缺少数值");
      transport = value;
      index += 1;
    } else if (argument.startsWith("-")) {
      throw new Error(`未知参数 ${argument}`);
    } else if (role === undefined) {
      role = argument;
    } else {
      throw new Error(`多余的位置参数 ${argument}`);
    }
  }

  if (role === undefined) throw new Error(`缺少 role\n${usage()}`);
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(role) || role.length > 40) {
    throw new Error("role 必须是 1-40 字符的小写 ASCII slug");
  }
  if (!Number.isSafeInteger(count) || count < 1) {
    throw new Error("--count 必须是正整数");
  }
  if (!transports.has(transport)) {
    throw new Error("--transport 只能是 codex、opencode 或 raw");
  }

  const capacity = adjectives.length * nouns.length;
  if (count > capacity) {
    throw new Error(`--count 超出可用组合上限 ${capacity}`);
  }

  return { role, count, json, transport, capacity };
}

function transportId(displayName, transport) {
  return transport === "codex" ? displayName.replaceAll("-", "_") : displayName;
}

function generate({ role, count, transport, capacity }) {
  const chosen = new Set();
  while (chosen.size < count) chosen.add(randomInt(capacity));

  return [...chosen].map((choice) => {
    const adjective = adjectives[Math.floor(choice / nouns.length)];
    const noun = nouns[choice % nouns.length];
    const displayName = `${role}-${adjective}-${noun}`;
    return { agentType: role, displayName, transportId: transportId(displayName, transport) };
  });
}

try {
  const options = parse(process.argv.slice(2));
  const names = generate(options);
  if (options.json) {
    const payload = names.length === 1 ? names[0] : names;
    process.stdout.write(`${JSON.stringify(payload)}\n`);
  } else {
    process.stdout.write(`${names.map(({ displayName }) => displayName).join("\n")}\n`);
  }
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
