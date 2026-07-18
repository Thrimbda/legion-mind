import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const repoRoot = resolve(new URL('../..', import.meta.url).pathname);

function readRepo(path: string): string {
  return readFileSync(join(repoRoot, path), 'utf8');
}

function runNode(args: string[], env: Record<string, string> = {}) {
  return spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

function digest(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function validReportData() {
  return {
    schemaVersion: '1.1',
    task: {
      id: 'token-report-fixture',
      title: '生成器回归报告',
      purpose: '验证 <script>alert(1)</script> 与属性转义',
      reviewer: '仓库维护者',
    },
    profile: 'implementation',
    workflowProfile: 'lite',
    designRequired: false,
    risk: 'low',
    stageConclusion: 'PASS',
    reviewStatus: 'NOT_REQUIRED',
    summary: '同一份 schema 数据生成三种 reviewer artifact；[危险](javascript:alert(1))；![远程图](https://example.com/x.png)\n# 伪标题',
    attention: {
      level: 'skim',
      summary: '生成器行为值得知悉，但无需人工介入。',
      humanAction: '知悉。',
      lifecycleBoundary: '允许继续 PR lifecycle。',
      evidence: ['.legion/tasks/token-report-fixture/docs/test-report.md'],
    },
    claims: [],
    scope: {
      included: ['报告 schema、模板与生成器'],
      excluded: ['外部托管'],
    },
    evidence: [
      { kind: 'plan', label: '任务契约', locator: '.legion/tasks/token-report-fixture/plan.md', status: 'PASS' },
      { kind: 'test-report', label: '验证报告', locator: '.legion/tasks/token-report-fixture/docs/test-report.md', status: 'PASS' },
      { kind: 'review-change', label: '变更审查', locator: '.legion/tasks/token-report-fixture/docs/review-change.md', status: 'PASS' },
    ],
    deliveryPath: ['任务契约', '实现', '验证', '审查', '报告'],
    changes: ['使用单一 report-data.json。'],
    verification: [
      { label: '生成器回归', status: 'PASS', evidence: '.legion/tasks/token-report-fixture/docs/test-report.md' },
    ],
    risks: [{ risk: '模板字段可能漂移', mitigation: 'schema 与回归共同约束' }],
    checklist: ['确认三份产物来自同一输入。'],
    final: {
      state: '实现与审查完成',
      nextStage: '进入 PR lifecycle',
      lifecycleDisclaimer: '报告产物不代表 PR 已合并或 cleanup 已完成。',
    },
    render: {
      prBacked: true,
      state: 'artifact-only',
      note: '本 fixture 不发布外部 URL。',
    },
  };
}

test('入口把非代码工作与明确微操作留在普通路径，高风险与不确定工作仍升级 Legion', () => {
  const agents = readRepo('AGENTS.md');
  const workflow = readRepo('skills/legion-workflow/SKILL.md');

  for (const [name, source] of [['AGENTS', agents], ['workflow', workflow]] as const) {
    for (const route of ['普通路径', '明确微操作', 'Legion 路径']) {
      assert.equal(source.includes(route), true, `${name} 应保留稳定入口分类 ${route}`);
    }
  }
  assert.equal(workflow.includes('SUBAGENT-STOP'), true);
  assert.equal(workflow.includes('scripts/subagent-name.mjs'), true);
  assert.equal(existsSync(join(repoRoot, '.opencode', 'agents')), false, '入口行为不再由 OpenCode custom agent prompt 复制');
});

test('上下文预算覆盖热文件与中风险强制加载闭包，并保留可重算降幅', () => {
  const result = runNode(['skills/legion-workflow/scripts/audit-context.mjs', '--check']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  const manifest = JSON.parse(readRepo('skills/legion-workflow/references/context-manifest.json'));
  assert.equal(report.baselineRevision, '5359115');
  const budgetedPaths = new Set([...manifest.hot, ...manifest.mediumAdditional].map((item: { path: string }) => item.path));
  assert.equal(report.files.length, budgetedPaths.size);
  assert.equal(report.failures.length, 0);
  assert.equal(report.unbudgetedRequiredReferences.length, 0);
  assert.ok(report.hot.current <= 42000);
  assert.ok(report.mediumClosure.current <= 59000);
  assert.ok(report.hot.reductionPercent >= 40);
  assert.ok(report.mediumClosure.reductionPercent >= 35);
  assert.deepEqual(report.requiredReferences, [
    'skills/legion-workflow/references/REF_HUMAN_ATTENTION.md',
    'skills/verify-change/references/REF_COGNITIVE_VERIFICATION.md',
  ]);

  const toolsReference = readRepo('skills/legion-workflow/references/REF_TOOLS.md');
  assert.ok([...toolsReference].length <= 1500, 'CLI reference 应保持按需且紧凑');
  assert.match(toolsReference, /--help/);
});

test('完整阶段摘要只投影为五字段 handoff，attention 与停止点不得降级', () => {
  const attention = readRepo('skills/legion-workflow/references/REF_HUMAN_ATTENTION.md');
  const logSync = readRepo('skills/legion-docs/references/REF_LOG_SYNC.md');
  const stages = ['review-rfc', 'verify-change', 'review-change'];

  for (const field of ['结果:', '变化:', '风险:', '下一步:', '证据:']) assert.ok(attention.includes(field));
  assert.match(attention, /判断变化后接关键发现；去重后合计最多三条/);
  assert.match(attention, /review\/decide.*唯一动作\/停止点/);
  assert.match(attention, /文件与投影冲突.+handoff 失败/s);
  assert.doesNotMatch(attention, /handoff[^\n]*原样返回|原样回传完整/);
  assert.match(logSync, /五个字段|五字段/);

  for (const stage of stages) {
    const source = readRepo(`skills/${stage}/SKILL.md`);
    assert.match(source, /完整 `## 会话注意力摘要`/);
    assert.match(source, /五字段/);
    assert.doesNotMatch(source, /handoff[^\n]*原样返回|最终 handoff 原样返回/);
  }
});

test('子代理命名器生成 canonical displayName 与 transport-safe id，并保证同批唯一', () => {
  const script = 'skills/legion-workflow/scripts/subagent-name.mjs';
  const result = runNode([script, 'engineer', '--count', '64', '--json', '--transport', 'codex']);
  assert.equal(result.status, 0, result.stderr);
  const names = JSON.parse(result.stdout);
  assert.equal(names.length, 64);
  assert.equal(new Set(names.map((item: { displayName: string }) => item.displayName)).size, 64);
  assert.equal(new Set(names.map((item: { transportId: string }) => item.transportId)).size, 64);
  for (const item of names) {
    assert.equal(item.agentType, 'engineer');
    assert.match(item.displayName, /^engineer-[a-z]+-[a-z]+$/);
    assert.match(item.transportId, /^engineer_[a-z]+_[a-z]+$/);
  }

  const opencode = runNode([script, 'review-change', '--json', '--transport', 'opencode']);
  assert.equal(opencode.status, 0, opencode.stderr);
  const opencodeName = JSON.parse(opencode.stdout);
  assert.equal(opencodeName.agentType, 'review-change');
  assert.match(opencodeName.displayName, /^review-change-[a-z]+-[a-z]+$/);
  assert.equal(opencodeName.transportId, opencodeName.displayName);

  const invalidRole = runNode([script, 'Engineer']);
  assert.notEqual(invalidRole.status, 0);
  assert.match(invalidRole.stderr, /小写 ASCII slug/);
  const overflow = runNode([script, 'engineer', '--count', '577']);
  assert.notEqual(overflow.status, 0);
  assert.match(overflow.stderr, /组合上限/);

  assert.equal(existsSync(join(repoRoot, '.opencode', 'agents')), false);
});

test('报告生成器从单一 schema 数据确定性且事务式生成三份安全产物', () => {
  const root = join(repoRoot, '.legion', 'tasks', 'token-report-fixture');
  const docs = join(root, 'docs');
  rmSync(root, { recursive: true, force: true });
  mkdirSync(docs, { recursive: true });
  const input = join(docs, 'report-data.json');
  const inputArg = relative(repoRoot, input);
  const script = 'skills/report-walkthrough/scripts/render-report.mjs';
  const outputNames = ['report-walkthrough.html', 'report-walkthrough.md', 'pr-body.md'];

  try {
    const data = validReportData();
    writeFileSync(join(docs, 'test-report.md'), '# 验证\n\n## Verdict\n\nPASS\n');
    writeFileSync(join(docs, 'review-change.md'), '# 审查\n\n## Verdict\n\nPASS\n');
    writeFileSync(input, `${JSON.stringify(data, null, 2)}\n`);
    const first = runNode([script, '--input', inputArg]);
    assert.equal(first.status, 0, first.stderr);
    assert.match(first.stdout, /RENDER_OK token-report-fixture/);
    for (const name of outputNames) assert.equal(existsSync(join(docs, name)), true, `${name} 应生成`);

    const html = readFileSync(join(docs, 'report-walkthrough.html'), 'utf8');
    assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    assert.doesNotMatch(html, /<script|<link|<iframe|https?:\/\/[^"<]*cdn/i);
    assert.doesNotMatch(html, /[ \t]+(?=\r?$)/m, '空 verifier 提示不得在 HTML 中留下行尾空白');
    assert.match(html, /oklch\(/);
    assert.match(html, /@media print/);
    assert.match(html, /@media \(max-width:/);
    for (const name of ['report-walkthrough.md', 'pr-body.md']) {
      const source = readFileSync(join(docs, name), 'utf8');
      assert.ok(source.includes('\\[危险\\]\\(javascript:alert\\(1\\)\\)'), `${name} 应把链接语法当作字面文本`);
      assert.ok(source.includes('\\!\\[远程图\\]\\(https://example\\.com/x\\.png\\)'), `${name} 应把远程图片语法当作字面文本`);
      assert.ok(source.includes('<br>\\# 伪标题'), `${name} 应把行首标题语法当作字面文本`);
      assert.doesNotMatch(source, /\[危险\]\(javascript:alert\(1\)\)|!\[远程图\]\(https:\/\/example\.com\/x\.png\)/);
    }
    const firstDigests = Object.fromEntries(outputNames.map((name) => [name, digest(join(docs, name))]));

    const second = runNode([script, '--input', inputArg]);
    assert.equal(second.status, 0, second.stderr);
    assert.deepEqual(Object.fromEntries(outputNames.map((name) => [name, digest(join(docs, name))])), firstDigests);

    data.summary = '这次内容不应在注入失败后残留。';
    writeFileSync(input, `${JSON.stringify(data, null, 2)}\n`);
    const failedTransaction = runNode([script, '--input', inputArg], {
      NODE_ENV: 'test',
      LEGION_REPORT_RENDER_FAIL_AT: 'after-first-install',
    });
    assert.notEqual(failedTransaction.status, 0);
    assert.deepEqual(Object.fromEntries(outputNames.map((name) => [name, digest(join(docs, name))])), firstDigests);

    const domainFixture = structuredClone(validReportData()) as any;
    domainFixture.claims = [{
      claimId: 'claim-domain',
      statement: '领域结论当前证据不足。',
      status: 'INCONCLUSIVE',
      expertise: 'domain',
      impact: '不能作为客观验收依据。',
      owner: '领域负责人',
      mitigation: '保持保守默认值。',
      evidence: '.legion/tasks/token-report-fixture/docs/domain-evidence.json',
      evidenceGap: '缺少独立生产样本。',
      escalation: '加载真实领域 verifier。',
      verifier: {
        kind: 'domain',
        source: 'skills/example-verifier/SKILL.md',
        version: 'sha256:fixture',
        method: '独立样本检查',
        independence: 'high',
        independenceReason: '使用独立工具输出。',
        confidence: 'medium',
        conclusion: '当前不能确定。',
        unproven: '未证明生产正确性。',
        residualUncertainty: '样本覆盖有限。',
        failureConditions: '输入分布变化。',
        rawEvidence: '.legion/tasks/token-report-fixture/docs/domain-evidence.json',
        resources: ['skills/example-verifier/SKILL.md'],
        executions: ['node verify-domain.mjs：exit 0'],
      },
    }];
    writeFileSync(input, `${JSON.stringify(domainFixture, null, 2)}\n`);
    const domainChecked = runNode([script, '--input', inputArg, '--check']);
    assert.equal(domainChecked.status, 0, domainChecked.stderr);

    const invalidCases = [
      { name: 'review 缺停止点', mutate: (value: any) => { value.attention.level = 'review'; delete value.attention.stopPoint; } },
      { name: '证据越界', mutate: (value: any) => { value.evidence[0].locator = '../secret.md'; } },
      { name: '不安全 URL', mutate: (value: any) => { value.render = { prBacked: true, state: 'rendered', url: 'javascript:alert(1)', note: 'bad' }; } },
      { name: '未知字段', mutate: (value: any) => { value.unknown = true; } },
      { name: 'implementation 缺 test-report', mutate: (value: any) => { value.evidence = value.evidence.filter((item: any) => item.kind !== 'test-report'); } },
      { name: 'domain claim 缺 verifier', mutate: (value: any) => { value.claims = [structuredClone(domainFixture.claims[0])]; delete value.claims[0].verifier; } },
      { name: 'verifier provenance 不可追溯', mutate: (value: any) => { value.claims = [structuredClone(domainFixture.claims[0])]; value.claims[0].verifier.resources = ['skills/other-verifier/SKILL.md']; } },
      { name: 'INCONCLUSIVE 缺证据缺口', mutate: (value: any) => { value.claims = [structuredClone(domainFixture.claims[0])]; delete value.claims[0].evidenceGap; } },
      { name: 'DEFERRED 缺触发协议', mutate: (value: any) => { value.claims = [{ ...structuredClone(domainFixture.claims[0]), status: 'DEFERRED', expertise: 'routine' }]; delete value.claims[0].verifier; delete value.claims[0].trigger; } },
      { name: 'RECOMMENDATION 缺选项', mutate: (value: any) => { value.claims = [{ ...structuredClone(domainFixture.claims[0]), status: 'RECOMMENDATION', expertise: 'routine' }]; delete value.claims[0].verifier; delete value.claims[0].options; } },
    ];
    for (const scenario of invalidCases) {
      const fixture = structuredClone(validReportData()) as any;
      scenario.mutate(fixture);
      writeFileSync(input, `${JSON.stringify(fixture, null, 2)}\n`);
      const checked = runNode([script, '--input', inputArg, '--check']);
      assert.notEqual(checked.status, 0, `${scenario.name}必须失败`);
      assert.match(checked.stderr, /校验失败/);
    }

    const outsideRepo = runNode([script, '--input', '/etc/hosts', '--check']);
    assert.notEqual(outsideRepo.status, 0);
    assert.match(outsideRepo.stderr, /当前仓库内/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('report-walkthrough 禁止手写三份产物，旧手工模板已退出真源', () => {
  const skill = readRepo('skills/report-walkthrough/SKILL.md');
  assert.match(skill, /Agent 禁止手写或局部修补上述三个生成产物/);
  assert.match(skill, /report-data\.json/);
  assert.equal(existsSync(join(repoRoot, 'skills/report-walkthrough/references/TEMPLATE_REPORT_WALKTHROUGH_HTML.md')), false);
  assert.equal(existsSync(join(repoRoot, 'skills/report-walkthrough/references/TEMPLATE_PR_BODY_IMPLEMENTATION.md')), false);
  assert.equal(existsSync(join(repoRoot, 'skills/report-walkthrough/references/TEMPLATE_PR_BODY_RFC_ONLY.md')), false);
});
