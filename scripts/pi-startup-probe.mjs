import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const runtimeDir = resolve(process.argv[2] ?? '');
const agentDir = resolve(process.argv[3] ?? '');
if (!process.argv[2] || !process.argv[3]) {
  throw new Error('usage: pi-startup-probe.mjs <runtime-dir> <agent-dir>');
}

const entrypoint = resolve(runtimeDir, 'node_modules', '@earendil-works', 'pi-coding-agent', 'dist', 'index.js');
const codingAgent = await import(pathToFileURL(entrypoint).href);
const loader = new codingAgent.DefaultResourceLoader({ cwd: process.cwd(), agentDir });
await loader.reload();
const loaded = loader.getExtensions();
const result = await codingAgent.createAgentSession({
  cwd: process.cwd(),
  agentDir,
  resourceLoader: loader,
  sessionManager: codingAgent.SessionManager.inMemory(process.cwd()),
});

try {
  const tools = result.session.agent.state.tools.map((tool) => tool.name);
  const seen = new Set();
  const duplicates = [...new Set(tools.filter((name) => {
    if (seen.has(name)) return true;
    seen.add(name);
    return false;
  }))];
  const payload = {
    extensions: loaded.extensions.map((extension) => extension.path),
    errors: loaded.errors.map((entry) => ({ path: entry.path, error: String(entry.error) })),
    tools,
    duplicates,
  };
  process.stdout.write(`LEGION_PI_PROBE=${JSON.stringify(payload)}\n`);
} finally {
  result.session.dispose();
}
