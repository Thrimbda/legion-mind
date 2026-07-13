import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';

const requiredAssets = [
  'skills/report-walkthrough/scripts/current-verdict.mjs',
  'skills/report-walkthrough/scripts/report-data-validation.mjs',
  'skills/report-walkthrough/references/report-data.schema.json',
  'skills/report-walkthrough/templates/report-walkthrough.html',
  'skills/verify-change/references/REF_COGNITIVE_VERIFICATION.md',
  'skills/legion-workflow/references/REF_HUMAN_ATTENTION.md',
  'skills/legion-workflow/scripts/subagent-name.mjs',
  'skills/legion-workflow/references/context-manifest.json',
];

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function withoutVersion(value) {
  const copy = structuredClone(value);
  delete copy.version;
  return copy;
}

function assertRequiredAssets(filePaths) {
  const missing = requiredAssets.filter((path) => !filePaths.has(path));
  assert.equal(missing.length, 0, `缺少关键资产: ${missing.join(', ')}`);
}

const pack = spawnSync(
  'npm',
  ['pack', '--dry-run', '--json', '--ignore-scripts'],
  { encoding: 'utf8', env: { ...process.env, npm_config_registry: 'https://registry.npmjs.org' } },
);
assert.equal(pack.status, 0, `npm pack 失败: ${pack.stderr}`);
const packJson = JSON.parse(pack.stdout);
assert.equal(packJson.length, 1);
const artifact = packJson[0];
assert.equal(artifact.id, 'lgmind@0.4.0');
assert.equal(artifact.name, 'lgmind');
assert.equal(artifact.version, '0.4.0');

const fileMap = new Map(artifact.files.map((entry) => [entry.path, entry]));
assertRequiredAssets(new Set(fileMap.keys()));

for (const removed of requiredAssets) {
  const negativeSet = new Set(fileMap.keys());
  negativeSet.delete(removed);
  assert.throws(
    () => assertRequiredAssets(negativeSet),
    /缺少关键资产/,
    `负例没有拒绝缺失资产: ${removed}`,
  );
  console.log(`NEGATIVE_CONTROL_OK missing=${removed}`);
}

const rootPackage = readJson('package.json');
const schedulerPackage = readJson('scheduler/package.json');
const headRootPackage = JSON.parse(execFileSync('git', ['show', 'HEAD:package.json'], { encoding: 'utf8' }));
const headSchedulerPackage = JSON.parse(execFileSync('git', ['show', 'HEAD:scheduler/package.json'], { encoding: 'utf8' }));

assert.equal(headRootPackage.version, '0.3.1');
assert.equal(rootPackage.version, '0.4.0');
assert.deepEqual(withoutVersion(rootPackage), withoutVersion(headRootPackage));
assert.equal(schedulerPackage.version, '0.0.0');
assert.deepEqual(schedulerPackage, headSchedulerPackage);

for (const [binName, binPath] of Object.entries(rootPackage.bin)) {
  const entry = fileMap.get(binPath);
  assert.ok(entry, `pack 缺少 bin: ${binName} -> ${binPath}`);
  assert.ok((entry.mode & 0o111) !== 0, `pack bin 不可执行: ${binPath}`);
  assert.ok((statSync(binPath).mode & 0o111) !== 0, `工作树 bin 不可执行: ${binPath}`);
  assert.match(readFileSync(binPath, 'utf8'), /^#!\/usr\/bin\/env node\n/);
}

const changedPaths = execFileSync('git', ['diff', '--name-only'], { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(Boolean);
const productTrackedDiff = changedPaths.filter((path) => !path.startsWith('.legion/'));
assert.deepEqual(productTrackedDiff, ['package.json']);

console.log(`ARTIFACT_OK id=${artifact.id} entries=${artifact.entryCount}`);
console.log(`ASSET_ASSERTIONS_OK count=${requiredAssets.length}`);
console.log(`VERSION_BOUNDARY_OK root=${rootPackage.version} scheduler=${schedulerPackage.version}`);
console.log(`BIN_ENTRY_OK count=${Object.keys(rootPackage.bin).length}`);
console.log(`TRACKED_DIFF_ALL files=${changedPaths.join(',')}`);
console.log(`TRACKED_PRODUCT_DIFF_OK files=${productTrackedDiff.join(',')}`);
